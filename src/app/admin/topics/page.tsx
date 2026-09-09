import { createAdminClient } from "@/lib/supabase/admin";
import { deleteTopic, upsertTopic } from "../control-actions";

export default async function AdminTopics() {
  const admin = createAdminClient();
  const { data } = await admin.from("topics").select("id,name,slug,description,trending_score").order("trending_score", { ascending: false });
  return <main className="mx-auto max-w-6xl px-5 py-8"><h1 className="text-3xl font-black">Topics</h1><p className="mt-2 text-gray-600">Manage curated topic records and their trending priority.</p>
    <form action={upsertTopic} className="mt-6 grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-[1fr_1fr_120px_auto]"><input name="name" required placeholder="New topic" className="rounded-lg border px-3 py-2"/><input name="slug" placeholder="slug" className="rounded-lg border px-3 py-2"/><input name="trending_score" type="number" step="0.1" defaultValue="0" className="rounded-lg border px-3 py-2"/><button className="rounded-lg bg-gray-950 px-4 py-2 font-bold text-white">Add</button><textarea name="description" placeholder="Description" className="rounded-lg border px-3 py-2 md:col-span-4"/></form>
    <div className="mt-5 space-y-3">{(data ?? []).map((t:any) => <form action={upsertTopic} key={t.id} className="grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-[1fr_1fr_120px_auto_auto]"><input type="hidden" name="id" value={t.id}/><input name="name" defaultValue={t.name} className="rounded-lg border px-3 py-2 font-bold"/><input name="slug" defaultValue={t.slug} className="rounded-lg border px-3 py-2"/><input name="trending_score" type="number" step="0.1" defaultValue={t.trending_score} className="rounded-lg border px-3 py-2"/><button className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white">Save</button><button formAction={deleteTopic} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600">Delete</button><textarea name="description" defaultValue={t.description ?? ""} className="rounded-lg border px-3 py-2 md:col-span-5"/></form>)}</div>
  </main>;
}
