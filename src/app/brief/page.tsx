import type { Metadata } from "next";
import Link from "next/link";
import { StoryCard } from "@/components/story-card";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { getStories } from "@/lib/data/stories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Daily News Brief",
  description: "A concise daily view of the biggest Sri Lanka, Australia and international stories, with links to original publishers.",
  alternates: { canonical: "/brief" },
};

export default async function DailyBriefPage() {
  const [top, sriLanka, australia, international] = await Promise.all([
    getStories({ limit: 9, trending: true }),
    getStories({ region: "sri-lanka", limit: 6 }),
    getStories({ region: "australia", limit: 6 }),
    getStories({ region: "international", limit: 6 }),
  ]);
  const date = new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeZone: "Australia/Melbourne" }).format(new Date());

  return <main className="mx-auto max-w-[1180px] px-5 py-8 sm:py-10">
    <header className="border-b border-[var(--news-line)] pb-7">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--news-accent)]">BridgeNews Daily Brief</p>
      <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div><h1 className="font-serif text-4xl font-black tracking-tight text-[var(--news-ink)] sm:text-5xl">The day, across three regions.</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--news-muted)]">{date}. Ranked from verified, currently published coverage. BridgeNews links readers to the original publishers.</p></div>
        <Link href="/latest" className="shrink-0 rounded-full border border-[var(--news-line)] px-4 py-2 text-xs font-black text-[var(--news-ink)]">See every latest story →</Link>
      </div>
    </header>

    <section className="py-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--news-muted)]">Lead coverage</p><h2 className="mt-1 font-serif text-2xl font-black">Most important now</h2></div><Link href="/trending" className="text-xs font-black text-[var(--news-accent)]">Trending →</Link></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{top.map((story)=><StoryCard key={story.slug} story={story}/>)}</div></section>

    <section className="grid gap-8 border-t border-[var(--news-line)] py-8 lg:grid-cols-3">
      <Region title="Sri Lanka" href="/region/sri-lanka" stories={sriLanka}/>
      <Region title="Australia" href="/region/australia" stories={australia}/>
      <Region title="International" href="/region/international" stories={international}/>
    </section>

    <section className="rounded-3xl bg-[#211d19] p-6 text-[#fffaf3] sm:p-8"><div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#c9bdb0]">Make BridgeNews a habit</p><h2 className="mt-2 font-serif text-3xl font-black">Get this brief in your inbox.</h2><p className="mt-3 max-w-xl text-sm leading-7 text-[#cfc4b8]">One daily digest covering Sri Lanka, Australia and major international stories. No AI-generated reporting and no full article republishing.</p></div><NewsletterSignup source="daily-brief" compact /></div></section>
  </main>;
}

function Region({ title, href, stories }: { title: string; href: string; stories: Awaited<ReturnType<typeof getStories>> }) {
  return <div><div className="mb-3 flex items-center justify-between border-b border-[var(--news-line)] pb-3"><h2 className="font-serif text-xl font-black">{title}</h2><Link href={href} className="text-xs font-black text-[var(--news-accent)]">More →</Link></div><div className="divide-y divide-[var(--news-line-soft)]">{stories.map((story, index)=><Link key={story.slug} href={`/story/${story.slug}`} className="grid grid-cols-[32px_1fr] gap-3 py-3 group"><span className="font-serif text-lg font-black text-[var(--news-muted)]">{String(index+1).padStart(2,"0")}</span><div><p className="font-serif text-base font-bold leading-snug text-[var(--news-ink)] group-hover:text-[var(--news-accent)]">{story.title}</p><p className="mt-1 text-[11px] font-semibold text-[var(--news-muted)]">{story.source} · {story.published}</p></div></Link>)}</div></div>;
}
