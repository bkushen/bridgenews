import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/data/stories";

export default async function TrendingPage() {
  const stories = await getStories({ limit: 48, trending: true });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Momentum</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Trending now</h1>
        <p className="mt-3 max-w-2xl leading-7 text-gray-600">Stories gaining attention based on cluster activity, source velocity and BridgeNews trend scoring.</p>
      </div>
      {stories.length ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No trending stories yet.</p>
      )}
    </main>
  );
}
