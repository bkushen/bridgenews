import { TopicGroupCard } from "@/components/topic-group-card";
import { getStories } from "@/lib/data/stories";
import { groupStoriesIntoTopics } from "@/lib/data/topic-groups";

export default async function LatestPage() {
  const stories = await getStories({ limit: 80 });
  const topics = groupStoriesIntoTopics(stories, 40);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="mb-8 border-b border-gray-200 pb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Live feed</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Latest topics</h1>
        <p className="mt-3 max-w-3xl leading-7 text-gray-600">The newest topics across Sri Lanka, Australia and international publishers, grouped so you can compare different sources covering the same subject.</p>
      </div>
      {topics.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{topics.map((topic) => <TopicGroupCard key={topic.key} topic={topic} />)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No published topics yet.</p>
      )}
    </main>
  );
}
