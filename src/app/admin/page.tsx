import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

async function count(table: string, filter?: (q: any) => any) {
  const admin = createAdminClient();
  let q = admin.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

function MetricCard({ label, value, hint, href, tone = "default" }: { label: string; value: string | number; hint: string; href: string; tone?: "default" | "good" | "warn" }) {
  const toneClass = tone === "good" ? "bg-emerald-50 text-emerald-700" : tone === "warn" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-700";
  return <Link href={href} className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.13em] text-gray-400">{label}</p><p className="mt-2 text-3xl font-black tracking-tight">{value}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${toneClass}`}>{tone === "good" ? "Healthy" : tone === "warn" ? "Check" : "Manage"}</span></div><p className="mt-3 text-sm leading-5 text-gray-500">{hint}</p><p className="mt-4 text-xs font-black text-gray-700 group-hover:text-black">Open →</p></Link>;
}

const quickActions = [
  ["Add a publisher", "Create a new news source and assign its region.", "/admin/sources/new", "+"],
  ["Review articles", "Edit, publish, hide or reclassify recent articles.", "/admin/articles", "▤"],
  ["Arrange homepage", "Turn homepage sections on/off and control their order.", "/admin/homepage", "⌘"],
  ["Run ingestion", "Refresh news, logos or article images manually.", "/admin/ingestion", "↻"],
  ["Manage users", "Review readers and admin access.", "/admin/users", "♙"],
  ["Site settings", "Change branding, defaults and maintenance mode.", "/admin/settings", "⚙"],
] as const;

export default async function AdminPage() {
  const admin = createAdminClient();
  const [articles, published, sources, activeSources, categories, topics, runs, audit] = await Promise.all([
    count("articles"), count("articles", (q) => q.eq("status", "published")), count("sources"), count("sources", (q) => q.eq("enabled", true)), count("categories"), count("topics"), count("ingestion_runs"), count("admin_audit_log"),
  ]);
  const { data: latestRuns } = await admin.from("ingestion_runs").select("id,started_at,fetched_count,inserted_count,failed_count,error_message,sources(name)").order("started_at", { ascending: false }).limit(6);
  const recentErrors = (latestRuns ?? []).filter((run:any)=>run.error_message || Number(run.failed_count) > 0).length;
  const publishedRate = articles ? Math.round((published / articles) * 100) : 0;

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2"><span className="rounded-full bg-gray-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-white">Control Center</span><span className="text-xs font-bold text-gray-400">BridgeNews</span></div><h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Good to see you.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">Manage publishing, homepage content, sources, users and system health from one place.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/sources/new" className="rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-black text-white hover:bg-gray-800">+ Add source</Link><Link href="/" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-black text-gray-700 hover:bg-gray-50">View website ↗</Link></div></div>
    </section>

    <section className="mt-6"><div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">At a glance</p><h2 className="mt-1 text-xl font-black">Website status</h2></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Articles" value={articles.toLocaleString()} hint={`${publishedRate}% currently published`} href="/admin/articles" tone="good"/><MetricCard label="Active sources" value={`${activeSources}/${sources}`} hint="Publishers currently enabled" href="/admin/sources" tone={activeSources === sources ? "good" : "warn"}/><MetricCard label="Taxonomy" value={categories + topics} hint={`${categories} categories · ${topics} topics`} href="/admin/categories"/><MetricCard label="Recent ingestion" value={recentErrors ? `${recentErrors} issue${recentErrors===1?"":"s"}` : "Healthy"} hint={`${runs.toLocaleString()} total ingestion runs`} href="/admin/ingestion" tone={recentErrors ? "warn" : "good"}/></div></section>

    <section className="mt-7"><div className="mb-3"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Common tasks</p><h2 className="mt-1 text-xl font-black">Quick actions</h2></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{quickActions.map(([title,sub,href,icon])=><Link key={href} href={href} className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gray-100 text-lg font-black text-gray-700 group-hover:bg-gray-950 group-hover:text-white">{icon}</span><div><h3 className="font-black">{title}</h3><p className="mt-1 text-sm leading-5 text-gray-500">{sub}</p></div></Link>)}</div></section>

    <section className="mt-7 grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 px-5 py-4"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">System activity</p><h2 className="mt-1 text-lg font-black">Latest ingestion runs</h2></div><Link href="/admin/ingestion" className="text-xs font-black text-gray-500 hover:text-black">View all →</Link></div><div className="divide-y divide-gray-100">{(latestRuns ?? []).length ? (latestRuns ?? []).map((run:any)=>{const bad=run.error_message || Number(run.failed_count)>0;return <div key={run.id} className="flex items-center gap-3 px-5 py-4"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${bad?"bg-amber-500":"bg-emerald-500"}`}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{run.sources?.name ?? "System task"}</p><p className="mt-0.5 text-xs text-gray-500">{new Date(run.started_at).toLocaleString("en-AU")} · {run.inserted_count} inserted · {run.failed_count} failed</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${bad?"bg-amber-50 text-amber-700":"bg-emerald-50 text-emerald-700"}`}>{bad?"Needs check":"OK"}</span></div>}) : <p className="p-5 text-sm text-gray-500">No ingestion runs yet.</p>}</div></div>

      <aside className="space-y-4"><div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Admin activity</p><p className="mt-2 text-3xl font-black">{audit.toLocaleString()}</p><p className="mt-1 text-sm text-gray-500">Recorded admin changes</p><Link href="/admin/audit" className="mt-4 inline-flex text-xs font-black">Open audit log →</Link></div><div className="rounded-2xl border border-gray-200 bg-gray-950 p-5 text-white shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-gray-400">Safety</p><h3 className="mt-2 text-lg font-black">AI processing remains off</h3><p className="mt-2 text-sm leading-6 text-gray-300">Admin-created sources keep AI summary and classification disabled while the site is in non-AI development mode.</p></div></aside>
    </section>
  </main>;
}
