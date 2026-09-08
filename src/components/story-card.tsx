import Link from "next/link";
import type { Story } from "@/lib/mock-data";

type StoryWithImage = Story & { imageUrl?: string | null };

export function StoryCard({ story, compact = false }: { story: StoryWithImage; compact?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {story.imageUrl ? (
        <Link href={`/story/${story.slug}`} className="block overflow-hidden bg-gray-100">
          <img
            src={story.imageUrl}
            alt=""
            className={`w-full object-cover transition duration-300 group-hover:scale-[1.02] ${compact ? "h-40" : "h-52"}`}
            loading="lazy"
          />
        </Link>
      ) : null}
      <div className={compact ? "p-4" : "p-5"}>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-700">{story.category}</span>
          {story.sourceCount > 1 ? <span>{story.sourceCount} sources</span> : null}
        </div>
        <Link href={`/story/${story.slug}`}>
          <h2 className={`${compact ? "text-lg" : "text-xl"} font-extrabold leading-snug tracking-tight text-gray-950 group-hover:underline`}>
            {story.title}
          </h2>
        </Link>
        {!compact ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">{story.summary}</p> : null}
        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500">
          <span className="truncate font-semibold text-gray-700">{story.source}</span>
          <span className="shrink-0">{story.published}</span>
        </div>
      </div>
    </article>
  );
}
