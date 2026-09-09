import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SourceBulkManager } from "@/components/admin/source-bulk-manager";
import { getSourceHealthInfo } from "@/lib/source-health";

export default async function SourceToolsPage({searchParams}:{searchParams:Promise<{filter?:string}>}){
  const {filter="all"}=await searchParams;
  const supabase=await createClient();
  const {data}=await supabase.from("sources").select("id,name,enabled,logo_url,last_success_at,last_error_message,consecutive_failures").order("name");
  const all=data??[]; const now=Date.now();
  const filtered=all.filter((s:any)=>{
    const err=String(s.last_error_message??"").toLowerCase(); const bad=Boolean(s.last_error_message)||Number(s.consecutive_failures??0)>0;
    if(filter==="healthy") return s.enabled&&!bad;
    if(filter==="disabled") return !s.enabled;
    if(filter==="attention") return bad;
    if(filter==="403") return err.includes("403");
    if(filter==="404") return err.includes("404");
    if(filter==="timeout") return err.includes("timeout")||err.includes("timed out");
    if(filter==="stale") return s.enabled&&(!s.last_success_at||now-new Date(s.last_success_at).getTime()>86400000);
    if(filter==="missing-logo") return s.enabled&&!s.logo_url;
    return true;
  });
  const filters=[["all","All"],["healthy","Healthy"],["attention","Needs attention"],["disabled","Disabled"],["403","403 blocked"],["404","404 missing"],["timeout","Timeout"],["stale","Stale >24h"],["missing-logo","Missing logo"]] as const;
  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Publishing network</p><h1 className="mt-1 text-3xl font-black tracking-tight">Source tools</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Filter publishers by health state and enable or disable multiple sources safely.</p></div><Link href="/admin/sources" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black hover:bg-slate-50">Full source editor →</Link></div>
  <nav className="mt-6 flex flex-wrap gap-2">{filters.map(([key,label])=><Link key={key} href={`/admin/source-tools?filter=${key}`} className={`rounded-full px-3 py-2 text-xs font-black ${filter===key?"bg-indigo-600 text-white":"border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{label}</Link>)}</nav>
  <p className="mt-3 text-xs font-bold text-slate-400">Showing {filtered.length} of {all.length} sources</p><SourceBulkManager sources={filtered.map((s:any)=>({id:s.id,name:s.name,enabled:s.enabled}))}/>
  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((s:any)=>{const h=getSourceHealthInfo(s.last_error_message,Number(s.consecutive_failures??0));return <article key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="truncate font-black">{s.name}</h2><span className={`rounded-full px-2 py-1 text-[10px] font-black ${s.enabled?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{s.enabled?"Enabled":"Disabled"}</span></div><p className={`mt-2 text-xs font-bold ${h?"text-amber-700":"text-emerald-700"}`}>{h?.title??"Healthy"}</p>{h?<p className="mt-1 text-xs leading-5 text-slate-500">{h.recommendation}</p>:null}</article>})}</div></main>;
}
