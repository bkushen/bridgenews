import { createAdminClient } from "@/lib/supabase/admin";
import { deleteArticle, updateArticle } from "../control-actions";
import { setArticleTaxonomy } from "./relationships";

export default async function AdminArticles({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q = "", status = "" } = await searchParams;
  const admin = createAdminClient();
  let query = admin.from("articles").select("id,title,description,image_url,language_code,status,published_at,sources(name)").order("published_at", { ascending: false }).limit(100);
  if (status) query = query.eq("status", status);
  if (q) query = query.ilike("title", `%${q}%`);
  const [{ data: articles }, { data: categories }, { data: topics }] = await Promise.all([
    query,
    admin.from("categories").select("id,name").order("sort_order").order("name"),
    admin.from("topics").select("id,name").order("trending_score", { ascending: false }).order("name"),
  ]);
  const articleIds = (articles ?? []).map((a: any) => a.id);
  const [{ data: articleCategories }, { data: articleTopics }] = articleIds.length ? await Promise.all([
    admin.from("article_categories").select("article_id,category_id").in("article_id", articleIds),
    admin.from("article_topics").select("article_id,topic_id").in("article_id", articleIds),
  ]) : [{ data: [] as any[] }, { data: [] as any[] }];
  const categoryMap = new Map<string, Set<string>>();
  const topicMap = new Map<string, Set<string>>();
  for (const row of articleCategories ?? []) { const set = categoryMap.get(row.article_id) ?? new Set<string>(); set.add(row.category_id); categoryMap.set(row.article_id, set); }
  for (const row of articleTopics ?? []) { const set = topicMap.get(row.article_id) ?? new Set<string>(); set.add(row.topic_id); topicMap.set(row.article_id, set); }

  return <main className="mx-auto max-w-7xl px-5 py-8"><div><p className="text-xs font-black uppercase tracking-[.18em] text-gray-400">Content</p><h1 className="text-3xl font-black">Articles</h1><p className="mt-2 text-gray-600">Edit publication details and assign categories/topics without touching SQL.</p></div>
    <form className="mt-5 flex flex-wrap gap-2"><input name="q" defaultValue={q} placeholder="Search title" className="rounded-lg border px-3 py-2 text-sm"/><select name="status" defaultValue={status} className="rounded-lg border px-3 py-2 text-sm"><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="review">Review</option><option value="rejected">Rejected</option></select><button className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white">Filter</button></form>
    <div className="mt-5 space-y-3">{(articles ?? []).map((a:any) => <div key={a.id} className="rounded-xl border bg-white p-4">
      <form action={updateArticle}><input type="hidden" name="id" value={a.id}/><div className="grid gap-3 lg:grid-cols-[1fr_140px]"><div className="space-y-2"><input name="title" defaultValue={a.title} className="w-full rounded-lg border px-3 py-2 font-bold"/><textarea name="description" defaultValue={a.description ?? ""} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm"/><input name="image_url" defaultValue={a.image_url ?? ""} placeholder="Image URL" className="w-full rounded-lg border px-3 py-2 text-sm"/><div className="text-xs text-gray-500">{a.sources?.name ?? "Unknown source"} · {a.published_at ? new Date(a.published_at).toLocaleString("en-AU") : "No publish date"}</div></div><div className="space-y-2"><select name="status" defaultValue={a.status} className="w-full rounded-lg border px-3 py-2"><option>published</option><option>draft</option><option>review</option><option>rejected</option></select><select name="language_code" defaultValue={a.language_code} className="w-full rounded-lg border px-3 py-2"><option value="en">English</option><option value="si">Sinhala</option><option value="ta">Tamil</option></select><button className="w-full rounded-lg bg-gray-950 px-3 py-2 text-sm font-bold text-white">Save details</button><button formAction={deleteArticle} className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600">Delete</button></div></div></form>
      <form action={setArticleTaxonomy} className="mt-4 grid gap-3 border-t pt-4 md:grid-cols-2"><input type="hidden" name="article_id" value={a.id}/><label className="text-xs font-black uppercase tracking-wide text-gray-400">Categories<select name="category_ids" multiple defaultValue={[...(categoryMap.get(a.id) ?? [])]} className="mt-2 h-28 w-full rounded-lg border px-3 py-2 text-sm normal-case tracking-normal text-gray-900">{(categories ?? []).map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="text-xs font-black uppercase tracking-wide text-gray-400">Topics<select name="topic_ids" multiple defaultValue={[...(topicMap.get(a.id) ?? [])]} className="mt-2 h-28 w-full rounded-lg border px-3 py-2 text-sm normal-case tracking-normal text-gray-900">{(topics ?? []).map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label><div className="md:col-span-2 flex items-center justify-between gap-3"><p className="text-xs text-gray-500">Use Ctrl/Cmd-click to select multiple values.</p><button className="rounded-lg border px-4 py-2 text-sm font-bold hover:bg-gray-50">Save categories & topics</button></div></form>
    </div>)}</div>
  </main>;
}
