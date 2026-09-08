import { createClient } from "@supabase/supabase-js";

const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function discoverIcon(html: string, websiteUrl: string) {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  const priorities = ["apple-touch-icon", "icon", "shortcut icon", "mask-icon"];
  for (const relName of priorities) {
    for (const tag of links) {
      const rel = tag.match(/\brel=["']([^"']+)["']/i)?.[1]?.toLowerCase();
      if (!rel || !rel.includes(relName)) continue;
      const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
      if (!href) continue;
      try { return new URL(decode(href), websiteUrl).toString(); } catch {}
    }
  }
  const og = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)?.[1];
  if (og && /logo|icon|brand/i.test(og)) {
    try { return new URL(decode(og), websiteUrl).toString(); } catch {}
  }
  try { return new URL("/favicon.ico", websiteUrl).toString(); } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return Response.json({ error: "Missing Supabase server secrets" }, { status: 500 });

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("sources").select("id,name,website_url,logo_url").eq("enabled", true).limit(100);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let updated = 0;
  const results: unknown[] = [];
  for (const source of data ?? []) {
    if (!source.website_url || source.logo_url) continue;
    try {
      const response = await fetch(source.website_url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const icon = discoverIcon(await response.text(), source.website_url);
      if (!icon) throw new Error("No icon found");
      const update = await supabase.from("sources").update({ logo_url: icon }).eq("id", source.id);
      if (update.error) throw update.error;
      updated += 1;
      results.push({ source: source.name, logo: icon });
    } catch (error) {
      results.push({ source: source.name, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return Response.json({ updated, results });
});
