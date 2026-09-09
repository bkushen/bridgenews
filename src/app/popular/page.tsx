import { PortalStoryRow } from "@/components/portal-story-row";
import { TopicGroupCard } from "@/components/topic-group-card";
import { getMostReadStories } from "@/lib/data/portal";
import { getStories } from "@/lib/data/stories";
import { groupStoriesIntoTopics, rankTrendingTopics } from "@/lib/data/topic-groups";

export default async function PopularPage() {
  const [mostRead, stories] = await Promise.all([getMostReadStories(30), getStories({ limit: 140 })]);
  const mostCovered = rankTrendingTopics(groupStoriesIntoTopics(stories, 70)).filter((topic) => topic.sourceCount > 1).slice(0, 18);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="border-b border-gray-200 pb-6"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Audience & coverage</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Popular News</h1><p className="mt-3 max-w-3xl leading-7 text-gray-600">Most Read measures BridgeNews reader activity. Most Covered measures how many independent publishers are reporting the same topic. They are intentionally separate rankings.</p></div>
      <section className="mt-8 grid gap-7 xl:grid-cols-2">
        <div><div className="mb-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">Reader activity</p><h2 className="mt-1 text-2xl font-black">Most Read</h2></div><div className="rounded-2xl border border-gray-200 bg-white px-5 shadow-sm">{mostRead.length ? mostRead.map((story, index) => <PortalStoryRow key={story.articleId} story={story} rank={index + 1} />) : <p className="py-10 text-center text-gray-500">View tracking is now live. This ranking will populate as readers open stories.</p>}</div></div>
        <div><div className="mb-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">Publisher activity</p><h2 className="mt-1 text-2xl font-black">Most Covered</h2></div><div className="grid gap-4">{mostCovered.length ? mostCovered.map((topic, index) => <TopicGroupCard key={topic.key} topic={topic} rank={index + 1} />) : <p className="rounded-2xl border border-dashed bg-white p-8 text-gray-500">Multi-source coverage is still growing as more publishers are connected.</p>}</div></div>
      </section>
    </main>
  );
}
