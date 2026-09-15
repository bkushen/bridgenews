export const ARTICLE_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
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

function jsonLdImage(html: string): string | undefined {
  for (const script of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(script[1]);
      const roots = Array.isArray(parsed) ? parsed : [parsed];
      const nodes = roots.flatMap((root: any) => Array.isArray(root?.["@graph"]) ? [root, ...root["@graph"]] : [root]);
      for (const node of nodes) {
        for (const candidate of [node?.image, node?.thumbnailUrl, node?.primaryImageOfPage?.contentUrl]) {
          if (typeof candidate === "string") return candidate;
          if (Array.isArray(candidate)) {
            const first = candidate.find((value) => typeof value === "string" || (value && typeof value.url === "string"));
            if (typeof first === "string") return first;
            if (first && typeof first.url === "string") return first.url;
          }
          if (candidate && typeof candidate === "object" && typeof candidate.url === "string") return candidate.url;
        }
      }
    } catch {}
  }
  return undefined;
}

function firstSrcset(html: string): string | undefined {
  const match = html.match(/<img[^>]+srcset=["']([^"']+)["']/i);
  if (!match?.[1]) return undefined;
  const candidates = match[1].split(",").map((part) => part.trim().split(/\s+/)[0]).filter(Boolean);
  return candidates.at(-1);
}

function normalizeImageUrl(raw: string | undefined | null, pageUrl: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(decodeHtml(raw).replace(/\\\//g, "/"), pageUrl);
    const path = `${url.pathname}${url.search}`;
    if (!/^https?:$/.test(url.protocol)) return null;
    if (/\.(svg|gif)(?:$|\?)/i.test(path)) return null;
    if (/(?:logo|favicon|site[-_]?icon|avatar|sprite|placeholder|tracking|pixel|branding|masthead|default[-_]?image)/i.test(path)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function extractPublisherImage(html: string, pageUrl: string): string | null {
  const raw =
    meta(html, "og:image") ??
    meta(html, "og:image:secure_url") ??
    meta(html, "twitter:image") ??
    meta(html, "twitter:image:src") ??
    jsonLdImage(html) ??
    html.match(/["']image["']\s*:\s*["'](https?:\\?\/\\?\/[^"']+)["']/i)?.[1] ??
    html.match(/<img[^>]+(?:data-src|data-lazy-src|data-original)=["']([^"']+)["']/i)?.[1] ??
    firstSrcset(html) ??
    html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
  return normalizeImageUrl(raw, pageUrl);
}

export async function verifyPublisherImage(url: string): Promise<boolean> {
  const check = (response: Response) => {
    if (!response.ok && response.status !== 206) return false;
    const type = (response.headers.get("content-type") || "").toLowerCase();
    return type.startsWith("image/") && !type.includes("svg") && !type.includes("gif");
  };

  try {
    const head = await fetch(url, {
      method: "HEAD",
      headers: ARTICLE_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(7_000),
    });
    if (check(head)) return true;
  } catch {}

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { ...ARTICLE_HEADERS, range: "bytes=0-2047" },
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });
    return check(response);
  } catch {
    return false;
  }
}

export async function resolvePublisherImage(articleUrl: string, candidate?: string | null): Promise<string | null> {
  const normalizedCandidate = normalizeImageUrl(candidate, articleUrl);
  if (normalizedCandidate && await verifyPublisherImage(normalizedCandidate)) return normalizedCandidate;

  try {
    const response = await fetch(articleUrl, {
      headers: ARTICLE_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    const image = extractPublisherImage(await response.text(), articleUrl);
    if (!image) return null;
    return await verifyPublisherImage(image) ? image : null;
  } catch {
    return null;
  }
}
