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
      {story.imageUrl ? <img src={story.imageUrl} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" /> : <div className="h-16 w-20 shrink-0 rounded-xl bg-gradient-to-br from-gray-200 to-gray-100" />}
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-extrabold leading-5 text-gray-950 group-hover:underline">{story.title}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-2 text-[11px] font-semibold text-gray-500"><span>{story.source}</span><span>•</span><span>{story.published}</span></div>
      </div>
    </Link>
  );
}

function HeroCard({ story, large = false }: { story: StoryWithImage; large?: boolean }) {
  return (
    <Link href={`/story/${story.slug}`} className={`group relative overflow-hidden rounded-2xl bg-gray-900 ${large ? "min-h-[340px] md:min-h-[430px]" : "min-h-[205px]"}`}>
      {story.imageUrl ? <img src={story.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="absolute inset-0 bg-gradient-to-br from-gray-700 via-gray-900 to-black" />}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/75"><span>{story.source}</span><span>•</span><span>{story.published}</span></div>
        <h2 className={`${large ? "text-2xl md:text-4xl" : "text-lg md:text-xl"} font-black leading-tight tracking-tight group-hover:underline`}>{story.title}</h2>
        {large ? <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-white/75">{story.summary}</p> : null}
      </div>
    </Link>
  );
}

function TopicFeedRow({ topic }: { topic: TopicGroup }) {
  const lead = topic.lead as StoryWithImage;
  return (
    <article className="border-b border-gray-200 py-5 last:border-0">
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        <Link href={`/story/${lead.slug}`} className="overflow-hidden rounded-2xl bg-gray-100">
          {lead.imageUrl ? <img src={lead.imageUrl} alt="" className="h-36 w-full object-cover transition hover:scale-105 sm:h-full" /> : <div className="h-36 bg-gradient-to-br from-gray-200 to-gray-100 sm:h-full" />}
        </Link>
        <div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-gray-500">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{topic.category}</span>
            <span>{topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</span><span>•</span><span>{topic.stories.length} report{topic.stories.length === 1 ? "" : "s"}</span>
          </div>
          <Link href={`/story/${lead.slug}`}><h3 className="mt-2 text-xl font-black leading-snug tracking-tight hover:underline">{lead.title}</h3></Link>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{lead.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">{topic.stories.slice(0, 4).map((story) => <span key={story.slug} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600">{story.source}</span>)}</div>
        </div>
      </div>
    </article>
  );
}

function StatWidget({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-gray-950">{value}</p><p className="mt-1 text-xs font-semibold text-gray-500">{sub}</p></div>;
}

export default async function Home() {
  const [allLatest, sriLanka, australia, international, categories, weather, rates, sources] = await Promise.all([
    getStories({ limit: 100 }),
    getStories({ region: "sri-lanka", limit: 10 }),
    getStories({ region: "australia", limit: 8 }),
    getStories({ region: "international", limit: 8 }),
    getCategories(),
    getHomepageWeather(),
    getExchangeStrip(),
    getPublicSources(40),
  ]);

  const latestTopics = groupStoriesIntoTopics(allLatest, 50);
  const trendingTopics = rankTrendingTopics(latestTopics).slice(0, 10);
  const topCategories = categories.slice(0, 12);
  const heroStories = (sriLanka.length ? sriLanka : allLatest).slice(0, 5) as StoryWithImage[];
  const inNews = allLatest.slice(0, 7) as StoryWithImage[];
  const feed = latestTopics.slice(0, 14);
  const sourceCount = new Set(allLatest.map((story) => story.source)).size;
  const multiSourceTopics = latestTopics.filter((topic) => topic.sourceCount > 1).length;
  const colombo = weather[0];
  const melbourne = weather[1];
  const tickerItems = trendingTopics.slice(0, 8).map((topic) => ({ key: topic.key, title: topic.lead.title, href: `/story/${topic.lead.slug}` }));

  return (
    <main className="mx-auto max-w-[1440px] px-3 py-4 sm:px-5 md:py-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 text-white shadow-sm">
        <div className="flex flex-wrap items-center divide-x divide-white/10">
          <div className="bg-red-600 px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em]">Markets & live</div>
          <div className="px-4 py-3 text-xs font-bold">AUD/LKR <span className="ml-1 text-emerald-400">{rates.audToLkr?.toFixed(2) ?? "—"}</span></div>
          <div className="px-4 py-3 text-xs font-bold">USD/LKR <span className="ml-1 text-emerald-400">{rates.usdToLkr?.toFixed(2) ?? "—"}</span></div>
          <div className="px-4 py-3 text-xs font-bold">AUD/USD <span className="ml-1 text-emerald-400">{rates.audToUsd?.toFixed(4) ?? "—"}</span></div>
          <div className="ml-auto hidden px-4 py-3 text-[10px] font-semibold text-gray-400 lg:block">Rates updated daily</div>
        </div>
      </section>

      <LiveNewsTicker items={tickerItems} />

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_330px]">
        <div className="grid gap-3 lg:grid-cols-[1.55fr_0.85fr]">
          {heroStories[0] ? <HeroCard story={heroStories[0]} large /> : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{heroStories.slice(1, 3).map((story) => <HeroCard key={story.slug} story={story} />)}</div>
        </div>
        <aside className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[colombo, melbourne].map((item) => <div key={item.city} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Weather</p><h3 className="mt-1 font-black">{item.city}</h3></div><span className="text-2xl">{item.emoji}</span></div><p className="mt-3 text-3xl font-black">{item.temperature != null ? `${Math.round(item.temperature)}°` : "—"}</p><p className="mt-1 text-[11px] font-semibold text-gray-500">H {item.high != null ? Math.round(item.high) : "—"}° · L {item.low != null ? Math.round(item.low) : "—"}°</p><p className="mt-2 text-[10px] text-gray-400">{item.city === "Colombo" ? formatCityTime("Asia/Colombo") : formatCityTime("Australia/Melbourne")}</p></div>)}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between border-b border-gray-200 pb-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-red-600">Fast scan</p><h2 className="text-xl font-black">In the News</h2></div><span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">LIVE</span></div><div>{inNews.slice(0, 5).map((story) => <MiniHeadline key={story.slug} story={story} />)}</div></div>
        </aside>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatWidget label="Published" value={allLatest.length} sub="recent stories loaded" /><StatWidget label="Publishers" value={sourceCount} sub="different source feeds" /><StatWidget label="Topics" value={latestTopics.length} sub="grouped story topics" /><StatWidget label="Multi-source" value={multiSourceTopics} sub="topics with cross-source coverage" /></section>

      <SourceRail sources={sources} />

      <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="shrink-0"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Trending topics</p><p className="text-sm font-black">Explore what is moving</p></div><div className="flex flex-wrap gap-2 lg:border-l lg:border-gray-200 lg:pl-4">{topCategories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-black hover:border-gray-400 hover:bg-white">#{category.name} <span className="ml-1 text-gray-400">{category.articleCount}</span></Link>)}</div></div></section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_330px]">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5"><SectionTitle eyebrow="Live feed" title="Latest News" href="/latest" /><div>{feed.map((topic) => <TopicFeedRow key={topic.key} topic={topic} />)}</div></div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><SectionTitle eyebrow="Across publishers" title="Popular Now" href="/trending" /><div className="mt-2 divide-y divide-gray-100">{trendingTopics.slice(0, 7).map((topic, index) => <Link key={topic.key} href={`/story/${topic.lead.slug}`} className="flex gap-3 py-3"><span className="text-xl font-black text-gray-300">{String(index + 1).padStart(2, "0")}</span><div><p className="line-clamp-2 text-sm font-black leading-5 hover:underline">{topic.lead.title}</p><p className="mt-1 text-[11px] font-semibold text-gray-500">{topic.sourceCount} sources · {topic.stories.length} reports</p></div></Link>)}</div></div>
          <div className="rounded-2xl bg-gray-950 p-5 text-white shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">BridgeNews Pulse</p><h3 className="mt-2 text-2xl font-black">Sri Lanka first</h3><p className="mt-2 text-sm leading-6 text-gray-300">Fast coverage from multiple Sri Lankan publishers, with English, Sinhala and Tamil sources grouped into one live portal.</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[78%] rounded-full bg-white" /></div><div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400"><span>Coverage</span><span>Growing</span></div></div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><SectionTitle eyebrow="Browse" title="Quick Links" /><div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold"><Link href="/region/sri-lanka" className="rounded-xl bg-red-600 px-3 py-3 text-white">🇱🇰 Sri Lanka</Link><Link href="/trending" className="rounded-xl bg-gray-950 px-3 py-3 text-white">Trending</Link><Link href="/latest" className="rounded-xl bg-gray-100 px-3 py-3">Latest</Link><Link href="/categories" className="rounded-xl bg-gray-100 px-3 py-3">Categories</Link><Link href="/search" className="rounded-xl bg-gray-100 px-3 py-3">Search</Link><Link href="/saved" className="rounded-xl bg-gray-100 px-3 py-3">Saved</Link></div></div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-[10px] leading-5 text-gray-500">Weather data: Open-Meteo. Currency rates: ExchangeRate-API open access. Utility data are cached to reduce external requests.</div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">{[["🇱🇰", "Sri Lanka", "/region/sri-lanka", sriLanka],["🇦🇺", "Australia", "/region/australia", australia],["🌍", "International", "/region/international", international]].map(([flag, label, href, items]) => <div key={label as string} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between border-b border-gray-200 pb-3"><h2 className="text-xl font-black">{flag as string} {label as string}</h2><Link href={href as string} className="text-xs font-black text-gray-500">View all →</Link></div><div className="mt-1">{(items as StoryWithImage[]).slice(0, 6).map((story) => <MiniHeadline key={story.slug} story={story} />)}</div></div>)}</section>
    </main>
  );
}
