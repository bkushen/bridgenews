import Link from "next/link";
import { createAdminClient, hasSupabaseServerConfig } from "@/lib/supabase/admin";
import { adminSources, type AdminSource } from "@/lib/admin/mock-sources";

async function getSources(): Promise<AdminSource[]> {
  if (!hasSupabaseServerConfig()) return adminSources;
  const admin = createAdminClient();
  const { data, error } = await admin.from("sources").select("id,name,source_type,enabled,auto_publish,fetch_interval_minutes,last_fetched_at,last_error_message,consecutive_failures").order("name");
  if (error || !data) return adminSources;
  return data.map((s) => ({
    name: s.name,
    region: "International",
    type: s.source_type === "api" ? "API" : "RSS",
    status: s.enabled && !s.last_error_message && (s.consecutive_failures ?? 0) === 0 ? "Healthy" : "Needs review",
    autoPublish: Boolean(s.auto_publish),
    interval: `${s.fetch_interval_minutes} min`,
    lastFetch: s.last_fetched_at ? new Date(s.last_fetched_at).toLocaleString("en-AU") : "Never",
    newItems: 0,
    duplicates: 0,
  }));
}

export default async function SourcesPage() {
  const sources = await getSources();
  const live = hasSupabaseServerConfig();
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Admin / Sources</p><h1 className="mt-2 text-4xl font-black">Content sources</h1><p className="mt-3 max-w-2xl text-gray-600">Manage Sri Lankan, Australian and international RSS/API sources, ingestion health and publication mode.</p></div>
        <Link href="/admin/sources/new" className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white">+ Add source</Link>
      </div>
      {!live && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Preview data is shown until Supabase environment variables are configured.</div>}
      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-[var(--border)] bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-4">Source</th><th className="px-5 py-4">Region</th><th className="px-5 py-4">Health</th><th className="px-5 py-4">Publish</th><th className="px-5 py-4">Schedule</th><th className="px-5 py-4">Last fetch</th><th className="px-5 py-4">Result</th></tr></thead><tbody>{sources.map((source) => <tr key={source.name} className="border-b border-[var(--border)] last:border-0"><td className="px-5 py-5"><div className="font-bold">{source.name}</div><div className="mt-1 text-xs text-gray-500">{source.type}</div></td><td className="px-5 py-5">{source.region}</td><td className="px-5 py-5"><span className={`rounded-full px-3 py-1 text-xs font-bold ${source.status === "Healthy" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{source.status}</span></td><td className="px-5 py-5"><span className="font-semibold">{source.autoPublish ? "Automatic" : "Review first"}</span></td><td className="px-5 py-5">Every {source.interval}</td><td className="px-5 py-5">{source.lastFetch}</td><td className="px-5 py-5"><span className="font-bold">{source.newItems}</span> new · {source.duplicates} dupes</td></tr>)}</tbody></table></div></div>
      <section className="mt-8 grid gap-4 lg:grid-cols-3"><div className="rounded-2xl border border-[var(--border)] bg-white p-6"><div className="text-sm font-bold text-gray-500">DEFAULT SAFETY</div><h2 className="mt-2 text-xl font-black">Review first</h2><p className="mt-2 text-sm leading-6 text-gray-600">New sources default to review mode. Turn on automatic publishing only after feed quality and attribution are verified.</p></div><div className="rounded-2xl border border-[var(--border)] bg-white p-6"><div className="text-sm font-bold text-gray-500">DUPLICATES</div><h2 className="mt-2 text-xl font-black">Idempotent ingestion</h2><p className="mt-2 text-sm leading-6 text-gray-600">Canonical URLs and source item IDs prevent the same feed entry from being published twice.</p></div><div className="rounded-2xl border border-[var(--border)] bg-white p-6"><div className="text-sm font-bold text-gray-500">NEXT LAYER</div><h2 className="mt-2 text-xl font-black">AI processing</h2><p className="mt-2 text-sm leading-6 text-gray-600">The next processor will generate summaries, detect regions/topics and cluster different publishers covering the same story.</p></div></section>
    </main>
  );
}
