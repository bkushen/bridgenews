import Link from "next/link";
import type { TopicGroup } from "@/lib/data/topic-groups";

export function TopicGroupCard({ topic, rank }: { topic: TopicGroup; rank?: number }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-gray-500">
        {typeof rank === "number" ? <span className="text-gray-400">#{rank}</span> : null}
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{topic.category}</span>
        <span>{topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</span>
        <span>•</span>
        <span>{topic.stories.length} report{topic.stories.length === 1 ? "" : "s"}</span>
      </div>

      <Link href={`/story/${topic.lead.slug}`}>
        <h2 className="mt-3 text-xl font-black leading-snug tracking-tight text-gray-950 hover:underline">{topic.lead.title}</h2>
      </Link>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">{topic.lead.summary}</p>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Coverage from</p>
        <div className="mt-2 divide-y divide-gray-100">
          {topic.stories.slice(0, 4).map((story) => (
            <Link key={story.slug} href={`/story/${story.slug}`} className="flex items-start justify-between gap-3 py-2.5 text-sm hover:bg-gray-50">
              <div className="min-w-0">
                <p className="font-bold leading-5 text-gray-900">{story.source}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{story.title}</p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-gray-400">{story.published}</span>
            </Link>
          ))}
        </div>
        {topic.stories.length > 4 ? <p className="pt-2 text-xs font-semibold text-gray-500">+{topic.stories.length - 4} more reports</p> : null}
      </div>
    </article>
  );
}
