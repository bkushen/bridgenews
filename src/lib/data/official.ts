export type OfficialLiveItem = {
  key: string;
  name: string;
  label: string;
  url: string;
  icon: string;
  latest: string[];
  status: "live" | "unavailable";
};

const SOURCES = [
  {
    key: "meteo",
    name: "Department of Meteorology",
    label: "Weather forecasts and severe advisories",
    url: "https://meteo.gov.lk/index.php?Itemid=580&id=8&lang=en&option=com_content&view=category",
    icon: "🌦️",
    keywords: ["weather forecast", "advisory", "warning", "lightning", "wind", "rain"],
  },
  {
    key: "dmc",
    name: "Disaster Management Centre",
    label: "Emergency warnings and situation reports",
    url: "https://www.dmc.gov.lk/index.php?lang=en&option=com_dmcreports&report_type_=&view=reports",
    icon: "⚠️",
    keywords: ["warning", "advisory", "forecast", "situation report", "water level", "weather"],
  },
  {
    key: "police",
    name: "Sri Lanka Police",
    label: "Official police media and press releases",
    url: "https://www.police.lk/?cat=86",
    icon: "👮",
    keywords: ["press release", "media", "notice"],
  },
  {
    key: "railway",
    name: "Sri Lanka Railways",
    label: "Service updates and passenger notices",
    url: "https://railway.gov.lk/web/index.php?Itemid=242&id=60&lang=en&option=com_content&view=category",
    icon: "🚆",
    keywords: ["train", "service", "rail", "notice", "timetable", "resumed", "limited"],
  },
  {
    key: "ceb",
    name: "Ceylon Electricity Board",
    label: "Power interruption and outage services",
    url: "https://www.ceb.lk/power-interruption/en",
    icon: "⚡",
    keywords: ["power interruption", "interruption", "outage", "schedule"],
  },
  {
    key: "cbsl",
    name: "Central Bank of Sri Lanka",
    label: "Monetary policy, press releases and public notices",
    url: "https://www.cbsl.gov.lk/en",
    icon: "🏦",
    keywords: ["press release", "monetary policy", "notice", "open market", "inflation", "financial"],
  },
] as const;

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;|&#8211;/g, "–")
    .replace(/&mdash;|&#8212;/g, "—")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function clean(value: string) {
  return decode(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function candidates(html: string) {
  const output: string[] = [];
  const patterns = [/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi, /<a[^>]+href=["'][^"']+["'][^>]*>([\s\S]*?)<\/a>/gi, /<td[^>]*>([\s\S]*?)<\/td>/gi];
  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const text = clean(match[1] || "");
      if (text.length >= 10 && text.length <= 180 && !output.includes(text)) output.push(text);
    }
  }
  return output;
}

function chooseLatest(html: string, keywords: readonly string[]) {
  const phrases = candidates(html);
  const preferred = phrases.filter((text) => {
    const lower = text.toLowerCase();
    return keywords.some((keyword) => lower.includes(keyword));
  });
  return (preferred.length ? preferred : phrases).slice(0, 5);
}

async function fetchSource(source: (typeof SOURCES)[number]): Promise<OfficialLiveItem> {
  try {
    const response = await fetch(source.url, {
      headers: { "user-agent": "BridgeNews/1.0 (+public-official-source-monitor)" },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const latest = chooseLatest(html, source.keywords);
    return { key: source.key, name: source.name, label: source.label, url: source.url, icon: source.icon, latest, status: latest.length ? "live" : "unavailable" };
  } catch (error) {
    console.error("Official source fetch failed", source.name, error);
    return { key: source.key, name: source.name, label: source.label, url: source.url, icon: source.icon, latest: [], status: "unavailable" };
  }
}

export async function getOfficialLiveItems() {
  return Promise.all(SOURCES.map(fetchSource));
}
