import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic="force-dynamic";

export default async function NewsletterAdminPage(){
  const admin=createAdminClient();
  const [{data},{count:active},{count:all}]=await Promise.all([
    admin.from("newsletter_subscribers").select("id,email,status,source,preferences,subscribed_at,updated_at").order("subscribed_at",{ascending:false}).limit(250),
    admin.from("newsletter_subscribers").select("id",{count:"exact",head:true}).eq("status","active"),
    admin.from("newsletter_subscribers").select("id",{count:"exact",head:true}),
  ]);
  const rows=data??[];
  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Growth</p><h1 className="mt-1 text-3xl font-black tracking-tight">Newsletter</h1><p className="mt-2 text-sm text-slate-600">People who joined the BridgeNews Daily Brief.</p></div><Link href="/brief" target="_blank" className="rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white">View Daily Brief ↗</Link></div>
  <section className="mt-6 grid gap-3 sm:grid-cols-3"><Metric label="Active" value={active??0}/><Metric label="All subscribers" value={all??0}/><Metric label="Unsubscribed" value={Math.max(0,(all??0)-(active??0))}/></section>
  <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black">Latest subscribers</h2><p className="mt-1 text-xs text-slate-500">Latest 250 records. Email addresses are admin-only.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="bg-slate-50 text-left text-xs uppercase text-slate-400"><th className="p-3">Email</th><th>Status</th><th>Source</th><th>Frequency</th><th>Subscribed</th></tr></thead><tbody>{rows.map((row:any)=><tr key={row.id} className="border-t border-slate-100"><td className="p-3 font-bold">{row.email}</td><td><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${row.status==="active"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-600"}`}>{String(row.status).toUpperCase()}</span></td><td>{row.source}</td><td>{row.preferences?.frequency??"daily"}</td><td>{new Date(row.subscribed_at).toLocaleString("en-AU")}</td></tr>)}</tbody></table>{!rows.length?<p className="p-5 text-sm text-slate-500">No subscribers yet.</p>:null}</div></section>
  <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">Delivery status</h2><p className="mt-2 text-sm leading-6 text-slate-600">Subscriber capture and the Daily Brief landing page are live. Actual email delivery requires connecting an email provider such as Resend, Mailchimp, Brevo or another transactional/newsletter service; no provider is currently connected, so BridgeNews does not pretend emails were sent.</p></section>
  </main>;
}
function Metric({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-3xl font-black">{value.toLocaleString()}</p></div>}
