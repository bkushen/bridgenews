import Link from "next/link";
import { getTopics } from "@/lib/data/topics";

export default async function TopicsPage() {
  const topics = await getTopics(48);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-3xl border-b border-gray-200 pb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Live discovery</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Topics in the News</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">Recurring people, places and subjects detected from current headlines using deterministic word frequency and category spread. No AI topic generation is used.</p>
      </div>

      {topics.length ? <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic, index) => (
          <Link key={topic.slug} href={`/topics/${topic.slug}`} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gray-950 text-xs font-black text-white">{String(index + 1).padStart(2, "0")}</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">{topic.storyCount || Math.round(topic.trendingScore / 10)} stories</span>
            </div>
            <h2 className="mt-5 text-xl font-black tracking-tight group-hover:underline">{topic.name}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{topic.description || "Recent coverage from across BridgeNews."}</p>
          </Link>
        ))}
      </div> : <p className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">Topic signals will appear as recurring subjects build across the live feed.</p>}
    </main>
  );
}
