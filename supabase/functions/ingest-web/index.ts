import { createClient } from "@supabase/supabase-js";

type Source = {
  id: string;
  name: string;
  slug: string;
  feed_url: string | null;
  auto_publish: boolean;
  default_language_code: string;
  max_items_per_fetch: number;
  fetch_interval_minutes: number;
  last_fetched_at: string | null;
  consecutive_failures: number;
};

type Item = {
  title: string;
  link: string;
  description?: string;
  imageUrl?: string;
  publishedAt?: string;
};

const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#8216;|&#8217;/g, "’")
    .replace(/&#8220;|&#8221;/g, "”")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function clean(value?: string) {
  if (!value) return undefined;
  const text = decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
  if (!text) return undefined;
  return text.length > 700 ? `${text.slice(0, 697).trimEnd()}...` : text;
}

function attr(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return undefined;
}

function titleFromHtml(html: string) {
  return (
    attr(html, "og:title") ??
    clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]) ??
    clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1])
  );
}

function dateFromHtml(html: string) {
  const raw =
    attr(html, "article:published_time") ??
    html.match(/["']datePublished["']\s*:\s*["']([^"']+)["']/i)?.[1] ??
    html.match(/datetime=["']([^"']+)["']/i)?.[1];
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function canonicalizeUrl(input: string) {
  const url = new URL(input);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
  }
  return url.toString();
}

function slugify(value: string) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "story"
  );
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isDue(source: Source) {
  if (!source.last_fetched_at) return true;
  return (
    Date.now() - new Date(source.last_fetched_at).getTime() >=
    Math.max(source.fetch_interval_minutes || 30, 5) * 60_000
  );
}

function extractLinks(listingUrl: string, html: string, slug: string) {
  const base = new URL(listingUrl);
  const output = new Set<string>();

  for (const match of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    try {
      const url = new URL(decodeHtml(match[1]), base);
      const path = url.pathname;

      if (slug.startsWith("newsfirst-")) {
        if (/\/[12]\d{3}\/\d{2}\/\d{2}\//.test(path) && /newsfirst\.lk$/i.test(url.hostname)) {
          output.add(url.toString());
        }
      } else if (slug.startsWith("itn-news-")) {
        if (/\/(?:ta\/)?[12]\d{3}\/\d{2}\/\d{2}\/\d+\/?$/.test(path) && /itnnews\.lk$/i.test(url.hostname)) {
          output.add(url.toString());
        }
      }
    } catch {}
  }

  return [...output];
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Page returned HTTP ${response.status}`);
  return await response.text();
}

async function discover(source: Source): Promise<Item[]> {
  if (!source.feed_url) throw new Error("Source has no listing URL");

  const listingHtml = await fetchHtml(source.feed_url);
  const links = extractLinks(source.feed_url, listingHtml, source.slug).slice(
    0,
    source.max_items_per_fetch || 15,
  );

  const items: Item[] = [];
  for (const link of links) {
    try {
      const html = await fetchHtml(link);
      const title = titleFromHtml(html);
      if (!title) continue;
      items.push({
        title,
        link,
        description: clean(attr(html, "og:description") ?? attr(html, "description")),
        imageUrl: attr(html, "og:image"),
        publishedAt: dateFromHtml(html),
      });
    } catch (error) {
      console.error("article_metadata_failed", source.name, link, error);
    }
  }

  return items;
}

async function processSource(supabase: ReturnType<typeof createClient>, source: Source) {
  const run = await supabase.from("ingestion_runs").insert({ source_id: source.id }).select("id").single();
  if (run.error) throw run.error;

  let fetchedCount = 0;
  let insertedCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  try {
    const items = await discover(source);
    fetchedCount = items.length;

    const regionResult = await supabase.from("source_regions").select("region_id").eq("source_id", source.id);
    if (regionResult.error) throw regionResult.error;
    const regionIds = (regionResult.data ?? []).map((row) => row.region_id);

    for (const item of items) {
      try {
        const canonicalUrl = canonicalizeUrl(item.link);
        const hash = await sha256(`${item.title}\n${canonicalUrl}`);
        const status = source.auto_publish ? "published" : "review_required";

        const insert = await supabase
          .from("articles")
          .insert({
            source_id: source.id,
            title: item.title,
            slug: `${slugify(item.title)}-${hash.slice(0, 10)}`,
            original_url: item.link,
            canonical_url: canonicalUrl,
            external_id: canonicalUrl,
            description: item.description,
            ai_summary: item.description,
            image_url: item.imageUrl,
            language_code: source.default_language_code || "en",
            status,
            auto_publish_requested: source.auto_publish,
            published_at: item.publishedAt ?? new Date().toISOString(),
            content_hash: hash,
            raw_metadata: {
              adapter: source.slug.startsWith("newsfirst-") ? "newsfirst_html" : "itn_html",
            },
          })
          .select("id")
          .single();

        if (insert.error) {
          if (insert.error.code === "23505") {
            duplicateCount += 1;
            continue;
          }
          throw insert.error;
        }

        insertedCount += 1;

        if (regionIds.length) {
          const regionInsert = await supabase
            .from("article_regions")
            .insert(regionIds.map((region_id) => ({ article_id: insert.data.id, region_id, confidence: 1 })));
          if (regionInsert.error) throw regionInsert.error;
        }
      } catch (error) {
        failedCount += 1;
        console.error("adapter_item_failed", source.name, error);
      }
    }

    const now = new Date().toISOString();
    await supabase
      .from("sources")
      .update({
        last_fetched_at: now,
        last_success_at: now,
        last_error_at: null,
        last_error_message: null,
        consecutive_failures: 0,
      })
      .eq("id", source.id);

    await supabase
      .from("ingestion_runs")
      .update({
        finished_at: now,
        fetched_count: fetchedCount,
        inserted_count: insertedCount,
        duplicate_count: duplicateCount,
        failed_count: failedCount,
      })
      .eq("id", run.data.id);

    return { source: source.name, fetchedCount, insertedCount, duplicateCount, failedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const now = new Date().toISOString();

    await supabase
      .from("sources")
      .update({
        last_fetched_at: now,
        last_error_at: now,
        last_error_message: message.slice(0, 1000),
        consecutive_failures: (source.consecutive_failures || 0) + 1,
      })
      .eq("id", source.id);

    await supabase
      .from("ingestion_runs")
      .update({
        finished_at: now,
        failed_count: Math.max(failedCount, 1),
        error_message: message.slice(0, 2000),
      })
      .eq("id", run.data.id);

    throw error;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) {
    return Response.json({ error: "Missing Supabase server secrets" }, { status: 500 });
  }

  const supabase = createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: { sourceId?: string } = {};
  try {
    body = await req.json();
  } catch {}

  let query = supabase
    .from("sources")
    .select(
      "id,name,slug,feed_url,auto_publish,default_language_code,max_items_per_fetch,fetch_interval_minutes,last_fetched_at,consecutive_failures",
    )
    .eq("enabled", true)
    .eq("source_type", "api");

  if (body.sourceId) query = query.eq("id", body.sourceId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const sources = (data ?? []) as Source[];
  const due = body.sourceId ? sources : sources.filter(isDue);
  const results: unknown[] = [];

  for (const source of due) {
    try {
      results.push(await processSource(supabase, source));
    } catch (error) {
      results.push({
        source: source.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return Response.json({
    configuredSources: sources.length,
    processedSources: results.length,
    skippedNotDue: sources.length - due.length,
    results,
  });
});
