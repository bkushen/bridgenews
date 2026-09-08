import Link from "next/link";
import { getTopics } from "@/lib/data/topics";

export default async function TopicsPage() {
  const topics = await getTopics(24);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Discovery</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Topics worth following</h1>
        <p className="mt-4 text-base leading-7 text-gray-600">Browse durable subjects and emerging themes across Sri Lanka, Australia and international coverage.</p>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic, index) => (
          <Link key={topic.slug} href={`/topics/${topic.slug}`} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gray-950 text-xs font-black text-white">{String(index + 1).padStart(2, "0")}</span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-500">Score {Math.round(topic.trendingScore)}</span>
            </div>
            <h2 className="mt-5 text-xl font-black tracking-tight group-hover:underline">{topic.name}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{topic.description || "Coverage and related stories from across BridgeNews."}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
