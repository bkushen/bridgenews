import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function since(days:number){ return new Date(Date.now()-days*24*60*60*1000).toISOString(); }
function group(rows:any[], key:(row:any)=>string|null|undefined){ const map=new Map<string,number>(); for(const row of rows){const k=key(row)||"Direct / unknown";map.set(k,(map.get(k)||0)+1);} return [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12); }
async function countSince(admin:any, days:number, eventType?:string){ let q=admin.from("traffic_events").select("id",{count:"exact",head:true}).gte("occurred_at",since(days)); if(eventType)q=q.eq("event_type",eventType); const {count}=await q; return count??0; }

export default async function TrafficPage(){
  const admin=createAdminClient();
  const [views24,views7,views30,outbound7,signups30,{data:events},{data:subscribers}]=await Promise.all([
    countSince(admin,1,"page_view"),countSince(admin,7,"page_view"),countSince(admin,30,"page_view"),countSince(admin,7,"outbound_click"),countSince(admin,30,"newsletter_signup"),
    admin.from("traffic_events").select("event_type,path,referrer_host,utm_source,utm_medium,utm_campaign,session_id,occurred_at").gte("occurred_at",since(30)).order("occurred_at",{ascending:false}).limit(5000),
    admin.from("newsletter_subscribers").select("id,status,subscribed_at").order("subscribed_at",{ascending:false}).limit(5000),
  ]);
  const rows=events??[];
  const pageViews=rows.filter((r:any)=>r.event_type==="page_view");
  const uniqueSessions=new Set(pageViews.map((r:any)=>r.session_id).filter(Boolean)).size;
  const topPages=group(pageViews,(r:any)=>r.path);
  const referrers=group(pageViews,(r:any)=>r.referrer_host);
  const campaigns=group(pageViews,(r:any)=>r.utm_source);
  const activeSubscribers=(subscribers??[]).filter((r:any)=>r.status==="active").length;

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Growth</p><h1 className="mt-1 text-3xl font-black tracking-tight">Traffic</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">First-party, privacy-conscious audience analytics. No IP addresses are stored.</p></div><div className="flex gap-2"><Link href="/brief" target="_blank" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black">Open Daily Brief ↗</Link><Link href="/admin/social" className="rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white">Social queue</Link></div></div>
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Views · 24h" value={views24}/><Metric label="Views · 7 days" value={views7}/><Metric label="Views · 30 days" value={views30}/><Metric label="30d sessions sampled" value={uniqueSessions}/></section>
    <section className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Outbound clicks · 7d" value={outbound7}/><Metric label="Newsletter signups · 30d" value={signups30}/><Metric label="Active subscribers" value={activeSubscribers}/></section>
    <section className="mt-7 grid gap-5 xl:grid-cols-3"><Rank title="Top pages" rows={topPages}/><Rank title="Referrers" rows={referrers}/><Rank title="UTM sources" rows={campaigns}/></section>
    <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">Tracking setup</h2><div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2"><p><b className="text-slate-900">First-party:</b> page views, outbound publisher clicks, UTM source/medium/campaign and anonymous browser-session IDs.</p><p><b className="text-slate-900">Optional GA4:</b> set <code>NEXT_PUBLIC_GA_MEASUREMENT_ID</code>. Search verification uses <code>NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION</code> and <code>NEXT_PUBLIC_BING_SITE_VERIFICATION</code>.</p></div></section>
  </main>;
}
function Metric({label,value}:{label:string;value:number|string}){return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{typeof value==="number"?value.toLocaleString():value}</p></div>}
function Rank({title,rows}:{title:string;rows:Array<[string,number]>}){return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black">{title}</h2></div><div className="divide-y divide-slate-100">{rows.length?rows.map(([label,count],i)=><div key={label} className="flex items-center gap-3 px-5 py-3"><span className="w-5 text-xs font-black text-slate-400">{i+1}</span><span className="min-w-0 flex-1 truncate text-sm font-bold">{label}</span><span className="text-xs font-black text-slate-500">{count.toLocaleString()}</span></div>):<p className="p-5 text-sm text-slate-500">No data yet.</p>}</div></div>}
