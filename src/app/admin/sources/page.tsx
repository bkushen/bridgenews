import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSourceHealthInfo } from "@/lib/source-health";
import { AdminFeedback } from "@/components/admin/admin-feedback";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { SourceLogo } from "@/components/source-logo";
import { deleteSource, updateSource } from "../control-actions";
import { testSource } from "./actions";
import { setSourceRegion } from "./relationships";

type SearchParams = Promise<{ q?: string; saved?: string; deleted?: string; error?: string; tested?: string; source?: string }>;

export default async function SourcesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const admin = await createClient();

  const [{ data: rawSources }, { data: regions }, { data: sourceRegions }] = await Promise.all([
    admin
      .from("sources")
      .select("id,name,slug,website_url,feed_url,source_type,logo_url,enabled,auto_publish,default_language_code,fetch_interval_minutes,max_items_per_fetch,last_success_at,last_error_at,last_error_message,consecutive_failures")
      .order("name"),
    admin.from("regions").select("id,name,slug,is_active").order("name"),
    admin.from("source_regions").select("source_id,region_id,is_primary"),
  ]);

  const allSources = rawSources ?? [];
  const sources = q
    ? allSources.filter((source: any) =>
        [source.name, source.website_url, source.source_type, source.default_language_code]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(q)),
      )
    : allSources;

  const primaryRegion = new Map(
    (sourceRegions ?? []).filter((row: any) => row.is_primary).map((row: any) => [row.source_id, row.region_id]),
  );
  const regionName = new Map((regions ?? []).map((row: any) => [row.id, row.name]));
  const healthy = allSources.filter(
    (source: any) => source.enabled && !source.last_error_message && Number(source.consecutive_failures ?? 0) === 0,
  ).length;
  const attention = allSources.filter(
    (source: any) => Boolean(source.last_error_message) || Number(source.consecutive_failures ?? 0) > 0,
  ).length;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <AdminFeedback saved={params.saved === "1"} deleted={params.deleted === "1"} error={params.error ?? null} />
      {params.tested === "ok" ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          Feed test passed{params.source ? ` for ${params.source}` : ""}. The URL returned a valid-looking RSS or Atom feed.
        </div>
      ) : null}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Publishing network</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Sources</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
            Manage publisher identity, feeds, logos, regions and automatic publishing.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">{healthy} healthy</span>
          {attention > 0 ? <span className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-black text-amber-700">{attention} need attention</span> : null}
          <Link href="/admin/sources/new" className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-black text-white hover:bg-gray-800">
            + Add publisher
          </Link>
        </div>
      </div>

      <form className="mt-6 flex max-w-2xl gap-2" action="/admin/sources">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search publisher, website, type or language…"
          className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />
        <button className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-black hover:bg-gray-50">Search</button>
        {q ? <Link href="/admin/sources" className="rounded-xl px-3 py-3 text-sm font-bold text-gray-500 hover:bg-gray-100">Clear</Link> : null}
      </form>

      <p className="mt-3 text-xs font-semibold text-gray-400">
        Showing {sources.length} of {allSources.length} publishers
      </p>

      <div className="mt-5 space-y-4">
        {sources.map((source: any) => {
          const bad = Boolean(source.last_error_message) || Number(source.consecutive_failures ?? 0) > 0;
          const sourceRegionName = regionName.get(primaryRegion.get(source.id)) ?? "No region";
          const healthInfo = getSourceHealthInfo(source.last_error_message, Number(source.consecutive_failures ?? 0));

          return (
            <article key={source.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <SourceLogo name={source.name} src={source.logo_url} className="h-14 w-14" imageClassName="p-1.5" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-lg font-black">{source.name}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${bad ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {bad ? "Needs attention" : "Healthy"}
                      </span>
                      {!source.enabled ? <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-black text-gray-600">Disabled</span> : null}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-gray-500">
                      {sourceRegionName} · {source.default_language_code?.toUpperCase()} · {source.source_type?.toUpperCase()} · every {source.fetch_interval_minutes} min
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-400">{source.website_url}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-lg px-3 py-2 text-xs font-black ${source.auto_publish ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {source.auto_publish ? "Auto publish" : "Review first"}
                  </span>
                </div>
              </div>

              <details className="border-t border-gray-100">
                <summary className="cursor-pointer list-none px-5 py-4 text-sm font-black text-gray-700 hover:bg-gray-50">
                  Edit publisher settings <span className="text-gray-400">▾</span>
                </summary>
                <div className="border-t border-gray-100 bg-gray-50/60 p-5">
                  <form action={updateSource}>
                    <input type="hidden" name="id" value={source.id} />
                    <div className="grid gap-6 xl:grid-cols-2">
                      <section>
                        <h3 className="text-sm font-black">Identity & links</h3>
                        <p className="mt-1 text-xs text-gray-500">What visitors see and where BridgeNews fetches content.</p>
                        <div className="mt-4 space-y-4">
                          <Field label="Publisher name"><input name="name" defaultValue={source.name} required className={inputClass} /></Field>
                          <Field label="Website URL"><input name="website_url" type="url" defaultValue={source.website_url} required className={inputClass} /></Field>
                          <Field label="Feed URL" hint="Leave empty for non-RSS sources."><input name="feed_url" type="url" defaultValue={source.feed_url ?? ""} className={inputClass} /></Field>
                          <Field label="Logo URL" hint="Use a stable direct image URL (PNG, SVG, WebP or JPG)."><input name="logo_url" type="url" defaultValue={source.logo_url ?? ""} className={inputClass} /></Field>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-sm font-black">Publishing behaviour</h3>
                        <p className="mt-1 text-xs text-gray-500">Control language, polling frequency and automatic publishing.</p>
                        <div className="mt-4 space-y-4">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Field label="Language">
                              <select name="default_language_code" defaultValue={source.default_language_code} className={inputClass}>
                                <option value="en">English</option><option value="si">Sinhala</option><option value="ta">Tamil</option>
                              </select>
                            </Field>
                            <Field label="Fetch interval" hint="Minutes">
                              <input name="fetch_interval_minutes" type="number" min={5} defaultValue={source.fetch_interval_minutes} className={inputClass} />
                            </Field>
                          </div>
                          <Field label="Max items per fetch">
                            <input name="max_items_per_fetch" type="number" min={1} max={100} defaultValue={source.max_items_per_fetch} className={inputClass} />
                          </Field>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold">
                              <input type="checkbox" name="enabled" defaultChecked={source.enabled} /> Enabled source
                            </label>
                            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold">
                              <input type="checkbox" name="auto_publish" defaultChecked={source.auto_publish} /> Auto publish
                            </label>
                          </div>
                        </div>
                      </section>
                    </div>

                    {healthInfo ? (
                      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-black">{healthInfo.title}</p>
                            <p className="mt-1 text-xs leading-5">{healthInfo.message}</p>
                            <p className="mt-2 text-xs font-bold leading-5 text-amber-800">Recommended: {healthInfo.recommendation}</p>
                          </div>
                          {!source.enabled ? <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">Currently disabled</span> : null}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
                        Last successful fetch: {source.last_success_at ? new Date(source.last_success_at).toLocaleString("en-AU") : "Not recorded yet"}
                      </div>
                    )}

                    <div className="mt-5 flex flex-col-reverse gap-2 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <ConfirmSubmitButton
                        formAction={deleteSource}
                        label="Delete publisher"
                        pendingLabel="Deleting…"
                        confirmMessage={`Delete ${source.name}? This cannot be undone.`}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-50"
                      />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button formAction={testSource} className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-black text-blue-700 hover:bg-blue-100">Test feed</button>
                        <button className="rounded-xl bg-gray-950 px-6 py-2.5 text-sm font-black text-white hover:bg-gray-800">Save changes</button>
                      </div>
                    </div>
                  </form>

                  <form action={setSourceRegion} className="mt-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-end">
                    <input type="hidden" name="source_id" value={source.id} />
                    <label className="flex-1 text-xs font-black uppercase tracking-wide text-gray-400">
                      Primary region
                      <select name="region_id" defaultValue={primaryRegion.get(source.id) ?? ""} className={inputClass}>
                        <option value="" disabled>Choose region</option>
                        {(regions ?? []).map((region: any) => <option key={region.id} value={region.id}>{region.name}{region.is_active ? "" : " (inactive)"}</option>)}
                      </select>
                    </label>
                    <button className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black hover:bg-gray-50">Save region</button>
                  </form>
                </div>
              </details>
            </article>
          );
        })}

        {sources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="font-black">No publishers found</p>
            <p className="mt-1 text-sm text-gray-500">Try a different search term.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

const inputClass = "mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-gray-900 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-black uppercase tracking-wide text-gray-400">
      {label}
      {children}
      {hint ? <span className="mt-1 block text-[11px] font-semibold normal-case tracking-normal text-gray-400">{hint}</span> : null}
    </label>
  );
}
