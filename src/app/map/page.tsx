import Link from "next/link";
import { getDistrictGroups } from "@/lib/data/portal";
import { getStories } from "@/lib/data/stories";
import { SriLankaLiveMap } from "@/components/sri-lanka-live-map";
import { EDITIONS, getActiveRegion } from "@/lib/region-context";

const AU_PLACES = ["Melbourne","Sydney","Brisbane","Perth","Adelaide","Canberra","Hobart","Darwin","Ballarat","Geelong","Gold Coast","Newcastle"];
const WORLD_PLACES = ["Asia","Europe","Americas","Middle East","Africa","Pacific","United States","United Kingdom","India","China","Japan","New Zealand"];

export default async function MapPage() {
  const region = await getActiveRegion();
  const edition = EDITIONS[region];

  if (region === "sri-lanka") {
    const districts = await getDistrictGroups();
    const covered = districts.filter((district) => district.count > 0);
    return <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="border-b border-gray-200 pb-6"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">🇱🇰 Sri Lanka · Local coverage</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Sri Lanka News Map</h1><p className="mt-3 max-w-3xl leading-7 text-gray-600">Explore current Sri Lankan reporting geographically. The live map uses OpenStreetMap, and every district marker opens its current BridgeNews coverage.</p></div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_360px]"><section className="rounded-3xl border border-gray-200 bg-white p-3 shadow-sm"><SriLankaLiveMap districts={districts.map(({ name, slug, count }) => ({ name, slug, count }))} /></section><aside className="rounded-3xl bg-gray-950 p-6 text-white shadow-sm"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-400">Coverage now</p><p className="mt-3 text-5xl font-black text-white">{covered.length}</p><p className="mt-1 text-sm text-gray-400">districts mentioned in recent stories</p><div className="mt-6 space-y-3">{covered.slice(0,10).map((district) => <Link key={district.slug} href={`/map/${district.slug}`} className="flex items-center justify-between border-b border-white/10 pb-3 text-sm font-bold text-white"><span>{district.name}</span><span className="text-gray-400">{district.count}</span></Link>)}</div></aside></div>
      <section className="mt-6"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">All districts</p><h2 className="mt-1 text-2xl font-black">Browse by district</h2></div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{districts.map((district) => <Link key={district.slug} href={`/map/${district.slug}`} className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${district.count ? "border-emerald-200 bg-white" : "border-gray-200 bg-white/60"}`}><div className="flex items-start justify-between gap-2"><span className="text-xl">📍</span><span className={`rounded-full px-2 py-1 text-[10px] font-black ${district.count ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-400"}`}>{district.count}</span></div><h3 className="mt-3 text-sm font-black">{district.name}</h3></Link>)}</div></section>
    </main>;
  }

  const stories = await getStories({ region, limit: 160 });
  const places = region === "australia" ? AU_PLACES : WORLD_PLACES;
  const counts = places.map((place) => ({ place, count: stories.filter((story) => `${story.title} ${story.summary}`.toLowerCase().includes(place.toLowerCase())).length })).sort((a,b) => b.count-a.count);

  return <main className="mx-auto max-w-7xl px-5 py-10">
    <div className="border-b border-gray-200 pb-6"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">{edition.flag} {edition.label} · Location explorer</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{edition.label} News by Place</h1><p className="mt-3 max-w-3xl leading-7 text-gray-600">Browse current {edition.adjective} coverage by places mentioned in the live regional feed.</p></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">{counts.map(({place,count}) => <Link key={place} href={`/search?q=${encodeURIComponent(place)}&region=${region}`} className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-center justify-between"><span className="text-2xl">📍</span><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-500">{count}</span></div><h2 className="mt-4 text-xl font-black group-hover:text-[var(--news-accent)]">{place}</h2><p className="mt-2 text-sm text-gray-500">Open current coverage →</p></Link>)}</div>
  </main>;
}
