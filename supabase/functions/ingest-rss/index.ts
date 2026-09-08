import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";

type Source = {
  id: string;
  name: string;
  feed_url: string | null;
  auto_publish: boolean;
  default_language_code: string;
  max_items_per_fetch: number;
};

type FeedItem = {
  title: string;
  link: string;
  guid?: string;
  description?: string;
  author?: string;
  imageUrl?: string;
  publishedAt?: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  trimValues: true,
});

function arr<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["#text", "__cdata", "@_href", "href"]) {
      const candidate = obj[key];
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
  }
  return undefined;
}

function firstLink(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw;
  for (const item of arr(raw as Record<string, unknown> | Record<string, unknown>[])) {
    if (!item || typeof item !== "object") continue;
    const href = text((item as Record<string, unknown>)["@_href"]);
    const rel = text((item as Record<string, unknown>)["@_rel"]);
    if (href && (!rel || rel === "alternate")) return href;
  }
  return undefined;
}

function stripHtml(input?: string): string | undefined {
  if (!input) return undefined;
  const cleaned = input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || undefined;
}

function canonicalizeUrl(input: string): string {
  const url = new URL(input);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(key)) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  return url.toString();
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "story";
}

function parseDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function extractRssItem(item: Record<string, unknown>): FeedItem | null {
  const title = text(item.title);
  const link = firstLink(item.link) ?? text(item.link);
  if (!title || !link) return null;

  const enclosure = item.enclosure as Record<string, unknown> | undefined;
  const mediaContent = item.content as Record<string, unknown> | undefined;
  const mediaThumbnail = item.thumbnail as Record<string, unknown> | undefined;

  return {
    title,
    link,
    guid: text(item.guid) ?? text(item.id),
    description: stripHtml(text(item.description) ?? text(item.summary) ?? text(item.encoded)),
    author: text(item.author) ?? text(item.creator),
    imageUrl:
      text(enclosure?.["@_url"]) ??
      text(mediaContent?.["@_url"]) ??
      text(mediaThumbnail?.["@_url"]),
    publishedAt: parseDate(text(item.pubDate) ?? text(item.published) ?? text(item.updated)),
  };
}

function parseFeed(xml: string): FeedItem[] {
  const doc = parser.parse(xml) as Record<string, unknown>;
  const rss = doc.rss as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;
  const atomFeed = doc.feed as Record<string, unknown> | undefined;
  const rawItems = channel?.item ?? atomFeed?.entry ?? [];

  return arr(rawItems as Record<string, unknown> | Record<string, unknown>[])
    .map(extractRssItem)
    .filter((item): item is FeedItem => Boolean(item));
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function processSource(
  supabase: ReturnType<typeof createClient>,
  source: Source,
) {
  if (!source.feed_url) throw new Error("Source has no feed URL");

  const run = await supabase
    .from("ingestion_runs")
    .insert({ source_id: source.id })
    .select("id")
    .single();
  if (run.error) throw run.error;

  let fetchedCount = 0;
  let insertedCount = 0;
  let duplicateCount = 0;
  let failedCount = 0;

  try {
    const response = await fetch(source.feed_url, {
      headers: {
        "user-agent": "BridgeNewsFeedBot/0.2 (+content-aggregation; respects publisher links)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Feed returned HTTP ${response.status}`);

    const xml = await response.text();
    const items = parseFeed(xml).slice(0, source.max_items_per_fetch || 50);
    fetchedCount = items.length;

    const regionResult = await supabase
      .from("source_regions")
      .select("region_id")
      .eq("source_id", source.id);
    if (regionResult.error) throw regionResult.error;
    const regionIds = (regionResult.data ?? []).map((row) => row.region_id);

    for (const item of items) {
      try {
        const canonicalUrl = canonicalizeUrl(item.link);
        const externalId = item.guid ?? canonicalUrl;
        const hash = await sha256(`${item.title}\n${canonicalUrl}`);
        const suffix = hash.slice(0, 10);

        const insert = await supabase
          .from("articles")
          .insert({
            source_id: source.id,
            title: item.title,
            slug: `${slugify(item.title)}-${suffix}`,
            original_url: item.link,
            canonical_url: canonicalUrl,
            external_id: externalId,
            description: item.description,
            author: item.author,
            image_url: item.imageUrl,
            language_code: source.default_language_code || "en",
            status: "processing",
            auto_publish_requested: source.auto_publish,
            published_at: item.publishedAt,
            content_hash: hash,
            raw_metadata: { feed_guid: item.guid ?? null },
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
          const regionInsert = await supabase.from("article_regions").insert(
            regionIds.map((region_id) => ({ article_id: insert.data.id, region_id, confidence: 1 })),
          );
          if (regionInsert.error) throw regionInsert.error;
        }
      } catch (error) {
        failedCount += 1;
        console.error("item_failed", source.name, error);
      }
    }

    const now = new Date().toISOString();
    await supabase
      .from("sources")
      .update({
        last_fetched_at: now,
        last_success_at: now,
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
        consecutive_failures: 1,
      })
      .eq("id", source.id);

    await supabase
      .from("ingestion_runs")
      .update({ finished_at: now, failed_count: Math.max(failedCount, 1), error_message: message.slice(0, 2000) })
      .eq("id", run.data.id);
    throw error;
  }
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRole) return Response.json({ error: "Missing Supabase server secrets" }, { status: 500 });

    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("INGEST_CRON_SECRET");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(url, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let body: { sourceId?: string } = {};
    try { body = await req.json(); } catch { /* empty body means due sources */ }

    let query = supabase
      .from("sources")
      .select("id,name,feed_url,auto_publish,default_language_code,max_items_per_fetch")
      .eq("enabled", true)
      .eq("source_type", "rss");
    if (body.sourceId) query = query.eq("id", body.sourceId);

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const results = [];
    for (const source of (data ?? []) as Source[]) {
      try {
        results.push(await processSource(supabase, source));
      } catch (error) {
        results.push({ source: source.name, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return Response.json({ processedSources: results.length, results });
  },
};
