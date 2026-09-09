import { createAdminClient } from "@/lib/supabase/admin";
import { deleteArticle, updateArticle } from "../control-actions";

export default async function AdminArticles({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const admin = createAdminClient();
  let query = admin.from("articles").select("id,title,description,image_url,language_code,status,published_at,sources(name)").order("published_at", { ascending: false }).limit(100);
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("title", `%${q}%`);
  const { data } = await query;
  return <main className="mx-auto max-w-7xl px-5 py-8"><div><p className="text-xs font-black uppercase tracking-[.18em] text-gray-400">Content</p><h1 className="text-3xl font-black">Articles</h1></div>
    <form className="mt-5 flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="Search title" className="rounded-lg border px-3 py-2 text-sm"/><select name="status" defaultValue={status} className="rounded-lg border px-3 py-2 text-sm"><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="review">Review</option><option value="rejected">Rejected</option></select><button className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white">Filter</button></form>
    <div className="mt-5 space-y-3">{(data ?? []).map((a:any) => <form action={updateArticle} key={a.id} className="rounded-xl border bg-white p-4"><input type="hidden" name="id" value={a.id}/><div className="grid gap-3 lg:grid-cols-[1fr_140px]"><div className="space-y-2"><input name="title" defaultValue={a.title} className="w-full rounded-lg border px-3 py-2 font-bold"/><textarea name="description" defaultValue={a.description ?? ""} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm"/><input name="image_url" defaultValue={a.image_url ?? ""} placeholder="Image URL" className="w-full rounded-lg border px-3 py-2 text-sm"/><div className="text-xs text-gray-500">{a.sources?.name ?? "Unknown source"} · {a.published_at ? new Date(a.published_at).toLocaleString("en-AU") : "No publish date"}</div></div><div className="space-y-2"><select name="status" defaultValue={a.status} className="w-full rounded-lg border px-3 py-2"><option>published</option><option>draft</option><option>review</option><option>rejected</option></select><select name="language_code" defaultValue={a.language_code} className="w-full rounded-lg border px-3 py-2"><option value="en">English</option><option value="si">Sinhala</option><option value="ta">Tamil</option></select><button className="w-full rounded-lg bg-gray-950 px-3 py-2 text-sm font-bold text-white">Save</button><button formAction={deleteArticle} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600">Delete</button></div></div></form>)}</div>
  </main>;
}
