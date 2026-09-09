import { createClient } from "@supabase/supabase-js";

const HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function attr(tag: string, name: string) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] ?? null;
}

function dimensionScore(value: string) {
  let score = 0;
  for (const match of value.matchAll(/(\d{2,4})x(\d{2,4})/gi)) {
    const size = Math.min(Number(match[1]), Number(match[2]));
    if (size >= 512) score = Math.max(score, 340);
    else if (size >= 256) score = Math.max(score, 300);
    else if (size >= 180) score = Math.max(score, 260);
    else if (size >= 144) score = Math.max(score, 220);
    else if (size >= 96) score = Math.max(score, 160);
    else if (size >= 48) score = Math.max(score, 80);
    else if (size <= 16) score = Math.min(score, -240);
  }
  return score;
}

function candidateScore(url: string, rel = "", sizes = "") {
  const value = `${url} ${sizes}`.toLowerCase();
  let score = dimensionScore(value);
  if (rel.includes("apple-touch-icon")) score += 360;
  else if (rel.includes("icon")) score += 140;
  if (/\.svg(?:$|\?)/i.test(url)) score += 320;
  else if (/\.(?:png|webp)(?:$|\?)/i.test(url)) score += 90;
  else if (/\.(?:jpe?g)(?:$|\?)/i.test(url)) score += 45;
  if (/logo|brand|apple-touch/i.test(value)) score += 150;
  if (/favicon/i.test(value)) score -= 80;
  if (/16x16/i.test(value)) score -= 320;
  if (/\.ico(?:$|\?)/i.test(url)) score -= 180;
  return score;
}

function isLowQualityLogo(url: string | null) {
  if (!url) return true;
  return /16x16|favicon(?:[-_.]|$)|favico|\.ico(?:$|\?)/i.test(url);
}

function discoverIcon(html: string, websiteUrl: string) {
  const candidates: Array<{ url: string; score: number }> = [];
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
  for (const tag of links) {
    const rel = attr(tag, "rel")?.toLowerCase() ?? "";
    if (!rel.includes("icon")) continue;
    const href = attr(tag, "href");
    if (!href) continue;
    try {
      const url = new URL(decode(href), websiteUrl).toString();
      candidates.push({ url, score: candidateScore(url, rel, attr(tag, "sizes") ?? "") });
    } catch {}
  }

  const og = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)?.[1];
  if (og && /logo|icon|brand/i.test(og)) {
    try {
      const url = new URL(decode(og), websiteUrl).toString();
      candidates.push({ url, score: candidateScore(url, "og:image") + 160 });
    } catch {}
  }

  candidates.sort((a, b) => b.score - a.score);
  if (candidates[0]) return candidates[0];
  try {
    const url = new URL("/favicon.ico", websiteUrl).toString();
    return { url, score: candidateScore(url, "icon") };
  } catch {
    return null;
  }
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
  let checked = 0;
  const results: unknown[] = [];
  for (const source of data ?? []) {
    if (!source.website_url || !isLowQualityLogo(source.logo_url)) continue;
    checked += 1;
    try {
      const response = await fetch(source.website_url, { headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const candidate = discoverIcon(await response.text(), source.website_url);
      if (!candidate) throw new Error("No icon found");
      const currentScore = source.logo_url ? candidateScore(source.logo_url) : -999;
      if (source.logo_url && candidate.url === source.logo_url) {
        results.push({ source: source.name, kept: source.logo_url, score: candidate.score });
        continue;
      }
      if (source.logo_url && candidate.score <= currentScore) {
        results.push({ source: source.name, kept: source.logo_url, candidate: candidate.url });
        continue;
      }
      const update = await supabase.from("sources").update({ logo_url: candidate.url }).eq("id", source.id);
      if (update.error) throw update.error;
      updated += 1;
      results.push({ source: source.name, oldLogo: source.logo_url, logo: candidate.url, score: candidate.score });
    } catch (error) {
      results.push({ source: source.name, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return Response.json({ checked, updated, results });
});
