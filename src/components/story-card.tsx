import Link from "next/link";
import type { Story } from "@/lib/mock-data";

type StoryWithImage = Story & { imageUrl?: string | null };

export function StoryCard({ story, compact = false }: { story: StoryWithImage; compact?: boolean }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/story/${story.slug}`} className={`block overflow-hidden bg-gray-100 ${compact ? "h-40" : "h-52"}`}>
        {story.imageUrl ? (
          <img
            src={story.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full flex-col justify-between bg-gradient-to-br from-gray-100 to-gray-200 p-5">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">BridgeNews</span>
            <div><p className="text-xs font-black uppercase tracking-wide text-gray-500">{story.source}</p><p className="mt-2 line-clamp-3 text-lg font-black leading-snug text-gray-800">{story.title}</p></div>
          </div>
        )}
      </Link>
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
