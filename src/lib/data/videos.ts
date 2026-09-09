export type NewsVideo = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  publishedAt: string | null;
  channel: string;
  channelUrl: string;
  language: string;
};

const CHANNELS = [
  { name: "Ada Derana", handle: "AdaDerana", language: "Sinhala / English / Tamil", channelUrl: "https://www.youtube.com/@AdaDerana" },
  { name: "Ada Derana News Channel English", handle: "ADNCEnglish", language: "English", channelUrl: "https://www.youtube.com/@ADNCEnglish" },
  { name: "Newsfirst Sri Lanka", handle: "newsfirstsrilanka", language: "Sinhala / English / Tamil", channelUrl: "https://www.youtube.com/@newsfirstsrilanka" },
] as const;

function decode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tag(entry: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return decode(entry.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "");
}

async function resolveChannelId(channelUrl: string) {
  const response = await fetch(channelUrl, {
    headers: { "user-agent": "Mozilla/5.0 BridgeNews/1.0" },
    next: { revalidate: 21600 },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Channel page HTTP ${response.status}`);
  const html = await response.text();
  return html.match(/"externalId":"(UC[^"]+)"/)?.[1] || html.match(/"channelId":"(UC[^"]+)"/)?.[1] || null;
}

async function fetchChannel(channel: (typeof CHANNELS)[number]): Promise<NewsVideo[]> {
  try {
    const channelId = await resolveChannelId(channel.channelUrl);
    if (!channelId) throw new Error("Could not resolve YouTube channel ID");
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
    const response = await fetch(feedUrl, {
      headers: { "user-agent": "BridgeNews/1.0 (+public-youtube-feed)" },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`YouTube feed HTTP ${response.status}`);
    const xml = await response.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
    return entries.slice(0, 8).map((entry) => {
      const id = tag(entry, "yt:videoId") || tag(entry, "id").replace(/^yt:video:/, "");
      const title = tag(entry, "title");
      const publishedAt = tag(entry, "published") || null;
      const url = id ? `https://www.youtube.com/watch?v=${id}` : channel.channelUrl;
      return {
        id: id || `${channel.handle}-${title}`,
        title: title || `${channel.name} video`,
        url,
        thumbnail: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "",
        publishedAt,
        channel: channel.name,
        channelUrl: channel.channelUrl,
        language: channel.language,
      };
    });
  } catch (error) {
    console.error("YouTube channel feed failed", channel.name, error);
    return [];
  }
}

export async function getLiveNewsVideos(limit = 18) {
  const rows = (await Promise.all(CHANNELS.map(fetchChannel))).flat();
  return rows
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
    .slice(0, limit);
}

export function getVerifiedVideoChannels() {
  return CHANNELS;
}
