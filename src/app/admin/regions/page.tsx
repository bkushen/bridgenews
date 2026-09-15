import { createAdminClient } from "@/lib/supabase/admin";
import { updateRegion } from "../control-actions";

export default async function AdminRegions() {
  const admin = createAdminClient();
  const { data } = await admin.from("regions").select("id,code,name,slug,is_active").order("name");
  const regions = data ?? [];
  const active = regions.filter((region: any) => region.is_active).length;

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Publishing editions</p><h1 className="mt-1 text-3xl font-black tracking-tight">Regions</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Control which country and regional editions are available on BridgeNews.</p></div><div className="flex gap-2 text-xs font-black"><span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">{regions.length} regions</span><span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">{active} active</span></div></div>

    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-black text-slate-950">Edition settings</h2><p className="mt-0.5 text-xs text-slate-500">Changes affect region navigation and source assignments.</p></div><div className="divide-y divide-slate-100">{regions.map((r:any) => <form action={updateRegion} key={r.id} className="grid gap-3 p-4 sm:p-5 lg:grid-cols-[100px_minmax(0,1fr)_minmax(0,1fr)_140px_auto] lg:items-end"><input type="hidden" name="id" value={r.id}/><div><p className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-slate-400">Code</p><div className="grid min-h-10 place-items-center rounded-xl bg-slate-100 px-3 py-2.5 text-sm font-black text-slate-700">{r.code}</div></div><label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Name<input name="name" defaultValue={r.name} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold normal-case text-slate-900 outline-none focus:border-black"/></label><label className="text-[10px] font-black uppercase tracking-wide text-slate-400">Slug<input name="slug" defaultValue={r.slug} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm normal-case text-slate-900 outline-none focus:border-black"/></label><label className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"><input type="checkbox" name="is_active" defaultChecked={r.is_active}/>Active</label><button className="rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">Save</button></form>)}</div></section>
  </main>;
}
