import type { EditionRegion } from "@/lib/region-context";

export type WhatsOnCategory = "movies" | "theatre" | "concerts" | "comedy" | "sports" | "festivals" | "family" | "arts" | "events";

export type WhatsOnItem = {
  id: string;
  title: string;
  category: WhatsOnCategory;
  region: EditionRegion;
  imageUrl: string | null;
  summary: string | null;
  startAt: string | null;
  endAt: string | null;
  venue: string | null;
  city: string | null;
  price: string | null;
  language: string | null;
  sourceName: string;
  sourceUrl: string;
  ticketUrl: string;
};

type Source = { name: string; url: string; region: EditionRegion; hint?: WhatsOnCategory };

const SOURCES: Record<EditionRegion, Source[]> = {
  "sri-lanka": [
    { name: "OneTicket", url: "https://oneticket.lk/", region: "sri-lanka" },
    { name: "IslandLive", url: "https://islandlive.org/events", region: "sri-lanka" },
    { name: "Scope Cinemas", url: "https://www.scopecinemas.com/movies/now-showing", region: "sri-lanka", hint: "movies" },
    { name: "National Film Corporation", url: "https://nfc.gov.lk/", region: "sri-lanka", hint: "movies" },
    { name: "BookMyShow Sri Lanka", url: "https://lk.bookmyshow.com/sri-lanka/movies/nowshowing", region: "sri-lanka", hint: "movies" },
  ],
  australia: [
    { name: "Ticketmaster Australia", url: "https://www.ticketmaster.com.au/discover/melbourne", region: "australia" },
    { name: "Ticketmaster Music", url: "https://www.ticketmaster.com.au/discover/concerts/melbourne", region: "australia", hint: "concerts" },
    { name: "What’s On Melbourne", url: "https://whatson.melbourne.vic.gov.au/", region: "australia" },
  ],
  international: [
    { name: "Ticketmaster", url: "https://www.ticketmaster.com/discover/concerts", region: "international", hint: "concerts" },
    { name: "IMDb", url: "https://www.imdb.com/calendar/", region: "international", hint: "movies" },
  ],
};

function plainText(value: unknown) {
  return typeof value === "string" ? value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
}

function absoluteUrl(value: unknown, base: string) {
  if (typeof value !== "string" || !value.trim()) return null;
  try { return new URL(value, base).toString(); } catch { return null; }
}

function firstString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) { const found = firstString(item); if (found) return found; }
  }
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return firstString(object.url) || firstString(object.contentUrl) || firstString(object.name);
  }
  return null;
}

function schemaTypes(value: unknown): string[] {
  if (typeof value === "string") return [value];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function flattenJsonLd(value: unknown, out: Record<string, unknown>[] = []) {
  if (Array.isArray(value)) { for (const child of value) flattenJsonLd(child, out); return out; }
  if (!value || typeof value !== "object") return out;
  const object = value as Record<string, unknown>;
  if (object["@type"]) out.push(object);
  if (Array.isArray(object["@graph"])) flattenJsonLd(object["@graph"], out);
  return out;
}

function categoryFrom(node: Record<string, unknown>, hint?: WhatsOnCategory): WhatsOnCategory {
  const types = schemaTypes(node["@type"]).join(" ").toLowerCase();
  const text = `${types} ${plainText(node.name)} ${plainText(node.eventAttendanceMode)} ${plainText(node.keywords)} ${plainText(node.genre)}`.toLowerCase();
  if (/movie|film|cinema|screening/.test(text)) return "movies";
  if (/theatre|theater|drama|play|musical|opera|performing/.test(text)) return "theatre";
  if (/concert|music|gig|live music/.test(text)) return "concerts";
  if (/comedy|comedian/.test(text)) return "comedy";
  if (/sport|match|game|race|tournament/.test(text)) return "sports";
  if (/festival|fair|carnival/.test(text)) return "festivals";
  if (/family|children|kids|child/.test(text)) return "family";
  if (/art|exhibition|gallery|museum/.test(text)) return "arts";
  return hint || "events";
}

function locationParts(value: unknown) {
  if (!value || typeof value !== "object") return { venue: null, city: null };
  const object = value as Record<string, unknown>;
  const address = object.address && typeof object.address === "object" ? object.address as Record<string, unknown> : {};
  return {
    venue: firstString(object.name),
    city: firstString(address.addressLocality) || firstString(address.addressRegion) || null,
  };
}

function offerParts(value: unknown) {
  const offer = Array.isArray(value) ? value[0] : value;
  if (!offer || typeof offer !== "object") return { url: null, price: null };
  const object = offer as Record<string, unknown>;
  const low = firstString(object.lowPrice) || firstString(object.price);
  const high = firstString(object.highPrice);
  const currency = firstString(object.priceCurrency);
  const price = low ? `${currency ? `${currency} ` : ""}${low}${high && high !== low ? `–${high}` : ""}` : null;
  return { url: firstString(object.url), price };
}

function normalizeNode(node: Record<string, unknown>, source: Source): WhatsOnItem | null {
  const title = plainText(node.name || node.headline);
  if (!title || title.length < 2) return null;
  const types = schemaTypes(node["@type"]).map((v) => v.toLowerCase());
  const eventLike = types.some((t) => /event|movie|screening/.test(t));
  if (!eventLike && !source.hint) return null;
  const { venue, city } = locationParts(node.location);
  const offers = offerParts(node.offers);
  const ticketUrl = absoluteUrl(offers.url || firstString(node.url), source.url) || source.url;
  const imageUrl = absoluteUrl(firstString(node.image) || firstString(node.thumbnailUrl), source.url);
  const startAt = firstString(node.startDate) || firstString(node.datePublished);
  const endAt = firstString(node.endDate);
  const summary = plainText(node.description) || null;
  const language = firstString(node.inLanguage);
  const key = `${source.name}:${title}:${startAt || ""}:${venue || ""}`.toLowerCase();
  return {
    id: key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 180),
    title,
    category: categoryFrom(node, source.hint),
    region: source.region,
    imageUrl,
    summary,
    startAt,
    endAt,
    venue,
    city,
    price: offers.price,
    language,
    sourceName: source.name,
    sourceUrl: source.url,
    ticketUrl,
  };
}

function parseJsonLd(html: string, source: Source) {
  const items: WhatsOnItem[] = [];
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of matches) {
    try {
      const json = JSON.parse(match[1].trim());
      for (const node of flattenJsonLd(json)) {
        const item = normalizeNode(node, source);
        if (item) items.push(item);
      }
    } catch { /* publisher markup can be malformed; ignore only that block */ }
  }
  return items;
}

function parseLinks(html: string, source: Source) {
  // Conservative fallback for sources that do not expose Event JSON-LD. It only uses real page links/titles.
  const out: WhatsOnItem[] = [];
  const re = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    const title = plainText(match[2]);
    if (title.length < 4 || title.length > 120) continue;
    const href = absoluteUrl(match[1], source.url);
    if (!href) continue;
    const haystack = `${title} ${href}`.toLowerCase();
    if (!/(movie|film|cinema|event|concert|music|theatre|theater|drama|comedy|festival|sport|show|ticket)/.test(haystack)) continue;
    out.push({
      id: `${source.name}:${title}:${href}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 180),
      title,
      category: categoryFrom({ name: title }, source.hint),
      region: source.region,
      imageUrl: null,
      summary: null,
      startAt: null,
      endAt: null,
      venue: null,
      city: null,
      price: null,
      language: null,
      sourceName: source.name,
      sourceUrl: source.url,
      ticketUrl: href,
    });
  }
  return out.slice(0, 20);
}

async function fetchSource(source: Source) {
  try {
    const response = await fetch(source.url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; BridgeNews/1.0; +https://bridgenews-live-bkushen-5488.vercel.app)" },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return [];
    const html = await response.text();
    const structured = parseJsonLd(html, source);
    return structured.length ? structured : parseLinks(html, source);
  } catch {
    return [];
  }
}

function dedupe(items: WhatsOnItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.title.toLowerCase().replace(/\W+/g, " ").trim()}|${item.startAt?.slice(0, 10) || ""}|${item.venue?.toLowerCase() || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getWhatsOnItems(region: EditionRegion, limit = 40): Promise<WhatsOnItem[]> {
  const rows = dedupe((await Promise.all(SOURCES[region].map(fetchSource))).flat());
  const cutoff = Date.now() - 12 * 60 * 60 * 1000;
  return rows
    .filter((item) => !item.startAt || Number.isNaN(new Date(item.startAt).getTime()) || new Date(item.startAt).getTime() >= cutoff)
    .sort((a, b) => {
      const at = a.startAt ? new Date(a.startAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bt = b.startAt ? new Date(b.startAt).getTime() : Number.MAX_SAFE_INTEGER;
      return at - bt || Number(Boolean(b.imageUrl)) - Number(Boolean(a.imageUrl)) || a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

export function whatsOnSources(region: EditionRegion) {
  return SOURCES[region].map(({ name, url }) => ({ name, url }));
}
