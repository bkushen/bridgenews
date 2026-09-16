"use client";

import { useEffect, useMemo, useState } from "react";
import type { WhatsOnCategory, WhatsOnItem } from "@/lib/data/whats-on";

const CATEGORIES: Array<{ key: "all" | WhatsOnCategory; label: string; icon: string }> = [
  { key: "all", label: "All", icon: "✦" },
  { key: "movies", label: "Movies", icon: "🎬" },
  { key: "theatre", label: "Theatre", icon: "🎭" },
  { key: "concerts", label: "Concerts", icon: "🎵" },
  { key: "comedy", label: "Comedy", icon: "🎤" },
  { key: "sports", label: "Sports", icon: "🏟" },
  { key: "festivals", label: "Festivals", icon: "🎪" },
  { key: "family", label: "Family", icon: "🎈" },
  { key: "arts", label: "Arts", icon: "🖼" },
  { key: "events", label: "More", icon: "📅" },
];

const LABELS: Record<WhatsOnCategory, string> = {
  movies: "Movie",
  theatre: "Theatre",
  concerts: "Concert",
  comedy: "Comedy",
  sports: "Sport",
  festivals: "Festival",
  family: "Family",
  arts: "Arts",
  events: "Event",
};

function formatDate(value: string | null, timeZone: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone }).format(date);
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function WhatsOnExplorer({ items, regionLabel, timeZone, compact = false }: { items: WhatsOnItem[]; regionLabel: string; timeZone: string; compact?: boolean }) {
  const available = useMemo(() => new Set(items.map((item) => item.category)), [items]);
  const [category, setCategory] = useState<"all" | WhatsOnCategory>("all");
  const filtered = useMemo(() => category === "all" ? items : items.filter((item) => item.category === category), [items, category]);
  const [selectedId, setSelectedId] = useState(items[0]?.id || "");

  useEffect(() => {
    if (!filtered.some((item) => item.id === selectedId)) setSelectedId(filtered[0]?.id || "");
  }, [filtered, selectedId]);

  const selected = filtered.find((item) => item.id === selectedId) || filtered[0] || null;
  const next = filtered.filter((item) => item.id !== selected?.id).slice(0, compact ? 7 : 14);

  return <section className={`rounded-xl border border-[#ded5c8] bg-[#fffdf8] ${compact ? "p-4" : "p-5 sm:p-7"}`}>
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#a5232f]"/><h2 className={`${compact ? "text-xl" : "text-3xl"} font-serif font-black tracking-tight text-[#1d1b19]`}>What&apos;s On</h2></div>
      <a href="/whats-on" className="text-[11px] font-black text-[#a5232f] hover:underline">Explore all →</a>
    </div>

    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {CATEGORIES.filter((item) => item.key === "all" || available.has(item.key as WhatsOnCategory)).map((item) => {
        const active = category === item.key;
        return <button key={item.key} type="button" onClick={() => setCategory(item.key)} aria-pressed={active} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black transition duration-200 hover:-translate-y-0.5 ${active ? "border-[#a5232f] bg-[#a5232f] text-white" : "border-[#d9cfc2] bg-[#fffaf7] text-[#5c544c] hover:border-[#a5232f] hover:bg-[#f8e8e8] hover:text-[#7f1822]"}`}>{item.icon} {item.label}</button>;
      })}
    </div>

    {!selected ? <div className="mt-5 rounded-xl border border-dashed border-[#d9cfc2] bg-[#f8f3eb] p-6 text-center"><p className="font-serif text-lg font-bold text-[#1d1b19]">No upcoming listings are available right now.</p><p className="mt-2 text-xs leading-5 text-[#746a61]">BridgeNews does not fill this section with news or invented events. Live cinema and organiser sources will appear here when they respond.</p></div> : <>
      <div className={`mt-4 overflow-hidden rounded-xl border border-[#d9cfc2] bg-[#121b2d] ${compact ? "min-h-[165px]" : "grid md:grid-cols-[minmax(230px,.72fr)_1fr]"}`}>
        <div className={`relative overflow-hidden bg-[#121b2d] ${compact ? "h-36" : "min-h-[280px]"}`}>
          {selected.imageUrl ? <img src={selected.imageUrl} alt="" className="h-full w-full object-cover transition duration-500 hover:scale-[1.035]"/> : <div className="grid h-full min-h-[160px] place-items-center bg-[radial-gradient(circle_at_top_left,#7f1822,#121b2d_62%)]"><div className="text-center text-white"><p className="font-serif text-5xl font-black opacity-80">{initials(selected.title)}</p><p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{LABELS[selected.category]}</p></div></div>}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"/>
          <span className="absolute left-3 top-3 rounded-md bg-[#a5232f] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-white">{LABELS[selected.category]}</span>
        </div>
        <div className={`${compact ? "bg-[#fffdf8] p-4" : "bg-[#fffdf8] p-5 sm:p-6"}`}>
          <div className="flex flex-wrap gap-1.5 text-[9px] font-black uppercase tracking-wide">
            {formatDate(selected.startAt, timeZone) ? <span className="rounded border border-[#d8d0c4] px-2 py-1 text-[#60584f]">🗓 {formatDate(selected.startAt, timeZone)}</span> : null}
            {selected.language ? <span className="rounded border border-[#d8d0c4] px-2 py-1 text-[#60584f]">{selected.language}</span> : null}
            {selected.price ? <span className="rounded border border-[#d8d0c4] px-2 py-1 text-[#60584f]">{selected.price}</span> : null}
          </div>
          <h3 className={`${compact ? "mt-2 text-xl" : "mt-3 text-3xl"} font-serif font-black leading-tight text-[#1d1b19]`}>{selected.title}</h3>
          {selected.summary ? <p className={`${compact ? "line-clamp-3" : "line-clamp-5"} mt-2 text-xs leading-5 text-[#665e56]`}>{selected.summary}</p> : null}
          <div className="mt-3 space-y-1 text-[11px] text-[#746a61]">
            {selected.venue || selected.city ? <p>📍 {[selected.venue, selected.city].filter(Boolean).join(", ")}</p> : <p>📍 {regionLabel}</p>}
            <p>Source: <a href={selected.sourceUrl} target="_blank" rel="noreferrer" className="font-bold text-[#a5232f] hover:underline">{selected.sourceName}</a></p>
          </div>
          <a href={selected.ticketUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-lg bg-[#a5232f] px-4 py-2 text-[11px] font-black text-white transition hover:-translate-y-0.5 hover:bg-[#7f1822]">Tickets / details ↗</a>
        </div>
      </div>

      {next.length ? <div className="mt-4">
        <div className="flex items-center justify-between"><p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#91867c]">What&apos;s next</p><p className="text-[9px] font-semibold text-[#91867c]">Click a card to view details</p></div>
        <div className={`mt-2 grid gap-2 ${compact ? "grid-cols-4 sm:grid-cols-7" : "grid-cols-3 sm:grid-cols-5 md:grid-cols-7"}`}>
          {next.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} title={item.title} className="group overflow-hidden rounded-lg border border-[#d9cfc2] bg-[#fffaf8] text-left transition duration-200 hover:-translate-y-1 hover:border-[#a5232f] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#a5232f]/30">
            <div className={`${compact ? "h-20" : "h-28"} overflow-hidden bg-[#eee5da]`}>{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/> : <div className="grid h-full place-items-center bg-[#f0e8de] text-xl font-black text-[#a5232f]">{initials(item.title)}</div>}</div>
            {!compact ? <div className="p-2"><p className="line-clamp-2 text-[10px] font-black leading-3.5 text-[#312c28]">{item.title}</p><p className="mt-1 text-[8px] font-bold uppercase text-[#a5232f]">{LABELS[item.category]}</p></div> : null}
          </button>)}
        </div>
      </div> : null}
    </>}
  </section>;
}
