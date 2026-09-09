import { createClient } from "@/lib/supabase/server";
import { AdminFeedback } from "@/components/admin/admin-feedback";
import { saveSeoSettings } from "../phase2-actions";

export default async function SeoPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key,value").eq("group_name","seo");
  const settings = Object.fromEntries((data??[]).map((row:any)=>[row.key,row.value]));
  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><AdminFeedback saved={params.saved==="1"} error={params.error??null}/>
    <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Search visibility</p><h1 className="mt-1 text-3xl font-black tracking-tight">SEO</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage default search titles, descriptions, indexing and social preview settings.</p></div>
    <form action={saveSeoSettings} className="mt-6 max-w-3xl space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <Field label="Default SEO title"><input name="seo_default_title" defaultValue={String(settings.seo_default_title??"BridgeNews")} className={inputClass}/></Field>
      <Field label="Default SEO description"><textarea name="seo_default_description" rows={4} defaultValue={String(settings.seo_default_description??"")} className={inputClass}/></Field>
      <Field label="Default social image URL"><input name="seo_social_image" type="url" defaultValue={String(settings.seo_social_image??"")} className={inputClass} placeholder="https://…"/></Field>
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold"><input type="checkbox" name="seo_robots_index" defaultChecked={settings.seo_robots_index!==false}/>Allow search engines to index public pages</label>
      <button className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-black text-white hover:bg-indigo-500">Save SEO settings</button>
    </form>
  </main>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-xs font-black uppercase tracking-wide text-slate-400">{label}{children}</label>}
const inputClass="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
