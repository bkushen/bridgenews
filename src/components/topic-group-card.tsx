import Link from "next/link";
import type { TopicGroup } from "@/lib/data/topic-groups";

export function TopicGroupCard({ topic, rank }: { topic: TopicGroup; rank?: number }) {
  return (
    <article className="rounded-xl border border-[var(--news-line)] bg-[var(--news-card)] p-5 transition hover:border-[#bcae9e]">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-muted)]">
        {typeof rank === "number" ? <span className="text-[var(--news-accent)]">#{rank}</span> : null}
        <span className="rounded-full border border-[var(--news-line)] bg-[var(--news-paper)] px-2.5 py-1 text-[var(--news-ink)]">{topic.category}</span>
        <span>{topic.sourceCount} source{topic.sourceCount === 1 ? "" : "s"}</span><span>•</span><span>{topic.stories.length} report{topic.stories.length === 1 ? "" : "s"}</span>
      </div>

      <Link href={`/story/${topic.lead.slug}`}><h2 className="mt-3 font-serif text-xl font-bold leading-snug tracking-tight text-[var(--news-ink)] hover:text-[var(--news-accent)]">{topic.lead.title}</h2></Link>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--news-muted)]">{topic.lead.summary}</p>

      <div className="mt-4 border-t border-[var(--news-line-soft)] pt-3">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-accent)]">Coverage from</p>
        <div className="mt-2 divide-y divide-[var(--news-line-soft)]">{topic.stories.slice(0, 4).map((story) => <Link key={story.slug} href={`/story/${story.slug}`} className="flex items-start justify-between gap-3 py-2.5 text-sm"><div className="min-w-0"><p className="font-bold leading-5 text-[var(--news-ink)]">{story.source}</p><p className="mt-0.5 line-clamp-1 text-xs text-[var(--news-muted)]">{story.title}</p></div><span className="shrink-0 text-[11px] font-semibold text-[var(--news-muted)]">{story.published}</span></Link>)}</div>
        {topic.stories.length > 4 ? <p className="pt-2 text-xs font-semibold text-[var(--news-muted)]">+{topic.stories.length - 4} more reports</p> : null}
      </div>
    </article>
  );
}
