import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoryBySlug } from "@/lib/data/story-detail";
import { saveBookmark } from "@/app/saved/actions";
import { ViewTracker } from "@/components/view-tracker";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      {story.articleId ? <ViewTracker articleId={story.articleId} /> : null}
      <article>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.14em] text-gray-500">
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-gray-700">{story.category}</span>
          {story.regions.map((region) => <span key={region}>{region}</span>)}
        </div>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-tight md:text-6xl">{story.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{story.source}</span><span>•</span><span>{story.published}</span>
          {story.sourceCount > 1 ? <><span>•</span><span>{story.sourceCount} publishers covering this story</span></> : null}
        </div>

        {story.articleId ? <form action={saveBookmark} className="mt-5"><input type="hidden" name="articleId" value={story.articleId} /><input type="hidden" name="returnTo" value={`/story/${story.slug}`} /><button className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-800 hover:bg-gray-50">☆ Save story</button></form> : null}

        {story.imageUrl ? <img src={story.imageUrl} alt="" className="mt-8 max-h-[560px] w-full rounded-3xl object-cover" /> : null}

        <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center justify-between gap-4"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Publisher snippet</p><span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-500">No AI summary</span></div>
          <p className="mt-4 text-lg leading-8 text-gray-800">{story.summary}</p>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 pb-4"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Related coverage</p><h2 className="mt-1 text-2xl font-black tracking-tight">Also covered by</h2></div><span className="text-sm font-semibold text-gray-500">{story.sources.length} publisher{story.sources.length === 1 ? "" : "s"}</span></div>
          <div className="divide-y divide-gray-100">
            {story.sources.map((source, index) => (
              <div key={`${source.url}-${index}`} className="grid gap-3 py-5 sm:grid-cols-[48px_1fr_auto] sm:items-center">
                <Link href={`/sources/${source.slug}`} className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border bg-white">{source.logoUrl ? <img src={source.logoUrl} alt="" className="h-full w-full object-contain p-1" /> : <span className="text-xs font-black">{source.name.slice(0,2).toUpperCase()}</span>}</Link>
                <div className="min-w-0"><Link href={`/sources/${source.slug}`} className="text-xs font-black uppercase tracking-wider text-gray-500 hover:text-black">{source.name}</Link><p className="mt-1 line-clamp-2 font-bold text-gray-900">{source.headline}</p>{source.publishedAt ? <p className="mt-1 text-xs text-gray-400">Publisher timestamp available</p> : null}</div>
                <a href={source.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-gray-200 px-4 py-2 text-xs font-black hover:bg-gray-50">Read original ↗</a>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
