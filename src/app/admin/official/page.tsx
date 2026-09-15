import { createAdminClient } from "@/lib/supabase/admin";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { deleteOfficialSource, upsertOfficialSource } from "../control-actions";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-black";

export default async function AdminOfficial() {
  const admin = createAdminClient();
  const [{ data: rows }, { data: regions }] = await Promise.all([
    admin.from("official_sources").select("*").order("sort_order"),
    admin.from("regions").select("id,name").order("name"),
  ]);
  const items = rows ?? [];

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Public-service directory</p><h1 className="mt-1 text-3xl font-black tracking-tight">Official sources</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage government, emergency, transport and public-service links shown on the site.</p></div><span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">{items.length} sources</span></div>

    <details className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><summary className="cursor-pointer font-black text-slate-900">+ Add official source</summary><OfficialForm regions={regions ?? []}/></details>

    <div className="mt-5 space-y-3">{items.map((item:any) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2"><h2 className="font-black text-slate-950">{item.name}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.enabled?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{item.enabled?"Enabled":"Hidden"}</span>{item.category?<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">{item.category}</span>:null}</div><p className="mt-1 truncate text-xs text-slate-400">{item.url}</p><details className="mt-4 border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-black text-slate-700">Edit source ▾</summary><OfficialForm item={item} regions={regions ?? []}/></details></article>)}</div>
  </main>;
}

function OfficialForm({ item, regions }: { item?: any; regions: any[] }) {
  return <form action={upsertOfficialSource} className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {item?<input type="hidden" name="id" value={item.id}/>:null}
    <Field label="Name"><input name="name" required defaultValue={item?.name??""} className={inputClass}/></Field>
    <Field label="Slug"><input name="slug" defaultValue={item?.slug??""} className={inputClass}/></Field>
    <Field label="Official URL"><input name="url" type="url" required defaultValue={item?.url??""} className={inputClass}/></Field>
    <Field label="Category"><input name="category" defaultValue={item?.category??""} className={inputClass}/></Field>
    <Field label="Icon"><input name="icon" defaultValue={item?.icon??""} className={inputClass}/></Field>
    <Field label="Region"><select name="region_id" defaultValue={item?.region_id??""} className={inputClass}><option value="">No region</option>{regions.map((r:any)=><option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
    <Field label="Description"><textarea name="description" rows={3} defaultValue={item?.description??""} className={inputClass}/></Field>
    <Field label="Order"><input name="sort_order" type="number" defaultValue={item?.sort_order??100} className={inputClass}/></Field>
    <label className="flex min-h-10 items-center gap-2 self-end rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-700"><input type="checkbox" name="enabled" defaultChecked={item?.enabled??true}/>Enabled</label>
    <div className="flex flex-col-reverse gap-2 md:col-span-2 xl:col-span-3 sm:flex-row sm:justify-end">{item?<ConfirmSubmitButton formAction={deleteOfficialSource} label="Delete" confirmMessage={`Delete ${item.name}?`} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-600 hover:bg-rose-50"/>:null}<button className="rounded-xl bg-black px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800">{item?"Save changes":"Add source"}</button></div>
  </form>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}<span className="mt-1.5 block">{children}</span></label>}
