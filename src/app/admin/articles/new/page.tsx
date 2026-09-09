import Link from "next/link";
import { AdminFeedback } from "@/components/admin/admin-feedback";
import { createManualArticle } from "../../phase2-actions";

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <AdminFeedback error={params.error ?? null} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Editorial publishing</p><h1 className="mt-1 text-3xl font-black tracking-tight">Create article</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Publish an original BridgeNews editorial item without AI processing.</p></div>
        <Link href="/admin/articles" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black hover:bg-slate-50">← Back to articles</Link>
      </div>

      <form action={createManualArticle} className="mt-6 grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1fr_320px] lg:p-6">
        <section className="space-y-4">
          <label className="block text-xs font-black uppercase tracking-wide text-slate-400">Headline<input name="title" required className={inputClass} placeholder="Article headline" /></label>
          <label className="block text-xs font-black uppercase tracking-wide text-slate-400">Short description<textarea name="description" rows={6} maxLength={700} className={inputClass} placeholder="Short original summary or editorial description" /></label>
          <label className="block text-xs font-black uppercase tracking-wide text-slate-400">Image URL<input name="image_url" type="url" className={inputClass} placeholder="https://…" /></label>
        </section>
        <aside className="space-y-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <label className="block text-xs font-black uppercase tracking-wide text-slate-400">Author<input name="author" defaultValue="BridgeNews Editorial" className={inputClass} /></label>
          <label className="block text-xs font-black uppercase tracking-wide text-slate-400">Language<select name="language_code" defaultValue="en" className={inputClass}><option value="en">English</option><option value="si">Sinhala</option><option value="ta">Tamil</option></select></label>
          <label className="block text-xs font-black uppercase tracking-wide text-slate-400">Status<select name="status" defaultValue="review_required" className={inputClass}><option value="review_required">Needs review</option><option value="published">Publish now</option><option value="discovered">Draft / discovered</option></select></label>
          <div className="rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-800"><strong>AI remains off.</strong> Manual articles are saved without AI summaries, classification or embeddings.</div>
          <button className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-indigo-500">Create article</button>
        </aside>
      </form>
    </main>
  );
}

const inputClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
