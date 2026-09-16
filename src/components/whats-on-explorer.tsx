"use client";

import { useEffect, useMemo, useState } from "react";
import type { WhatsOnCategory, WhatsOnItem } from "@/lib/data/whats-on";

const CATEGORIES: Array<{ key: "all" | WhatsOnCategory; label: string }> = [
  { key: "all", label: "All" }, { key: "movies", label: "Movies" }, { key: "theatre", label: "Stage Dramas" },
  { key: "concerts", label: "Concerts" }, { key: "comedy", label: "Comedy" }, { key: "sports", label: "Sports" },
  { key: "festivals", label: "Festivals" }, { key: "family", label: "Family" }, { key: "arts", label: "Arts" }, { key: "events", label: "Events" },
];

const LABELS: Record<WhatsOnCategory, string> = { movies: "Movie", theatre: "Stage drama", concerts: "Concert", comedy: "Comedy", sports: "Sport", festivals: "Festival", family: "Family", arts: "Arts", events: "Event" };

function formatDate(value: string | null, timeZone: string) {
  if (!value) return null; const date = new Date(value); if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone }).format(date);
}
function normalizeTitle(value: string) { return value.toLowerCase().normalize("NFKD").replace(/\((?:sin|eng|tam|hin|sinhala|english|tamil|hindi|2d|3d|imax)[^)]*\)/gi, " ").replace(/\b(?:movie|film|2d|3d|imax|dolby|screening|now showing|coming soon)\b/gi, " ").replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim(); }
function normalizeImage(value: string | null) { if (!value) return ""; try { const url = new URL(value); url.search = ""; url.hash = ""; return `${url.hostname}${url.pathname}`.toLowerCase().replace(/\/(?:thumb|thumbnail|small|medium|large)\//g, "/"); } catch { return value.toLowerCase().split("?")[0].split("#")[0]; } }
function richness(item: WhatsOnItem) { return Number(Boolean(item.summary)) * 4 + Number(Boolean(item.duration)) * 2 + Number(Boolean(item.language)) * 2 + Number(Boolean(item.startAt)) * 2 + Number(Boolean(item.venue)) + item.providers.length; }
function mergeUniqueItems(items: WhatsOnItem[]) {
  const byTitle = new Map<string, WhatsOnItem>(); const imageOwner = new Map<string, string>();
  for (const item of items) {
    if (!item.imageUrl) continue; const titleKey = normalizeTitle(item.title); if (!titleKey) continue; const imageKey = normalizeImage(item.imageUrl);
    const existingKey = byTitle.has(titleKey) ? titleKey : imageKey && imageOwner.has(imageKey) ? imageOwner.get(imageKey)! : titleKey; const current = byTitle.get(existingKey);
    if (!current) { const copy = { ...item, providers: [...item.providers] }; byTitle.set(titleKey, copy); if (imageKey) imageOwner.set(imageKey, titleKey); continue; }
    const preferred = richness(item) > richness(current) ? { ...item, providers: [...item.providers] } : current; const other = preferred === current ? item : current;
    preferred.providers = Array.from(new Map([...preferred.providers, ...other.providers].map((provider) => [`${provider.name.toLowerCase()}|${provider.url}`, provider])).values());
    preferred.summary ||= other.summary; preferred.duration ||= other.duration; preferred.language ||= other.language; preferred.startAt ||= other.startAt; preferred.endAt ||= other.endAt; preferred.venue ||= other.venue; preferred.city ||= other.city; preferred.price ||= other.price; preferred.status ||= other.status; preferred.imageUrl ||= other.imageUrl; byTitle.set(existingKey, preferred);
  }
  return [...byTitle.values()];
}
function startOfDay(date: Date) { const copy = new Date(date); copy.setHours(0, 0, 0, 0); return copy; }
function endOfDay(date: Date) { const copy = new Date(date); copy.setHours(23, 59, 59, 999); return copy; }
function weekendRange(offsetWeeks = 0) {
  const today = startOfDay(new Date()); const day = today.getDay(); const daysUntilFriday = (5 - day + 7) % 7;
  const friday = new Date(today); friday.setDate(today.getDate() + daysUntilFriday + offsetWeeks * 7);
  const sunday = new Date(friday); sunday.setDate(friday.getDate() + 2);
  return { from: friday, to: endOfDay(sunday) };
}
function inRange(item: WhatsOnItem, from: Date | null, to: Date | null) {
  if (!from && !to) return true; if (!item.startAt) return false; const time = new Date(item.startAt).getTime(); if (Number.isNaN(time)) return false;
  return (!from || time >= from.getTime()) && (!to || time <= to.getTime());
}

export function WhatsOnExplorer({ items, regionLabel, timeZone, compact = false }: { items: WhatsOnItem[]; regionLabel: string; timeZone: string; compact?: boolean }) {
  const pictured = useMemo(() => mergeUniqueItems(items), [items]);
  const available = useMemo(() => new Set(pictured.map((item) => item.category)), [pictured]);
  const [category, setCategory] = useState<"all" | WhatsOnCategory>("all");
  const [timing, setTiming] = useState<"all" | "now" | "soon">("all");
  const [dateMode, setDateMode] = useState<"all" | "weekend" | "next-weekend" | "custom">("all");
  const [fromDate, setFromDate] = useState(""); const [toDate, setToDate] = useState("");
  const filtered = useMemo(() => {
    let from: Date | null = null; let to: Date | null = null;
    if (dateMode === "weekend") ({ from, to } = weekendRange(0));
    if (dateMode === "next-weekend") ({ from, to } = weekendRange(1));
    if (dateMode === "custom") { from = fromDate ? startOfDay(new Date(`${fromDate}T00:00:00`)) : null; to = toDate ? endOfDay(new Date(`${toDate}T00:00:00`)) : null; }
    return pictured.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (timing === "now" && item.status !== "Now showing") return false;
      if (timing === "soon" && item.status !== "Coming soon") return false;
      return inRange(item, from, to);
    });
  }, [pictured, category, timing, dateMode, fromDate, toDate]);
  const [selectedId, setSelectedId] = useState(pictured[0]?.id || "");
  useEffect(() => { if (!filtered.some((item) => item.id === selectedId)) setSelectedId(filtered[0]?.id || ""); }, [filtered, selectedId]);
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0] || null;
  const next = filtered.filter((item) => item.id !== selected?.id).slice(0, compact ? 7 : 12);

  return <section className={`rounded-xl border border-[#ded5c8] bg-[#fffdf8] ${compact ? "p-4" : "p-5 sm:p-7"}`}>
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#a5232f]"/><h2 className={`${compact ? "text-xl" : "text-3xl"} font-serif font-black tracking-tight text-[#1d1b19]`}>What&apos;s On</h2></div><a href="/whats-on" className="text-[11px] font-black text-[#a5232f] hover:underline">What&apos;s On →</a></div>

    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{CATEGORIES.filter((item) => item.key === "all" || available.has(item.key as WhatsOnCategory)).map((item) => { const active = category === item.key; return <button key={item.key} type="button" onClick={() => setCategory(item.key)} className={`shrink-0 rounded-md border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition duration-200 hover:-translate-y-0.5 ${active ? "border-[#a5232f] bg-[#a5232f] text-white" : "border-[#d9cfc2] bg-[#f1eadf] text-[#5c544c] hover:border-[#a5232f] hover:bg-[#f8e8e8] hover:text-[#7f1822]"}`}>{item.label}</button>; })}</div>

    {!compact ? <div className="mt-3 space-y-3 border-t border-[#eee6dc] pt-3">
      <div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8c8177]">When</span>{[["all","All dates"],["weekend","This weekend"],["next-weekend","Next weekend"]].map(([key,label]) => <button key={key} type="button" onClick={() => setDateMode(key as typeof dateMode)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${dateMode === key ? "border-[#1d1b19] bg-[#1d1b19] text-white" : "border-[#d9cfc2] bg-white text-[#5f574f] hover:border-[#a5232f]"}`}>{label}</button>)}<button type="button" onClick={() => setDateMode("custom")} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${dateMode === "custom" ? "border-[#1d1b19] bg-[#1d1b19] text-white" : "border-[#d9cfc2] bg-white text-[#5f574f] hover:border-[#a5232f]"}`}>Custom dates</button></div>
      {dateMode === "custom" ? <div className="flex flex-wrap gap-2"><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-[#d9cfc2] bg-white px-3 py-2 text-xs text-[#3d3732]"/><span className="self-center text-xs text-[#91867c]">to</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-[#d9cfc2] bg-white px-3 py-2 text-xs text-[#3d3732]"/></div> : null}
      <div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-black uppercase tracking-[0.14em] text-[#8c8177]">Status</span>{[["all","All"],["now","Now showing"],["soon","Coming soon"]].map(([key,label]) => <button key={key} type="button" onClick={() => setTiming(key as typeof timing)} className={`rounded-full border px-3 py-1.5 text-[10px] font-bold ${timing === key ? "border-[#a5232f] bg-[#a5232f] text-white" : "border-[#d9cfc2] bg-white text-[#5f574f] hover:border-[#a5232f]"}`}>{label}</button>)}</div>
    </div> : null}

    {!selected ? <div className="mt-5 rounded-xl border border-dashed border-[#d9cfc2] bg-[#f8f3eb] p-6 text-center"><p className="font-serif text-lg font-bold text-[#1d1b19]">No pictured listings match these filters.</p><p className="mt-2 text-xs leading-5 text-[#746a61]">BridgeNews only shows genuine movie/event posters in this module.</p></div> : <>
      <div className={`mt-4 ${compact ? "grid grid-cols-[145px_minmax(0,1fr)] gap-4" : "grid gap-5 rounded-xl border border-[#ddd3c6] bg-[#fffdf8] p-4 md:grid-cols-[260px_minmax(0,1fr)]"}`}>
        <button type="button" onClick={() => window.open(selected.ticketUrl, "_blank")} className="group overflow-hidden rounded-lg bg-[#eee5da] text-left shadow-sm"><img src={selected.imageUrl!} alt={`${selected.title} poster`} className={`${compact ? "h-[218px]" : "h-[390px]"} w-full object-cover transition duration-300 group-hover:scale-[1.025]`} /></button>
        <div className="min-w-0 self-start"><div className="flex flex-wrap gap-1.5 text-[9px] font-black uppercase tracking-wide"><span className="rounded border border-[#e1aaa9] bg-[#faeeee] px-2 py-1 text-[#8b1e28]">{LABELS[selected.category]}</span>{selected.language ? <span className="rounded border border-[#d8d0c4] px-2 py-1 text-[#60584f]">{selected.language}</span> : null}{selected.duration ? <span className="rounded border border-[#d8d0c4] px-2 py-1 text-[#60584f]">⏱ {selected.duration}</span> : null}{formatDate(selected.startAt, timeZone) ? <span className="rounded border border-[#d8d0c4] px-2 py-1 text-[#60584f]">🗓 {formatDate(selected.startAt, timeZone)}</span> : null}{selected.price ? <span className="rounded border border-[#d8d0c4] px-2 py-1 text-[#60584f]">{selected.price}</span> : null}</div>
          <h3 className={`${compact ? "mt-2 text-xl" : "mt-3 text-3xl"} font-serif font-black leading-tight text-[#1d1b19]`}>{selected.title}</h3>{selected.summary ? <p className={`${compact ? "line-clamp-3" : "line-clamp-5"} mt-2 text-xs leading-5 text-[#665e56]`}>{selected.summary}</p> : null}
          <div className="mt-3 space-y-1 text-[11px] text-[#746a61]">{selected.status ? <p>🎟 {selected.status}</p> : null}<p>📍 {[selected.venue, selected.city].filter(Boolean).join(", ") || regionLabel}</p></div>
          <div className="mt-3 flex flex-wrap gap-1.5">{selected.providers.slice(0, compact ? 5 : 10).map((provider) => <a key={`${provider.name}-${provider.url}`} href={provider.url} target="_blank" rel="noreferrer" className="rounded border border-[#a5232f] px-2 py-1 text-[9px] font-black uppercase text-[#a5232f] transition hover:bg-[#a5232f] hover:text-white">{provider.name} ↗</a>)}</div>
        </div>
      </div>
      {next.length ? <div className="mt-5"><p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#91867c]">What&apos;s next</p><div className={`mt-2 grid gap-2 ${compact ? "grid-cols-4 sm:grid-cols-7" : "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8"}`}>{next.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} title={item.title} className="group overflow-hidden rounded-lg border border-[#d9cfc2] bg-[#fffaf8] text-left transition duration-200 hover:-translate-y-1 hover:border-[#a5232f] hover:shadow-md"><div className={`${compact ? "h-24" : "h-32"} overflow-hidden bg-[#eee5da]`}><img src={item.imageUrl!} alt={`${item.title} poster`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/></div></button>)}</div></div> : null}
      {!compact ? <div className="mt-8 border-t border-[#e8dfd4] pt-5"><div className="mb-3"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#91867c]">All pictured listings</p><h3 className="mt-1 font-serif text-2xl font-black text-[#1d1b19]">{filtered.length} unique movies & events</h3></div><div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{filtered.map((item) => <button key={`catalog-${item.id}`} type="button" onClick={() => { setSelectedId(item.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="group overflow-hidden rounded-xl border border-[#ddd3c6] bg-[#fffdf8] text-left transition duration-200 hover:-translate-y-1 hover:border-[#bba999] hover:shadow-lg"><div className="aspect-[2/3] overflow-hidden bg-[#eee5da]"><img src={item.imageUrl!} alt={`${item.title} poster`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.035]"/></div><div className="p-3"><h4 className="line-clamp-2 font-serif text-[15px] font-black leading-5 text-[#211e1b]">{item.title}</h4><div className="mt-2 flex flex-wrap gap-1 text-[8px] font-black uppercase"><span className="rounded bg-[#211e1b] px-1.5 py-1 text-white">{LABELS[item.category]}</span>{item.language ? <span className="rounded bg-[#f0e9df] px-1.5 py-1 text-[#655d55]">{item.language}</span> : null}{item.duration ? <span className="rounded bg-[#f0e9df] px-1.5 py-1 text-[#655d55]">{item.duration}</span> : null}</div><p className="mt-2 line-clamp-1 text-[10px] text-[#7d736a]">📍 {[item.venue,item.city].filter(Boolean).join(", ") || regionLabel}</p></div></button>)}</div></div> : null}
    </>}
  </section>;
}
