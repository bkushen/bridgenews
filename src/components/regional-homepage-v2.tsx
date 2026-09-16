import Link from "next/link";
import { getStories } from "@/lib/data/stories";
import { getExchangeStrip, getHomepageWeather, formatCityTime, type WeatherCardData } from "@/lib/data/home-widgets";
import { getWhatsOnItems } from "@/lib/data/whats-on";
import { groupStoriesIntoTopics, rankTrendingTopics, type TopicGroup } from "@/lib/data/topic-groups";
import { LiveNewsTicker } from "@/components/live-news-ticker";
import { RegionPreference } from "@/components/region-preference";
import { RegionalPulseBoard } from "@/components/regional-pulse-board";
import { WhatsOnExplorer } from "@/components/whats-on-explorer";
import type { Story } from "@/lib/mock-data";

type RegionKey = "sri-lanka" | "australia" | "international";
type StoryWithImage = Story & { imageUrl?: string | null };
type RegionConfig = { key: RegionKey; label: string; flag: string; city: string; timeZone: string; places: string[] };

const REGIONS: Record<RegionKey, RegionConfig> = {
  "sri-lanka": { key: "sri-lanka", label: "Sri Lanka", flag: "🇱🇰", city: "Colombo", timeZone: "Asia/Colombo", places: ["Colombo", "Kandy", "Galle", "Jaffna", "Anuradhapura", "Negombo", "Kurunegala", "Trincomalee", "Batticaloa", "Ratnapura", "Badulla", "Matara"] },
  australia: { key: "australia", label: "Australia", flag: "🇦🇺", city: "Melbourne", timeZone: "Australia/Melbourne", places: ["Melbourne", "Sydney", "Brisbane", "Perth", "Adelaide", "Canberra", "Hobart", "Darwin", "Ballarat", "Geelong", "Gold Coast", "Newcastle"] },
  international: { key: "international", label: "International", flag: "🌍", city: "World", timeZone: "UTC", places: ["Asia", "Europe", "Americas", "Middle East", "Africa", "Pacific"] },
};

function SectionHeader({ title, href, label = "See all" }: { title: string; href?: string; label?: string }) {
  return <div className="mb-4 flex items-center justify-between gap-4">
    <h2 className="text-xl font-extrabold tracking-tight text-[#101828] sm:text-2xl">{title}</h2>
    {href ? <Link href={href} className="text-xs font-semibold text-[#3157d5] hover:underline">{label} →</Link> : null}
  </div>;
}

function greeting(timeZone: string) {
  const h = Number(new Intl.DateTimeFormat("en-AU", { timeZone, hour: "2-digit", hour12: false }).format(new Date()));
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}

function MainStory({ story }: { story: StoryWithImage }) {
  return <Link href={`/story/${story.slug}`} className="group block overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white">
    {story.imageUrl ? <div className="aspect-[16/9] overflow-hidden bg-[#f2f4f7]"><img src={story.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"/></div> : null}
    <div className="p-5 sm:p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3157d5]">{story.source} · {story.published}</p>
      <h1 className="mt-2 text-[28px] font-extrabold leading-[1.05] tracking-[-0.035em] text-[#101828] group-hover:text-[#3157d5] sm:text-[36px]">{story.title}</h1>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#667085]">{story.summary}</p>
    </div>
  </Link>;
}

function MiniStory({ story }: { story: StoryWithImage }) {
  return <Link href={`/story/${story.slug}`} className="group grid grid-cols-[92px_1fr] gap-3 rounded-xl p-2 transition hover:bg-[#f8fafc]">
    {story.imageUrl ? <div className="h-[76px] overflow-hidden rounded-lg bg-[#f2f4f7]"><img src={story.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/></div> : <div className="grid h-[76px] place-items-center rounded-lg bg-[#eef3ff] text-lg font-black text-[#3157d5]">BN</div>}
    <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#3157d5]">{story.source}</p><h3 className="mt-1 line-clamp-3 text-sm font-bold leading-[1.2] text-[#101828] group-hover:text-[#3157d5]">{story.title}</h3><p className="mt-1 text-[9px] text-[#98a2b3]">{story.published}</p></div>
  </Link>;
}

function NewsCard({ story }: { story: StoryWithImage }) {
  return <Link href={`/story/${story.slug}`} className="group block overflow-hidden rounded-2xl border border-[#e4e7ec] bg-white">
    {story.imageUrl ? <div className="aspect-[4/3] overflow-hidden bg-[#f2f4f7]"><img src={story.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"/></div> : null}
    <div className="p-4"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#3157d5]">{story.source}</p><h3 className="mt-1.5 line-clamp-3 text-[17px] font-extrabold leading-[1.12] text-[#101828] group-hover:text-[#3157d5]">{story.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#667085]">{story.summary}</p></div>
  </Link>;
}

function LatestRow({ topic }: { topic: TopicGroup }) {
  const story = topic.lead as StoryWithImage;
  return <article className="grid grid-cols-[108px_1fr] gap-4 border-b border-[#eaecf0] py-4 first:pt-0">
    {story.imageUrl ? <Link href={`/story/${story.slug}`} className="overflow-hidden rounded-xl"><img src={story.imageUrl} alt="" className="h-[84px] w-full object-cover transition duration-300 hover:scale-105"/></Link> : null}
    <div><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#3157d5]">{story.source} · {story.published}</p><Link href={`/story/${story.slug}`} className="mt-1 block line-clamp-2 text-base font-extrabold leading-[1.18] text-[#101828] hover:text-[#3157d5]">{story.title}</Link><p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-[#667085]">{story.summary}</p></div>
  </article>;
}

function WeatherCard({ weather, timeZone }: { weather: WeatherCardData; timeZone: string }) {
  return <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5">
    <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.1em] text-[#667085]">Weather</p><p className="mt-2 text-4xl font-extrabold tracking-tight text-[#101828]">{weather.temperature != null ? `${Math.round(weather.temperature)}°` : "—"}</p><p className="mt-1 text-xs text-[#667085]">{weather.condition} · {weather.city}</p></div><span className="text-4xl">{weather.emoji}</span></div>
    <p className="mt-4 border-t border-[#f0f2f5] pt-3 text-[10px] text-[#98a2b3]">{formatCityTime(timeZone)} local time</p>
  </section>;
}

function MostCovered({ topics }: { topics: TopicGroup[] }) {
  return <section className="rounded-2xl border border-[#e4e7ec] bg-white p-5"><SectionHeader title="Most Covered" href="/popular"/><div className="space-y-1">{topics.slice(0,6).map((topic,i)=><Link key={topic.key} href={`/story/${topic.lead.slug}`} className="grid grid-cols-[28px_1fr] gap-3 rounded-xl px-1 py-3 hover:bg-[#f8fafc]"><span className="text-lg font-extrabold text-[#cbd5e1]">{i+1}</span><div><p className="line-clamp-2 text-sm font-bold leading-5 text-[#101828]">{topic.lead.title}</p><p className="mt-1 text-[9px] text-[#98a2b3]">{topic.sourceCount} source{topic.sourceCount===1?"":"s"}</p></div></Link>)}</div></section>;
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
  const lead = stories[0] as StoryWithImage | undefined;
  const sideStories = stories.slice(1,5) as StoryWithImage[];
  const cards = stories.slice(5,11) as StoryWithImage[];
  const publishers = Array.from(new Set(stories.map((s) => s.source))).slice(0,16);
  const tickerItems = trending.slice(0,8).map((t)=>({ key:t.key, title:t.lead.title, href:`/story/${t.lead.slug}` }));
  const pulseTopics = topics.slice(0,9).map((topic)=>({ key:topic.key,title:topic.lead.title,slug:topic.lead.slug,summary:topic.lead.summary,source:topic.lead.source,sourceCount:topic.sourceCount,category:topic.category }));
  const localDate = new Intl.DateTimeFormat("en-AU", { timeZone: config.timeZone, weekday:"short", day:"2-digit", month:"short" }).format(new Date());

  return <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-4 sm:px-6"><RegionPreference region={region}/>
    <section className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[#e4e7ec] bg-white px-4 py-3 text-[10px] font-semibold text-[#667085]">
      <span className="font-bold text-[#101828]">{config.flag} {config.label}</span><span>·</span><span>{localDate}</span><span>·</span><span>{formatCityTime(config.timeZone)}</span><span>·</span><span>{localWeather.emoji} {localWeather.temperature != null ? `${Math.round(localWeather.temperature)}°` : "—"} {config.city}</span><span className="ml-auto hidden lg:inline">AUD/LKR {rates.audToLkr?.toFixed(2) ?? "—"} · USD/LKR {rates.usdToLkr?.toFixed(2) ?? "—"}</span>
    </section>

    <div className="mt-3"><LiveNewsTicker items={tickerItems}/></div>

    {lead ? <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_360px]">
      <MainStory story={lead}/>
      <aside className="rounded-2xl border border-[#e4e7ec] bg-white p-3 sm:p-4"><div className="mb-2 flex items-center justify-between"><h2 className="text-base font-extrabold text-[#101828]">Latest in {config.label}</h2><Link href="/latest" className="text-[10px] font-semibold text-[#3157d5]">View all</Link></div>{sideStories.map((story)=><MiniStory key={story.slug} story={story}/>)}</aside>
    </section> : null}

    <section className="mt-8"><SectionHeader title="Top Stories" href="/top-stories"/><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map((story)=><NewsCard key={story.slug} story={story}/>)}</div></section>

    <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"><RegionalPulseBoard regionLabel={config.label} flag={config.flag} greeting={`${greeting(config.timeZone)} ${config.key === "international" ? "🌍" : "☀️"}`} topics={pulseTopics} storyCount={stories.length} sourceCount={sourceCount} fallbackChips={config.places}/><div id="whats-on"><WhatsOnExplorer items={whatsOn} regionLabel={config.label} timeZone={config.timeZone} compact/></div></section>

    <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-[#e4e7ec] bg-white p-5"><SectionHeader title={`Latest ${config.label}`} href="/latest"/><div>{topics.slice(0,14).map((topic)=><LatestRow key={topic.key} topic={topic}/>)}</div></div>
      <aside className="space-y-5"><MostCovered topics={trending}/><WeatherCard weather={localWeather} timeZone={config.timeZone}/><section className="rounded-2xl border border-[#e4e7ec] bg-white p-5"><SectionHeader title="Publishers" href="/sources"/><div className="flex flex-wrap gap-2">{publishers.map((p)=><Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="rounded-full border border-[#e4e7ec] bg-[#f8fafc] px-3 py-1.5 text-[10px] font-semibold text-[#475467] hover:border-[#3157d5] hover:text-[#3157d5]">{p}</Link>)}</div></section></aside>
    </section>

    <section className="mt-8"><SectionHeader title={`Across ${config.label}`} href="/map" label="View map"/><div className="flex flex-wrap gap-2">{config.places.map((p)=><Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="rounded-full border border-[#e4e7ec] bg-white px-4 py-2 text-xs font-semibold text-[#344054] hover:border-[#3157d5] hover:bg-[#eef3ff] hover:text-[#3157d5]">{p}</Link>)}</div></section>

    <section className="mt-8 grid gap-4 md:grid-cols-3"><Link href="/topics" className="rounded-2xl border border-[#e4e7ec] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3157d5]">Topics</p><h3 className="mt-2 text-lg font-extrabold text-[#101828]">Follow what matters</h3><p className="mt-2 text-xs leading-5 text-[#667085]">Browse grouped regional coverage by subject.</p></Link><Link href="/videos" className="rounded-2xl border border-[#e4e7ec] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3157d5]">Video</p><h3 className="mt-2 text-lg font-extrabold text-[#101828]">Watch publisher channels</h3><p className="mt-2 text-xs leading-5 text-[#667085]">See regional video feeds in one place.</p></Link><Link href="/suggest-feed" className="rounded-2xl border border-[#e4e7ec] bg-white p-5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3157d5]">Suggest</p><h3 className="mt-2 text-lg font-extrabold text-[#101828]">Missing a publisher?</h3><p className="mt-2 text-xs leading-5 text-[#667085]">Suggest a source or channel for review.</p></Link></section>
  </main>;
}
