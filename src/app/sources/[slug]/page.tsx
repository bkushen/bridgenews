import { notFound } from "next/navigation";
import { PortalStoryRow } from "@/components/portal-story-row";
import { getPortalStories, getSourceDirectory } from "@/lib/data/portal";
import { followSource } from "@/app/following/actions";

export default async function SourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const source = (await getSourceDirectory(150)).find((item) => item.slug === slug);
  if (!source) notFound();
  const stories = await getPortalStories({ sourceSlug: slug, limit: 80 });
  const icon = source.logoUrl || (source.websiteUrl ? `${new URL(source.websiteUrl).origin}/favicon.ico` : null);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-5 border-b border-gray-200 pb-7 sm:flex-row sm:items-center">
        <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border bg-white shadow-sm">{icon ? <img src={icon} alt="" className="h-full w-full object-contain p-2" /> : <span className="text-xl font-black">{source.name.slice(0,2)}</span>}</div>
        <div className="min-w-0 flex-1"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Publisher</p><h1 className="mt-1 text-4xl font-black tracking-tight">{source.name}</h1><p className="mt-2 text-sm text-gray-500">{source.languageCode.toUpperCase()} · {source.articleCount} published stories on BridgeNews</p></div>
        <div className="flex flex-wrap gap-2">
          <form action={followSource}><input type="hidden" name="sourceId" value={source.id} /><input type="hidden" name="returnTo" value={`/sources/${source.slug}`} /><button className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-black hover:bg-gray-50">＋ Follow</button></form>
          {source.websiteUrl ? <a href={source.websiteUrl} target="_blank" rel="noreferrer" className="rounded-full bg-gray-950 px-5 py-3 text-sm font-black text-white">Visit publisher ↗</a> : null}
        </div>
      </div>
      <section className="mt-7 rounded-2xl border border-gray-200 bg-white px-5 shadow-sm">{stories.map((story) => <PortalStoryRow key={story.articleId} story={story} />)}</section>
    </main>
  );
}
