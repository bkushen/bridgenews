import Link from "next/link";
import type { Story } from "@/lib/mock-data";

export function StoryCard({ story }: { story: Story }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span>{story.category}</span>
        <span>•</span>
        <span>{story.sourceCount} sources</span>
      </div>
      <Link href={`/story/${story.slug}`}>
        <h2 className="text-xl font-bold leading-tight hover:underline">{story.title}</h2>
      </Link>
      <p className="mt-3 leading-7 text-gray-600">{story.summary}</p>
      <div className="mt-5 flex items-center justify-between text-sm text-gray-500">
        <span>{story.source}</span>
        <span>{story.published}</span>
      </div>
    </article>
  );
}
