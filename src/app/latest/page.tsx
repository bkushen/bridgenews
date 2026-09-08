import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/data/stories";

export default async function LatestPage() {
  const stories = await getStories({ limit: 40 });

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="mb-7 text-4xl font-black">Latest</h1>
      {stories.length ? (
        <div className="grid gap-5 md:grid-cols-2">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-gray-600">No published stories yet.</p>
      )}
    </main>
  );
}
