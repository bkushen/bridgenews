import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSourceHealthInfo } from "@/lib/source-health";

export default async function HealthPage() {
  const supabase = await createClient();
  const [{ data: sources }, { data: runs }] = await Promise.all([
    supabase.from("sources").select("id,name,slug,enabled,logo_url,last_success_at,last_error_at,last_error_message,consecutive_failures").order("name"),
    supabase.from("ingestion_runs").select("id,started_at,failed_count,error_message,sources(name)").order("started_at",{ascending:false}).limit(20),
  ]);
  const all=sources??[];
  const now=Date.now();
  const broken=all.filter((s:any)=>Boolean(s.last_error_message)||Number(s.consecutive_failures??0)>0);
  const stale=all.filter((s:any)=>s.enabled && (!s.last_success_at || now-new Date(s.last_success_at).getTime()>24*60*60*1000));
  const missingLogo=all.filter((s:any)=>s.enabled && !s.logo_url);
  const active=all.filter((s:any)=>s.enabled).length;
  const recentFailed=(runs??[]).filter((r:any)=>r.error_message||Number(r.failed_count)>0);

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Operations</p><h1 className="mt-1 text-3xl font-black tracking-tight">System health</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">A single view of publisher health, freshness, logos and ingestion problems.</p></div><div className="flex gap-2"><Link href="/admin/sources" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black hover:bg-slate-50">Manage sources</Link><Link href="/admin/ingestion" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-500">Ingestion controls</Link></div></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Active sources" value={`${active}/${all.length}`} good/><Metric label="Need attention" value={broken.length} warn={broken.length>0}/><Metric label="Stale >24h" value={stale.length} warn={stale.length>0}/><Metric label="Missing logos" value={missingLogo.length} warn={missingLogo.length>0}/></div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2"><Panel title="Sources needing attention">{broken.length?broken.slice(0,20).map((s:any)=>{const e=getSourceHealthInfo(s.last_error_message,Number(s.consecutive_failures??0));return <div key={s.id} className="border-b border-slate-100 py-3 last:border-0"><div className="flex items-center justify-between gap-3"><p className="font-black">{s.name}</p><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${s.enabled?"bg-amber-50 text-amber-700":"bg-slate-100 text-slate-500"}`}>{s.enabled?"Enabled":"Disabled"}</span></div><p className="mt-1 text-xs font-bold text-slate-600">{e?.title??"Ingestion issue"}</p><p className="mt-1 text-xs leading-5 text-slate-500">{e?.recommendation??"Review source configuration."}</p></div>}):<Empty text="No source errors recorded."/>}</Panel>
    <Panel title="Recent ingestion failures">{recentFailed.length?recentFailed.slice(0,15).map((r:any)=><div key={r.id} className="border-b border-slate-100 py-3 last:border-0"><p className="font-black">{r.sources?.name??"System task"}</p><p className="mt-1 text-xs text-slate-500">{new Date(r.started_at).toLocaleString("en-AU")} · {r.failed_count} failed</p><p className="mt-1 text-xs font-semibold text-rose-600">{r.error_message||"Items failed during ingestion"}</p></div>):<Empty text="No recent ingestion failures."/>}</Panel></div>
  </main>;
}
function Metric({label,value,good=false,warn=false}:{label:string;value:string|number;good?:boolean;warn?:boolean}){return <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-2 text-3xl font-black ${warn?"text-amber-600":good?"text-emerald-600":"text-slate-950"}`}>{value}</p></div>}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">{title}</h2><div className="mt-3">{children}</div></section>}
function Empty({text}:{text:string}){return <p className="py-8 text-center text-sm text-slate-400">{text}</p>}
