import Link from "next/link";
import { getSourceDirectory } from "@/lib/data/portal";

function sourceIcon(source: { logoUrl: string | null; websiteUrl: string | null }) {
  if (source.logoUrl) return source.logoUrl;
  if (!source.websiteUrl) return null;
  try { return `${new URL(source.websiteUrl).origin}/favicon.ico`; } catch { return null; }
}

export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ language?: string }> }) {
  const params = await searchParams;
  const language = params.language || "all";
  const sources = (await getSourceDirectory(120)).filter((source) => language === "all" || source.languageCode === language);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="flex flex-col gap-5 border-b border-[var(--news-line)] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--news-accent)]">Publishers</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--news-ink)] md:text-5xl">Source Directory</h1><p className="mt-3 max-w-3xl leading-7 text-[var(--news-muted)]">Browse active publishers, languages, current BridgeNews article counts and source activity.</p></div>
        <div className="flex flex-wrap gap-2">{[["all","All"],["en","English"],["si","සිංහල"],["ta","தமிழ்"]].map(([value,label]) => <Link key={value} href={`/sources?language=${value}`} className={`rounded-full px-4 py-2 text-xs font-black transition ${language === value ? "bg-[var(--news-accent)] text-white" : "border border-[var(--news-line)] bg-[var(--news-card)] text-[var(--news-ink)] hover:border-[#bcae9e]"}`}>{label}</Link>)}</div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sources.map((source) => { const icon = sourceIcon(source); return <Link key={source.id} href={`/sources/${source.slug}`} className="group rounded-xl border border-[var(--news-line)] bg-[var(--news-card)] p-5 transition hover:border-[#bcae9e]"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg border border-[var(--news-line)] bg-white">{icon ? <img src={icon} alt="" className="h-full w-full object-contain p-1" /> : <span className="font-black text-[var(--news-ink)]">{source.name.slice(0,2).toUpperCase()}</span>}</div><div className="min-w-0"><h2 className="truncate font-serif font-bold text-[var(--news-ink)] group-hover:text-[var(--news-accent)]">{source.name}</h2><p className="text-[10px] font-black uppercase tracking-wider text-[var(--news-muted)]">{source.languageCode}</p></div></div><div className="mt-5 flex items-center justify-between border-t border-[var(--news-line-soft)] pt-3 text-xs"><span className="font-black text-[var(--news-ink)]">{source.articleCount} stories</span><span className="text-[var(--news-muted)]">{source.lastSuccessAt ? "Active" : "Connected"}</span></div></Link>; })}
      </div>
      {!sources.length ? <div className="mt-8 rounded-xl border border-dashed border-[var(--news-line)] bg-[var(--news-card)] p-8 text-center text-[var(--news-muted)]">No active publishers match this language filter.</div> : null}
    </main>
  );
}
