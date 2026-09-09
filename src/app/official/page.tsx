import { getOfficialLiveItems } from "@/lib/data/official";

export default async function OfficialPage() {
  const items = await getOfficialLiveItems();
  const liveCount = items.filter((item) => item.status === "live").length;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="border-b border-gray-200 pb-6">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">Primary information</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Official Sri Lanka Alerts & Notices</h1>
        <p className="mt-3 max-w-3xl leading-7 text-gray-600">Live first-party status cards from government and public-service websites. BridgeNews only surfaces short public headings here and links straight back to the authority.</p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Live sources</p><p className="mt-2 text-4xl font-black">{liveCount}/{items.length}</p><p className="mt-1 text-xs text-gray-500">responding on this refresh</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Refresh</p><p className="mt-2 text-2xl font-black">10 min</p><p className="mt-1 text-xs text-gray-500">server cache interval</p></div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Source type</p><p className="mt-2 text-2xl font-black">Official</p><p className="mt-1 text-xs text-gray-500">kept separate from media reports</p></div>
      </section>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.key} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4"><div className="text-3xl">{item.icon}</div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${item.status === "live" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{item.status === "live" ? "Live" : "Open source"}</span></div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">Official source</p>
            <h2 className="mt-1 text-xl font-black">{item.name}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{item.label}</p>
            {item.latest.length ? <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">{item.latest.slice(0,4).map((headline) => <p key={headline} className="text-sm font-bold leading-5 text-gray-800">• {headline}</p>)}</div> : <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">The authority page did not expose a short headline list on this refresh. Use the direct link for the latest information.</p>}
            <a href={item.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex rounded-full bg-gray-950 px-4 py-2.5 text-sm font-black text-white">Open official website ↗</a>
          </article>
        ))}
      </div>
    </main>
  );
}
