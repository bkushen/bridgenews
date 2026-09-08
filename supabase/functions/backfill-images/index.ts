import { createClient } from "@supabase/supabase-js";

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
    .replace(/&gt;/g, ">");
}

function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const re of [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ]) {
    const match = html.match(re);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }
  return undefined;
}

function extractImage(html: string, pageUrl: string) {
  const raw =
    meta(html, "og:image") ??
    meta(html, "og:image:secure_url") ??
    meta(html, "twitter:image") ??
    meta(html, "twitter:image:src") ??
    html.match(/["']image["']\s*:\s*["'](https?:\\?\/\\?\/[^"']+)["']/i)?.[1]?.replace(/\\\//g, "/") ??
    html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];

  if (!raw) return undefined;
  try {
    const url = new URL(decodeHtml(raw), pageUrl);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return Response.json({ error: "Missing Supabase server secrets" }, { status: 500 });

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: { limit?: number } = {};
  try { body = await req.json(); } catch {}
  const limit = Math.max(1, Math.min(body.limit ?? 40, 100));

  const { data, error } = await supabase
    .from("articles")
    .select("id,original_url,title,published_at")
    .eq("status", "published")
    .or("image_url.is.null,image_url.eq.")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const article of data ?? []) {
    try {
      if (!article.original_url) { skipped += 1; continue; }
      const response = await fetch(article.original_url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(12_000) });
      if (!response.ok) { failed += 1; continue; }
      const imageUrl = extractImage(await response.text(), article.original_url);
      if (!imageUrl) { skipped += 1; continue; }
      const update = await supabase.from("articles").update({ image_url: imageUrl }).eq("id", article.id);
      if (update.error) { failed += 1; continue; }
      updated += 1;
    } catch {
      failed += 1;
    }
  }

  return Response.json({ scanned: (data ?? []).length, updated, skipped, failed });
});
