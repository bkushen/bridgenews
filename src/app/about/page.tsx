export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">About BridgeNews</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">News discovery without the clutter.</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-gray-700">
        <p>BridgeNews is a news discovery platform focused on Sri Lanka, Australia and major international stories. It collects metadata from approved public feeds, organises stories by region and category, and sends readers to the original publisher for the full article.</p>
        <p>BridgeNews does not aim to replace publishers. Headlines, publisher names, images where supplied by feeds, and source links are used to help readers discover reporting from the organisations that created it.</p>
        <p>The current platform operates without AI. Categories, search, source health checks, duplicate protection and scheduled ingestion use deterministic application and database logic.</p>
      </div>
    </main>
  );
}
