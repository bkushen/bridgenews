import { notFound } from "next/navigation";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/data/stories";
import { regionMeta, type RegionSlug } from "@/lib/mock-data";

export default async function RegionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!(slug in regionMeta)) notFound();

  const regionSlug = slug as RegionSlug;
  const region = regionMeta[regionSlug];
  const stories = await getStories({ region: regionSlug, limit: 40 });
  const lead = stories[0];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-gray-200 pb-6">
        <div className="max-w-3xl">
          <div className="text-4xl">{region.flag}</div>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{region.label}</h1>
          <p className="mt-3 max-w-2xl leading-7 text-gray-600">{region.description}</p>
        </div>
        <div className="rounded-full bg-white px-4 py-2 text-xs font-bold text-gray-500 shadow-sm ring-1 ring-gray-200">{stories.length} stories</div>
      </div>

      {lead ? (
        <>
          <section className="mb-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <StoryCard story={lead} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">{stories.slice(1, 3).map((story) => <StoryCard key={story.slug} story={story} compact />)}</div>
          </section>
          <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stories.slice(3).map((story) => <StoryCard key={story.slug} story={story} />)}</section>
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No published stories for {region.label} yet.</p>
      )}
    </main>
  );
}
