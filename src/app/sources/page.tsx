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
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-col gap-5 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Publishers</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Source Directory</h1><p className="mt-3 max-w-3xl leading-7 text-gray-600">Browse active publishers, their language, current BridgeNews article count and latest source health.</p></div>
        <div className="flex gap-2">{[["all","All"],["en","English"],["si","සිංහල"],["ta","தமிழ்"]].map(([value,label]) => <Link key={value} href={`/sources?language=${value}`} className={`rounded-full px-4 py-2 text-xs font-black ${language === value ? "bg-gray-950 text-white" : "border border-gray-200 bg-white"}`}>{label}</Link>)}</div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sources.map((source) => {
          const icon = sourceIcon(source);
          return <Link key={source.id} href={`/sources/${source.slug}`} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl border bg-white">{icon ? <img src={icon} alt="" className="h-full w-full object-contain p-1" /> : <span className="font-black">{source.name.slice(0,2).toUpperCase()}</span>}</div><div className="min-w-0"><h2 className="truncate font-black group-hover:underline">{source.name}</h2><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{source.languageCode}</p></div></div><div className="mt-5 flex items-center justify-between text-xs"><span className="font-black">{source.articleCount} stories</span><span className="text-gray-400">{source.lastSuccessAt ? "Active" : "Connected"}</span></div></Link>;
        })}
      </div>
    </main>
  );
}
