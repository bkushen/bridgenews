import type { Metadata } from "next";
import Link from "next/link";
import { StoryCard } from "@/components/story-card";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { getStories } from "@/lib/data/stories";
import { EDITIONS, getActiveRegion } from "@/lib/region-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Daily News Brief", description: "A concise regional daily news brief with links to original publishers.", alternates: { canonical: "/brief" } };

export default async function DailyBriefPage() {
  const region = await getActiveRegion();
  const edition = EDITIONS[region];
  const [top, latest] = await Promise.all([
    getStories({ region, limit: 9, trending: true }),
    getStories({ region, limit: 12 }),
  ]);
  const date = new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeZone: edition.timeZone }).format(new Date());

  return <main className="mx-auto max-w-[1180px] px-5 py-8 sm:py-10">
    <header className="border-b border-[var(--news-line)] pb-7">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--news-accent)]">{edition.flag} BridgeNews {edition.label} Daily Brief</p>
      <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div><h1 className="font-serif text-4xl font-black tracking-tight text-[var(--news-ink)] sm:text-5xl">The day in {edition.label}.</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--news-muted)]">{date}. Ranked from verified, currently published {edition.adjective} coverage. BridgeNews links readers to the original publishers.</p></div>
        <Link href="/latest" className="shrink-0 rounded-full border border-[var(--news-line)] px-4 py-2 text-xs font-black text-[var(--news-ink)]">See every latest story →</Link>
      </div>
    </header>

    <section className="py-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--news-muted)]">Lead coverage</p><h2 className="mt-1 font-serif text-2xl font-black">Most important now</h2></div><Link href="/trending" className="text-xs font-black text-[var(--news-accent)]">Trending →</Link></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{top.map((story)=><StoryCard key={story.slug} story={story}/>)}</div></section>

    <section className="border-t border-[var(--news-line)] py-8"><div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl font-black">Latest from {edition.label}</h2><span className="text-xs font-black text-[var(--news-muted)]">{latest.length} stories</span></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{latest.slice(0,9).map((story)=><StoryCard key={story.slug} story={story}/>)}</div></section>

    <section className="rounded-3xl bg-[#211d19] p-6 text-[#fffaf3] sm:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#c9bdb0]">Make BridgeNews a habit</p><h2 className="mt-2 font-serif text-3xl font-black text-[#fffaf3]">Get the {edition.label} brief in your inbox.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[#cfc4b8]">A daily digest focused on your selected edition. No AI-generated reporting and no full article republishing.</p></div><NewsletterSignup source={`daily-brief-${region}`} compact /></div></section>
  </main>;
}
