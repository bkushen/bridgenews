import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bridgenews-live-bkushen-5488.vercel.app";

function xml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export async function GET() {
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("slug,title,published_at,language_code,image_url")
    .eq("status", "published")
    .not("image_url", "is", null)
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(1000);

  const body = (data ?? []).map((article) => {
    const lang = String(article.language_code || "en").toLowerCase().slice(0, 2);
    return `<url><loc>${xml(`${BASE_URL}/story/${article.slug}`)}</loc><news:news><news:publication><news:name>BridgeNews</news:name><news:language>${xml(lang)}</news:language></news:publication><news:publication_date>${xml(new Date(article.published_at).toISOString())}</news:publication_date><news:title>${xml(article.title)}</news:title></news:news>${article.image_url ? `<image:image><image:loc>${xml(article.image_url)}</image:loc></image:image>` : ""}</url>`;
  }).join("");

  const content = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${body}</urlset>`;
  return new Response(content, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=300, s-maxage=300" } });
}
