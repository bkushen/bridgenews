import { createAdminClient } from "@/lib/supabase/admin";
import { deleteCategory, upsertCategory } from "../control-actions";

export default async function AdminCategories() {
  const admin = createAdminClient();
  const { data } = await admin.from("categories").select("id,name,slug,description,sort_order").order("sort_order");
  return <main className="mx-auto max-w-6xl px-5 py-8"><h1 className="text-3xl font-black">Categories</h1><p className="mt-2 text-gray-600">Create, rename, order and remove public news categories.</p>
    <form action={upsertCategory} className="mt-6 grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-[1fr_1fr_100px_auto]"><input name="name" required placeholder="New category" className="rounded-lg border px-3 py-2"/><input name="slug" placeholder="slug (optional)" className="rounded-lg border px-3 py-2"/><input name="sort_order" type="number" defaultValue="100" className="rounded-lg border px-3 py-2"/><button className="rounded-lg bg-gray-950 px-4 py-2 font-bold text-white">Add</button><textarea name="description" placeholder="Description" className="rounded-lg border px-3 py-2 md:col-span-4"/></form>
    <div className="mt-5 space-y-3">{(data ?? []).map((c:any) => <form action={upsertCategory} key={c.id} className="grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-[1fr_1fr_100px_auto_auto]"><input type="hidden" name="id" value={c.id}/><input name="name" defaultValue={c.name} className="rounded-lg border px-3 py-2 font-bold"/><input name="slug" defaultValue={c.slug} className="rounded-lg border px-3 py-2"/><input name="sort_order" type="number" defaultValue={c.sort_order} className="rounded-lg border px-3 py-2"/><button className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white">Save</button><button formAction={deleteCategory} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600">Delete</button><textarea name="description" defaultValue={c.description ?? ""} className="rounded-lg border px-3 py-2 md:col-span-5"/></form>)}</div>
  </main>;
}
