import Link from "next/link";
import type { Story } from "@/lib/mock-data";

type StoryWithImage = Story & { imageUrl?: string | null };

export function StoryCard({ story, compact = false }: { story: StoryWithImage; compact?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-xl border border-[var(--news-line)] bg-[var(--news-card)] transition duration-200 hover:border-[#bcae9e]">
      <Link href={`/story/${story.slug}`} className={`block overflow-hidden bg-[var(--news-paper-deep)] ${compact ? "h-40" : "h-52"}`}>
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col justify-between bg-[var(--news-paper-deep)] p-5">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--news-muted)]">BridgeNews</span>
            <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-accent)]">{story.source}</p><p className="mt-2 line-clamp-3 font-serif text-lg font-bold leading-snug text-[var(--news-ink)]">{story.title}</p></div>
          </div>
        )}
      </Link>
      <div className={compact ? "p-4" : "p-5"}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-[var(--news-muted)]">
          <span className="rounded-full border border-[var(--news-line)] bg-[var(--news-paper)] px-2.5 py-1 text-[var(--news-ink)]">{story.category}</span>
          {story.sourceCount > 1 ? <span>{story.sourceCount} sources</span> : null}
        </div>
        <Link href={`/story/${story.slug}`}>
          <h2 className={`${compact ? "text-lg" : "text-xl"} font-serif font-bold leading-snug tracking-tight text-[var(--news-ink)] group-hover:text-[var(--news-accent)]`}>
            {story.title}
          </h2>
        </Link>
        {!compact ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--news-muted)]">{story.summary}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--news-line-soft)] pt-3 text-xs text-[var(--news-muted)]">
          <span className="truncate font-bold text-[var(--news-ink)]">{story.source}</span>
          <span className="shrink-0">{story.published}</span>
        </div>
      </div>
    </article>
  );
}
