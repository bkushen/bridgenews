import Link from "next/link";
import { getStories } from "@/lib/data/stories";
import { getExchangeStrip, getHomepageWeather, formatCityTime, formatClock, type WeatherCardData } from "@/lib/data/home-widgets";
import { groupStoriesIntoTopics, rankTrendingTopics, type TopicGroup } from "@/lib/data/topic-groups";
import { LiveNewsTicker } from "@/components/live-news-ticker";
import { RegionPreference } from "@/components/region-preference";
import type { Story } from "@/lib/mock-data";

type RegionKey = "sri-lanka" | "australia" | "international";
type StoryWithImage = Story & { imageUrl?: string | null };

type RegionConfig = {
  key: RegionKey;
  label: string;
  flag: string;
  route: string;
  city: string;
  timeZone: string;
  places: string[];
};

const REGIONS: Record<RegionKey, RegionConfig> = {
  "sri-lanka": {
    key: "sri-lanka", label: "Sri Lanka", flag: "🇱🇰", route: "/sri-lanka", city: "Colombo", timeZone: "Asia/Colombo",
    places: ["Colombo", "Kandy", "Galle", "Jaffna", "Anuradhapura", "Negombo", "Kurunegala", "Trincomalee", "Batticaloa", "Ratnapura", "Badulla", "Matara"],
  },
  australia: {
    key: "australia", label: "Australia", flag: "🇦🇺", route: "/australia", city: "Melbourne", timeZone: "Australia/Melbourne",
    places: ["Melbourne", "Sydney", "Brisbane", "Perth", "Adelaide", "Canberra", "Hobart", "Darwin", "Ballarat", "Geelong", "Gold Coast", "Newcastle"],
  },
  international: {
    key: "international", label: "International", flag: "🌍", route: "/international", city: "Melbourne", timeZone: "Australia/Melbourne",
    places: ["Asia", "Europe", "Americas", "Middle East", "Africa", "Pacific"],
  },
};

const REGION_LINKS = Object.values(REGIONS);

function SectionHeader({ title, href, label = "See all" }: { title: string; href?: string; label?: string }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">{title}</h2>{href ? <Link href={href} className="text-[11px] font-black text-rose-700 hover:text-black">{label} →</Link> : null}</div>;
}

function greeting(timeZone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-AU", { timeZone, hour: "2-digit", hour12: false }).format(new Date()));
  return hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
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

function StoryTile({ story, large = false }: { story: StoryWithImage; large?: boolean }) {
  return <Link href={`/story/${story.slug}`} className={`group block overflow-hidden rounded-xl border border-slate-200 bg-white ${large ? "sm:row-span-2" : ""}`}>{story.imageUrl ? <img src={story.imageUrl} alt="" className={`${large ? "h-56" : "h-32"} w-full object-cover`} /> : null}<div className="p-3"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-rose-700">{story.source} · {story.published}</p><p className={`${large ? "mt-2 text-xl" : "mt-1.5 text-sm"} line-clamp-3 font-black leading-tight text-slate-950 group-hover:underline`}>{story.title}</p></div></Link>;
}

function LatestCard({ topic }: { topic: TopicGroup }) {
  const story = topic.lead as StoryWithImage;
  return <article className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex gap-3">{story.imageUrl ? <img src={story.imageUrl} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover"/> : null}<div className="min-w-0"><Link href={`/story/${story.slug}`} className="line-clamp-3 text-[16px] font-black leading-5 text-slate-950 hover:underline">{story.title}</Link><p className="mt-1 text-[10px] font-bold text-rose-700">{story.source} · {story.published}</p></div></div><p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">{story.summary}</p>{topic.sourceCount > 1 ? <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-500">Covered by {topic.sourceCount} sources</p> : null}</article>;
}

function Ranking({ topics }: { topics: TopicGroup[] }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Most Covered" href="/popular"/><div className="divide-y divide-slate-100">{topics.slice(0, 6).map((topic, index) => <Link key={topic.key} href={`/story/${topic.lead.slug}`} className="flex gap-3 py-3 first:pt-0"><span className="w-5 shrink-0 text-lg font-black text-rose-700">{index + 1}</span><div><p className="line-clamp-3 text-sm font-black leading-5 text-slate-900 hover:underline">{topic.lead.title}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</p></div></Link>)}</div></section>;
}

function PulseBoard({ region, label, flag, timeZone, topics, storyCount, sourceCount }: { region: RegionKey; label: string; flag: string; timeZone: string; topics: TopicGroup[]; storyCount: number; sourceCount: number }) {
  const pulseTopics = topics.slice(0, 9);
  const feature = [...topics].sort((a, b) => b.sourceCount - a.sourceCount)[0] ?? topics[0];
  const topicLabels = Array.from(new Set(topics.map((topic) => topic.category).filter((name) => name && name.toLowerCase() !== "general"))).slice(0, 10);
  const fallbackLabels = region === "sri-lanka" ? ["Colombo", "Politics", "Business", "Weather", "Sports"] : region === "australia" ? ["Melbourne", "Politics", "Business", "Weather", "Sport"] : ["World", "Business", "Technology", "Politics", "Sport"];
  const chips = topicLabels.length ? topicLabels : fallbackLabels;

  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-700"><span className="h-2 w-2 rounded-full bg-emerald-600"/><span>Daily News Pulse · Live</span></div><h1 className="text-2xl font-black tracking-tight text-slate-950">{greeting(timeZone)} {region === "sri-lanka" ? "🌤️" : region === "australia" ? "☀️" : "🌍"}</h1></div>
      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_230px]">
        <div className="max-h-[275px] overflow-y-auto pr-1">{pulseTopics.length ? pulseTopics.map((topic, index) => <Link key={topic.key} href={`/story/${topic.lead.slug}`} className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] leading-5 text-slate-800 ${index === 0 ? "bg-[#f1ede5] font-black" : "font-semibold hover:bg-slate-50"}`}><span className="w-4 shrink-0 text-[9px] font-black text-slate-400">{flag}</span><span className="line-clamp-2 group-hover:underline">{topic.lead.title}</span>{topic.sourceCount > 1 ? <span className="ml-auto shrink-0 text-[9px] font-black text-rose-700">{topic.sourceCount}</span> : null}</Link>) : <p className="text-sm text-slate-500">No current stories available for this region.</p>}</div>
        <div className="rounded-xl border-l-2 border-rose-700 bg-[#efe9dd] p-4">{feature ? <><p className="text-[9px] font-black uppercase tracking-[0.14em] text-rose-700">Most covered now</p><Link href={`/story/${feature.lead.slug}`} className="mt-2 block text-[15px] font-black leading-5 text-slate-950 hover:underline">{feature.lead.title}</Link><p className="mt-2 line-clamp-6 text-[12px] leading-5 text-slate-700">{feature.lead.summary}</p><p className="mt-3 text-[9px] font-bold text-slate-500">{feature.sourceCount} source{feature.sourceCount === 1 ? "" : "s"} · {feature.lead.source}</p></> : null}</div>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-[9px] font-semibold italic text-slate-400">Live {label} edition · {storyCount} linked stories · {sourceCount} outlets</p>
    </div>
    <div className="border-t border-slate-200 p-4 sm:p-5"><div className="mb-3 flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Trending Topics</p><Link href="/topics" className="text-[9px] font-bold text-slate-400">Click to explore in News →</Link></div><div className="flex flex-wrap gap-2">{chips.map((name, index) => <Link key={name} href={`/search?q=${encodeURIComponent(name)}`} className={`rounded-full border px-3 py-1.5 text-[11px] font-black ${index < 3 ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:text-rose-700"}`}>#{name}</Link>)}</div></div>
  </div>;
}

function WhatsOn({ config, stories }: { config: RegionConfig; stories: StoryWithImage[] }) {
  const withImages = stories.filter((story) => story.imageUrl);
  const lead = withImages[0] ?? stories[0];
  const next = withImages.slice(1, 7);
  return <aside className="rounded-xl border border-slate-200 bg-white p-4">
    <SectionHeader title="What's On" href="/latest" label={`${config.label} now`}/>
    {lead ? <><Link href={`/story/${lead.slug}`} className="group block overflow-hidden rounded-lg bg-slate-950 text-white">{lead.imageUrl ? <img src={lead.imageUrl} alt="" className="h-32 w-full object-cover opacity-80"/> : null}<div className="p-4"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{config.flag} {config.label} · Now</p><p className="mt-1 line-clamp-3 text-lg font-black leading-5 group-hover:underline">{lead.title}</p></div></Link><div className="mt-3"><div className="flex flex-wrap gap-1.5"><span className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-800">LIVE NEWS</span><span className="rounded border border-slate-200 px-2 py-1 text-[9px] font-bold text-slate-600">{config.city}</span><span className="rounded border border-slate-200 px-2 py-1 text-[9px] font-bold text-slate-600">{lead.source}</span></div><p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{lead.summary}</p></div></> : null}
    {next.length ? <div className="mt-4"><p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">What's next</p><div className="mt-2 grid grid-cols-6 gap-2">{next.map((story) => <Link key={story.slug} href={`/story/${story.slug}`} title={story.title} className="group overflow-hidden rounded-md border border-slate-200">{story.imageUrl ? <img src={story.imageUrl} alt="" className="h-16 w-full object-cover transition group-hover:scale-105"/> : null}</Link>)}</div></div> : null}
    <div className="mt-4 grid grid-cols-2 gap-2"><Link href={`/search?q=${encodeURIComponent(config.city)}`} className="rounded-lg border border-slate-200 p-2.5 text-xs font-black hover:bg-slate-50">{config.city} →</Link><Link href="/official" className="rounded-lg border border-slate-200 p-2.5 text-xs font-black hover:bg-slate-50">Official →</Link><Link href="/videos" className="rounded-lg border border-slate-200 p-2.5 text-xs font-black hover:bg-slate-50">Videos →</Link><Link href="/top-stories" className="rounded-lg border border-slate-200 p-2.5 text-xs font-black hover:bg-slate-50">Top stories →</Link></div>
  </aside>;
}

export async function RegionalHomepage({ region }: { region: RegionKey }) {
  const config = REGIONS[region];
  const [stories, weather, rates] = await Promise.all([getStories({ region, limit: 100 }), getHomepageWeather(), getExchangeStrip()]);
  const topics = groupStoriesIntoTopics(stories, 70);
  const trending = rankTrendingTopics(topics).slice(0, 12);
  const inNews = stories.slice(1, 6) as StoryWithImage[];
  const localWeather = region === "sri-lanka" ? weather[0] : weather[1];
  const sourceCount = new Set(stories.map((story) => story.source)).size;
  const tickerItems = trending.slice(0, 8).map((topic) => ({ key: topic.key, title: topic.lead.title, href: `/story/${topic.lead.slug}` }));
  const localDate = new Intl.DateTimeFormat("en-AU", { timeZone: config.timeZone, weekday: "short", day: "2-digit", month: "short" }).format(new Date());

  return <main className="mx-auto max-w-[1180px] px-3 pb-12 pt-3 sm:px-5 md:pt-4">
    <RegionPreference region={region}/>
    <section className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold text-slate-500"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>{localDate}</span><span>·</span><span>{formatCityTime(config.timeZone)} in {config.label}</span><span>·</span><span>{localWeather.emoji} {localWeather.temperature != null ? `${Math.round(localWeather.temperature)}°` : "—"} {config.city}</span><span className="ml-auto hidden sm:inline">{config.flag} {config.label} live desk</span></div></section>

    <nav aria-label="Choose news region" className="mt-3 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3"><Link href="/" className="shrink-0 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-black text-slate-700 hover:border-slate-400">Overview</Link>{REGION_LINKS.map((item) => <Link key={item.key} href={item.route} className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-black ${item.key === region ? "bg-black text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`} aria-current={item.key === region ? "page" : undefined}>{item.flag} {item.label}</Link>)}</nav>

    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600"><span className="font-black text-slate-950">Markets</span><span>AUD/LKR <b>{rates.audToLkr?.toFixed(2) ?? "—"}</b></span><span>USD/LKR <b>{rates.usdToLkr?.toFixed(2) ?? "—"}</b></span><span>AUD/USD <b>{rates.audToUsd?.toFixed(4) ?? "—"}</b></span><span className="ml-auto hidden text-slate-400 sm:inline">Daily rates</span></div>
    <LiveNewsTicker items={tickerItems}/>

    <section className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_350px]"><PulseBoard region={region} label={config.label} flag={config.flag} timeZone={config.timeZone} topics={trending.length ? trending : topics} storyCount={stories.length} sourceCount={sourceCount}/><WhatsOn config={config} stories={stories as StoryWithImage[]}/></section>

    <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]"><div><SectionHeader title={`In the News · ${config.label}`}/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{inNews.map((story, index) => <StoryTile key={story.slug} story={story} large={index === 0}/>)}</div><section className="mt-6"><SectionHeader title={`Latest ${config.label} News`} href="/latest"/><div className="grid gap-3 md:grid-cols-2">{topics.slice(0, 16).map((topic) => <LatestCard key={topic.key} topic={topic}/>)}</div></section></div><aside className="space-y-4"><WeatherPanel weather={localWeather} timeZone={config.timeZone}/><SunMoonPanel weather={localWeather}/><Ranking topics={trending}/></aside></section>

    <section className="mt-8 border-t border-slate-200 pt-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-950">Across {config.label}</h2><p className="mt-1 text-xs text-slate-500">Jump into location and regional news searches</p></div><Link href="/search" className="text-xs font-black text-rose-700">Search news →</Link></div><div className="flex flex-wrap gap-2">{config.places.map((place) => <Link key={place} href={`/search?q=${encodeURIComponent(place)}`} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-400">{place}</Link>)}</div></section>
  </main>;
}
