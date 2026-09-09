import { createClient } from "@/lib/supabase/server";

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

type ManagedChannel = {
  id: string;
  name: string;
  channel_id: string | null;
  channel_url: string;
  feed_url: string | null;
  language_code: string;
};

function decode(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function tag(entry: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return decode(entry.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, "").trim() || "");
}

function languageLabel(code: string) {
  return code === "si" ? "Sinhala" : code === "ta" ? "Tamil" : "English";
}

async function resolveChannelId(channel: ManagedChannel) {
  if (channel.channel_id) return channel.channel_id;
  const response = await fetch(channel.channel_url, { headers: { "user-agent": "Mozilla/5.0 BridgeNews/1.0" }, next: { revalidate: 21600 }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Channel page HTTP ${response.status}`);
  const html = await response.text();
  return html.match(/"externalId":"(UC[^"]+)"/)?.[1] || html.match(/"channelId":"(UC[^"]+)"/)?.[1] || null;
}

async function fetchChannel(channel: ManagedChannel): Promise<NewsVideo[]> {
  try {
    const channelId = await resolveChannelId(channel);
    const feedUrl = channel.feed_url || (channelId ? `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}` : null);
    if (!feedUrl) throw new Error("No channel feed available");
    const response = await fetch(feedUrl, { headers: { "user-agent": "BridgeNews/1.0 (+public-youtube-feed)" }, next: { revalidate: 600 }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`YouTube feed HTTP ${response.status}`);
    const xml = await response.text();
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((match) => match[1]);
    return entries.slice(0, 8).map((entry) => {
      const id = tag(entry, "yt:videoId") || tag(entry, "id").replace(/^yt:video:/, "");
      const title = tag(entry, "title");
      return { id: id || `${channel.id}-${title}`, title: title || `${channel.name} video`, url: id ? `https://www.youtube.com/watch?v=${id}` : channel.channel_url, thumbnail: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "", publishedAt: tag(entry, "published") || null, channel: channel.name, channelUrl: channel.channel_url, language: languageLabel(channel.language_code) };
    });
  } catch (error) {
    console.error("YouTube channel feed failed", channel.name, error);
    return [];
  }
}

export async function getVerifiedVideoChannels() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("video_channels").select("id,name,channel_id,channel_url,feed_url,language_code").eq("enabled", true).order("sort_order");
  if (error || !data) {
    console.error("Managed video channels unavailable", error);
    return [];
  }
  return (data as ManagedChannel[]).map((channel) => ({ ...channel, language: languageLabel(channel.language_code), channelUrl: channel.channel_url }));
}

export async function getLiveNewsVideos(limit = 18) {
  const channels = await getVerifiedVideoChannels();
  const rows = (await Promise.all(channels.map((channel) => fetchChannel(channel)))).flat();
  return rows.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()).slice(0, limit);
}
