import Link from "next/link";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/data/stories";
import { regionMeta } from "@/lib/mock-data";

export default async function Home() {
  const stories = await getStories({ limit: 8, trending: true });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <section className="rounded-3xl bg-black px-7 py-12 text-white md:px-12">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">Sri Lanka • Australia • International</p>
        <h1 className="max-w-4xl text-4xl font-black tracking-tight md:text-6xl">One place to understand what is happening — and why it matters.</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">Automatic source aggregation, AI summaries, duplicate clustering and region-aware discovery.</p>
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3">
        {Object.entries(regionMeta).map(([slug, region]) => (
          <Link key={slug} href={`/region/${slug}`} className="rounded-2xl border border-[var(--border)] bg-white p-6 transition hover:-translate-y-0.5">
            <div className="text-3xl">{region.flag}</div>
            <h2 className="mt-4 text-2xl font-bold">{region.label}</h2>
            <p className="mt-2 leading-6 text-gray-600">{region.description}</p>
          </Link>
        ))}
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Live feed</p>
            <h2 className="text-3xl font-black">Top stories</h2>
          </div>
          <Link href="/latest" className="text-sm font-semibold">View latest →</Link>
        </div>
        {stories.length ? (
          <div className="grid gap-5 md:grid-cols-2">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-gray-600">No published stories yet. Add a source in Admin and run the ingestion pipeline.</div>
        )}
      </section>
    </main>
  );
}
