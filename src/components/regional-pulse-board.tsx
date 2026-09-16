"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type RegionalPulseTopic = {
  key: string;
  title: string;
  slug: string;
  summary: string;
  source: string;
  sourceCount: number;
  category?: string | null;
};

type Props = {
  regionLabel: string;
  flag: string;
  greeting: string;
  topics: RegionalPulseTopic[];
  storyCount: number;
  sourceCount: number;
  fallbackChips: string[];
};

export function RegionalPulseBoard({ regionLabel, flag, greeting, topics, storyCount, sourceCount, fallbackChips }: Props) {
  const [activeKey, setActiveKey] = useState(topics[0]?.key ?? "");
  const active = topics.find((topic) => topic.key === activeKey) ?? topics[0];
  const chips = useMemo(() => {
    const values = Array.from(new Set(topics.map((topic) => topic.category).filter((value): value is string => Boolean(value && value.toLowerCase() !== "general"))));
    return (values.length ? values : fallbackChips).slice(0, 10);
  }, [topics, fallbackChips]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#a5232f]">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>Daily News Pulse · Live</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">{greeting}</h1>
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_230px]">
          <div className="max-h-[275px] overflow-y-auto pr-1">
            {topics.map((topic) => {
              const selected = topic.key === active?.key;
              return (
                <Link
                  key={topic.key}
                  href={`/story/${topic.slug}`}
                  onMouseEnter={() => setActiveKey(topic.key)}
                  onFocus={() => setActiveKey(topic.key)}
                  onPointerEnter={() => setActiveKey(topic.key)}
                  className={`group flex items-center gap-2 rounded-lg border-l-2 px-3 py-2 text-[13px] leading-5 transition-colors ${selected ? "border-[#a5232f] bg-[#f8e8e8] font-black text-[#7f1822]" : "border-transparent font-semibold text-[#514b45] hover:bg-[#f4eee5] hover:text-[#7f1822]"}`}
                >
                  <span className="w-4 shrink-0 text-[9px]">{flag}</span>
                  <span className="line-clamp-2 group-hover:underline">{topic.title}</span>
                  {topic.sourceCount > 1 ? <span className="ml-auto shrink-0 text-[9px] font-black text-[#a5232f]">{topic.sourceCount}</span> : null}
                </Link>
              );
            })}
          </div>

          <div className="min-h-[220px] rounded-xl border-l-2 border-[#a5232f] bg-[#efe8dc] p-4 transition-all" aria-live="polite">
            {active ? (
              <>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#a5232f]">Selected topic</p>
                <Link href={`/story/${active.slug}`} className="mt-2 block text-[15px] font-black leading-5 text-[#1d1b19] hover:text-[#7f1822] hover:underline">
                  {active.title}
                </Link>
                <p className="mt-2 line-clamp-7 text-[12px] leading-5 text-[#5f5851]">{active.summary}</p>
                <p className="mt-3 text-[9px] font-bold text-[#746e66]">
                  {active.sourceCount} source{active.sourceCount === 1 ? "" : "s"} · {active.source}
                </p>
              </>
            ) : null}
          </div>
        </div>

        <p className="mt-4 border-t border-slate-100 pt-3 text-[9px] font-semibold italic text-slate-400">
          Live {regionLabel} edition · {storyCount} linked stories · {sourceCount} outlets
        </p>
      </div>

      <div className="border-t border-slate-200 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Trending Topics</p>
          <Link href="/topics" className="text-[9px] font-bold text-[#746e66] transition-colors hover:text-[#7f1822]">Explore all →</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map((name, index) => (
            <Link key={name} href={`/search?q=${encodeURIComponent(name)}`} className={`rounded-full border px-3 py-1.5 text-[11px] font-black transition-colors ${index < 3 ? "border-[#d8a5aa] bg-[#f8e8e8] text-[#7f1822] hover:border-[#a5232f] hover:bg-[#f3d9dc]" : "border-[#d8d0c4] bg-[#fffdf8] text-[#5f5851] hover:border-[#a5232f] hover:bg-[#f8e8e8] hover:text-[#7f1822]"}`}>
              #{name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
