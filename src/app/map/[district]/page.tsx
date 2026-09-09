import { notFound } from "next/navigation";
import { PortalStoryRow } from "@/components/portal-story-row";
import { getDistrictBySlug, getDistrictGroups } from "@/lib/data/portal";

export default async function DistrictPage({ params }: { params: Promise<{ district: string }> }) {
  const { district } = await params;
  const group = getDistrictBySlug(await getDistrictGroups(), district);
  if (!group) notFound();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="border-b border-gray-200 pb-6"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">District coverage</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">📍 {group.name}</h1><p className="mt-3 text-gray-600">Recent stories whose publisher headline or feed snippet mentions {group.name}.</p></div>
      <section className="mt-7 rounded-2xl border border-gray-200 bg-white px-5 shadow-sm">{group.stories.length ? group.stories.map((story) => <PortalStoryRow key={story.articleId} story={story} />) : <p className="py-12 text-center text-gray-500">No recent district-specific stories yet.</p>}</section>
    </main>
  );
}
