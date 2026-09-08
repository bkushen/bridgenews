import { notFound } from "next/navigation";
import { StoryCard } from "@/components/story-card";
import { getTopicBySlug, getTopicStories } from "@/lib/data/topics";

export default async function TopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [topic, stories] = await Promise.all([getTopicBySlug(slug), getTopicStories(slug, 20)]);
  if (!topic) notFound();

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Topic</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">{topic.name}</h1>
          <span className="rounded-full bg-gray-950 px-3 py-1.5 text-xs font-bold text-white">Trend {Math.round(topic.trendingScore)}</span>
        </div>
        <p className="mt-4 text-base leading-7 text-gray-600">{topic.description || "Recent reporting and related coverage from BridgeNews sources."}</p>
      </div>

      <section className="mt-9">
        <div className="mb-5 border-b border-gray-200 pb-3">
          <h2 className="text-2xl font-black tracking-tight">Latest coverage</h2>
        </div>
        {stories.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No published stories are linked to this topic yet.</div>
        )}
      </section>
    </main>
  );
}
