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
            ? "Films now showing, theatre, concerts and local events across Australia — tap through to the cinema, venue or organiser to book."
            : "Films, live shows and events from around the world — tap through to the cinema, venue or organiser to book."}
      </p>
    </header>

    <div className="mt-7"><WhatsOnExplorer items={items} regionLabel={edition.label} timeZone={edition.timeZone}/></div>
  </main>;
}
