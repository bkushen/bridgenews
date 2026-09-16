import type { Metadata } from "next";
import { WhatsOnExplorer } from "@/components/whats-on-explorer";
import { EDITIONS, getActiveRegion } from "@/lib/region-context";
import { getWhatsOnItems } from "@/lib/data/whats-on";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "What's On",
  description: "Films now showing, stage dramas and local events for the selected BridgeNews edition.",
  alternates: { canonical: "/whats-on" },
};

const AUSTRALIA_GUIDES = [
  { name: "Melbourne", href: "https://whatson.melbourne.vic.gov.au/" },
  { name: "Sydney", href: "https://whatson.cityofsydney.nsw.gov.au/" },
  { name: "Perth", href: "https://visitperth.com/events" },
  { name: "Canberra", href: "https://events.canberra.com.au/whats-on" },
  { name: "Hobart", href: "https://www.hobartcity.com.au/Things-To-Do/Upcoming-events" },
  { name: "Palace Cinemas", href: "https://www.palacecinemas.com.au/movies/" },
  { name: "HOYTS", href: "https://www.hoyts.com.au/movies" },
  { name: "Event Cinemas", href: "https://www.eventcinemas.com.au/Movies/NowShowing" },
];

export default async function WhatsOnPage() {
  const region = await getActiveRegion();
  const edition = EDITIONS[region];
  const items = await getWhatsOnItems(region, 200);

  return <main className="mx-auto max-w-[1360px] px-4 py-8 sm:px-5 sm:py-10">
    <header className="border-b border-[var(--news-line)] pb-6">
      <h1 className="font-serif text-4xl font-black tracking-tight text-[var(--news-ink)] sm:text-5xl">🎭 What&apos;s On</h1>
      <p className="mt-2 max-w-4xl font-serif text-[15px] italic leading-7 text-[var(--news-muted)]">
        {region === "sri-lanka"
          ? "Films now showing, stage dramas and local events across Sri Lanka — tap through to the cinema or organiser to book."
          : region === "australia"
            ? "Movies, theatre, concerts, sport, festivals and local events across Australia — browse nationally or narrow the catalogue by city."
            : "Films, live shows and events from around the world — tap through to the cinema, venue or organiser to book."}
      </p>
      {region === "australia" ? <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full border border-[var(--news-line)] bg-[var(--news-card)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--news-ink)]">Australia-wide</span><span className="rounded-full border border-[var(--news-line)] bg-[var(--news-card)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--news-ink)]">City filters</span><span className="rounded-full border border-[var(--news-line)] bg-[var(--news-card)] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--news-ink)]">Movies + live events</span></div> : null}
    </header>

    <div className="mt-7"><WhatsOnExplorer items={items} regionLabel={edition.label} timeZone={edition.timeZone}/></div>

    {region === "australia" ? <section className="mt-10 border-t border-[var(--news-line)] pt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--news-muted)]">Australian discovery</p><h2 className="mt-1 font-serif text-2xl font-black text-[var(--news-ink)]">More city & cinema guides</h2></div><p className="max-w-xl text-xs leading-5 text-[var(--news-muted)]">Use these official and cinema guides when you want to browse beyond the listings currently indexed by BridgeNews.</p></div>
      <div className="mt-4 flex flex-wrap gap-2">{AUSTRALIA_GUIDES.map((guide)=><a key={guide.href} href={guide.href} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--news-line)] bg-[var(--news-card)] px-3 py-2 text-[11px] font-bold text-[var(--news-ink)] transition hover:-translate-y-0.5 hover:border-[var(--news-accent)] hover:text-[var(--news-accent)]">{guide.name} ↗</a>)}</div>
    </section> : null}
  </main>;
}
