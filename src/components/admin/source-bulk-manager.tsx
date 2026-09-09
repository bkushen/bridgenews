"use client";

import { useState } from "react";
import { bulkSourceAction } from "@/app/admin/phase2-actions";

type Source = { id: string; name: string; enabled: boolean };

export function SourceBulkManager({ sources }: { sources: Source[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const allSelected = sources.length > 0 && selected.length === sources.length;
  return <form action={bulkSourceAction} className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-black">Bulk source actions</p><p className="mt-1 text-xs text-slate-500">Select publishers, then enable or disable them together.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={()=>setSelected(allSelected?[]:sources.map(s=>s.id))} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black hover:bg-slate-50">{allSelected?"Clear all":"Select all"}</button><select name="bulk_action" defaultValue="" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black"><option value="" disabled>Choose action</option><option value="enable">Enable selected</option><option value="disable">Disable selected</option></select><button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-500">Apply to {selected.length}</button></div></div>
    <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">{sources.map(source=><label key={source.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-xs font-bold ${selected.includes(source.id)?"border-indigo-300 bg-indigo-50":"border-slate-200 bg-slate-50"}`}><input type="checkbox" name="source_ids" value={source.id} checked={selected.includes(source.id)} onChange={()=>toggle(source.id)}/><span className="min-w-0 flex-1 truncate">{source.name}</span><span className={`h-2 w-2 rounded-full ${source.enabled?"bg-emerald-500":"bg-slate-300"}`}/></label>)}</div>
  </form>;
}
