import { createClient } from "@/lib/supabase/server";
import { AdminFeedback } from "@/components/admin/admin-feedback";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { deleteContentPage, saveContentPage } from "../phase2-actions";

export default async function AdminPages({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("content_pages").select("id,slug,title,body,excerpt,published,seo_title,seo_description,updated_at").order("slug");
  const pages = data ?? [];

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <AdminFeedback saved={params.saved === "1"} deleted={params.deleted === "1"} error={params.error ?? null} />
    <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Website content</p><h1 className="mt-1 text-3xl font-black tracking-tight">Pages</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Edit About, Contact, Privacy, Terms and other simple public pages without changing code.</p></div>

    <details className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4"><summary className="cursor-pointer font-black text-indigo-900">+ Create a new page</summary><PageForm /></details>

    <div className="mt-5 space-y-4">{pages.map((page:any)=><article key={page.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black">{page.title}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${page.published?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{page.published?"Published":"Hidden"}</span><span className="text-xs font-bold text-slate-400">/{page.slug}</span></div>
      <details className="mt-4"><summary className="cursor-pointer text-sm font-black text-slate-700">Edit page ▾</summary><div className="mt-4 border-t border-slate-100 pt-4"><PageForm page={page}/></div></details>
    </article>)}</div>
  </main>;
}

function PageForm({ page }: { page?: any }) {
  return <form action={saveContentPage} className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
    {page?<input type="hidden" name="id" value={page.id}/>:null}
    <div className="space-y-3"><Field label="Title"><input name="title" required defaultValue={page?.title ?? ""} className={inputClass}/></Field><Field label="Slug"><input name="slug" required defaultValue={page?.slug ?? ""} className={inputClass} placeholder="about"/></Field><Field label="Body"><textarea name="body" rows={10} defaultValue={page?.body ?? ""} className={inputClass}/></Field><Field label="Excerpt"><textarea name="excerpt" rows={2} defaultValue={page?.excerpt ?? ""} className={inputClass}/></Field></div>
    <aside className="space-y-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200"><Field label="SEO title"><input name="seo_title" defaultValue={page?.seo_title ?? ""} className={inputClass}/></Field><Field label="SEO description"><textarea name="seo_description" rows={4} defaultValue={page?.seo_description ?? ""} className={inputClass}/></Field><label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold"><input type="checkbox" name="published" defaultChecked={page?.published ?? true}/>Published</label><button className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-500">Save page</button>{page?<ConfirmSubmitButton formAction={deleteContentPage} label="Delete page" confirmMessage={`Delete ${page.title}?`} className="w-full rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-black text-rose-600 hover:bg-rose-50"/>:null}</aside>
  </form>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block text-xs font-black uppercase tracking-wide text-slate-400">{label}{children}</label>}
const inputClass="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
