import Link from "next/link";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/data/stories";
import type { Story } from "@/lib/mock-data";

type StoryWithImage = Story & { imageUrl?: string | null };

function SectionHeader({ title, href, eyebrow }: { title: string; href: string; eyebrow: string }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 border-b border-gray-200 pb-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black tracking-tight text-gray-950">{title}</h2>
      </div>
      <Link href={href} className="shrink-0 text-sm font-bold text-gray-600 hover:text-black">View all →</Link>
    </div>
  );
}

function LeadStory({ story }: { story: StoryWithImage }) {
  return (
    <article className="group relative min-h-[430px] overflow-hidden rounded-3xl bg-gray-950 text-white">
      {story.imageUrl ? <img src={story.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-[1.02]" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
      <div className="relative flex min-h-[430px] max-w-3xl flex-col justify-end p-7 md:p-10">
        <div className="mb-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.15em] text-gray-200">
          <span className="rounded-full bg-white/15 px-3 py-1.5 backdrop-blur">{story.category}</span>
          {story.sourceCount > 1 ? <span className="rounded-full bg-white/10 px-3 py-1.5">{story.sourceCount} sources</span> : null}
        </div>
        <Link href={`/story/${story.slug}`}>
          <h1 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">{story.title}</h1>
        </Link>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-200 md:text-base">{story.summary}</p>
        <div className="mt-5 flex gap-3 text-xs font-semibold text-gray-300"><span>{story.source}</span><span>•</span><span>{story.published}</span></div>
      </div>
    </article>
  );
}

export default async function Home() {
  const [topStories, latest, sriLanka, australia, international] = await Promise.all([
    getStories({ limit: 7, trending: true }),
    getStories({ limit: 6 }),
    getStories({ region: "sri-lanka", limit: 4 }),
    getStories({ region: "australia", limit: 4 }),
    getStories({ region: "international", limit: 4 }),
  ]);

  const lead = topStories[0] as StoryWithImage | undefined;
  const sideStories = topStories.slice(1, 5);

  return (
    <main className="mx-auto max-w-7xl px-5 py-7 md:py-9">
      <section className="mb-6 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
        <span className="mr-1 uppercase tracking-[0.15em] text-gray-400">Explore</span>
        <Link href="/region/sri-lanka" className="rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200">🇱🇰 Sri Lanka</Link>
        <Link href="/region/australia" className="rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200">🇦🇺 Australia</Link>
        <Link href="/region/international" className="rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-gray-200">🌍 International</Link>
        <Link href="/trending" className="rounded-full bg-gray-950 px-3 py-2 text-white">Trending now</Link>
      </section>

      {lead ? (
        <section className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
          <LeadStory story={lead} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {sideStories.slice(0, 3).map((story) => <StoryCard key={story.slug} story={story} compact />)}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">No published stories yet. The automatic source pipeline is ready for its first ingestion run.</section>
      )}

      <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <SectionHeader title="Latest stories" href="/latest" eyebrow="Live feed" />
          <div className="grid gap-5 md:grid-cols-2">{latest.slice(0, 6).map((story) => <StoryCard key={story.slug} story={story} />)}</div>
        </div>
        <aside>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Why BridgeNews</p>
            <h2 className="mt-2 text-xl font-black">One story. Multiple perspectives.</h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">BridgeNews is built to combine duplicate coverage, keep publisher attribution, and make Sri Lankan, Australian and international reporting easier to follow.</p>
            <Link href="/topics" className="mt-5 inline-flex rounded-full bg-gray-950 px-4 py-2 text-xs font-bold text-white">Browse topics</Link>
          </div>
          <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-950 p-5 text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Fast scan</p>
            <h3 className="mt-2 text-lg font-black">Latest headlines</h3>
            <div className="mt-4 divide-y divide-white/10">
              {latest.slice(0, 5).map((story) => (
                <Link key={story.slug} href={`/story/${story.slug}`} className="block py-3 text-sm font-bold leading-5 text-gray-100 hover:text-white">{story.title}</Link>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-12"><SectionHeader title="Sri Lanka" href="/region/sri-lanka" eyebrow="🇱🇰 Local focus" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{sriLanka.map((story) => <StoryCard key={story.slug} story={story} compact />)}</div></section>
      <section className="mt-12"><SectionHeader title="Australia" href="/region/australia" eyebrow="🇦🇺 National focus" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{australia.map((story) => <StoryCard key={story.slug} story={story} compact />)}</div></section>
      <section className="mt-12"><SectionHeader title="International" href="/region/international" eyebrow="🌍 World focus" /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{international.map((story) => <StoryCard key={story.slug} story={story} compact />)}</div></section>
    </main>
  );
}
