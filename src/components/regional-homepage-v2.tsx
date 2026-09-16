import Link from "next/link";
import { getStories } from "@/lib/data/stories";
import { getHomepageWeather, formatCityTime, formatClock, type WeatherCardData } from "@/lib/data/home-widgets";
import { getWhatsOnItems } from "@/lib/data/whats-on";
import { groupStoriesIntoTopics, rankTrendingTopics, type TopicGroup } from "@/lib/data/topic-groups";
import { RegionPreference } from "@/components/region-preference";
import { RegionalPulseBoard } from "@/components/regional-pulse-board";
import { WhatsOnExplorer } from "@/components/whats-on-explorer";
import type { Story } from "@/lib/mock-data";

type RegionKey = "sri-lanka" | "australia" | "international";
type StoryWithImage = Story & { imageUrl?: string | null };
type RegionConfig = { key: RegionKey; label: string; flag: string; city: string; timeZone: string; places: string[] };

const REGIONS: Record<RegionKey, RegionConfig> = {
  "sri-lanka": { key: "sri-lanka", label: "Sri Lanka", flag: "🇱🇰", city: "Colombo", timeZone: "Asia/Colombo", places: ["Colombo", "Negombo", "Anuradhapura", "Batticaloa", "Trincomalee", "Galle", "Kandy", "Jaffna", "Kurunegala", "Badulla", "Ratnapura", "Nuwara Eliya"] },
  australia: { key: "australia", label: "Australia", flag: "🇦🇺", city: "Melbourne", timeZone: "Australia/Melbourne", places: ["Melbourne", "Sydney", "Brisbane", "Perth", "Adelaide", "Canberra", "Hobart", "Darwin", "Gold Coast", "Newcastle", "Geelong", "Ballarat"] },
  international: { key: "international", label: "International", flag: "🌍", city: "World", timeZone: "UTC", places: ["Asia", "Europe", "Americas", "Middle East", "Africa", "Pacific", "South Asia", "East Asia", "North America", "Latin America", "Oceania", "Global"] },
};

const quickLinks = [
  ["Google", "https://www.google.com", "G"], ["Gmail", "https://mail.google.com", "✉"], ["YouTube", "https://www.youtube.com", "▶"], ["Facebook", "https://www.facebook.com", "f"], ["WhatsApp", "https://www.whatsapp.com", "◉"], ["Wikipedia", "https://www.wikipedia.org", "W"], ["X.com", "https://x.com", "𝕏"], ["LinkedIn", "https://www.linkedin.com", "in"], ["Instagram", "https://www.instagram.com", "◎"], ["Reddit", "https://www.reddit.com", "●"],
] as const;

function SectionTitle({ title, href, label = "See all" }: { title: string; href?: string; label?: string }) {
  return <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-[18px] font-extrabold tracking-tight text-[#101828] sm:text-[21px]">{title}</h2>{href ? <Link href={href} className="text-[10px] font-bold text-[#3157d5] hover:underline">{label} →</Link> : null}</div>;
}

function greeting(timeZone: string) {
  const h = Number(new Intl.DateTimeFormat("en-AU", { timeZone, hour: "2-digit", hour12: false }).format(new Date()));
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}

function InNewsCard({ story, large = false }: { story: StoryWithImage; large?: boolean }) {
  return <Link href={`/story/${story.slug}`} className={`group overflow-hidden rounded-xl border border-[#e4e7ec] bg-white ${large ? "row-span-2" : ""}`}>
    {story.imageUrl ? <div className={`overflow-hidden bg-[#f2f4f7] ${large ? "h-[240px] sm:h-[300px]" : "h-[115px]"}`}><img src={story.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.035]"/></div> : <div className={`${large ? "h-[240px] sm:h-[300px]" : "h-[115px]"} bg-[#f8fafc]`}/>} 
    <div className={large ? "p-4" : "p-3"}><p className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#3157d5]">{story.source} · {story.published}</p><h3 className={`${large ? "mt-2 text-[22px] sm:text-[27px]" : "mt-1.5 text-[14px]"} line-clamp-3 font-extrabold leading-[1.12] text-[#101828] group-hover:text-[#3157d5]`}>{story.title}</h3></div>
  </Link>;
}

function FeaturedCard({ topic }: { topic: TopicGroup }) {
  return <Link href={`/story/${topic.lead.slug}`} className="rounded-xl border border-[#e4e7ec] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#c8d4ff] hover:shadow-sm">
    <p className="text-[9px] font-bold text-[#98a2b3]">★ {topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</p>
    <h3 className="mt-2 line-clamp-3 text-[16px] font-extrabold leading-5 text-[#101828]">{topic.lead.title}</h3>
    <p className="mt-3 text-[9px] font-semibold text-[#667085]">Editor&apos;s pick</p>
  </Link>;
}

function LatestCard({ topic }: { topic: TopicGroup }) {
  const story = topic.lead as StoryWithImage;
  return <article className="rounded-xl border border-[#e4e7ec] bg-white p-4">
    <div className="flex gap-3">{story.imageUrl ? <Link href={`/story/${story.slug}`} className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-[#f2f4f7]"><img src={story.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-105"/></Link> : null}<div className="min-w-0"><Link href={`/story/${story.slug}`} className="line-clamp-3 text-[15px] font-extrabold leading-5 text-[#101828] hover:text-[#3157d5]">{story.title}</Link><p className="mt-1 text-[9px] font-semibold text-[#3157d5]">{story.source} · {story.published}</p></div></div>
    <p className="mt-3 line-clamp-3 text-[11px] leading-5 text-[#667085]">{story.summary}</p>
    <div className="mt-3 flex flex-wrap gap-1.5">{topic.category ? <span className="rounded border border-[#e4e7ec] bg-[#f8fafc] px-2 py-1 text-[8px] font-semibold text-[#667085]">#{topic.category}</span> : null}<span className="rounded border border-[#e4e7ec] bg-[#f8fafc] px-2 py-1 text-[8px] font-semibold text-[#667085]">+{Math.max(0, topic.sourceCount - 1)}</span></div>
    <div className="mt-3 flex items-center justify-between border-t border-[#f0f2f5] pt-3 text-[9px]"><span className="text-[#667085]">☆ Save</span><Link href={`/story/${story.slug}`} className="font-bold text-[#3157d5]">Read More →</Link></div>
  </article>;
}

function WeatherPanel({ weather, timeZone }: { weather: WeatherCardData; timeZone: string }) {
  return <section className="rounded-xl border border-[#e4e7ec] bg-white p-4"><SectionTitle title="Weather"/><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="text-4xl">{weather.emoji}</span><div><p className="text-3xl font-extrabold tracking-tight text-[#101828]">{weather.temperature != null ? `${Math.round(weather.temperature)}°` : "—"}</p><p className="text-[10px] font-semibold text-[#667085]">{weather.condition} · {weather.city}</p></div></div><p className="text-right text-[9px] leading-4 text-[#98a2b3]">H {weather.high != null ? Math.round(weather.high) : "—"}° / L {weather.low != null ? Math.round(weather.low) : "—"}°<br/>Feels {weather.apparentTemperature != null ? `${Math.round(weather.apparentTemperature)}°` : "—"}</p></div>{weather.hourly.length ? <div className="mt-4 grid grid-cols-5 gap-1 rounded-lg border border-[#f0f2f5] p-2">{weather.hourly.map((point) => <div key={point.time} className="text-center"><p className="text-[7px] font-bold text-[#98a2b3]">{new Date(point.time).toLocaleTimeString("en-AU", { timeZone, hour: "2-digit", minute: "2-digit" })}</p><p className="my-1 text-base">{point.emoji}</p><p className="text-[9px] font-bold text-[#344054]">{point.temperature != null ? `${Math.round(point.temperature)}°` : "—"}</p></div>)}</div> : null}<p className="mt-3 text-[8px] text-[#98a2b3]">Open-Meteo · {formatCityTime(timeZone)}</p></section>;
}

function SunMoonPanel({ weather }: { weather: WeatherCardData }) {
  const sunrise = weather.sunrise ? new Date(weather.sunrise) : null;
  const sunset = weather.sunset ? new Date(weather.sunset) : null;
  const daylight = sunrise && sunset ? Math.max(0, sunset.getTime() - sunrise.getTime()) : 0;
  const daylightText = daylight ? `${Math.floor(daylight / 3600000)}h ${Math.round((daylight % 3600000) / 60000)}m` : "—";
  return <section className="rounded-xl border border-[#e4e7ec] bg-white p-4"><SectionTitle title="Sun & Moon"/><div className="grid grid-cols-3 gap-2 text-center"><div><p>🌅</p><p className="mt-1 text-sm font-extrabold">{formatClock(weather.sunrise)}</p><p className="text-[7px] font-bold uppercase text-[#98a2b3]">Sunrise</p></div><div><p>☀️</p><p className="mt-1 text-sm font-extrabold">{daylightText}</p><p className="text-[7px] font-bold uppercase text-[#98a2b3]">Daylight</p></div><div><p>🌇</p><p className="mt-1 text-sm font-extrabold">{formatClock(weather.sunset)}</p><p className="text-[7px] font-bold uppercase text-[#98a2b3]">Sunset</p></div></div></section>;
}

function CalendarPanel({ timeZone }: { timeZone: string }) {
  const now = new Date();
  const year = Number(new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric" }).format(now));
  const month = Number(new Intl.DateTimeFormat("en-US", { timeZone, month: "numeric" }).format(now)) - 1;
  const today = Number(new Intl.DateTimeFormat("en-US", { timeZone, day: "numeric" }).format(now));
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: offset + days }, (_, i) => i < offset ? null : i - offset + 1);
  const label = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone }).format(now);
  return <section className="rounded-xl border border-[#e4e7ec] bg-white p-4"><SectionTitle title="Holiday Calendar" href="/archive" label="Calendar"/><p className="mb-3 text-[10px] font-bold text-[#3157d5]">{label}</p><div className="grid grid-cols-7 gap-1 text-center">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <span key={d} className="pb-1 text-[7px] font-bold text-[#98a2b3]">{d}</span>)}{cells.map((d, i) => <span key={i} className={`grid h-6 place-items-center rounded text-[9px] font-semibold ${d === today ? "bg-[#3157d5] text-white" : "text-[#475467]"}`}>{d ?? ""}</span>)}</div></section>;
}

function RankingPanel({ title, topics }: { title: string; topics: TopicGroup[] }) {
  return <section className="rounded-xl border border-[#e4e7ec] bg-white p-4"><SectionTitle title={title} href="/popular"/><div className="space-y-3">{topics.slice(0,6).map((topic,i)=><Link key={topic.key} href={`/story/${topic.lead.slug}`} className="grid grid-cols-[18px_1fr] gap-2"><span className="text-base font-extrabold text-[#3157d5]">{i+1}</span><div><p className="line-clamp-2 text-[12px] font-bold leading-4 text-[#101828]">{topic.lead.title}</p><p className="mt-1 text-[8px] text-[#98a2b3]">{topic.sourceCount} source{topic.sourceCount===1?"":"s"}</p></div></Link>)}</div></section>;
}

function TodayPulse({ stories, sourceCount, topics }: { stories: Story[]; sourceCount: number; topics: TopicGroup[] }) {
  return <section className="rounded-xl border border-[#e4e7ec] bg-white p-4"><SectionTitle title="Today's Pulse"/><div className="grid grid-cols-2 gap-2"><div className="rounded-lg border border-[#eef2f6] p-3"><p className="text-2xl font-extrabold text-[#101828]">{stories.length}</p><p className="text-[7px] font-bold uppercase text-[#98a2b3]">Stories today</p></div><div className="rounded-lg border border-[#eef2f6] p-3"><p className="text-2xl font-extrabold text-[#101828]">{sourceCount}</p><p className="text-[7px] font-bold uppercase text-[#98a2b3]">Outlets</p></div><div className="rounded-lg border border-[#eef2f6] p-3"><p className="text-2xl font-extrabold text-[#101828]">{topics.length}</p><p className="text-[7px] font-bold uppercase text-[#98a2b3]">Topics</p></div><div className="rounded-lg border border-[#eef2f6] p-3"><p className="text-2xl font-extrabold text-[#101828]">{topics.filter(t=>t.sourceCount>1).length}</p><p className="text-[7px] font-bold uppercase text-[#98a2b3]">Multi-source</p></div></div></section>;
}

export async function RegionalHomepageV2({ region }: { region: RegionKey }) {
  const config = REGIONS[region];
  const [stories, weather, whatsOn] = await Promise.all([getStories({ region, limit: 140 }), getHomepageWeather(), getWhatsOnItems(region, 28)]);
  const topics = groupStoriesIntoTopics(stories, 100);
  const trending = rankTrendingTopics(topics).slice(0, 14);
  const sourceCount = new Set(stories.map((s) => s.source)).size;
  const localWeather = region === "sri-lanka" ? weather[0] : weather[1];
  const localDate = new Intl.DateTimeFormat("en-AU", { timeZone: config.timeZone, weekday: "short", day: "2-digit", month: "short" }).format(new Date());
  const pulseTopics = topics.slice(0,9).map((topic)=>({ key:topic.key,title:topic.lead.title,slug:topic.lead.slug,summary:topic.lead.summary,source:topic.lead.source,sourceCount:topic.sourceCount,category:topic.category }));
  const inNews = stories.slice(0,5) as StoryWithImage[];
  const featured = topics.slice(5,11);
  const latest = topics.slice(11,31);
  const keywordText = Array.from(new Set(topics.map(t=>t.category).filter(Boolean))).slice(0,24).join(" · ");

  return <main className="mx-auto max-w-[1180px] px-3 pb-14 pt-4 sm:px-5"><RegionPreference region={region}/>
    <section className="rounded-full border border-[#e4e7ec] bg-white px-4 py-2.5 text-[9px] font-semibold text-[#667085]"><div className="flex items-center gap-2 overflow-x-auto"><span className="shrink-0 font-bold text-[#101828]">{localDate}</span><span>·</span><span className="shrink-0">{config.flag} {formatCityTime(config.timeZone)} in {config.label}</span><span>·</span><span className="shrink-0">{localWeather.emoji} {localWeather.temperature != null ? `${Math.round(localWeather.temperature)}°` : "—"} {config.city}</span><span>·</span><Link href="/latest" className="shrink-0 font-bold text-[#3157d5]">Latest regional updates →</Link></div></section>

    <section className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">{quickLinks.map(([label,href,icon])=><a key={label} href={href} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-2 rounded-full border border-[#e4e7ec] bg-white px-3 py-2 text-[10px] font-semibold text-[#475467] hover:border-[#c8d4ff] hover:bg-[#f8faff]"><span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#eef3ff] px-1 text-[9px] font-black text-[#3157d5]">{icon}</span>{label}</a>)}</section>

    <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]"><RegionalPulseBoard regionLabel={config.label} flag={config.flag} greeting={`${greeting(config.timeZone)} ${region === "international" ? "🌍" : "☀️"}`} topics={pulseTopics} storyCount={stories.length} sourceCount={sourceCount} fallbackChips={config.places}/><div id="whats-on"><WhatsOnExplorer items={whatsOn} regionLabel={config.label} timeZone={config.timeZone} compact/></div></section>

    <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_265px]"><div><SectionTitle title="In the News"/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.1fr_.8fr_.8fr]">{inNews[0] ? <InNewsCard story={inNews[0]} large/> : null}<div className="grid gap-3">{inNews.slice(1,3).map(s=><InNewsCard key={s.slug} story={s}/>)}</div><div className="grid gap-3">{inNews.slice(3,5).map(s=><InNewsCard key={s.slug} story={s}/>)}</div></div>
      <section className="mt-6"><SectionTitle title="Featured Stories" href="/top-stories"/><div className="grid gap-3 sm:grid-cols-2">{featured.map(t=><FeaturedCard key={t.key} topic={t}/>)}</div></section>
    </div><aside className="space-y-4"><WeatherPanel weather={localWeather} timeZone={config.timeZone}/><SunMoonPanel weather={localWeather}/></aside></section>

    <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_265px]"><div><div className="flex items-center justify-between gap-3"><SectionTitle title="Latest News"/><div className="mb-4 hidden gap-1.5 sm:flex"><span className="rounded-full border border-[#e4e7ec] bg-white px-2.5 py-1 text-[8px] font-semibold text-[#667085]">All</span><span className="rounded-full border border-[#e4e7ec] bg-white px-2.5 py-1 text-[8px] font-semibold text-[#667085]">Multi-source</span></div></div><div className="grid gap-3 md:grid-cols-2">{latest.map(t=><LatestCard key={t.key} topic={t}/>)}</div><div className="mt-5 text-center"><Link href="/latest" className="inline-flex rounded-full border border-[#e4e7ec] bg-white px-5 py-2 text-[10px] font-bold text-[#475467] hover:border-[#3157d5] hover:text-[#3157d5]">Browse all news →</Link></div></div>
      <aside className="space-y-4"><CalendarPanel timeZone={config.timeZone}/><RankingPanel title="Trending" topics={trending}/><RankingPanel title="Most Covered" topics={[...topics].sort((a,b)=>b.sourceCount-a.sourceCount)}/>{keywordText ? <section className="rounded-xl border border-[#e4e7ec] bg-white p-4"><SectionTitle title="Trending Keywords"/><p className="text-[15px] font-extrabold leading-6 text-[#344054]">{keywordText}</p></section> : null}<TodayPulse stories={stories} sourceCount={sourceCount} topics={topics}/><section className="rounded-xl border border-[#e4e7ec] bg-white p-4"><SectionTitle title="Support Us"/><p className="text-[10px] leading-5 text-[#667085]">BridgeNews is free to use. Support helps keep regional aggregation, monitoring and infrastructure running.</p><Link href="/brief" className="mt-3 inline-flex rounded-lg bg-[#3157d5] px-3 py-2 text-[9px] font-bold text-white">Explore Daily Brief</Link></section><section className="rounded-xl border border-[#e4e7ec] bg-white p-4"><SectionTitle title="Suggest a Feed" href="/suggest-feed" label="Suggest"/><p className="text-[10px] leading-5 text-[#667085]">Missing a publisher or video channel? Suggest it for review.</p><Link href="/suggest-feed" className="mt-3 inline-flex rounded-lg border border-[#e4e7ec] px-3 py-2 text-[9px] font-bold text-[#3157d5]">＋ Suggest a feed</Link></section></aside></section>

    <section className="mt-7"><div className="flex items-center justify-between gap-3"><div><h2 className="text-[18px] font-extrabold text-[#101828]">Across {config.label}</h2><p className="mt-1 text-[9px] text-[#98a2b3]">Browse local and regional coverage</p></div><Link href="/map" className="text-[10px] font-bold text-[#3157d5]">View map →</Link></div><div className="mt-4 flex flex-wrap gap-2">{config.places.map((p)=><Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="rounded-full border border-[#e4e7ec] bg-white px-3 py-2 text-[10px] font-semibold text-[#475467] hover:border-[#3157d5] hover:text-[#3157d5]">{p}</Link>)}</div></section>
  </main>;
}
