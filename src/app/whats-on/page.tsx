import type { Metadata } from "next";
import { WhatsOnExplorer } from "@/components/whats-on-explorer";
import { EDITIONS, getActiveRegion } from "@/lib/region-context";
import { getWhatsOnItems, whatsOnSources } from "@/lib/data/whats-on";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "What's On",
  description: "Upcoming movies, theatre, concerts, comedy, sports, festivals, family and arts listings for the selected BridgeNews edition.",
  alternates: { canonical: "/whats-on" },
};

export default async function WhatsOnPage() {
  const region = await getActiveRegion();
  const edition = EDITIONS[region];
  const [items, sources] = await Promise.all([
    getWhatsOnItems(region, 80),
    Promise.resolve(whatsOnSources(region)),
  ]);

  return <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-5 sm:py-10">
    <header className="border-b border-[var(--news-line)] pb-6">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--news-accent)]">{edition.flag} {edition.label} edition</p>
      <h1 className="mt-2 font-serif text-4xl font-black tracking-tight text-[var(--news-ink)] sm:text-5xl">What&apos;s On</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--news-muted)]">Latest and upcoming films, stage shows, concerts, comedy, sport, festivals, family activities and arts listings from cinema and event organisers. This section does not use news articles.</p>
    </header>

    <div className="mt-7"><WhatsOnExplorer items={items} regionLabel={edition.label} timeZone={edition.timeZone}/></div>

    <section className="mt-8 border-t border-[var(--news-line)] pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--news-muted)]">Live listing sources</p><h2 className="mt-1 font-serif text-xl font-black text-[var(--news-ink)]">Where the listings come from</h2></div><p className="max-w-xl text-xs leading-5 text-[var(--news-muted)]">BridgeNews links to the organiser, cinema or ticket provider for current details and booking. Listings can temporarily disappear when an external source is unavailable.</p></div>
      <div className="mt-4 flex flex-wrap gap-2">{sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--news-line)] bg-[var(--news-card)] px-3 py-2 text-[11px] font-bold text-[var(--news-ink)] transition hover:-translate-y-0.5 hover:border-[var(--news-accent)] hover:text-[var(--news-accent)]">{source.name} ↗</a>)}</div>
    </section>
  </main>;
}
