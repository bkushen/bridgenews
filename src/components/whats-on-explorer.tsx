"use client";

import { useMemo, useState } from "react";
import type { WhatsOnCategory, WhatsOnItem } from "@/lib/data/whats-on";

const PAGE_CATEGORIES: Array<{ key: "all" | WhatsOnCategory; label: string }> = [
  { key: "all", label: "All" },
  { key: "movies", label: "Movies" },
  { key: "theatre", label: "Stage Dramas" },
  { key: "concerts", label: "Concerts" },
  { key: "comedy", label: "Comedy" },
  { key: "sports", label: "Sports" },
  { key: "festivals", label: "Festivals" },
  { key: "family", label: "Family" },
  { key: "arts", label: "Arts" },
  { key: "events", label: "Events" },
];

const LABELS: Record<WhatsOnCategory, string> = {
  movies: "Movie", theatre: "Stage drama", concerts: "Concert", comedy: "Comedy", sports: "Sport",
  festivals: "Festival", family: "Family", arts: "Arts", events: "Event",
};

const AUSTRALIA_CITY_ORDER = ["Melbourne", "Sydney", "Brisbane", "Perth", "Adelaide", "Canberra", "Hobart", "Darwin", "Gold Coast", "Newcastle", "Geelong", "Ballarat"];

function formatDate(value: string | null, timeZone: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone }).format(date);
}

function normalizeTitle(value: string) {
  return value.toLowerCase().normalize("NFKD")
    .replace(/\((?:sin|eng|tam|hin|sinhala|english|tamil|hindi|2d|3d|imax)[^)]*\)/gi, " ")
    .replace(/\b(?:movie|film|2d|3d|imax|dolby|screening|now showing|coming soon)\b/gi, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
}

function normalizeImage(value: string | null) {
  if (!value) return "";
  try { const url = new URL(value); url.search = ""; url.hash = ""; return `${url.hostname}${url.pathname}`.toLowerCase(); }
  catch { return value.toLowerCase().split("?")[0].split("#")[0]; }
}

function richness(item: WhatsOnItem) {
  return Number(Boolean(item.summary)) * 4 + Number(Boolean(item.duration)) * 2 + Number(Boolean(item.language)) * 2 + Number(Boolean(item.startAt)) * 2 + Number(Boolean(item.venue)) + item.providers.length;
}

function mergeUniqueItems(items: WhatsOnItem[]) {
  const byTitle = new Map<string, WhatsOnItem>();
  const imageOwner = new Map<string, string>();
  for (const item of items) {
    if (!item.imageUrl) continue;
    const titleKey = normalizeTitle(item.title);
    if (!titleKey) continue;
    const imageKey = normalizeImage(item.imageUrl);
    const existingKey = byTitle.has(titleKey) ? titleKey : imageKey && imageOwner.has(imageKey) ? imageOwner.get(imageKey)! : titleKey;
    const current = byTitle.get(existingKey);
    if (!current) {
      byTitle.set(titleKey, { ...item, providers: [...item.providers] });
      if (imageKey) imageOwner.set(imageKey, titleKey);
      continue;
    }
    const preferred = richness(item) > richness(current) ? { ...item, providers: [...item.providers] } : current;
    const other = preferred === current ? item : current;
    preferred.providers = Array.from(new Map([...preferred.providers, ...other.providers].map((provider) => [`${provider.name.toLowerCase()}|${provider.url}`, provider])).values());
    preferred.summary ||= other.summary; preferred.duration ||= other.duration; preferred.language ||= other.language;
    preferred.startAt ||= other.startAt; preferred.endAt ||= other.endAt; preferred.venue ||= other.venue; preferred.city ||= other.city;
    preferred.price ||= other.price; preferred.status ||= other.status; preferred.imageUrl ||= other.imageUrl;
    byTitle.set(existingKey, preferred);
  }
  return [...byTitle.values()];
}

function weekendRange(offsetWeeks = 0) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const friday = new Date(today); friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7) + offsetWeeks * 7);
  const sunday = new Date(friday); sunday.setDate(friday.getDate() + 2); sunday.setHours(23, 59, 59, 999);
  return { from: friday, to: sunday };
}

function isWithin(item: WhatsOnItem, from: Date | null, to: Date | null) {
  if (!from && !to) return true;
  if (!item.startAt) return false;
  const time = new Date(item.startAt).getTime();
  if (Number.isNaN(time)) return false;
  return (!from || time >= from.getTime()) && (!to || time <= to.getTime());
}

function CompactWhatsOn({ items, regionLabel, timeZone }: { items: WhatsOnItem[]; regionLabel: string; timeZone: string }) {
  const pictured = useMemo(() => mergeUniqueItems(items), [items]);
  const [selectedId, setSelectedId] = useState(pictured[0]?.id || "");
  const selected = pictured.find((item) => item.id === selectedId) || pictured[0] || null;
  const next = pictured.filter((item) => item.id !== selected?.id).slice(0, 7);

  if (!selected) return <section className="rounded-xl border border-[#ded5c8] bg-[#fffdf8] p-4"><div className="flex items-center justify-between"><h2 className="font-serif text-xl font-black">What&apos;s On</h2><a href="/whats-on" className="text-[11px] font-black text-[#a5232f]">What&apos;s On →</a></div><p className="mt-5 text-sm text-[#746a61]">No pictured listings available right now.</p></section>;

  return <section className="rounded-xl border border-[#ded5c8] bg-[#fffdf8] p-4">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#a5232f]"/><h2 className="font-serif text-xl font-black text-[#1d1b19]">What&apos;s On</h2></div><a href="/whats-on" className="text-[11px] font-black text-[#a5232f]">What&apos;s On →</a></div>
    <div className="mt-4 grid grid-cols-[145px_minmax(0,1fr)] gap-4">
      <img src={selected.imageUrl!} alt={`${selected.title} poster`} className="h-[218px] w-full rounded-lg object-cover shadow-sm"/>
      <div className="min-w-0"><div className="flex flex-wrap gap-1.5 text-[9px] font-black uppercase"><span className="rounded border border-[#e1aaa9] bg-[#faeeee] px-2 py-1 text-[#8b1e28]">{LABELS[selected.category]}</span>{selected.language ? <span className="rounded border border-[#d8d0c4] px-2 py-1">{selected.language}</span> : null}{selected.duration ? <span className="rounded border border-[#d8d0c4] px-2 py-1">⏱ {selected.duration}</span> : null}</div><h3 className="mt-2 font-serif text-xl font-black leading-tight text-[#1d1b19]">{selected.title}</h3>{selected.summary ? <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#665e56]">{selected.summary}</p> : null}<div className="mt-3 space-y-1 text-[11px] text-[#746a61]">{selected.status ? <p>🎟 {selected.status}</p> : null}<p>📍 {[selected.venue, selected.city].filter(Boolean).join(", ") || regionLabel}</p>{formatDate(selected.startAt, timeZone) ? <p>🗓 {formatDate(selected.startAt, timeZone)}</p> : null}</div><div className="mt-3 flex flex-wrap gap-1.5">{selected.providers.slice(0,5).map((provider)=><a key={`${provider.name}-${provider.url}`} href={provider.url} target="_blank" rel="noreferrer" className="rounded border border-[#a5232f] px-2 py-1 text-[9px] font-black uppercase text-[#a5232f] hover:bg-[#a5232f] hover:text-white">{provider.name} ↗</a>)}</div></div>
    </div>
    {next.length ? <div className="mt-5"><p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#91867c]">What&apos;s next</p><div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">{next.map((item)=><button key={item.id} type="button" onClick={()=>setSelectedId(item.id)} className="group overflow-hidden rounded-lg border border-[#d9cfc2] bg-[#fffaf8] transition hover:-translate-y-1 hover:border-[#a5232f] hover:shadow-md"><div className="h-24 overflow-hidden"><img src={item.imageUrl!} alt={`${item.title} poster`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/></div></button>)}</div></div> : null}
  </section>;
}

export function WhatsOnExplorer({ items, regionLabel, timeZone, compact = false }: { items: WhatsOnItem[]; regionLabel: string; timeZone: string; compact?: boolean }) {
  if (compact) return <CompactWhatsOn items={items} regionLabel={regionLabel} timeZone={timeZone}/>;

  const pictured = useMemo(() => mergeUniqueItems(items), [items]);
  const available = useMemo(() => new Set(pictured.map((item) => item.category)), [pictured]);
  const australia = regionLabel.toLowerCase().includes("australia");
  const cityOptions = useMemo(() => {
    if (!australia) return [];
    const cities = Array.from(new Set(pictured.map((item) => item.city).filter((city): city is string => Boolean(city))));
    return cities.sort((a, b) => {
      const ai = AUSTRALIA_CITY_ORDER.indexOf(a);
      const bi = AUSTRALIA_CITY_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [pictured, australia]);
  const [category, setCategory] = useState<"all" | WhatsOnCategory>("all");
  const [city, setCity] = useState("all");
  const [dateMode, setDateMode] = useState<"all" | "weekend" | "next-weekend" | "custom">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filtered = useMemo(() => {
    let from: Date | null = null; let to: Date | null = null;
    if (dateMode === "weekend") ({ from, to } = weekendRange(0));
    if (dateMode === "next-weekend") ({ from, to } = weekendRange(1));
    if (dateMode === "custom") {
      from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
      to = toDate ? new Date(`${toDate}T23:59:59`) : null;
    }
    return pictured.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (city !== "all" && item.city !== city && !(item.category === "movies" && !item.city)) return false;
      return isWithin(item, from, to);
    });
  }, [pictured, category, city, dateMode, fromDate, toDate]);

  return <section>
    <div className="rounded-2xl border border-[#ded5c8] bg-[#fffdf8] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">{PAGE_CATEGORIES.filter((item)=>item.key==="all"||available.has(item.key as WhatsOnCategory)).map((item)=>{const active=category===item.key; return <button key={item.key} type="button" onClick={()=>setCategory(item.key)} className={`shrink-0 rounded-md px-4 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition ${active ? "bg-[#a5232f] text-white" : "bg-[#ece6dc] text-[#443e38] hover:bg-[#dfd6c9]"}`}>{item.label}</button>})}</div>
        <a href="/suggest-feed?type=event" className="shrink-0 rounded-md bg-[#ece6dc] px-4 py-2 text-[11px] font-black text-[#2c2926] transition hover:bg-[#dfd6c9]">✚ Submit an event</a>
      </div>
      {australia && cityOptions.length ? <div className="mt-4 flex items-center gap-2 overflow-x-auto border-t border-[#eee6dc] pt-4"><span className="mr-1 shrink-0 text-[9px] font-black uppercase tracking-[0.14em] text-[#8c8177]">Where</span><button type="button" onClick={()=>setCity("all")} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold ${city==="all"?"border-[#a5232f] bg-[#a5232f] text-white":"border-[#ded5c8] bg-white text-[#514b45]"}`}>All Australia</button>{cityOptions.map((name)=><button key={name} type="button" onClick={()=>setCity(name)} className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold ${city===name?"border-[#a5232f] bg-[#a5232f] text-white":"border-[#ded5c8] bg-white text-[#514b45] hover:border-[#a5232f]"}`}>{name}</button>)}</div> : null}
    </div>

    <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#8c8177]">When</span><button type="button" onClick={()=>setDateMode(dateMode==="weekend"?"all":"weekend")} className={`rounded-full border px-4 py-2 text-[10px] font-bold ${dateMode==="weekend"?"border-[#a5232f] bg-[#a5232f] text-white":"border-[#ded5c8] bg-[#fffdf8] text-[#514b45]"}`}>This weekend</button><button type="button" onClick={()=>setDateMode(dateMode==="next-weekend"?"all":"next-weekend")} className={`rounded-full border px-4 py-2 text-[10px] font-bold ${dateMode==="next-weekend"?"border-[#a5232f] bg-[#a5232f] text-white":"border-[#ded5c8] bg-[#fffdf8] text-[#514b45]"}`}>Next weekend</button></div>
      <div className="flex items-center gap-2"><input type="date" value={fromDate} onChange={(e)=>{setFromDate(e.target.value); setDateMode("custom")}} className="rounded-lg border border-[#ded5c8] bg-[#fffdf8] px-3 py-2 text-xs text-[#433d37]"/><span className="text-[#a69b90]">–</span><input type="date" value={toDate} onChange={(e)=>{setToDate(e.target.value); setDateMode("custom")}} className="rounded-lg border border-[#ded5c8] bg-[#fffdf8] px-3 py-2 text-xs text-[#433d37]"/></div>
    </div>

    <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {filtered.map((item)=><article key={item.id} className="group overflow-hidden rounded-2xl border border-[#ded5c8] bg-[#fffdf8] shadow-[0_1px_0_rgba(30,20,10,.03)] transition duration-200 hover:-translate-y-1 hover:shadow-lg">
        <a href={item.ticketUrl} target="_blank" rel="noreferrer" className="block aspect-[3/4.45] overflow-hidden bg-[#eee5da]"><img src={item.imageUrl!} alt={`${item.title} poster`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"/></a>
        <div className="p-3">
          <h3 className="line-clamp-2 font-serif text-[15px] font-black leading-5 text-[#211e1b]">{item.title}</h3>
          <div className="mt-2 flex flex-wrap gap-1 text-[8px] font-black"><span className="rounded bg-[#211e1b] px-1.5 py-1 text-white">{LABELS[item.category]}</span>{formatDate(item.startAt,timeZone)?<span className="rounded bg-[#f0e9df] px-1.5 py-1 text-[#655d55]">📅 {formatDate(item.startAt,timeZone)}</span>:null}{item.language?<span className="rounded bg-[#f0e9df] px-1.5 py-1 text-[#655d55]">{item.language}</span>:null}{item.duration?<span className="rounded bg-[#f0e9df] px-1.5 py-1 text-[#655d55]">{item.duration}</span>:null}</div>
          <p className="mt-2 line-clamp-1 text-[10px] text-[#7d736a]">📍 {[item.venue,item.city].filter(Boolean).join(", ") || (australia ? "Australia-wide" : regionLabel)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{item.providers.slice(0,3).map((provider)=><a key={`${provider.name}-${provider.url}`} href={provider.url} target="_blank" rel="noreferrer" className="rounded border border-[#a5232f] px-2 py-1 text-[8px] font-black uppercase text-[#a5232f] hover:bg-[#a5232f] hover:text-white">{provider.name} ↗</a>)}</div>
        </div>
      </article>)}
    </div>

    {!filtered.length ? <div className="mt-8 rounded-2xl border border-dashed border-[#d9cfc2] bg-[#fffdf8] p-10 text-center"><p className="font-serif text-xl font-black text-[#1d1b19]">Nothing listed yet — check back soon.</p></div> : null}
  </section>;
}
