import { createClient } from "@/lib/supabase/server";
import { AdminFeedback } from "@/components/admin/admin-feedback";
import { moveHomepageSection, saveHomepageSection } from "./actions";

type SearchParams = Promise<{ saved?: string; error?: string }>;

export default async function AdminHomepage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const admin = await createClient();
  const { data } = await admin
    .from("homepage_sections")
    .select("id,section_key,label,enabled,sort_order")
    .order("sort_order", { ascending: true })
    .order("section_key", { ascending: true });

  const sections = data ?? [];
  const enabledCount = sections.filter((section: any) => section.enabled).length;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <AdminFeedback saved={params.saved === "1"} error={params.error ?? null} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Homepage layout</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Homepage</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Turn major homepage sections on or off and control their display order.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">{enabledCount} enabled</span>
          <span className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-black text-gray-600">{sections.length} total</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-800">
        <p className="font-black">Easy ordering</p>
        <p className="mt-1 text-xs leading-5">Use Move up / Move down for normal changes. The order number is available for precise control.</p>
      </div>

      <div className="mt-5 space-y-3">
        {sections.map((section: any, index: number) => (
          <article key={section.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-100 text-sm font-black text-gray-500">{index + 1}</div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-black text-gray-950">{section.label}</h2>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${section.enabled ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {section.enabled ? "Visible" : "Hidden"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-gray-400">{section.section_key}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <form action={moveHomepageSection}>
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button disabled={index === 0} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35">↑ Move up</button>
                </form>
                <form action={moveHomepageSection}>
                  <input type="hidden" name="id" value={section.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button disabled={index === sections.length - 1} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35">↓ Move down</button>
                </form>
              </div>
            </div>

            <form action={saveHomepageSection} className="mt-4 grid gap-3 border-t border-gray-100 pt-4 sm:grid-cols-[1fr_160px_auto] sm:items-end">
              <input type="hidden" name="id" value={section.id} />
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold">
                <input type="checkbox" name="enabled" defaultChecked={section.enabled} />
                Show this section on homepage
              </label>
              <label className="text-xs font-black uppercase tracking-wide text-gray-400">
                Order number
                <input name="sort_order" type="number" defaultValue={section.sort_order} className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100" />
              </label>
              <button className="rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-black text-white hover:bg-gray-800">Save</button>
            </form>
          </article>
        ))}
      </div>
    </main>
  );
}
