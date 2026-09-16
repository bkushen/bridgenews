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

type Hashtag = { label: string; score: number; mentions: number };

const TAG_STOP_WORDS = new Set([
  "a","an","and","are","as","at","be","been","being","but","by","for","from","has","have","in","into","is","it","its","latest","live","new","news","of","on","or","over","says","the","their","this","to","update","updates","was","were","will","with","after","before","amid","about","against","through","during","more","than","now","today","tomorrow","yesterday"
]);

function titleWords(title: string) {
  return title.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) ?? [];
}

function cleanTagWord(word: string) {
  return word.replace(/^[.'’-]+|[.'’-]+$/g, "").trim();
}

function hashtagKey(label: string) {
  return label.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function buildHashtags(topics: RegionalPulseTopic[], fallback: string[]): Hashtag[] {
  const scores = new Map<string, Hashtag>();

  const add = (label: string, score: number, mentionKey: string) => {
    const cleaned = label.replace(/\s+/g, " ").trim();
    if (!cleaned || cleaned.length < 3 || cleaned.length > 42) return;
    const key = hashtagKey(cleaned);
    const existing = scores.get(key);
    const mentionToken = `${key}|${mentionKey}`;
    if (!existing) {
      scores.set(key, { label: cleaned, score, mentions: 1, _seen: new Set([mentionToken]) } as Hashtag & { _seen: Set<string> });
      return;
    }
    const enriched = existing as Hashtag & { _seen?: Set<string> };
    enriched._seen ??= new Set();
    if (!enriched._seen.has(mentionToken)) {
      enriched._seen.add(mentionToken);
      enriched.mentions += 1;
    }
    enriched.score += score;
  };

  topics.forEach((topic, topicIndex) => {
    const weight = 1 + Math.min(topic.sourceCount, 6) * 0.55 + Math.max(0, 8 - topicIndex) * 0.08;
    const category = topic.category?.trim();
    if (category && category.toLocaleLowerCase() !== "general") add(category, 7 * weight, topic.key);

    const words = titleWords(topic.title)
      .map(cleanTagWord)
      .filter(Boolean);
    const useful = words.filter((word) => !TAG_STOP_WORDS.has(word.toLocaleLowerCase()) && !/^\d+$/.test(word));

    useful.forEach((word) => {
      if (word.length >= 4) add(word, 1.35 * weight, topic.key);
    });

    for (let i = 0; i < useful.length - 1; i += 1) {
      const pair = `${useful[i]} ${useful[i + 1]}`;
      add(pair, 3.3 * weight, topic.key);
    }

    if (topic.sourceCount > 1) {
      for (let i = 0; i < useful.length - 2; i += 1) {
        const phrase = `${useful[i]} ${useful[i + 1]} ${useful[i + 2]}`;
        add(phrase, 2.6 * weight, topic.key);
      }
    }
  });

  const ranked = [...scores.values()]
    .filter((tag) => tag.mentions >= 2 || tag.score >= 7)
    .sort((a, b) => b.score - a.score || b.mentions - a.mentions || a.label.length - b.label.length);

  const selected: Hashtag[] = [];
  for (const candidate of ranked) {
    const key = hashtagKey(candidate.label);
    const overlaps = selected.some((chosen) => {
      const chosenKey = hashtagKey(chosen.label);
      return key === chosenKey || (key.includes(chosenKey) && chosenKey.length > 5 && candidate.mentions <= chosen.mentions) || (chosenKey.includes(key) && key.length > 5 && chosen.mentions >= candidate.mentions);
    });
    if (!overlaps) selected.push(candidate);
    if (selected.length >= 12) break;
  }

  if (selected.length < 8) {
    fallback.forEach((label, index) => {
      const key = hashtagKey(label);
      if (!selected.some((tag) => hashtagKey(tag.label) === key)) selected.push({ label, score: 1 - index * 0.01, mentions: 1 });
    });
  }

  return selected.slice(0, 12);
}

export function RegionalPulseBoard({ regionLabel, flag, greeting, topics, storyCount, sourceCount, fallbackChips }: Props) {
  const [activeKey, setActiveKey] = useState(topics[0]?.key ?? "");
  const active = topics.find((topic) => topic.key === activeKey) ?? topics[0];
  const hashtags = useMemo(() => buildHashtags(topics, fallbackChips), [topics, fallbackChips]);

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
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Trending Topics</p>
            <p className="mt-1 text-[9px] text-slate-400">Live tags from repeated names, places and issues in this edition</p>
          </div>
          <Link href="/topics" className="shrink-0 text-[9px] font-bold text-[#746e66] transition-colors hover:text-[#7f1822]">Explore all →</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {hashtags.map((tag, index) => (
            <Link
              key={tag.label}
              href={`/search?q=${encodeURIComponent(tag.label)}`}
              title={`${tag.mentions} live topic mention${tag.mentions === 1 ? "" : "s"}`}
              className={`group inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-black transition-all hover:-translate-y-0.5 ${index < 3 ? "border-[#d8a5aa] bg-[#f8e8e8] text-[12px] text-[#7f1822] hover:border-[#a5232f] hover:bg-[#f3d9dc]" : "border-[#d8d0c4] bg-[#fffdf8] text-[11px] text-[#5f5851] hover:border-[#a5232f] hover:bg-[#f8e8e8] hover:text-[#7f1822]"}`}
            >
              <span>#</span><span>{tag.label}</span>{tag.mentions > 1 ? <span className="ml-0.5 text-[8px] font-bold opacity-55">{tag.mentions}</span> : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
