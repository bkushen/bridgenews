import Link from "next/link";
import { getDistrictGroups } from "@/lib/data/portal";

export default async function MapPage() {
  const districts = await getDistrictGroups();
  const covered = districts.filter((district) => district.count > 0);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="border-b border-gray-200 pb-6"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Local coverage</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Sri Lanka News Map</h1><p className="mt-3 max-w-3xl leading-7 text-gray-600">Explore current reporting by Sri Lankan district. District matching is deterministic from place names in publisher headlines and feed snippets.</p></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-gray-200 bg-gradient-to-b from-emerald-50 to-white p-5 shadow-sm">
          <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {districts.map((district) => <Link key={district.slug} href={`/map/${district.slug}`} className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${district.count ? "border-emerald-200 bg-white" : "border-gray-200 bg-white/60"}`}><div className="flex items-start justify-between gap-2"><span className="text-xl">📍</span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${district.count ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-400"}`}>{district.count}</span></div><h2 className="mt-3 text-sm font-black">{district.name}</h2></Link>)}
          </div>
        </section>
        <aside className="rounded-3xl bg-gray-950 p-6 text-white shadow-sm"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-400">Coverage now</p><p className="mt-3 text-5xl font-black">{covered.length}</p><p className="mt-1 text-sm text-gray-400">districts mentioned in recent stories</p><div className="mt-6 space-y-3">{covered.slice(0,8).map((district) => <Link key={district.slug} href={`/map/${district.slug}`} className="flex items-center justify-between border-b border-white/10 pb-3 text-sm font-bold"><span>{district.name}</span><span className="text-gray-400">{district.count}</span></Link>)}</div></aside>
      </div>
    </main>
  );
}
