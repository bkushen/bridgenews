import Link from "next/link";
import { getStories } from "@/lib/data/stories";
import { getCategories } from "@/lib/data/categories";
import { getPublicSources } from "@/lib/data/sources";
import { getExchangeStrip, getHomepageWeather, formatCityTime, formatClock, type WeatherCardData } from "@/lib/data/home-widgets";
import { groupStoriesIntoTopics, rankTrendingTopics, type TopicGroup } from "@/lib/data/topic-groups";
import { getSiteControl, sectionEnabled } from "@/lib/data/site-control";
import { LiveNewsTicker } from "@/components/live-news-ticker";
import { SourceRail } from "@/components/source-rail";
import type { Story } from "@/lib/mock-data";

type StoryWithImage = Story & { imageUrl?: string | null };
type RegionFilter = "sri-lanka" | "australia" | "international" | "all";
type RegionTab = { key: RegionFilter; label: string; flagUrl?: string; symbol?: string };

const REGION_TABS: RegionTab[] = [
  { key: "sri-lanka", label: "Sri Lanka", flagUrl: "https://flagcdn.com/w40/lk.png" },
  { key: "australia", label: "Australia", flagUrl: "https://flagcdn.com/w40/au.png" },
  { key: "international", label: "International", symbol: "🌍" },
  { key: "all", label: "All", symbol: "🌐" },
];

const SOCIAL_LINKS = [
  ["Google", "https://www.google.com"], ["Gmail", "https://mail.google.com"], ["YouTube", "https://www.youtube.com"],
  ["Facebook", "https://www.facebook.com"], ["WhatsApp", "https://www.whatsapp.com"], ["Wikipedia", "https://www.wikipedia.org"],
  ["X.com", "https://x.com"], ["LinkedIn", "https://www.linkedin.com"], ["Instagram", "https://www.instagram.com"], ["Reddit", "https://www.reddit.com"],
] as const;

const SRI_LANKA_PLACES = ["Colombo", "Kandy", "Galle", "Jaffna", "Anuradhapura", "Negombo", "Kurunegala", "Trincomalee", "Batticaloa", "Ratnapura", "Badulla", "Matara"];

function RegionMark({ tab, compact = false }: { tab: RegionTab; compact?: boolean }) {
  if (tab.flagUrl) return <img src={tab.flagUrl} alt={`${tab.label} flag`} className={`${compact ? "h-3.5 w-5" : "h-4 w-6"} rounded-[2px] border border-black/10 object-cover`} />;
  return <span className={compact ? "text-sm" : "text-base"} aria-hidden="true">{tab.symbol}</span>;
}

function SectionHeader({ title, href, linkLabel = "See all" }: { title: string; href?: string; linkLabel?: string }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">{title}</h2>{href ? <Link href={href} className="text-[11px] font-black text-rose-700 hover:text-black">{linkLabel} →</Link> : null}</div>;
}

function PulseHeadline({ story, region }: { story: StoryWithImage; region: RegionFilter }) {
  const symbol = region === "sri-lanka" ? "🇱🇰" : region === "australia" ? "🇦🇺" : region === "international" ? "🌍" : "•";
  return <Link href={`/story/${story.slug}`} className="group flex items-start gap-2 border-b border-slate-100 py-2 text-[13px] font-bold leading-5 text-slate-800 last:border-0 hover:text-black"><span className="mt-0.5 shrink-0 text-[10px]">{symbol}</span><span className="line-clamp-2 group-hover:underline">{story.title}</span></Link>;
}

function InNewsCard({ story, large = false }: { story: StoryWithImage; large?: boolean }) {
  return <Link href={`/story/${story.slug}`} className={`group block overflow-hidden rounded-xl border border-slate-200 bg-white ${large ? "sm:row-span-2" : ""}`}>
    {story.imageUrl ? <img src={story.imageUrl} alt="" className={`${large ? "h-56" : "h-32"} w-full object-cover`} /> : <div className={`${large ? "h-56" : "h-32"} grid place-items-center bg-slate-100 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400`}>BridgeNews</div>}
    <div className="p-3"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-rose-700">{story.source} · {story.published}</p><p className={`${large ? "mt-2 text-xl" : "mt-1.5 text-sm"} line-clamp-3 font-black leading-tight text-slate-950 group-hover:underline`}>{story.title}</p></div>
  </Link>;
}

function FeaturedCard({ topic }: { topic: TopicGroup }) {
  return <Link href={`/story/${topic.lead.slug}`} className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300"><p className="text-[11px] font-black text-slate-400">★ {topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</p><h3 className="mt-3 line-clamp-3 text-lg font-black leading-snug tracking-tight text-slate-950 group-hover:underline">{topic.lead.title}</h3><p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-rose-700">Editor-style pick · multi-source</p></Link>;
}

function LatestNewsCard({ topic }: { topic: TopicGroup }) {
  const lead = topic.lead as StoryWithImage;
  return <article className="rounded-xl border border-slate-200 bg-white p-4">
    <div className="flex gap-3">{lead.imageUrl ? <img src={lead.imageUrl} alt="" className="h-20 w-24 shrink-0 rounded-lg object-cover" /> : <div className="grid h-20 w-24 shrink-0 place-items-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-400">BN</div>}<div className="min-w-0"><Link href={`/story/${lead.slug}`}><h3 className="line-clamp-3 text-[16px] font-black leading-5 text-slate-950 hover:underline">{lead.title}</h3></Link><p className="mt-1 text-[10px] font-bold text-rose-700">{lead.source} · {lead.published}</p></div></div>
    <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded border border-slate-200 px-2 py-1 text-[9px] font-bold text-slate-500">#{topic.category}</span>{topic.sourceCount > 1 ? <span className="rounded border border-slate-200 px-2 py-1 text-[9px] font-bold text-slate-500">+{topic.sourceCount - 1} sources</span> : null}</div>
    <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">{lead.summary}</p>
    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-[10px] font-bold text-slate-400">☆ Save</span><Link href={`/story/${lead.slug}`} className="text-[10px] font-black text-rose-700 hover:text-black">Read More →</Link></div>
    {topic.stories.length > 1 ? <div className="mt-3 border-t border-slate-100 pt-3"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">Related coverage</p><div className="mt-2 space-y-1">{topic.stories.slice(1, 4).map((story) => <Link key={story.slug} href={`/story/${story.slug}`} className="block truncate text-[10px] font-semibold text-slate-600 hover:text-black"><b className="mr-1 text-slate-800">{story.source}</b>{story.title}</Link>)}</div></div> : null}
  </article>;
}

function WeatherPanel({ weather }: { weather: WeatherCardData }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Weather" href="/" linkLabel="Forecast"/><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="text-4xl">{weather.emoji}</span><div><p className="text-4xl font-black tracking-tight">{weather.temperature != null ? `${Math.round(weather.temperature)}°` : "—"}</p><p className="text-xs font-semibold text-slate-500">{weather.condition} · {weather.city}</p></div></div><p className="text-right text-[10px] font-semibold leading-5 text-slate-500">H {weather.high != null ? Math.round(weather.high) : "—"}° / L {weather.low != null ? Math.round(weather.low) : "—"}°<br/>Feels {weather.apparentTemperature != null ? `${Math.round(weather.apparentTemperature)}°` : "—"}</p></div>
    {weather.hourly.length ? <div className="mt-4 grid grid-cols-5 gap-1 border-t border-slate-100 pt-3">{weather.hourly.map((point) => <div key={point.time} className="text-center"><p className="text-[9px] font-bold text-slate-400">{new Date(point.time).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" })}</p><p className="my-1 text-lg">{point.emoji}</p><p className="text-[10px] font-black">{point.temperature != null ? `${Math.round(point.temperature)}°` : "—"}</p></div>)}</div> : null}
    <p className="mt-3 border-t border-slate-100 pt-3 text-[9px] text-slate-400">Open-Meteo · {weather.city === "Colombo" ? formatCityTime("Asia/Colombo") : formatCityTime("Australia/Melbourne")}</p></section>;
}

function SunMoonPanel({ weather }: { weather: WeatherCardData }) {
  const sunrise = weather.sunrise ? new Date(weather.sunrise) : null;
  const sunset = weather.sunset ? new Date(weather.sunset) : null;
  const daylightMs = sunrise && sunset ? Math.max(0, sunset.getTime() - sunrise.getTime()) : 0;
  const daylightHours = daylightMs ? `${Math.floor(daylightMs / 3600000)}h ${Math.round((daylightMs % 3600000) / 60000)}m` : "—";
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Sun & Moon"/><div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-xl">🌅</p><p className="mt-1 text-sm font-black">{formatClock(weather.sunrise)}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Sunrise</p></div><div><p className="text-xl">☀️</p><p className="mt-1 text-sm font-black">{daylightHours}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Daylight</p></div><div><p className="text-xl">🌇</p><p className="mt-1 text-sm font-black">{formatClock(weather.sunset)}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Sunset</p></div></div><div className="mt-4 rounded-lg bg-slate-50 p-3"><div className="flex items-center justify-between text-[10px] font-bold text-slate-500"><span>🌗 Lunar phase</span><span>Local sky guide</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-1/2 rounded-full bg-slate-800"/></div><p className="mt-2 text-[9px] leading-4 text-slate-400">Astronomical times use the weather location; lunar phase is shown as a simple visual guide.</p></div></section>;
}

function HolidayCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const days = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7;
  const cells = Array.from({ length: offset + days }, (_, index) => index < offset ? null : index - offset + 1);
  const monthName = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(now);
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Holiday Calendar"/><p className="mb-3 text-xs font-black text-rose-700">{monthName}</p><div className="grid grid-cols-7 gap-1 text-center">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day) => <span key={day} className="pb-1 text-[8px] font-black uppercase text-slate-400">{day}</span>)}{cells.map((day, index) => <span key={index} className={`grid h-7 place-items-center rounded text-[10px] font-bold ${day === now.getDate() ? "bg-black text-white" : "text-slate-600"}`}>{day ?? ""}</span>)}</div><p className="mt-3 text-[9px] leading-4 text-slate-400">Current-month calendar. Public-holiday detail can be added when a verified holiday source is connected.</p></section>;
}

function RankList({ title, topics, href }: { title: string; topics: TopicGroup[]; href: string }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title={title} href={href}/><div className="divide-y divide-slate-100">{topics.slice(0, 5).map((topic, index) => <Link key={topic.key} href={`/story/${topic.lead.slug}`} className="flex gap-3 py-3 first:pt-0"><span className="w-5 shrink-0 text-lg font-black text-rose-700">{index + 1}</span><div><p className="line-clamp-3 text-sm font-black leading-5 text-slate-900 hover:underline">{topic.lead.title}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{topic.lead.source} · {topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</p></div></Link>)}</div></section>;
}

function TodayPulse({ stories, sourceCount, topicCount, multiSource }: { stories: number; sourceCount: number; topicCount: number; multiSource: number }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Today's Pulse"/><div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Live & active</p><p className="mt-1 text-lg font-black">📰 News is moving</p></div><div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-slate-100 p-3"><p className="text-2xl font-black">{stories}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Stories loaded</p></div><div className="rounded-lg border border-slate-100 p-3"><p className="text-2xl font-black">{sourceCount}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Outlets</p></div><div className="rounded-lg border border-slate-100 p-3"><p className="text-2xl font-black">{topicCount}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Topics</p></div><div className="rounded-lg border border-slate-100 p-3"><p className="text-2xl font-black">{multiSource}</p><p className="text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">Multi-source</p></div></div></section>;
}

function greetingFor(timeZone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-AU", { timeZone, hour: "2-digit", hour12: false }).format(new Date()));
  return hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
}

export default async function Home({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const params = await searchParams;
  const control = await getSiteControl();
  const configuredDefault = String(control.settings.default_region ?? "sri-lanka") as RegionFilter;
  const defaultRegion: RegionFilter = REGION_TABS.some((tab) => tab.key === configuredDefault) ? configuredDefault : "sri-lanka";
  const requested = params.region as RegionFilter | undefined;
  const selectedRegion: RegionFilter = REGION_TABS.some((tab) => tab.key === requested) ? (requested as RegionFilter) : defaultRegion;

  const [allLatest, sriLanka, australia, international, categories, weather, rates, sources] = await Promise.all([
    getStories({ limit: 100 }), getStories({ region: "sri-lanka", limit: 100 }), getStories({ region: "australia", limit: 100 }), getStories({ region: "international", limit: 100 }), getCategories(), getHomepageWeather(), getExchangeStrip(), getPublicSources(60),
  ]);

  const selectedStories = selectedRegion === "sri-lanka" ? sriLanka : selectedRegion === "australia" ? australia : selectedRegion === "international" ? international : allLatest;
  const selectedTab = REGION_TABS.find((tab) => tab.key === selectedRegion) || REGION_TABS[0];
  const regionLabel = selectedTab.label;
  const latestTopics = groupStoriesIntoTopics(selectedStories, 60);
  const trendingTopics = rankTrendingTopics(latestTopics).slice(0, 12);
  const featuredTopics = [...trendingTopics.filter((topic) => topic.sourceCount > 1), ...latestTopics].filter((topic, index, array) => array.findIndex((item) => item.key === topic.key) === index).slice(0, 6);
  const topCategories = categories.slice(0, 14);
  const pulseStories = selectedStories.slice(0, 10) as StoryWithImage[];
  const inNews = selectedStories.slice(1, 6) as StoryWithImage[];
  const feed = latestTopics.slice(0, 18);
  const colombo = weather[0];
  const melbourne = weather[1];
  const sourceCount = new Set(selectedStories.map((story) => story.source)).size;
  const multiSourceTopics = latestTopics.filter((topic) => topic.sourceCount > 1).length;
  const lead = pulseStories[0];
  const tickerItems = trendingTopics.slice(0, 8).map((topic) => ({ key: topic.key, title: topic.lead.title, href: `/story/${topic.lead.slug}` }));
  const utilityDate = new Intl.DateTimeFormat("en-AU", { timeZone: "Asia/Colombo", weekday: "short", day: "2-digit", month: "short" }).format(new Date());

  return <main className="mx-auto max-w-[1180px] px-3 pb-12 pt-3 sm:px-5 md:pt-4">
    <section className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold text-slate-500"><div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>{utilityDate}</span><span>·</span><span>{formatCityTime("Asia/Colombo")} in Sri Lanka</span><span>·</span><span>{colombo.emoji} {colombo.temperature != null ? `${Math.round(colombo.temperature)}°` : "—"} Colombo</span><span className="ml-auto hidden sm:inline">BridgeNews live desk</span></div></section>

    <section className="mt-3 flex gap-2 overflow-x-auto pb-1">{SOCIAL_LINKS.map(([label, href]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 hover:border-slate-400 hover:text-black">{label}</a>)}</section>

    {control.settings.markets_enabled !== false ? <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600"><span className="font-black text-slate-950">Markets</span><span>AUD/LKR <b>{rates.audToLkr?.toFixed(2) ?? "—"}</b></span><span>USD/LKR <b>{rates.usdToLkr?.toFixed(2) ?? "—"}</b></span><span>AUD/USD <b>{rates.audToUsd?.toFixed(4) ?? "—"}</b></span><span className="ml-auto hidden text-slate-400 sm:inline">Daily rates</span></div> : null}
    {control.settings.ticker_enabled !== false ? <LiveNewsTicker items={tickerItems}/> : null}

    {sectionEnabled(control, "region_switcher") ? <nav aria-label="Choose news region" className="mt-3 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">{REGION_TABS.map((tab) => { const active = selectedRegion === tab.key; return <Link key={tab.key} href={tab.key === defaultRegion ? "/" : `/?region=${tab.key}`} className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-black transition ${active ? "bg-black text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`} aria-current={active ? "page" : undefined}><RegionMark tab={tab} compact/><span>{tab.label}</span></Link>; })}</nav> : null}

    <section className="mt-5 grid gap-4 lg:grid-cols-[1fr_290px]">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-700"><span className="h-2 w-2 rounded-full bg-rose-600"/><span>Daily News Pulse · Live</span></div>
        <div className="grid gap-5 md:grid-cols-[1.15fr_.85fr]"><div><h1 className="text-3xl font-black tracking-tight text-slate-950">{greetingFor("Asia/Colombo")} ☀️</h1>{lead ? <><Link href={`/story/${lead.slug}`} className="mt-4 block"><h2 className="text-2xl font-black leading-tight tracking-tight text-slate-950 hover:underline">{lead.title}</h2></Link><p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">{lead.summary}</p><p className="mt-3 text-[10px] font-bold text-slate-400">{lead.source} · {lead.published}</p></> : null}</div><div className="max-h-[290px] overflow-y-auto rounded-lg bg-slate-50 px-3 py-1">{pulseStories.slice(1).map((story) => <PulseHeadline key={story.slug} story={story} region={selectedRegion}/>)}</div></div>
        <div className="mt-4 border-t border-slate-100 pt-3 text-[9px] font-semibold text-slate-400">Showing the latest live digest · {selectedStories.length} linked stories · {sourceCount} outlets · {regionLabel}</div>
        <div className="mt-4 border-t border-slate-200 pt-4"><div className="mb-2 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Trending Topics</p><Link href="/topics" className="text-[9px] font-bold text-slate-400">Click to explore →</Link></div><div className="flex flex-wrap gap-2">{topCategories.slice(0, 10).map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-700 hover:border-rose-300 hover:text-rose-700">#{category.name}</Link>)}</div></div>
      </div>

      <aside className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="What's On" href="/videos"/><div className="space-y-3"><Link href="/videos" className="block rounded-lg bg-slate-950 p-4 text-white"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Watch</p><p className="mt-1 text-lg font-black">Latest video channels</p><p className="mt-2 text-xs text-slate-300">Browse enabled Sri Lankan, Australian and international video publishers.</p></Link><div className="grid grid-cols-2 gap-2"><Link href="/official" className="rounded-lg border border-slate-200 p-3 text-xs font-black hover:bg-slate-50">Official updates →</Link><Link href="/map" className="rounded-lg border border-slate-200 p-3 text-xs font-black hover:bg-slate-50">News map →</Link><Link href="/top-stories" className="rounded-lg border border-slate-200 p-3 text-xs font-black hover:bg-slate-50">Top stories →</Link><Link href="/sources" className="rounded-lg border border-slate-200 p-3 text-xs font-black hover:bg-slate-50">Publishers →</Link></div></div></aside>
    </section>

    {sectionEnabled(control, "source_rail") ? <SourceRail sources={sources}/> : null}

    <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
      <div>
        {sectionEnabled(control, "fast_scan") ? <section><SectionHeader title="In the News"/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{inNews.map((story, index) => <InNewsCard key={story.slug} story={story} large={index === 0}/>)}</div></section> : null}
        <section className="mt-6"><SectionHeader title="Featured Stories" href="/top-stories"/><div className="grid gap-3 sm:grid-cols-2">{featuredTopics.map((topic) => <FeaturedCard key={topic.key} topic={topic}/>)}</div></section>
      </div>
      <aside className="space-y-4"><WeatherPanel weather={colombo}/><SunMoonPanel weather={colombo}/></aside>
    </section>

    <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-black tracking-tight text-slate-950">Latest News</h2><div className="flex gap-1.5 text-[10px] font-black"><span className="rounded-full bg-black px-3 py-1.5 text-white">All</span><span className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-400">Live</span><span className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-400">Non-AI</span></div></div>
        {sectionEnabled(control, "latest_news") ? <div className="grid gap-3 md:grid-cols-2">{feed.map((topic) => <LatestNewsCard key={topic.key} topic={topic}/>)}</div> : null}
        <div className="mt-5 text-center"><Link href="/latest" className="inline-flex rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-black text-slate-700 hover:border-slate-400">Browse all news →</Link></div>
      </div>
      <aside className="space-y-4"><HolidayCalendar/><RankList title="Trending" topics={latestTopics.slice(0, 5)} href="/popular"/><RankList title="Most Covered" topics={trendingTopics} href="/popular"/><section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Trending Keywords"/><div className="flex flex-wrap gap-x-2 gap-y-1">{topCategories.map((category, index) => <Link key={category.slug} href={`/categories/${category.slug}`} className={`${index < 3 ? "text-xl" : index < 7 ? "text-base" : "text-xs"} font-black leading-tight text-slate-700 hover:text-rose-700`}>{category.name.toLowerCase()}</Link>)}</div></section><TodayPulse stories={selectedStories.length} sourceCount={sourceCount} topicCount={latestTopics.length} multiSource={multiSourceTopics}/></aside>
    </section>

    <section className="mt-8 border-t border-slate-200 pt-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-950">Across Sri Lanka</h2><p className="mt-1 text-xs text-slate-500">Jump into location-based news searches</p></div><Link href="/map" className="text-xs font-black text-rose-700">View map →</Link></div><div className="flex flex-wrap gap-2">{SRI_LANKA_PLACES.map((place) => <Link key={place} href={`/search?q=${encodeURIComponent(place)}`} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-400">{place}</Link>)}</div></section>

    {sectionEnabled(control, "regional_sections") ? <section className="mt-7 grid gap-4 lg:grid-cols-3">{[{ tab: REGION_TABS[0], href: "/?region=sri-lanka", items: sriLanka }, { tab: REGION_TABS[1], href: "/?region=australia", items: australia }, { tab: REGION_TABS[2], href: "/?region=international", items: international }].map(({ tab, href, items }) => <div key={tab.key} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><h2 className="flex items-center gap-2 text-lg font-black"><RegionMark tab={tab}/>{tab.label}</h2><Link href={href} className="text-[10px] font-black text-rose-700">View →</Link></div><div className="mt-2 divide-y divide-slate-100">{(items as StoryWithImage[]).slice(0, 5).map((story) => <Link key={story.slug} href={`/story/${story.slug}`} className="block py-3"><p className="line-clamp-2 text-sm font-black leading-5 text-slate-900 hover:underline">{story.title}</p><p className="mt-1 text-[10px] font-semibold text-slate-400">{story.source} · {story.published}</p></Link>)}</div></div>)}</section> : null}

    <section className="mt-8 grid gap-4 border-t border-slate-200 pt-6 md:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Support BridgeNews</p><h2 className="mt-2 text-xl font-black">Independent, source-attributed discovery</h2><p className="mt-2 text-sm leading-6 text-slate-600">BridgeNews keeps real publisher attribution visible and AI processing disabled while the platform is being developed.</p><Link href="/sources" className="mt-4 inline-flex text-xs font-black text-rose-700">Browse all publishers →</Link></div><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Suggest a Feed</p><h2 className="mt-2 text-xl font-black">Missing a news publisher?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Send BridgeNews a publisher, RSS feed or video-channel suggestion for review.</p><Link href="/suggest-feed" className="mt-4 inline-flex rounded-lg bg-black px-4 py-2.5 text-xs font-black text-white hover:bg-slate-800">+ Suggest a feed</Link></div></section>
  </main>;
}
