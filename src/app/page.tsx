import Link from "next/link";
import { getStories } from "@/lib/data/stories";
import { getCategories } from "@/lib/data/categories";
import { groupStoriesIntoTopics, rankTrendingTopics, type TopicGroup } from "@/lib/data/topic-groups";
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
      {story.imageUrl ? <img src={story.imageUrl} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" /> : null}
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-extrabold leading-5 text-gray-950 group-hover:underline">{story.title}</p>
        <div className="mt-1.5 flex flex-wrap gap-x-2 text-[11px] font-semibold text-gray-500"><span>{story.source}</span><span>•</span><span>{story.published}</span></div>
      </div>
    </Link>
  );
}

function TopicFeedRow({ topic }: { topic: TopicGroup }) {
  return (
    <article className="border-b border-gray-200 py-6 last:border-0">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.13em] text-gray-500">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{topic.category}</span>
        <span>{topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</span>
        <span>•</span>
        <span>{topic.stories.length} report{topic.stories.length === 1 ? "" : "s"}</span>
      </div>
      <Link href={`/story/${topic.lead.slug}`}><h3 className="mt-2 text-xl font-black leading-snug tracking-tight hover:underline">{topic.lead.title}</h3></Link>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{topic.lead.summary}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {topic.stories.slice(0, 4).map((story) => (
          <Link key={story.slug} href={`/story/${story.slug}`} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 hover:border-gray-400 hover:bg-white">
            <p className="text-xs font-black text-gray-800">{story.source}</p>
            <p className="mt-1 line-clamp-1 text-[11px] leading-4 text-gray-500">{story.title}</p>
          </Link>
        ))}
      </div>
    </article>
  );
}

export default async function Home() {
  const [allLatest, sriLanka, australia, international, categories] = await Promise.all([
    getStories({ limit: 80 }),
    getStories({ region: "sri-lanka", limit: 6 }),
    getStories({ region: "australia", limit: 6 }),
    getStories({ region: "international", limit: 6 }),
    getCategories(),
  ]);

  const latestTopics = groupStoriesIntoTopics(allLatest, 40);
  const trendingTopics = rankTrendingTopics(latestTopics).slice(0, 8);
  const pulse = trendingTopics.slice(0, 6);
  const inNews = allLatest.slice(0, 6);
  const feed = latestTopics.slice(0, 12);
  const topCategories = categories.slice(0, 10);

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-5 md:py-7">
      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Daily News Pulse · Live</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">What matters right now</h1>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <Link href="/region/sri-lanka" className="rounded-full bg-gray-100 px-3 py-2">🇱🇰 Sri Lanka</Link>
            <Link href="/region/australia" className="rounded-full bg-gray-100 px-3 py-2">🇦🇺 Australia</Link>
            <Link href="/region/international" className="rounded-full bg-gray-100 px-3 py-2">🌍 World</Link>
          </div>
        </div>

        {pulse.length ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl bg-gray-950 p-5 text-white md:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Top topics across sources</p>
              <div className="mt-4 divide-y divide-white/10">
                {pulse.map((topic, i) => (
                  <Link key={topic.key} href={`/story/${topic.lead.slug}`} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="mt-0.5 text-xs font-black text-gray-500">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="font-extrabold leading-6 hover:underline">{topic.lead.title}</p>
                      <p className="mt-1 text-xs text-gray-400">{topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"} · {topic.stories.length} report{topic.stories.length === 1 ? "" : "s"}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Trending categories</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {topCategories.map((category) => <Link key={category.slug} href={`/categories/${category.slug}`} className="rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold hover:border-gray-400">#{category.name} <span className="text-gray-400">{category.articleCount}</span></Link>)}
              </div>
              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">How topics work</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">Similar publisher headlines are grouped deterministically. Topics with coverage from more source feeds rise higher in Trending. No AI is used.</p>
              </div>
            </div>
          </div>
        ) : <p className="mt-6 text-sm text-gray-500">No published stories are available yet.</p>}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <SectionTitle eyebrow="Live topics" title="Latest News" href="/latest" />
          <div className="mt-1">{feed.map((topic) => <TopicFeedRow key={topic.key} topic={topic} />)}</div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <SectionTitle eyebrow="Fast scan" title="In the News" />
            <div className="mt-2">{inNews.map((story) => <MiniHeadline key={story.slug} story={story} />)}</div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <SectionTitle eyebrow="Browse" title="Sections" />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-bold">
              <Link href="/trending" className="rounded-xl bg-gray-950 px-3 py-3 text-white">Trending</Link>
              <Link href="/latest" className="rounded-xl bg-gray-100 px-3 py-3">Latest</Link>
              <Link href="/categories" className="rounded-xl bg-gray-100 px-3 py-3">Categories</Link>
              <Link href="/search" className="rounded-xl bg-gray-100 px-3 py-3">Search</Link>
              <Link href="/saved" className="rounded-xl bg-gray-100 px-3 py-3">Saved</Link>
              <Link href="/about" className="rounded-xl bg-gray-100 px-3 py-3">About</Link>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {[
          ["🇱🇰", "Sri Lanka", "/region/sri-lanka", sriLanka],
          ["🇦🇺", "Australia", "/region/australia", australia],
          ["🌍", "International", "/region/international", international],
        ].map(([flag, label, href, items]) => (
          <div key={label as string} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3"><h2 className="text-xl font-black">{flag as string} {label as string}</h2><Link href={href as string} className="text-xs font-black text-gray-500">View all →</Link></div>
            <div className="mt-1">{(items as StoryWithImage[]).slice(0, 5).map((story) => <MiniHeadline key={story.slug} story={story} />)}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
