import Link from "next/link";
import { LiveAutoRefresh } from "@/components/live-auto-refresh";
import { createClient } from "@/lib/supabase/server";
import { runOperation } from "./actions";

const OPERATIONS = [
  ["ingest-rss","RSS ingestion","Collect all enabled RSS publishers now","↻"],
  ["ingest-web","Web ingestion","Collect configured public web sources now","⌁"],
  ["ingest-generic-web","Generic web","Collect generic publisher metadata sources","◎"],
  ["backfill-source-logos","Refresh logos","Discover and improve publisher icons","◉"],
  ["backfill-images","Backfill images","Find missing public article thumbnails","▧"],
] as const;

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });
}

function regionsFor(article: any) {
  return (article.article_regions ?? [])
    .map((item: any) => item.regions?.name)
    .filter(Boolean)
    .join(", ") || "Unassigned";
}

export default async function AdminIngestion() {
  const supabase = await createClient();
  const [{ data }, { data: uploadedArticles }] = await Promise.all([
    supabase.from("ingestion_runs").select("id,started_at,finished_at,fetched_count,inserted_count,duplicate_count,failed_count,error_message,sources(name,slug)").order("started_at", { ascending: false }).limit(100),
    supabase
      .from("articles")
      .select("id,title,description,author,status,language_code,image_url,original_url,canonical_url,external_id,auto_publish_requested,processing_error,published_at,discovered_at,fetched_at,created_at,updated_at,sources(name,slug),article_regions(regions(name,slug))")
      .eq("auto_publish_requested", true)
      .order("discovered_at", { ascending: false })
      .limit(75),
  ]);

  const runs=data??[];
  const articles=uploadedArticles??[];
  const running=runs.filter((r:any)=>!r.finished_at).length;
  const failed=runs.filter((r:any)=>r.error_message||Number(r.failed_count)>0).length;
  const inserted=runs.slice(0,20).reduce((sum:number,r:any)=>sum+Number(r.inserted_count??0),0);
  const publishedAuto=articles.filter((a:any)=>a.status==="published").length;
  const articleErrors=articles.filter((a:any)=>a.processing_error).length;
  const withImages=articles.filter((a:any)=>Boolean(a.image_url)).length;

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <LiveAutoRefresh intervalMs={10000}/>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Operations</p><h1 className="mt-1 text-3xl font-black tracking-tight">Ingestion</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Watch automatic uploads live, inspect every imported post, run collection jobs and review ingestion history.</p></div><Link href="/admin/health" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black hover:bg-slate-50">View system health →</Link></div>

    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Running jobs" value={running} tone={running?"blue":"default"}/><Metric label="Issues in recent 100" value={failed} tone={failed?"warn":"good"}/><Metric label="Inserted in last 20 runs" value={inserted.toLocaleString()} tone="good"/><Metric label="Live auto posts" value={articles.length} tone="good"/></div>

    <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500"/><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Live auto-upload monitor</p></div><h2 className="mt-1 text-lg font-black">Latest automatically imported posts</h2><p className="mt-1 text-xs text-slate-500">Refreshes every 10 seconds while this page is open. Times shown in Melbourne time.</p></div>
        <div className="flex flex-wrap gap-2 text-[11px] font-black"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{publishedAuto} published</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{withImages} with images</span><span className={`rounded-full px-2.5 py-1 ${articleErrors?"bg-rose-50 text-rose-700":"bg-slate-100 text-slate-700"}`}>{articleErrors} errors</span></div>
      </div>

      <div className="divide-y divide-slate-100">
        {articles.length ? articles.map((article:any) => <article key={article.id} className="p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[112px_minmax(0,1fr)_220px]">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {article.image_url ? <img src={article.image_url} alt="" className="h-24 w-full object-cover lg:h-full" loading="lazy"/> : <div className="grid h-24 place-items-center text-[10px] font-black uppercase tracking-wide text-slate-400 lg:h-full">No image</div>}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${article.status==="published"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{String(article.status).toUpperCase()}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">AUTO</span>{article.processing_error ? <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-700">ERROR</span> : null}</div>
              <h3 className="mt-2 text-base font-black leading-6 text-slate-950">{article.title}</h3>
              {article.description ? <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{article.description}</p> : null}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span><b className="text-slate-700">Source:</b> {article.sources?.name??"Unknown"}</span><span><b className="text-slate-700">Region:</b> {regionsFor(article)}</span><span><b className="text-slate-700">Language:</b> {article.language_code??"—"}</span>{article.author ? <span><b className="text-slate-700">Author:</b> {article.author}</span> : null}</div>
            </div>
            <div className="text-xs text-slate-500"><dl className="grid grid-cols-[82px_1fr] gap-x-2 gap-y-1.5"><dt className="font-bold text-slate-700">Discovered</dt><dd>{formatDate(article.discovered_at)}</dd><dt className="font-bold text-slate-700">Published</dt><dd>{formatDate(article.published_at)}</dd><dt className="font-bold text-slate-700">Fetched</dt><dd>{formatDate(article.fetched_at)}</dd></dl><div className="mt-3 flex flex-wrap gap-2">{article.original_url ? <a href={article.original_url} target="_blank" rel="noreferrer" className="rounded-lg bg-slate-950 px-3 py-2 font-black text-white">Original ↗</a> : null}<Link href={`/admin/articles/${article.id}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-black text-slate-700">Open article</Link></div></div>
          </div>
          <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs"><summary className="font-black text-slate-700">All import details</summary><dl className="mt-3 grid gap-2 break-all sm:grid-cols-[140px_1fr]"><dt className="font-bold">Article ID</dt><dd>{article.id}</dd><dt className="font-bold">External ID</dt><dd>{article.external_id??"—"}</dd><dt className="font-bold">Auto publish requested</dt><dd>{article.auto_publish_requested?"Yes":"No"}</dd><dt className="font-bold">Status</dt><dd>{article.status}</dd><dt className="font-bold">Created</dt><dd>{formatDate(article.created_at)}</dd><dt className="font-bold">Updated</dt><dd>{formatDate(article.updated_at)}</dd><dt className="font-bold">Original URL</dt><dd>{article.original_url??"—"}</dd><dt className="font-bold">Canonical URL</dt><dd>{article.canonical_url??"—"}</dd><dt className="font-bold">Image URL</dt><dd>{article.image_url??"—"}</dd><dt className="font-bold">Processing error</dt><dd className={article.processing_error?"font-bold text-rose-700":""}>{article.processing_error??"None"}</dd></dl></details>
        </article>) : <p className="p-6 text-sm text-slate-500">No automatic uploads found yet.</p>}
      </div>
    </section>

    <section className="mt-7"><div className="mb-3"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Manual controls</p><h2 className="mt-1 text-lg font-black">Run ingestion jobs</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{OPERATIONS.map(([operation,title,description,icon]) => <form action={runOperation} key={operation} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><input type="hidden" name="operation" value={operation}/><div className="flex items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-lg font-black text-slate-900">{icon}</span><div><h3 className="font-black">{title}</h3><p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{description}</p></div></div><button className="mt-4 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800">Run now</button></form>)}</div></section>

    <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">History</p><h2 className="mt-1 text-lg font-black">Recent ingestion runs</h2></div><span className="text-xs font-bold text-slate-400">Latest {runs.length}</span></div><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-400"><th className="p-3">Source</th><th>Started</th><th>Status</th><th>Duration</th><th>Fetched</th><th>Inserted</th><th>Duplicates</th><th>Failed</th><th>Error</th></tr></thead><tbody>{runs.map((r:any)=>{const ms=r.finished_at?new Date(r.finished_at).getTime()-new Date(r.started_at).getTime():null;const bad=r.error_message||Number(r.failed_count)>0;return <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"><td className="p-3 font-bold">{r.sources?.name??"System"}</td><td>{formatDate(r.started_at)}</td><td><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${!r.finished_at?"bg-slate-100 text-slate-700":bad?"bg-amber-50 text-amber-700":"bg-emerald-50 text-emerald-700"}`}>{!r.finished_at?"RUNNING":bad?"CHECK":"OK"}</span></td><td>{ms==null?"—":`${(ms/1000).toFixed(1)}s`}</td><td>{r.fetched_count}</td><td className="font-bold text-emerald-700">{r.inserted_count}</td><td>{r.duplicate_count}</td><td className={r.failed_count?"font-bold text-rose-600":""}>{r.failed_count}</td><td className="max-w-[320px] truncate text-rose-600" title={r.error_message??""}>{r.error_message??"—"}</td></tr>})}</tbody></table></div></section>
  </main>;
}

function Metric({label,value,tone="default"}:{label:string;value:string|number;tone?:"default"|"good"|"warn"|"blue"}){const c=tone==="good"?"text-emerald-600":tone==="warn"?"text-amber-600":tone==="blue"?"text-slate-700":"text-slate-950";return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-2 text-3xl font-black ${c}`}>{value}</p></div>}
