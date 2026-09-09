import { createAdminClient } from "@/lib/supabase/admin";
import { updateHomepageSection } from "../control-actions";

export default async function AdminHomepage() {
  const admin = createAdminClient(); const { data } = await admin.from("homepage_sections").select("id,section_key,label,enabled,sort_order").order("sort_order");
  return <main className="mx-auto max-w-5xl px-5 py-8"><h1 className="text-3xl font-black">Homepage</h1><p className="mt-2 text-gray-600">Enable, disable and reorder major homepage sections.</p><div className="mt-6 space-y-3">{(data ?? []).map((s:any) => <form action={updateHomepageSection} key={s.id} className="grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-[1fr_130px_130px_auto]"><input type="hidden" name="id" value={s.id}/><div><div className="font-black">{s.label}</div><div className="text-xs text-gray-400">{s.section_key}</div></div><label className="flex items-center gap-2 rounded-lg border px-3"><input type="checkbox" name="enabled" defaultChecked={s.enabled}/>Enabled</label><input name="sort_order" type="number" defaultValue={s.sort_order} className="rounded-lg border px-3 py-2"/><button className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white">Save</button></form>)}</div></main>;
}
