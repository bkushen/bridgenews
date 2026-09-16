import Link from "next/link";
import { getStories } from "@/lib/data/stories";
import { getExchangeStrip, getHomepageWeather, formatCityTime, formatClock, type WeatherCardData } from "@/lib/data/home-widgets";
import { getWhatsOnItems } from "@/lib/data/whats-on";
import { groupStoriesIntoTopics, rankTrendingTopics, type TopicGroup } from "@/lib/data/topic-groups";
import { LiveNewsTicker } from "@/components/live-news-ticker";
import { RegionPreference } from "@/components/region-preference";
import { RegionalPulseBoard } from "@/components/regional-pulse-board";
import { WhatsOnExplorer } from "@/components/whats-on-explorer";
import type { Story } from "@/lib/mock-data";

type RegionKey = "sri-lanka" | "australia" | "international";
type StoryWithImage = Story & { imageUrl?: string | null };
type RegionConfig = { key: RegionKey; label: string; flag: string; route: string; city: string; timeZone: string; places: string[] };

const REGIONS: Record<RegionKey, RegionConfig> = {
  "sri-lanka": { key: "sri-lanka", label: "Sri Lanka", flag: "🇱🇰", route: "/sri-lanka", city: "Colombo", timeZone: "Asia/Colombo", places: ["Colombo", "Kandy", "Galle", "Jaffna", "Anuradhapura", "Negombo", "Kurunegala", "Trincomalee", "Batticaloa", "Ratnapura", "Badulla", "Matara"] },
  australia: { key: "australia", label: "Australia", flag: "🇦🇺", route: "/australia", city: "Melbourne", timeZone: "Australia/Melbourne", places: ["Melbourne", "Sydney", "Brisbane", "Perth", "Adelaide", "Canberra", "Hobart", "Darwin", "Ballarat", "Geelong", "Gold Coast", "Newcastle"] },
  international: { key: "international", label: "International", flag: "🌍", route: "/international", city: "World", timeZone: "UTC", places: ["Asia", "Europe", "Americas", "Middle East", "Africa", "Pacific"] },
};

function SectionHeader({ title, href, label = "See all" }: { title: string; href?: string; label?: string }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">{title}</h2>{href ? <Link href={href} className="text-[11px] font-black text-rose-700 hover:text-black">{label} →</Link> : null}</div>;
}

function greeting(timeZone: string) {
  const h = Number(new Intl.DateTimeFormat("en-AU", { timeZone, hour: "2-digit", hour12: false }).format(new Date()));
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}

function relativeDay(offset: number, timeZone: string) {
  const d = new Date(Date.now() - offset * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function WeatherPanel({ weather, timeZone }: { weather: WeatherCardData; timeZone: string }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Weather"/><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="text-4xl">{weather.emoji}</span><div><p className="text-4xl font-black tracking-tight">{weather.temperature != null ? `${Math.round(weather.temperature)}°` : "—"}</p><p className="text-xs font-semibold text-slate-500">{weather.condition} · {weather.city}</p></div></div><p className="text-right text-[10px] font-semibold leading-5 text-slate-500">H {weather.high != null ? Math.round(weather.high) : "—"}° / L {weather.low != null ? Math.round(weather.low) : "—"}°<br/>Feels {weather.apparentTemperature != null ? `${Math.round(weather.apparentTemperature)}°` : "—"}</p></div>{weather.hourly.length ? <div className="mt-4 grid grid-cols-5 gap-1 border-t border-slate-100 pt-3">{weather.hourly.map((point) => <div key={point.time} className="text-center"><p className="text-[9px] font-bold text-slate-400">{new Date(point.time).toLocaleTimeString("en-AU", { timeZone, hour: "2-digit", minute: "2-digit" })}</p><p className="my-1 text-lg">{point.emoji}</p><p className="text-[10px] font-black">{point.temperature != null ? `${Math.round(point.temperature)}°` : "—"}</p></div>)}</div> : null}<p className="mt-3 border-t border-slate-100 pt-3 text-[9px] text-slate-400">Open-Meteo · {formatCityTime(timeZone)}</p></section>;
}

function SunMoonPanel({ weather }: { weather: WeatherCardData }) {
  const sunrise = weather.sunrise ? new Date(weather.sunrise) : null;
  const sunset = weather.sunset ? new Date(weather.sunset) : null;
  const daylight = sunrise && sunset ? Math.max(0, sunset.getTime() - sunrise.getTime()) : 0;
  const daylightText = daylight ? `${Math.floor(daylight / 3600000)}h ${Math.round((daylight % 3600000) / 60000)}m` : "—";
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Sun & Moon"/><div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-xl">🌅</p><p className="mt-1 text-sm font-black">{formatClock(weather.sunrise)}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Sunrise</p></div><div><p className="text-xl">☀️</p><p className="mt-1 text-sm font-black">{daylightText}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Daylight</p></div><div><p className="text-xl">🌇</p><p className="mt-1 text-sm font-black">{formatClock(weather.sunset)}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Sunset</p></div></div></section>;
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
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Calendar" href="/archive" label="Archive"/><p className="mb-3 text-xs font-black text-rose-700">{label}</p><div className="grid grid-cols-7 gap-1 text-center">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <span key={d} className="pb-1 text-[8px] font-black uppercase text-slate-400">{d}</span>)}{cells.map((d, i) => <span key={i} className={`grid h-7 place-items-center rounded text-[10px] font-bold ${d === today ? "bg-black text-white" : "text-slate-600"}`}>{d ?? ""}</span>)}</div><p className="mt-3 text-[9px] leading-4 text-slate-400">Use the archive to browse coverage by date.</p></section>;
}

function Stat({ n, label }: { n: number; label: string }) {
  return <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><p className="text-2xl font-black">{n}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p></div>;
}

function TodayPulse({ stories, sourceCount, topics }: { stories: Story[]; sourceCount: number; topics: TopicGroup[] }) {
  const multi = topics.filter((t) => t.sourceCount > 1).length;
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Today's Pulse"/><div className="grid grid-cols-2 gap-2"><Stat n={stories.length} label="Stories loaded"/><Stat n={sourceCount} label="Outlets"/><Stat n={topics.length} label="Live topics"/><Stat n={multi} label="Multi-source"/></div><p className="mt-3 text-[9px] leading-4 text-slate-400">Live coverage statistics only. No AI sentiment scoring.</p></section>;
}

function Ranking({ topics }: { topics: TopicGroup[] }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Most Covered" href="/popular"/><div className="divide-y divide-slate-100">{topics.slice(0, 6).map((topic, i) => <Link key={topic.key} href={`/story/${topic.lead.slug}`} className="flex gap-3 py-3 first:pt-0"><span className="w-5 shrink-0 text-lg font-black text-rose-700">{i + 1}</span><div><p className="line-clamp-3 text-sm font-black leading-5 text-slate-900 hover:underline">{topic.lead.title}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</p></div></Link>)}</div></section>;
}

function StoryTile({ story, large = false }: { story: StoryWithImage; large?: boolean }) {
  return <Link href={`/story/${story.slug}`} className="group block overflow-hidden rounded-xl border border-slate-200 bg-white">{story.imageUrl ? <div className="overflow-hidden"><img src={story.imageUrl} alt="" className={`${large ? "h-56" : "h-32"} w-full object-cover transition duration-300 group-hover:scale-[1.035]`}/></div> : null}<div className="p-3"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-rose-700">{story.source} · {story.published}</p><p className={`${large ? "mt-2 text-xl" : "mt-1.5 text-sm"} line-clamp-3 font-black leading-tight text-slate-950 group-hover:text-rose-800`}>{story.title}</p></div></Link>;
}

function LatestCard({ topic }: { topic: TopicGroup }) {
  const story = topic.lead as StoryWithImage;
  return <article className="rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex gap-3">{story.imageUrl ? <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg"><img src={story.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 hover:scale-105"/></div> : null}<div className="min-w-0"><Link href={`/story/${story.slug}`} className="line-clamp-3 text-[16px] font-black leading-5 text-slate-950 hover:text-rose-800">{story.title}</Link><p className="mt-1 text-[10px] font-bold text-rose-700">{story.source} · {story.published}</p></div></div><p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">{story.summary}</p><div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[10px] font-bold text-slate-400">{topic.sourceCount > 1 ? `${topic.sourceCount} sources` : "Single source"}</span><Link href={`/story/${story.slug}`} className="text-[10px] font-black text-rose-700">Read more →</Link></div></article>;
}

export async function RegionalHomepageV2({ region }: { region: RegionKey }) {
  const config = REGIONS[region];
  const [stories, weather, rates, whatsOn] = await Promise.all([
    getStories({ region, limit: 120 }),
    getHomepageWeather(),
    getExchangeStrip(),
    getWhatsOnItems(region, 28),
  ]);
  const topics = groupStoriesIntoTopics(stories, 80);
  const trending = rankTrendingTopics(topics).slice(0, 14);
  const sourceCount = new Set(stories.map((s) => s.source)).size;
  const localWeather = region === "sri-lanka" ? weather[0] : weather[1];
  const inNews = stories.slice(0, 6) as StoryWithImage[];
  const publishers = Array.from(new Set(stories.map((s) => s.source))).slice(0, 18);
  const tickerItems = trending.slice(0, 8).map((t) => ({ key: t.key, title: t.lead.title, href: `/story/${t.lead.slug}` }));
  const localDate = new Intl.DateTimeFormat("en-AU", { timeZone: config.timeZone, weekday: "short", day: "2-digit", month: "short" }).format(new Date());
  const pulseTopics = topics.slice(0, 9).map((topic) => ({ key: topic.key, title: topic.lead.title, slug: topic.lead.slug, summary: topic.lead.summary, source: topic.lead.source, sourceCount: topic.sourceCount, category: topic.category }));

  return <main className="mx-auto max-w-[1180px] px-3 pb-12 pt-3 sm:px-5 md:pt-4"><RegionPreference region={region}/>
    <section className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold text-slate-500"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>{localDate}</span><span>·</span><span>{formatCityTime(config.timeZone)} in {config.label}</span><span>·</span><span>{localWeather.emoji} {localWeather.temperature != null ? `${Math.round(localWeather.temperature)}°` : "—"} {config.city}</span><span className="ml-auto hidden sm:inline">{config.flag} {config.label} live desk</span></div></section>

    <section className="mt-3 flex gap-2 overflow-x-auto pb-1">{[["Top Stories","/top-stories"],["News","/latest"],["Videos","/videos"],["What's On","/whats-on"],["Map","/map"],["Topics","/topics"],["Archive","/archive"],["Sources","/sources"],["Daily Brief","/brief"]].map(([label,href]) => <Link key={label} href={href} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 hover:border-rose-700 hover:text-rose-800">{label}</Link>)}</section>
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600"><span className="font-black text-slate-950">Markets</span><span>AUD/LKR <b>{rates.audToLkr?.toFixed(2) ?? "—"}</b></span><span>USD/LKR <b>{rates.usdToLkr?.toFixed(2) ?? "—"}</b></span><span>AUD/USD <b>{rates.audToUsd?.toFixed(4) ?? "—"}</b></span></div>
    <LiveNewsTicker items={tickerItems}/>

    <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_370px]"><RegionalPulseBoard regionLabel={config.label} flag={config.flag} greeting={`${greeting(config.timeZone)} ${config.key === "international" ? "🌍" : "☀️"}`} topics={pulseTopics} storyCount={stories.length} sourceCount={sourceCount} fallbackChips={config.places}/><div id="whats-on"><WhatsOnExplorer items={whatsOn} regionLabel={config.label} timeZone={config.timeZone} compact/></div></section>

    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-center gap-2 overflow-x-auto"><span className="shrink-0 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Publishers in this edition</span>{publishers.map((p) => <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600">{p}</Link>)}</div></section>

    <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]"><div><SectionHeader title={`In the News · ${config.label}`}/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{inNews.map((story, i) => <StoryTile key={story.slug} story={story} large={i === 0}/>)}</div><section className="mt-6"><div className="flex flex-wrap items-end justify-between gap-3"><SectionHeader title={`Latest ${config.label} News`} href="/latest"/><div className="mb-3 flex gap-1.5 text-[9px] font-black"><Link href="/latest" className="rounded-full bg-black px-3 py-1.5 text-white">Latest</Link><Link href="/popular" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-500">Popular</Link><Link href="/top-stories" className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-500">Multi-source</Link></div></div><div className="grid gap-3 md:grid-cols-2">{topics.slice(0, 18).map((topic) => <LatestCard key={topic.key} topic={topic}/>)}</div></section><section className="mt-6 rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Browse by date" href="/archive" label="Full archive"/><div className="flex gap-2 overflow-x-auto">{Array.from({length:7},(_,i)=>{const date=relativeDay(i,config.timeZone);return <Link key={date} href={`/archive?date=${date}`} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black ${i===0?"bg-black text-white":"border border-slate-200 text-slate-600"}`}>{i===0?"Today":i===1?"Yesterday":date.slice(5)}</Link>})}</div></section></div><aside className="space-y-4"><WeatherPanel weather={localWeather} timeZone={config.timeZone}/><SunMoonPanel weather={localWeather}/><CalendarPanel timeZone={config.timeZone}/><Ranking topics={trending}/><TodayPulse stories={stories} sourceCount={sourceCount} topics={topics}/></aside></section>

    <section className="mt-8 border-t border-slate-200 pt-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-950">Across {config.label}</h2><p className="mt-1 text-xs text-slate-500">Location and regional news shortcuts</p></div><Link href="/map" className="text-xs font-black text-rose-700">View map →</Link></div><div className="flex flex-wrap gap-2">{config.places.map((p) => <Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">{p}</Link>)}</div></section>
    <section className="mt-7 grid gap-4 md:grid-cols-3"><Link href="/topics" className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">Topics</p><h3 className="mt-2 text-lg font-black">Follow what matters</h3><p className="mt-2 text-xs leading-5 text-slate-500">Explore grouped coverage across people, policy, sport, economy and more.</p></Link><Link href="/videos" className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">Video</p><h3 className="mt-2 text-lg font-black">Watch publisher channels</h3><p className="mt-2 text-xs leading-5 text-slate-500">Browse enabled video feeds without leaving the regional experience.</p></Link><Link href="/suggest-feed" className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-rose-700">Suggest a Feed</p><h3 className="mt-2 text-lg font-black">Missing a publisher?</h3><p className="mt-2 text-xs leading-5 text-slate-500">Suggest an RSS feed, publisher or video channel for review.</p></Link></section>
  </main>;
}
