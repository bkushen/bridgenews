import Link from "next/link";
import { getStories } from "@/lib/data/stories";
import { getCategories } from "@/lib/data/categories";
import { getPublicSources } from "@/lib/data/sources";
import { getExchangeStrip, getHomepageWeather, formatCityTime } from "@/lib/data/home-widgets";
import { groupStoriesIntoTopics, rankTrendingTopics, type TopicGroup } from "@/lib/data/topic-groups";
import { LiveNewsTicker } from "@/components/live-news-ticker";
import { SourceRail } from "@/components/source-rail";
import type { Story } from "@/lib/mock-data";

type StoryWithImage = Story & { imageUrl?: string | null };
type RegionFilter = "sri-lanka" | "australia" | "international" | "all";

const REGION_TABS: Array<{ key: RegionFilter; label: string; flag: string }> = [
  { key: "sri-lanka", label: "Sri Lanka", flag: "🇱🇰" },
  { key: "australia", label: "Australia", flag: "🇦🇺" },
  { key: "international", label: "International", flag: "🌍" },
  { key: "all", label: "All", flag: "🌐" },
];

function SectionTitle({ eyebrow, title, href }: { eyebrow: string; title: string; href?: string }) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-gray-200 pb-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">{title}</h2>
      </div>
      {href ? <Link href={href} className="text-xs font-black text-gray-500 hover:text-black">View all →</Link> : null}
    </div>
  );
}

function MiniHeadline({ story }: { story: StoryWithImage }) {
  return (
    <Link href={`/story/${story.slug}`} className="group flex gap-3 border-b border-gray-100 py-3 last:border-0">
      {story.imageUrl ? <img src={story.imageUrl} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" /> : <div className="h-16 w-20 shrink-0 rounded-lg bg-gray-100" />}
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-extrabold leading-5 text-gray-950 group-hover:underline">{story.title}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-2 text-[11px] font-semibold text-gray-500"><span>{story.source}</span><span>•</span><span>{story.published}</span></div>
      </div>
    </Link>
  );
}

function CompactTopStory({ story, rank }: { story: StoryWithImage; rank: number }) {
  return (
    <Link href={`/story/${story.slug}`} className="group flex gap-4 border-b border-gray-100 py-4 last:border-0">
      <span className="w-7 shrink-0 pt-0.5 text-lg font-black text-gray-300">{String(rank).padStart(2, "0")}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-[0.13em] text-red-600">{story.source} · {story.published}</p>
        <h2 className="mt-1 line-clamp-2 text-lg font-black leading-snug tracking-tight text-gray-950 group-hover:underline">{story.title}</h2>
        <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-gray-500">{story.summary}</p>
      </div>
      {story.imageUrl ? <img src={story.imageUrl} alt="" className="hidden h-20 w-28 shrink-0 rounded-lg object-cover sm:block" /> : null}
    </Link>
  );
}

function TopicFeedRow({ topic }: { topic: TopicGroup }) {
  const lead = topic.lead as StoryWithImage;
  return (
    <article className="border-b border-gray-200 py-5 last:border-0">
      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
        <Link href={`/story/${lead.slug}`} className="overflow-hidden rounded-lg bg-gray-100">
          {lead.imageUrl ? <img src={lead.imageUrl} alt="" className="h-28 w-full object-cover sm:h-full" /> : <div className="h-28 bg-gray-100 sm:h-full" />}
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-gray-500">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{topic.category}</span>
            <span>{topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</span><span>•</span><span>{topic.stories.length} report{topic.stories.length === 1 ? "" : "s"}</span>
          </div>
          <Link href={`/story/${lead.slug}`}><h3 className="mt-2 text-lg font-black leading-snug tracking-tight hover:underline">{lead.title}</h3></Link>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{lead.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">{topic.stories.slice(0, 4).map((story) => <span key={story.slug} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600">{story.source}</span>)}</div>
        </div>
      </div>
    </article>
  );
}

function StatWidget({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return <div className="rounded-xl border border-gray-200 bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-gray-950">{value}</p><p className="mt-1 text-xs font-semibold text-gray-500">{sub}</p></div>;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ region?: string }> }) {
  const params = await searchParams;
  const requested = params.region as RegionFilter | undefined;
  const selectedRegion: RegionFilter = REGION_TABS.some((tab) => tab.key === requested) ? (requested as RegionFilter) : "sri-lanka";

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
  const regionLabel = REGION_TABS.find((tab) => tab.key === selectedRegion)?.label || "Sri Lanka";
  const regionFlag = REGION_TABS.find((tab) => tab.key === selectedRegion)?.flag || "🇱🇰";
  const latestTopics = groupStoriesIntoTopics(selectedStories, 50);
  const trendingTopics = rankTrendingTopics(latestTopics).slice(0, 10);
  const topCategories = categories.slice(0, 12);
  const topStories = selectedStories.slice(0, 6) as StoryWithImage[];
  const inNews = selectedStories.slice(0, 7) as StoryWithImage[];
  const feed = latestTopics.slice(0, 14);
  const sourceCount = new Set(selectedStories.map((story) => story.source)).size;
  const multiSourceTopics = latestTopics.filter((topic) => topic.sourceCount > 1).length;
  const colombo = weather[0];
  const melbourne = weather[1];
  const tickerItems = trendingTopics.slice(0, 8).map((topic) => ({ key: topic.key, title: topic.lead.title, href: `/story/${topic.lead.slug}` }));

  return (
    <main className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 md:py-6">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-gray-950 text-white">
        <div className="flex flex-wrap items-center divide-x divide-white/10">
          <div className="bg-red-600 px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em]">Markets & live</div>
          <div className="px-4 py-3 text-xs font-bold">AUD/LKR <span className="ml-1 text-emerald-400">{rates.audToLkr?.toFixed(2) ?? "—"}</span></div>
          <div className="px-4 py-3 text-xs font-bold">USD/LKR <span className="ml-1 text-emerald-400">{rates.usdToLkr?.toFixed(2) ?? "—"}</span></div>
          <div className="px-4 py-3 text-xs font-bold">AUD/USD <span className="ml-1 text-emerald-400">{rates.audToUsd?.toFixed(4) ?? "—"}</span></div>
          <div className="ml-auto hidden px-4 py-3 text-[10px] font-semibold text-gray-400 lg:block">Rates updated daily</div>
        </div>
      </section>

      <LiveNewsTicker items={tickerItems} />

      <nav aria-label="Choose news region" className="mt-3 flex gap-2 overflow-x-auto rounded-xl border border-gray-200 bg-white p-2">
        {REGION_TABS.map((tab) => {
          const active = selectedRegion === tab.key;
          return (
            <Link key={tab.key} href={tab.key === "sri-lanka" ? "/" : `/?region=${tab.key}`} className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-black transition ${active ? "bg-gray-950 text-white" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`} aria-current={active ? "page" : undefined}>
              <span className="mr-2 text-base" aria-hidden="true">{tab.flag}</span>{tab.label}
            </Link>
          );
        })}
      </nav>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_330px]">
        <div className="rounded-xl border border-gray-200 bg-white px-4 sm:px-5">
          <div className="border-b border-gray-200 py-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">{regionFlag} {regionLabel}</p><div className="mt-1 flex items-center justify-between gap-3"><h1 className="text-2xl font-black tracking-tight">Top Stories</h1><Link href="/top-stories" className="text-xs font-black text-gray-500 hover:text-black">View all →</Link></div></div>
          <div>{topStories.slice(0, 5).map((story, index) => <CompactTopStory key={story.slug} story={story} rank={index + 1} />)}</div>
        </div>
        <aside className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[colombo, melbourne].map((item) => <div key={item.city} className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Weather</p><h3 className="mt-1 font-black">{item.city}</h3></div><span className="text-2xl">{item.emoji}</span></div><p className="mt-3 text-3xl font-black">{item.temperature != null ? `${Math.round(item.temperature)}°` : "—"}</p><p className="mt-1 text-[11px] font-semibold text-gray-500">H {item.high != null ? Math.round(item.high) : "—"}° · L {item.low != null ? Math.round(item.low) : "—"}°</p><p className="mt-2 text-[10px] text-gray-400">{item.city === "Colombo" ? formatCityTime("Asia/Colombo") : formatCityTime("Australia/Melbourne")}</p></div>)}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex items-center justify-between border-b border-gray-200 pb-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Fast scan</p><h2 className="text-xl font-black">In the News</h2></div><span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">LIVE</span></div><div>{inNews.slice(0, 5).map((story) => <MiniHeadline key={story.slug} story={story} />)}</div></div>
        </aside>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatWidget label="Recent stories" value={selectedStories.length} sub={`${regionLabel} currently loaded`} /><StatWidget label="Publishers" value={sourceCount} sub="different source feeds" /><StatWidget label="Topics" value={latestTopics.length} sub="grouped story topics" /><StatWidget label="Multi-source" value={multiSourceTopics} sub="cross-source coverage" /></section>

      <SourceRail sources={sources} />

      <section className="mt-4 rounded-xl border border-gray-200 bg-white p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="shrink-0"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Trending topics</p><p className="text-sm font-black">Explore what is moving</p></div><div className="flex flex-wrap gap-2 lg:border-l lg:border-gray-200 lg:pl-4">{topCategories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-black hover:border-gray-400 hover:bg-white">#{category.name} <span className="ml-1 text-gray-400">{category.articleCount}</span></Link>)}</div></div></section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_330px]">
        <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5"><SectionTitle eyebrow={`${regionFlag} ${regionLabel}`} title="Latest News" href="/latest" /><div>{feed.map((topic) => <TopicFeedRow key={topic.key} topic={topic} />)}</div></div>
        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4"><SectionTitle eyebrow="Across publishers" title="Most Covered" href="/popular" /><div className="mt-2 divide-y divide-gray-100">{trendingTopics.slice(0, 7).map((topic, index) => <Link key={topic.key} href={`/story/${topic.lead.slug}`} className="flex gap-3 py-3"><span className="text-xl font-black text-gray-300">{String(index + 1).padStart(2, "0")}</span><div><p className="line-clamp-2 text-sm font-black leading-5 hover:underline">{topic.lead.title}</p><p className="mt-1 text-[11px] font-semibold text-gray-500">{topic.sourceCount} sources · {topic.stories.length} reports</p></div></Link>)}</div></div>
          <div className="rounded-xl border border-gray-200 bg-white p-4"><SectionTitle eyebrow="Browse" title="Quick Links" /><div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold"><Link href="/region/sri-lanka" className="rounded-lg bg-red-600 px-3 py-3 text-white">🇱🇰 Sri Lanka</Link><Link href="/region/australia" className="rounded-lg bg-gray-950 px-3 py-3 text-white">🇦🇺 Australia</Link><Link href="/latest" className="rounded-lg bg-gray-100 px-3 py-3">Latest</Link><Link href="/sources" className="rounded-lg bg-gray-100 px-3 py-3">Sources</Link><Link href="/map" className="rounded-lg bg-gray-100 px-3 py-3">Map</Link><Link href="/official" className="rounded-lg bg-gray-100 px-3 py-3">Official</Link></div></div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-[10px] leading-5 text-gray-500">Weather data: Open-Meteo. Currency rates: ExchangeRate-API open access. Utility data are cached to reduce external requests.</div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">{[["🇱🇰", "Sri Lanka", "/?region=sri-lanka", sriLanka],["🇦🇺", "Australia", "/?region=australia", australia],["🌍", "International", "/?region=international", international]].map(([flag, label, href, items]) => <div key={label as string} className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex items-center justify-between border-b border-gray-200 pb-3"><h2 className="text-xl font-black">{flag as string} {label as string}</h2><Link href={href as string} className="text-xs font-black text-gray-500">View here →</Link></div><div className="mt-1">{(items as StoryWithImage[]).slice(0, 6).map((story) => <MiniHeadline key={story.slug} story={story} />)}</div></div>)}</section>
    </main>
  );
}
