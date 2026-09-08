import { TopicGroupCard } from "@/components/topic-group-card";
import { getStories } from "@/lib/data/stories";
import { groupStoriesIntoTopics, rankTrendingTopics } from "@/lib/data/topic-groups";

export default async function TrendingPage() {
  const stories = await getStories({ limit: 80 });
  const topics = rankTrendingTopics(groupStoriesIntoTopics(stories, 50)).slice(0, 36);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Momentum</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Trending topics</h1>
        <p className="mt-3 max-w-3xl leading-7 text-gray-600">Topics rise when more independent source feeds are covering the same subject. BridgeNews groups similar headlines deterministically—no AI required.</p>
      </div>
      {topics.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{topics.map((topic, index) => <TopicGroupCard key={topic.key} topic={topic} rank={index + 1} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No trending topics yet.</p>
      )}
    </main>
  );
}
