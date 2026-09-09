import { createAdminClient } from "@/lib/supabase/admin";
import { updateRegion } from "../control-actions";

export default async function AdminRegions() {
  const admin = createAdminClient(); const { data } = await admin.from("regions").select("id,code,name,slug,is_active").order("name");
  return <main className="mx-auto max-w-5xl px-5 py-8"><h1 className="text-3xl font-black">Regions</h1><p className="mt-2 text-gray-600">Control which country/region editions are active.</p><div className="mt-6 space-y-3">{(data ?? []).map((r:any) => <form action={updateRegion} key={r.id} className="grid gap-2 rounded-xl border bg-white p-4 md:grid-cols-[100px_1fr_1fr_auto_auto]"><input type="hidden" name="id" value={r.id}/><div className="rounded-lg bg-gray-100 px-3 py-2 text-center font-black">{r.code}</div><input name="name" defaultValue={r.name} className="rounded-lg border px-3 py-2 font-bold"/><input name="slug" defaultValue={r.slug} className="rounded-lg border px-3 py-2"/><label className="flex items-center gap-2 rounded-lg border px-3"><input type="checkbox" name="is_active" defaultChecked={r.is_active}/>Active</label><button className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white">Save</button></form>)}</div></main>;
}
