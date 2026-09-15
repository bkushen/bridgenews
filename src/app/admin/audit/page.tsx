import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminAudit() {
  const admin = createAdminClient();
  const { data } = await admin.from("admin_audit_log").select("id,user_id,action,entity_type,entity_id,details,created_at").order("created_at", { ascending: false }).limit(300);
  const rows = data ?? [];

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Operations</p><h1 className="mt-1 text-3xl font-black tracking-tight">Audit log</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Recent control-panel changes for accountability and troubleshooting.</p></div><span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">{rows.length} recent events</span></div>

    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-black text-slate-950">Activity history</h2><p className="mt-0.5 text-xs text-slate-500">Newest changes first</p></div><span className="text-xs font-bold text-slate-400">Up to 300 events</span></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] font-black uppercase tracking-[0.08em] text-slate-400"><th className="p-3">Time</th><th>Action</th><th>Entity</th><th>ID</th><th>User</th><th className="pr-3">Details</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"><td className="p-3 whitespace-nowrap text-xs text-slate-600">{new Date(r.created_at).toLocaleString("en-AU")}</td><td><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-700">{r.action}</span></td><td className="font-bold text-slate-800">{r.entity_type}</td><td className="max-w-[180px] truncate font-mono text-[10px] text-slate-500" title={r.entity_id??""}>{r.entity_id??"—"}</td><td className="max-w-[180px] truncate font-mono text-[10px] text-slate-500" title={r.user_id??""}>{r.user_id??"—"}</td><td className="max-w-[360px] pr-3"><details><summary className="cursor-pointer text-xs font-black text-slate-600 hover:text-black">View details</summary><pre className="mt-2 max-w-[520px] whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 text-[10px] leading-5 text-slate-600">{JSON.stringify(r.details,null,2)}</pre></details></td></tr>)}</tbody></table></div>
      {!rows.length ? <p className="p-8 text-center text-sm text-slate-400">No admin events recorded yet.</p> : null}
    </section>
  </main>;
}
