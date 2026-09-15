import Link from "next/link";
import { getStories } from "@/lib/data/stories";
import { getCategories } from "@/lib/data/categories";
import { getPublicSources } from "@/lib/data/sources";
import { getExchangeStrip, getHomepageWeather, formatCityTime } from "@/lib/data/home-widgets";
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

function RegionMark({ tab, compact = false }: { tab: RegionTab; compact?: boolean }) {
  if (tab.flagUrl) return <img src={tab.flagUrl} alt={`${tab.label} flag`} className={`${compact ? "h-3.5 w-5" : "h-4 w-6"} rounded-[2px] border border-black/10 object-cover`} />;
  return <span className={compact ? "text-sm" : "text-base"} aria-hidden="true">{tab.symbol}</span>;
}

function SectionHeader({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">{title}</h2>{href ? <Link href={href} className="text-xs font-bold text-slate-500 hover:text-black">{linkLabel} →</Link> : null}</div>;
}

function PulseHeadline({ story, region }: { story: StoryWithImage; region: RegionFilter }) {
  const symbol = region === "sri-lanka" ? "🇱🇰" : region === "australia" ? "🇦🇺" : region === "international" ? "🌍" : "●";
  return <Link href={`/story/${story.slug}`} className="group flex items-start gap-2 py-1.5 text-sm font-bold leading-5 text-slate-800 hover:text-black"><span className="mt-0.5 shrink-0 text-xs">{symbol}</span><span className="line-clamp-1 group-hover:underline">{story.title}</span></Link>;
}

function InNewsItem({ story }: { story: StoryWithImage }) {
  return <Link href={`/story/${story.slug}`} className="group block min-w-[250px] max-w-[320px] shrink-0 border-r border-slate-200 px-4 first:pl-0 last:border-0"><p className="text-[10px] font-bold text-slate-400">{story.source} · {story.published}</p><p className="mt-1 line-clamp-3 text-sm font-black leading-5 text-slate-900 group-hover:underline">{story.title}</p></Link>;
}

function LatestStoryCard({ topic }: { topic: TopicGroup }) {
  const lead = topic.lead as StoryWithImage;
  return <article className="border-b border-slate-200 py-5 first:pt-0 last:border-0"><div className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)]"><Link href={`/story/${lead.slug}`} className="overflow-hidden rounded-lg bg-slate-100">{lead.imageUrl ? <img src={lead.imageUrl} alt="" className="h-40 w-full object-cover sm:h-full" /> : <div className="grid h-40 place-items-center bg-slate-100 text-xs font-black uppercase tracking-[0.16em] text-slate-400">BridgeNews</div>}</Link><div><div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500"><span className="font-black text-slate-800">{lead.source}</span><span>•</span><span>{lead.published}</span>{topic.sourceCount > 1 ? <><span>•</span><span className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-600">{topic.sourceCount} sources</span></> : null}</div><Link href={`/story/${lead.slug}`}><h3 className="mt-2 text-xl font-black leading-tight tracking-tight text-slate-950 hover:underline">{lead.title}</h3></Link><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{lead.summary}</p><div className="mt-3 flex flex-wrap gap-1.5">{topic.stories.slice(0, 4).map((story) => <span key={story.slug} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">{story.source}</span>)}</div><Link href={`/story/${lead.slug}`} className="mt-3 inline-flex text-xs font-black text-slate-900 hover:underline">Read more →</Link></div></div></article>;
}

function WeatherCard({ item }: { item: { city: string; emoji: string; temperature: number | null; high: number | null; low: number | null } }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Weather</p><p className="mt-1 font-black text-slate-950">{item.city}</p></div><span className="text-2xl">{item.emoji}</span></div><div className="mt-3 flex items-end justify-between"><p className="text-3xl font-black tracking-tight">{item.temperature != null ? `${Math.round(item.temperature)}°` : "—"}</p><p className="pb-1 text-[11px] font-semibold text-slate-500">H {item.high != null ? Math.round(item.high) : "—"}° · L {item.low != null ? Math.round(item.low) : "—"}°</p></div><p className="mt-2 text-[10px] text-slate-400">{item.city === "Colombo" ? formatCityTime("Asia/Colombo") : formatCityTime("Australia/Melbourne")}</p></div>;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const params = await searchParams;
  const control = await getSiteControl();
  const configuredDefault = String(control.settings.default_region ?? "sri-lanka") as RegionFilter;
  const defaultRegion: RegionFilter = REGION_TABS.some((tab) => tab.key === configuredDefault) ? configuredDefault : "sri-lanka";
  const requested = params.region as RegionFilter | undefined;
  const selectedRegion: RegionFilter = REGION_TABS.some((tab) => tab.key === requested) ? (requested as RegionFilter) : defaultRegion;

  const [allLatest, sriLanka, australia, international, categories, weather, rates, sources] = await Promise.all([
    getStories({ limit: 100 }),
    getStories({ region: "sri-lanka", limit: 100 }),
    getStories({ region: "australia", limit: 100 }),
    getStories({ region: "international", limit: 100 }),
    getCategories(),
    getHomepageWeather(),
    getExchangeStrip(),
    getPublicSources(40),
  ]);

  const selectedStories = selectedRegion === "sri-lanka" ? sriLanka : selectedRegion === "australia" ? australia : selectedRegion === "international" ? international : allLatest;
  const selectedTab = REGION_TABS.find((tab) => tab.key === selectedRegion) || REGION_TABS[0];
  const regionLabel = selectedTab.label;
  const latestTopics = groupStoriesIntoTopics(selectedStories, 50);
  const trendingTopics = rankTrendingTopics(latestTopics).slice(0, 10);
  const topCategories = categories.slice(0, 12);
  const pulseStories = selectedStories.slice(0, 10) as StoryWithImage[];
  const inNews = selectedStories.slice(4, 10) as StoryWithImage[];
  const feed = latestTopics.slice(0, 16);
  const colombo = weather[0];
  const melbourne = weather[1];
  const lead = pulseStories[0];
  const tickerItems = trendingTopics.slice(0, 8).map((topic) => ({ key: topic.key, title: topic.lead.title, href: `/story/${topic.lead.slug}` }));

  return <main className="mx-auto max-w-[1180px] px-3 pb-10 pt-3 sm:px-5 md:pt-4">
    {control.settings.markets_enabled !== false ? <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600"><span className="font-black text-slate-950">Markets</span><span>AUD/LKR <b>{rates.audToLkr?.toFixed(2) ?? "—"}</b></span><span>USD/LKR <b>{rates.usdToLkr?.toFixed(2) ?? "—"}</b></span><span>AUD/USD <b>{rates.audToUsd?.toFixed(4) ?? "—"}</b></span><span className="ml-auto hidden text-slate-400 sm:inline">Daily rates</span></div> : null}

    {control.settings.ticker_enabled !== false ? <LiveNewsTicker items={tickerItems} /> : null}

    {sectionEnabled(control, "region_switcher") ? <nav aria-label="Choose news region" className="mt-3 flex gap-2 overflow-x-auto border-b border-slate-200 pb-3">{REGION_TABS.map((tab) => { const active = selectedRegion === tab.key; return <Link key={tab.key} href={tab.key === defaultRegion ? "/" : `/?region=${tab.key}`} className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-black transition ${active ? "bg-black text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`} aria-current={active ? "page" : undefined}><RegionMark tab={tab} compact/><span>{tab.label}</span></Link>; })}</nav> : null}

    <section className="mt-5 border-b border-slate-200 pb-5">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500"><span className="h-2 w-2 rounded-full bg-rose-600"/><span>Daily News Pulse · Live</span></div>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}</h1>
          {lead ? <><Link href={`/story/${lead.slug}`} className="mt-5 block"><h2 className="max-w-3xl text-2xl font-black leading-tight tracking-tight text-slate-950 hover:underline sm:text-3xl">{lead.title}</h2></Link><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{lead.summary}</p><p className="mt-3 text-xs font-bold text-slate-400">{lead.source} · {lead.published}</p></> : null}
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">{pulseStories.slice(1).map((story) => <PulseHeadline key={story.slug} story={story} region={selectedRegion}/>)}</div>
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-400">Live coverage from BridgeNews publishers · {selectedStories.length} recent stories loaded for {regionLabel}</p>
    </section>

    {sectionEnabled(control, "trending_categories") ? <section className="border-b border-slate-200 py-5"><div className="mb-3 flex items-end justify-between"><div><h2 className="text-base font-black text-slate-950">Trending Topics</h2><p className="mt-0.5 text-xs text-slate-400">Explore what is moving now</p></div><Link href="/topics" className="text-xs font-bold text-slate-500 hover:text-black">Topics →</Link></div><div className="flex flex-wrap gap-2">{topCategories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-slate-400">#{category.name} <span className="ml-1 text-slate-400">{category.articleCount}</span></Link>)}</div></section> : null}

    {sectionEnabled(control, "source_rail") ? <SourceRail sources={sources}/> : null}

    {sectionEnabled(control, "fast_scan") ? <section className="border-b border-slate-200 py-5"><SectionHeader title="In the News" href="/latest"/><div className="flex overflow-x-auto pb-2">{inNews.map((story) => <InNewsItem key={story.slug} story={story}/>)}</div></section> : null}

    <section className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1fr)_310px]">
      <div>
        {sectionEnabled(control, "latest_news") ? <><SectionHeader title="Latest News" href="/latest"/><div>{feed.map((topic) => <LatestStoryCard key={topic.key} topic={topic}/>)}</div></> : null}
      </div>

      <aside className="space-y-5">
        {sectionEnabled(control, "weather") ? <section><SectionHeader title="Weather"/><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><WeatherCard item={colombo}/><WeatherCard item={melbourne}/></div></section> : null}

        {sectionEnabled(control, "most_covered") ? <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Most Covered" href="/popular"/><div className="divide-y divide-slate-100">{trendingTopics.slice(0, 7).map((topic, index) => <Link key={topic.key} href={`/story/${topic.lead.slug}`} className="flex gap-3 py-3 first:pt-0"><span className="w-6 shrink-0 text-lg font-black text-slate-300">{String(index + 1).padStart(2, "0")}</span><div><p className="line-clamp-3 text-sm font-black leading-5 text-slate-900 hover:underline">{topic.lead.title}</p><p className="mt-1 text-[11px] font-semibold text-slate-400">{topic.sourceCount} sources · {topic.stories.length} reports</p></div></Link>)}</div></section> : null}

        <section className="rounded-xl border border-slate-200 bg-white p-4"><SectionHeader title="Quick Links"/><div className="grid grid-cols-2 gap-2 text-xs font-black"><Link href="/region/sri-lanka" className="rounded-lg bg-slate-100 px-3 py-3 hover:bg-slate-200">Sri Lanka</Link><Link href="/region/australia" className="rounded-lg bg-slate-100 px-3 py-3 hover:bg-slate-200">Australia</Link><Link href="/region/international" className="rounded-lg bg-slate-100 px-3 py-3 hover:bg-slate-200">World</Link><Link href="/sources" className="rounded-lg bg-slate-100 px-3 py-3 hover:bg-slate-200">Sources</Link><Link href="/official" className="rounded-lg bg-slate-100 px-3 py-3 hover:bg-slate-200">Official</Link><Link href="/map" className="rounded-lg bg-slate-100 px-3 py-3 hover:bg-slate-200">Map</Link></div></section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-black text-slate-900">BridgeNews live utilities</p><p className="mt-2 text-[11px] leading-5 text-slate-500">Weather: Open-Meteo · Exchange rates: ExchangeRate-API · News from verified publisher feeds.</p></section>
      </aside>
    </section>

    {sectionEnabled(control, "regional_sections") ? <section className="mt-8 border-t border-slate-200 pt-6"><SectionHeader title="More from each region"/><div className="grid gap-5 lg:grid-cols-3">{[{tab: REGION_TABS[0], href: "/?region=sri-lanka", items: sriLanka},{tab: REGION_TABS[1], href: "/?region=australia", items: australia},{tab: REGION_TABS[2], href: "/?region=international", items: international}].map(({ tab, href, items }) => <div key={tab.key} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between border-b border-slate-100 pb-3"><h3 className="flex items-center gap-2 font-black"><RegionMark tab={tab}/>{tab.label}</h3><Link href={href} className="text-[11px] font-bold text-slate-400 hover:text-black">View →</Link></div><div className="divide-y divide-slate-100">{(items as StoryWithImage[]).slice(0, 5).map((story) => <Link key={story.slug} href={`/story/${story.slug}`} className="block py-3"><p className="line-clamp-2 text-sm font-black leading-5 text-slate-900 hover:underline">{story.title}</p><p className="mt-1 text-[11px] text-slate-400">{story.source} · {story.published}</p></Link>)}</div></div>)}</div></section> : null}
  </main>;
}
