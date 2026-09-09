import Link from "next/link";
import { TopicGroupCard } from "@/components/topic-group-card";
import { getStories } from "@/lib/data/stories";
import { groupStoriesIntoTopics, rankTrendingTopics } from "@/lib/data/topic-groups";

export default async function TopStoriesPage({ searchParams }: { searchParams: Promise<{ language?: string }> }) {
  const params = await searchParams;
  const language = params.language || "all";
  const stories = await getStories({ limit: 160 });
  const filtered = language === "all" ? stories : stories.filter((story) => {
    const text = `${story.title} ${story.summary}`;
    if (language === "si") return /[\u0D80-\u0DFF]/u.test(text);
    if (language === "ta") return /[\u0B80-\u0BFF]/u.test(text);
    return !/[\u0D80-\u0DFF\u0B80-\u0BFF]/u.test(text);
  });
  const topics = rankTrendingTopics(groupStoriesIntoTopics(filtered, 80)).slice(0, 48);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-col gap-5 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-600">Across publishers</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Top Stories</h1><p className="mt-3 max-w-3xl leading-7 text-gray-600">The biggest current stories ranked by independent publisher coverage and report count. Similar headlines are grouped deterministically without AI.</p></div>
        <div className="flex flex-wrap gap-2">
          {[["all","All"],["en","English"],["si","සිංහල"],["ta","தமிழ்"]].map(([value,label]) => <Link key={value} href={`/top-stories?language=${value}`} className={`rounded-full px-4 py-2 text-xs font-black ${language === value ? "bg-gray-950 text-white" : "border border-gray-200 bg-white"}`}>{label}</Link>)}
        </div>
      </div>
      <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{topics.map((topic, index) => <TopicGroupCard key={topic.key} topic={topic} rank={index + 1} />)}</div>
    </main>
  );
}
