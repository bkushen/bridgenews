import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoryBySlug } from "@/lib/data/story-detail";
import { saveBookmark } from "@/app/saved/actions";
import { ViewTracker } from "@/components/view-tracker";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) return { title: "Story not found | BridgeNews" };
  const description = story.summary.slice(0, 180);
  return {
    title: `${story.title} | BridgeNews`,
    description,
    alternates: { canonical: `/story/${story.slug}` },
    openGraph: { type: "article", title: story.title, description, images: story.imageUrl ? [{ url: story.imageUrl }] : undefined, publishedTime: story.publishedAt || undefined },
    twitter: { card: story.imageUrl ? "summary_large_image" : "summary", title: story.title, description, images: story.imageUrl ? [story.imageUrl] : undefined },
  };
}

const secondaryButton = "rounded-full border border-[var(--news-line)] bg-[var(--news-card)] px-4 py-2 text-sm font-bold text-[var(--news-ink)] transition hover:border-[#b9aa99] hover:text-[var(--news-accent)]";

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getStoryBySlug(slug);
  if (!story) notFound();
  const shareText = encodeURIComponent(story.title);
  const shareUrl = encodeURIComponent(`/story/${story.slug}`);

  return (
    <main className="mx-auto max-w-[1040px] px-4 py-8 sm:px-5 sm:py-10">
      {story.articleId ? <ViewTracker articleId={story.articleId} /> : null}
      <article>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-muted)]">
          {story.categorySlug ? <Link href={`/categories/${story.categorySlug}`} className="rounded-full border border-[var(--news-line)] bg-[var(--news-card)] px-3 py-1.5 text-[var(--news-accent)] hover:border-[#b9aa99]">{story.category}</Link> : <span className="rounded-full border border-[var(--news-line)] bg-[var(--news-card)] px-3 py-1.5">{story.category}</span>}
          {story.regions.map((region) => <Link key={region.slug} href={`/region/${region.slug}`} className="hover:text-[var(--news-accent)]">{region.name}</Link>)}
        </div>

        <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight text-[var(--news-ink)] sm:text-5xl md:text-6xl">{story.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-[var(--news-line)] pb-5 text-sm text-[var(--news-muted)]">
          {story.sourceSlug ? <Link href={`/sources/${story.sourceSlug}`} className="font-bold text-[var(--news-ink)] hover:text-[var(--news-accent)]">{story.source}</Link> : <span className="font-bold text-[var(--news-ink)]">{story.source}</span>}<span>•</span><span>{story.published}</span>
          {story.sourceCount > 1 ? <><span>•</span><span>{story.sourceCount} publishers covering this story</span></> : null}
        </div>

        {story.topics.length ? <div className="mt-4 flex flex-wrap gap-2">{story.topics.map((topic) => <Link key={topic.slug} href={`/topics/${topic.slug}`} className="rounded-full border border-[var(--news-line)] bg-transparent px-3 py-1.5 text-xs font-bold text-[var(--news-muted)] hover:border-[#b9aa99] hover:text-[var(--news-accent)]">#{topic.name}</Link>)}</div> : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {story.articleId ? <form action={saveBookmark}><input type="hidden" name="articleId" value={story.articleId} /><input type="hidden" name="returnTo" value={`/story/${story.slug}`} /><button className={secondaryButton}>☆ Save story</button></form> : null}
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer" className={secondaryButton}>Share</a>
          <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noreferrer" className={secondaryButton}>Post ↗</a>
          <a href={story.originalUrl} target="_blank" rel="noreferrer" className="rounded-full bg-[var(--news-ink)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--news-accent-deep)]">Read original ↗</a>
        </div>

        {story.imageUrl ? <img src={story.imageUrl} alt="" className="mt-8 max-h-[580px] w-full rounded-xl border border-[var(--news-line-soft)] object-cover" /> : <div className="mt-8 grid h-64 place-items-center rounded-xl border border-[var(--news-line-soft)] bg-[var(--news-paper-deep)] text-sm font-bold text-[var(--news-muted)]">Image unavailable from publisher</div>}

        <section className="mt-8 border-y border-[var(--news-line)] py-6 md:py-8">
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--news-accent)]">Publisher snippet</p><span className="rounded-full border border-[var(--news-line)] bg-[var(--news-paper)] px-3 py-1 text-[10px] font-bold text-[var(--news-muted)]">No AI summary</span></div>
          <p className="mt-4 max-w-3xl font-serif text-xl leading-8 text-[var(--news-ink)]">{story.summary}</p>
          {story.sourceWebsiteUrl ? <p className="mt-5 max-w-3xl text-sm leading-6 text-[var(--news-muted)]">Coverage attributed to <a href={story.sourceWebsiteUrl} target="_blank" rel="noreferrer" className="font-bold text-[var(--news-ink)] underline decoration-[var(--news-line)] hover:text-[var(--news-accent)]">{story.source}</a>. BridgeNews links readers to the original publisher for the full report.</p> : null}
        </section>

        <section className="mt-8 rounded-xl border border-[var(--news-line)] bg-[var(--news-card)] p-5 sm:p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--news-line-soft)] pb-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--news-accent)]">Related coverage</p><h2 className="mt-1 text-2xl font-bold text-[var(--news-ink)]">Also covered by</h2></div><span className="text-sm font-semibold text-[var(--news-muted)]">{story.sources.length} publisher{story.sources.length === 1 ? "" : "s"}</span></div>
          <div className="divide-y divide-[var(--news-line-soft)]">
            {story.sources.map((source, index) => (
              <div key={`${source.url}-${index}`} className="grid gap-3 py-5 sm:grid-cols-[48px_1fr_auto] sm:items-center">
                <Link href={`/sources/${source.slug}`} className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border border-[var(--news-line)] bg-white">{source.logoUrl ? <img src={source.logoUrl} alt="" className="h-full w-full object-contain p-1" /> : <span className="text-xs font-black">{source.name.slice(0,2).toUpperCase()}</span>}</Link>
                <div className="min-w-0"><Link href={`/sources/${source.slug}`} className="text-[10px] font-black uppercase tracking-wider text-[var(--news-accent)]">{source.name}</Link><p className="mt-1 line-clamp-2 font-serif font-bold leading-6 text-[var(--news-ink)]">{source.headline}</p>{source.publishedAt ? <p className="mt-1 text-xs text-[var(--news-muted)]">{new Date(source.publishedAt).toLocaleString("en-AU")}</p> : null}</div>
                <a href={source.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-[var(--news-line)] px-4 py-2 text-xs font-black text-[var(--news-ink)] hover:border-[#b9aa99] hover:text-[var(--news-accent)]">Read original ↗</a>
              </div>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
