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

function SectionHeader({ eyebrow, title, href, label = "See all" }: { eyebrow?: string; title: string; href?: string; label?: string }) {
  return <div className="mb-5 flex items-end justify-between gap-4 border-b-2 border-[#171717] pb-2">
    <div>{eyebrow ? <p className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-[var(--news-accent)]">{eyebrow}</p> : null}<h2 className="text-[22px] font-black tracking-[-0.03em] text-[#111] sm:text-[28px]">{title}</h2></div>
    {href ? <Link href={href} className="mb-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#555] hover:text-[var(--news-accent)]">{label} →</Link> : null}
  </div>;
}

function greeting(timeZone: string) {
  const h = Number(new Intl.DateTimeFormat("en-AU", { timeZone, hour: "2-digit", hour12: false }).format(new Date()));
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}

function HeroStory({ story }: { story: StoryWithImage }) {
  return <Link href={`/story/${story.slug}`} className="group block">
    {story.imageUrl ? <div className="aspect-[16/9] overflow-hidden bg-[#e9e9e7]"><img src={story.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"/></div> : null}
    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--news-accent)]">{story.source} · {story.published}</p>
    <h1 className="mt-2 text-[30px] font-black leading-[1.02] tracking-[-0.045em] text-[#111] group-hover:text-[var(--news-accent)] sm:text-[42px] lg:text-[50px]">{story.title}</h1>
    <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-6 text-[#666]">{story.summary}</p>
  </Link>;
}

function SideStory({ story, index }: { story: StoryWithImage; index: number }) {
  return <Link href={`/story/${story.slug}`} className="group grid grid-cols-[92px_1fr] gap-3 border-b border-[#dedede] py-3 first:pt-0 last:border-0">
    {story.imageUrl ? <div className="h-[76px] overflow-hidden bg-[#ececea]"><img src={story.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/></div> : <div className="grid h-[76px] place-items-center bg-[#111] text-xl font-black text-white">{index + 1}</div>}
    <div><p className="text-[8px] font-black uppercase tracking-[0.12em] text-[var(--news-accent)]">{story.source}</p><h3 className="mt-1 line-clamp-3 text-[15px] font-black leading-[1.12] text-[#161616] group-hover:text-[var(--news-accent)]">{story.title}</h3><p className="mt-1 text-[9px] font-bold text-[#999]">{story.published}</p></div>
  </Link>;
}

function StoryCard({ story }: { story: StoryWithImage }) {
  return <Link href={`/story/${story.slug}`} className="group block">
    {story.imageUrl ? <div className="aspect-[4/3] overflow-hidden bg-[#ededeb]"><img src={story.imageUrl} alt="" className="h-full w-full object-cover transition duration-400 group-hover:scale-[1.04]"/></div> : null}
    <p className="mt-3 text-[9px] font-black uppercase tracking-[0.12em] text-[var(--news-accent)]">{story.source}</p>
    <h3 className="mt-1 line-clamp-3 text-[18px] font-black leading-[1.08] tracking-[-0.02em] text-[#151515] group-hover:text-[var(--news-accent)]">{story.title}</h3>
    <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#707070]">{story.summary}</p>
  </Link>;
}

function LatestRow({ topic }: { topic: TopicGroup }) {
  const story = topic.lead as StoryWithImage;
  return <article className="grid grid-cols-[110px_1fr] gap-4 border-b border-[#e2e2e2] py-4 first:pt-0">
    {story.imageUrl ? <Link href={`/story/${story.slug}`} className="overflow-hidden"><img src={story.imageUrl} alt="" className="h-[86px] w-full object-cover transition duration-300 hover:scale-105"/></Link> : null}
    <div><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--news-accent)]">{story.source} · {story.published}</p><Link href={`/story/${story.slug}`} className="mt-1 block line-clamp-2 text-[18px] font-black leading-[1.08] text-[#151515] hover:text-[var(--news-accent)]">{story.title}</Link><p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#777]">{story.summary}</p></div>
  </article>;
}

function WeatherPanel({ weather, timeZone }: { weather: WeatherCardData; timeZone: string }) {
  return <section className="border-t-4 border-[#111] bg-[#f4f4f2] p-4"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--news-accent)]">Weather</p><div className="mt-3 flex items-center justify-between"><div><p className="text-[34px] font-black tracking-[-0.05em]">{weather.temperature != null ? `${Math.round(weather.temperature)}°` : "—"}</p><p className="text-xs font-bold text-[#555]">{weather.condition} · {weather.city}</p></div><span className="text-4xl">{weather.emoji}</span></div><p className="mt-3 text-[9px] text-[#8a8a8a]">{formatCityTime(timeZone)} local time</p></section>;
}

function Ranking({ topics }: { topics: TopicGroup[] }) {
  return <section><SectionHeader eyebrow="Live" title="Most Covered" href="/popular"/><div>{topics.slice(0,6).map((topic,i)=><Link key={topic.key} href={`/story/${topic.lead.slug}`} className="grid grid-cols-[34px_1fr] gap-3 border-b border-[#ddd] py-3 first:pt-0"><span className="text-2xl font-black text-[#c9c9c9]">{String(i+1).padStart(2,"0")}</span><div><h3 className="line-clamp-2 text-[14px] font-black leading-[1.15] text-[#171717] hover:text-[var(--news-accent)]">{topic.lead.title}</h3><p className="mt-1 text-[9px] font-bold text-[#999]">{topic.sourceCount} source{topic.sourceCount===1?"":"s"}</p></div></Link>)}</div></section>;
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
  const side = stories.slice(1,5) as StoryWithImage[];
  const gridStories = stories.slice(5,13) as StoryWithImage[];
  const publishers = Array.from(new Set(stories.map((s) => s.source))).slice(0,18);
  const tickerItems = trending.slice(0,8).map((t)=>({ key:t.key, title:t.lead.title, href:`/story/${t.lead.slug}` }));
  const pulseTopics = topics.slice(0,9).map((topic)=>({ key:topic.key,title:topic.lead.title,slug:topic.lead.slug,summary:topic.lead.summary,source:topic.lead.source,sourceCount:topic.sourceCount,category:topic.category }));
  const localDate = new Intl.DateTimeFormat("en-AU", { timeZone: config.timeZone, weekday:"long", day:"numeric", month:"long" }).format(new Date());

  return <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-5 sm:px-6"><RegionPreference region={region}/>
    <section className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-[#dedede] py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#777]"><span className="text-[#111]">{config.flag} {config.label}</span><span>{localDate}</span><span>{formatCityTime(config.timeZone)}</span><span>{localWeather.emoji} {localWeather.temperature != null ? `${Math.round(localWeather.temperature)}°` : "—"} {config.city}</span><span className="ml-auto hidden lg:inline">AUD/LKR {rates.audToLkr?.toFixed(2) ?? "—"} · USD/LKR {rates.usdToLkr?.toFixed(2) ?? "—"}</span></section>

    <LiveNewsTicker items={tickerItems}/>

    {lead ? <section className="mt-7 grid gap-7 border-b border-[#d8d8d8] pb-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(270px,.75fr)]">
      <HeroStory story={lead}/>
      <aside className="border-t-4 border-[#111] pt-3 lg:border-t-0 lg:border-l lg:border-[#ddd] lg:pl-6"><p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--news-accent)]">Latest in {config.label}</p>{side.map((story,i)=><SideStory key={story.slug} story={story} index={i}/>)}</aside>
    </section> : null}

    <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <SectionHeader eyebrow={`${config.label} edition`} title="Top Stories" href="/top-stories"/>
        <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 xl:grid-cols-4">{gridStories.map((story)=><StoryCard key={story.slug} story={story}/>)}</div>
      </div>
      <aside><Ranking topics={trending}/></aside>
    </section>

    <section className="mt-10 border-y border-[#ddd] py-8"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_370px]"><RegionalPulseBoard regionLabel={config.label} flag={config.flag} greeting={`${greeting(config.timeZone)} ${config.key === "international" ? "🌍" : "☀️"}`} topics={pulseTopics} storyCount={stories.length} sourceCount={sourceCount} fallbackChips={config.places}/><div id="whats-on"><WhatsOnExplorer items={whatsOn} regionLabel={config.label} timeZone={config.timeZone} compact/></div></div></section>

    <section className="mt-10 grid gap-9 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div><SectionHeader eyebrow="Fresh coverage" title={`Latest ${config.label}`} href="/latest"/><div>{topics.slice(0,14).map((topic)=><LatestRow key={topic.key} topic={topic}/>)}</div></div>
      <aside className="space-y-8"><WeatherPanel weather={localWeather} timeZone={config.timeZone}/><section><SectionHeader eyebrow="Sources" title="Publishers"/><div className="flex flex-wrap gap-2">{publishers.map((p)=><Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="border border-[#d5d5d5] bg-white px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.05em] text-[#555] hover:border-[#111] hover:text-[#111]">{p}</Link>)}</div></section></aside>
    </section>

    <section className="mt-10"><SectionHeader eyebrow="Explore" title={`Across ${config.label}`} href="/map" label="View map"/><div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{config.places.map((p)=><Link key={p} href={`/search?q=${encodeURIComponent(p)}`} className="group border-t-2 border-[#111] bg-[#f4f4f2] p-4"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[var(--news-accent)]">Local desk</p><h3 className="mt-1 text-xl font-black text-[#151515] group-hover:text-[var(--news-accent)]">{p}</h3><p className="mt-4 text-[10px] font-bold uppercase tracking-[0.06em] text-[#888]">Browse coverage →</p></Link>)}</div></section>

    <section className="mt-10 grid gap-4 md:grid-cols-3"><Link href="/topics" className="border border-[#d9d9d9] bg-white p-6"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--news-accent)]">Topics</p><h3 className="mt-2 text-2xl font-black tracking-[-0.03em]">Follow what matters</h3><p className="mt-3 text-xs leading-5 text-[#777]">Explore grouped coverage across people, policy, sport, economy and more.</p></Link><Link href="/videos" className="border border-[#d9d9d9] bg-white p-6"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--news-accent)]">Video</p><h3 className="mt-2 text-2xl font-black tracking-[-0.03em]">Watch publisher channels</h3><p className="mt-3 text-xs leading-5 text-[#777]">Browse enabled video feeds in the selected edition.</p></Link><Link href="/suggest-feed" className="border border-[#d9d9d9] bg-white p-6"><p className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--news-accent)]">Contribute</p><h3 className="mt-2 text-2xl font-black tracking-[-0.03em]">Suggest a publisher</h3><p className="mt-3 text-xs leading-5 text-[#777]">Suggest an RSS feed, publisher, event source or video channel.</p></Link></section>
  </main>;
}
