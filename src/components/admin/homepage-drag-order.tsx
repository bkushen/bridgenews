"use client";

import { useState } from "react";
import { reorderHomepageSections } from "@/app/admin/homepage/actions";

type Section={id:string;label:string;enabled:boolean};
export function HomepageDragOrder({sections}:{sections:Section[]}){
  const [items,setItems]=useState(sections);
  const [dragId,setDragId]=useState<string|null>(null);
  function drop(targetId:string){ if(!dragId||dragId===targetId)return; const next=[...items]; const from=next.findIndex(x=>x.id===dragId); const to=next.findIndex(x=>x.id===targetId); const [moved]=next.splice(from,1); next.splice(to,0,moved); setItems(next); setDragId(null); }
  return <form action={reorderHomepageSections} className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4"><input type="hidden" name="ordered_ids" value={JSON.stringify(items.map(x=>x.id))}/><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-black text-indigo-950">Drag & drop order</p><p className="mt-1 text-xs text-indigo-700">Drag sections into the order you want, then save once.</p></div><button className="rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white hover:bg-indigo-500">Save dragged order</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{items.map((item,index)=><div key={item.id} draggable onDragStart={()=>setDragId(item.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>drop(item.id)} className="cursor-grab rounded-xl border border-indigo-100 bg-white px-3 py-3 shadow-sm active:cursor-grabbing"><div className="flex items-center gap-3"><span className="text-slate-400">⋮⋮</span><span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs font-black">{index+1}</span><span className="min-w-0 flex-1 truncate text-sm font-black">{item.label}</span><span className={`h-2 w-2 rounded-full ${item.enabled?"bg-emerald-500":"bg-slate-300"}`}/></div></div>)}</div></form>;
}
