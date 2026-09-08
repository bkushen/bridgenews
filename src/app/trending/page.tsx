import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/data/stories";

export default async function TrendingPage() {
  const stories = await getStories({ limit: 40, trending: true });

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Ranked by cluster trend score</p>
      <h1 className="mb-7 mt-1 text-4xl font-black">Trending</h1>
      {stories.length ? (
        <div className="grid gap-5 md:grid-cols-2">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-gray-600">No trending stories yet.</p>
      )}
    </main>
  );
}
