import { createAdminClient } from "@/lib/supabase/admin";
import { updateSiteSetting } from "../control-actions";

function inputType(value: unknown) { return typeof value === "boolean" ? "boolean" : typeof value === "number" ? "number" : "string"; }

export default async function AdminSettings() {
  const admin = createAdminClient();
  const { data } = await admin.from("site_settings").select("key,group_name,label,description,value").order("group_name").order("label");
  const settings = data ?? [];
  const groups = [...new Set(settings.map((setting: any) => setting.group_name || "general"))];

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Website configuration</p><h1 className="mt-1 text-3xl font-black tracking-tight">Site settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage global branding, regional defaults and system switches without editing code.</p></div><span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">{settings.length} settings</span></div>

    <div className="mt-6 space-y-6">{groups.map((group) => <section key={group} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Group</p><h2 className="mt-1 text-lg font-black capitalize text-slate-950">{String(group).replaceAll("_"," ")}</h2></div><div className="divide-y divide-slate-100">{settings.filter((setting: any) => (setting.group_name || "general") === group).map((s:any) => { const type = inputType(s.value); return <form action={updateSiteSetting} key={s.key} className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,360px)_auto] lg:items-end"><input type="hidden" name="key" value={s.key}/><input type="hidden" name="type" value={type}/><div><div className="font-black text-slate-950">{s.label}</div><div className="mt-1 font-mono text-[10px] text-slate-400">{s.key}</div>{s.description ? <p className="mt-2 max-w-2xl text-sm leading-5 text-slate-500">{s.description}</p>:null}</div><label className="block text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Value{type === "boolean" ? <select name="value" defaultValue={String(s.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold normal-case text-slate-900"><option value="true">Enabled</option><option value="false">Disabled</option></select> : <input name="value" defaultValue={String(s.value ?? "")} type={type === "number" ? "number" : "text"} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold normal-case text-slate-900 outline-none focus:border-black"/>}</label><button className="rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">Save</button></form>; })}</div></section>)}</div>
  </main>;
}
