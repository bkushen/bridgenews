import Link from "next/link";
import type { PortalStory } from "@/lib/data/portal";

export function PortalStoryRow({ story, rank }: { story: PortalStory; rank?: number }) {
  return (
    <article className="grid gap-4 border-b border-gray-100 py-4 last:border-0 sm:grid-cols-[120px_1fr_auto]">
      <Link href={`/story/${story.slug}`} className="overflow-hidden rounded-xl bg-gray-100">
        {story.imageUrl ? <img src={story.imageUrl} alt="" className="h-24 w-full object-cover" /> : <div className="h-24 bg-gradient-to-br from-gray-200 to-gray-100" />}
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-gray-400">
          {rank ? <span className="text-gray-950">#{rank}</span> : null}
          <span>{story.category}</span><span>•</span><span>{story.languageCode}</span>
          {story.viewCount ? <><span>•</span><span>{story.viewCount.toLocaleString()} views</span></> : null}
        </div>
        <Link href={`/story/${story.slug}`}><h2 className="mt-1 line-clamp-2 text-lg font-black leading-snug tracking-tight hover:underline">{story.title}</h2></Link>
        <p className="mt-1 line-clamp-1 text-sm text-gray-500">{story.source} · {story.published}</p>
      </div>
      {story.sourceLogoUrl ? <img src={story.sourceLogoUrl} alt="" className="hidden h-9 w-9 rounded-lg object-contain sm:block" /> : null}
    </article>
  );
}
