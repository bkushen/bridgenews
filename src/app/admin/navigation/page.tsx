import { createClient } from "@/lib/supabase/server";
import { AdminFeedback } from "@/components/admin/admin-feedback";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { deleteMenuItem, saveMenuItem } from "../phase2-actions";

export default async function NavigationPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("site_menu_items").select("id,area,label,href,enabled,sort_order").order("area").order("sort_order");
  const items = data ?? [];
  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><AdminFeedback saved={params.saved==="1"} deleted={params.deleted==="1"} error={params.error??null}/>
    <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Site structure</p><h1 className="mt-1 text-3xl font-black tracking-tight">Navigation & footer</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Control the public header and footer links without editing code.</p></div>
    <details className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4"><summary className="cursor-pointer font-black text-indigo-900">+ Add menu link</summary><ItemForm/></details>
    <div className="mt-5 grid gap-5 xl:grid-cols-2">{["header","footer"].map(area=><section key={area} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black capitalize">{area}</h2><div className="mt-4 space-y-3">{items.filter((i:any)=>i.area===area).map((item:any)=><ItemForm key={item.id} item={item}/>)}</div></section>)}</div>
  </main>;
}

function ItemForm({item}:{item?:any}){return <form action={saveMenuItem} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">{item?<input type="hidden" name="id" value={item.id}/>:null}<label className="text-xs font-black uppercase tracking-wide text-slate-400">Area<select name="area" defaultValue={item?.area??"header"} className={inputClass}><option value="header">Header</option><option value="footer">Footer</option></select></label><label className="text-xs font-black uppercase tracking-wide text-slate-400">Label<input name="label" required defaultValue={item?.label??""} className={inputClass}/></label><label className="text-xs font-black uppercase tracking-wide text-slate-400">Link<input name="href" required defaultValue={item?.href??""} className={inputClass} placeholder="/about"/></label><label className="text-xs font-black uppercase tracking-wide text-slate-400">Order<input name="sort_order" type="number" defaultValue={item?.sort_order??100} className={inputClass}/></label><label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold"><input type="checkbox" name="enabled" defaultChecked={item?.enabled??true}/>Enabled</label><div className="flex gap-2"><button className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-500">Save</button>{item?<ConfirmSubmitButton formAction={deleteMenuItem} label="Delete" confirmMessage={`Delete ${item.label}?`} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-600 hover:bg-rose-50"/>:null}</div></form>}
const inputClass="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
