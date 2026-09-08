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

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-8">
        <div className="text-4xl">{region.flag}</div>
        <h1 className="mt-3 text-4xl font-black">{region.label}</h1>
        <p className="mt-3 max-w-2xl leading-7 text-gray-600">{region.description}</p>
      </div>
      {stories.length ? (
        <div className="grid gap-5 md:grid-cols-2">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-gray-600">No published stories for {region.label} yet.</p>
      )}
    </main>
  );
}
