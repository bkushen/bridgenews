import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

async function count(table: string, filter?: (q: any) => any) {
  const admin = createAdminClient();
  let q = admin.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

function MetricCard({ label, value, hint, href, tone = "default", icon }: { label: string; value: string | number; hint: string; href: string; tone?: "default" | "good" | "warn"; icon: string }) {
  const toneClass = tone === "good" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : tone === "warn" ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-indigo-50 text-indigo-700 ring-indigo-100";
  return <Link href={href} className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"><div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-slate-50 transition group-hover:bg-indigo-50"/><div className="relative flex items-start justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-lg text-white shadow-sm">{icon}</span></div><p className="relative mt-3 text-sm leading-5 text-slate-500">{hint}</p><div className="relative mt-4 flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${toneClass}`}>{tone === "good" ? "Healthy" : tone === "warn" ? "Check" : "Manage"}</span><span className="text-xs font-black text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600">Open →</span></div></Link>;
}

const quickActions = [
  ["Add publisher", "Create a new news source and assign its region.", "/admin/sources/new", "+"],
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

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl md:p-8 lg:p-10">
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"/><div className="absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl"/>
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-indigo-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow-sm">Control Center</span><span className="rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-slate-300 ring-1 ring-white/10">BridgeNews</span></div><h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Everything in one place.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">Manage publishing, content, sources, users and system health from a cleaner, faster workspace.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/sources/new" className="rounded-xl bg-white px-4 py-2.5 text-sm font-black text-slate-950 shadow-sm hover:bg-slate-100">+ Add source</Link><Link href="/" className="rounded-xl bg-white/8 px-4 py-2.5 text-sm font-black text-white ring-1 ring-white/15 hover:bg-white/12">View website ↗</Link></div></div>
    </section>

    <section className="mt-7"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">At a glance</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Website status</h2></div><span className="hidden rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm ring-1 ring-slate-200 sm:inline">Live data</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Articles" value={articles.toLocaleString()} hint={`${publishedRate}% currently published`} href="/admin/articles" tone="good" icon="▤"/><MetricCard label="Active sources" value={`${activeSources}/${sources}`} hint="Publishers currently enabled" href="/admin/sources" tone={activeSources === sources ? "good" : "warn"} icon="◉"/><MetricCard label="Taxonomy" value={categories + topics} hint={`${categories} categories · ${topics} topics`} href="/admin/categories" icon="#"/><MetricCard label="Recent ingestion" value={recentErrors ? `${recentErrors} issue${recentErrors===1?"":"s"}` : "Healthy"} hint={`${runs.toLocaleString()} total ingestion runs`} href="/admin/ingestion" tone={recentErrors ? "warn" : "good"} icon="↻"/></div></section>

    <section className="mt-8"><div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-500">Common tasks</p><h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Quick actions</h2></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{quickActions.map(([title,sub,href,icon])=><Link key={href} href={href} className="group flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-lg font-black text-indigo-600 ring-1 ring-indigo-100 transition group-hover:bg-indigo-600 group-hover:text-white">{icon}</span><div className="min-w-0"><h3 className="font-black text-slate-950">{title}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{sub}</p><p className="mt-3 text-xs font-black text-indigo-600">Open tool →</p></div></Link>)}</div></section>

    <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-500">System activity</p><h2 className="mt-1 text-xl font-black text-slate-950">Latest ingestion runs</h2></div><Link href="/admin/ingestion" className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-500 hover:bg-slate-100 hover:text-slate-950">View all →</Link></div><div className="divide-y divide-slate-100">{(latestRuns ?? []).length ? (latestRuns ?? []).map((run:any)=>{const bad=run.error_message || Number(run.failed_count)>0;return <div key={run.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70 sm:px-6"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-black ${bad?"bg-amber-50 text-amber-700":"bg-emerald-50 text-emerald-700"}`}>{bad?"!":"✓"}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-900">{run.sources?.name ?? "System task"}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(run.started_at).toLocaleString("en-AU")} · {run.inserted_count} inserted · {run.failed_count} failed</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${bad?"bg-amber-50 text-amber-700":"bg-emerald-50 text-emerald-700"}`}>{bad?"Needs check":"OK"}</span></div>}) : <p className="p-6 text-sm text-slate-500">No ingestion runs yet.</p>}</div></div>

      <aside className="space-y-4"><div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-lg text-violet-600 ring-1 ring-violet-100">≡</span><span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-500">AUDIT</span></div><p className="mt-4 text-3xl font-black text-slate-950">{audit.toLocaleString()}</p><p className="mt-1 text-sm text-slate-500">Recorded admin changes</p><Link href="/admin/audit" className="mt-5 inline-flex text-xs font-black text-indigo-600">Open audit log →</Link></div><div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white shadow-lg"><div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10"/><p className="relative text-[10px] font-black uppercase tracking-[0.16em] text-indigo-100">Safety</p><h3 className="relative mt-2 text-xl font-black">AI processing remains off</h3><p className="relative mt-2 text-sm leading-6 text-indigo-100">Admin-created sources keep AI summary and classification disabled while BridgeNews stays in non-AI development mode.</p></div></aside>
    </section>
  </main>;
}
