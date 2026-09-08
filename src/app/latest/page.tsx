import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/data/stories";

export default async function LatestPage() {
  const stories = await getStories({ limit: 48 });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Live feed</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Latest stories</h1>
        <p className="mt-3 max-w-2xl leading-7 text-gray-600">The newest published coverage across Sri Lanka, Australia and international sources.</p>
      </div>
      {stories.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No published stories yet.</p>
      )}
    </main>
  );
}
