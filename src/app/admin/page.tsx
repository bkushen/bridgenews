import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminIcon } from "@/components/admin/admin-icon";

async function count(table: string, filter?: (q: any) => any) {
  const admin = createAdminClient();
  let q = admin.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

function StatCard({ label, value, sub, href, icon, attention = false }: { label: string; value: string | number; sub: string; href: string; icon: string; attention?: boolean }) {
  return <Link href={href} className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${attention ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}><AdminIcon name={icon} className="h-5 w-5" /></span></div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs leading-5 text-slate-500">{sub}</p><span className="shrink-0 text-xs font-black text-slate-400 transition group-hover:text-black">Open →</span></div></Link>;
}

const QUICK_ACTIONS = [
  ["Traffic", "See pages, referrers and campaigns", "/admin/traffic", "analytics"],
  ["Newsletter", "Review Daily Brief subscribers", "/admin/newsletter", "newsletter"],
  ["Social queue", "Approve highlighted stories", "/admin/social", "social"],
  ["Articles", "Review and feature stories", "/admin/articles", "articles"],
  ["Ingestion", "Watch live imports", "/admin/ingestion", "ingestion"],
  ["Image recovery", "Recover verified publisher images", "/admin/images", "images"],
  ["New source", "Add a publisher and region", "/admin/sources/new", "sources"],
  ["Homepage", "Order visible sections", "/admin/homepage", "homepage"],
  ["Source health", "Fix unhealthy feeds", "/admin/source-tools", "health"],
] as const;

export default async function AdminPage() {
  const admin = createAdminClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [articles, published, published24h, sources, activeSources, unhealthySources, missingImages, breaking, featured, audit, views7d, subscribers, socialQueued] = await Promise.all([
    count("articles"),
    count("articles", (q) => q.eq("status", "published")),
    count("articles", (q) => q.eq("status", "published").gte("published_at", since24h)),
    count("sources"),
    count("sources", (q) => q.eq("enabled", true)),
    count("sources", (q) => q.eq("enabled", true).gt("consecutive_failures", 0)),
    count("articles", (q) => q.eq("status", "published").or("image_url.is.null,image_url.eq.")),
    count("articles", (q) => q.eq("status", "published").eq("is_breaking", true)),
    count("articles", (q) => q.eq("status", "published").eq("is_featured", true)),
    count("admin_audit_log"),
    count("traffic_events", (q) => q.eq("event_type", "page_view").gte("occurred_at", since7d)),
    count("newsletter_subscribers", (q) => q.eq("status", "active")),
    count("social_post_queue", (q) => q.in("status", ["queued", "approved"])),
  ]);

  const [{ data: latestRuns }, { data: latestStories }] = await Promise.all([
    admin.from("ingestion_runs").select("id,started_at,inserted_count,failed_count,error_message,sources(name)").order("started_at", { ascending: false }).limit(7),
    admin.from("articles").select("id,title,slug,published_at,is_breaking,is_featured,is_main_headline,sources(name)").eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(6),
  ]);

  const recentErrors = (latestRuns ?? []).filter((run: any) => run.error_message || Number(run.failed_count) > 0).length;
  const sourceHealth = unhealthySources === 0 ? "All healthy" : `${unhealthySources} need attention`;
  const imageCoverage = Math.max(0, Math.round(((published - missingImages) / Math.max(published, 1)) * 100));

  return <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Publishing, operations and audience growth in one place.</p></div><div className="flex gap-2"><Link href="/brief" target="_blank" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700">Daily Brief ↗</Link><Link href="/admin/articles/new" className="rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">+ New article</Link></div></div>

    {(unhealthySources > 0 || recentErrors > 0 || missingImages > 0) ? <section className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-amber-700 ring-1 ring-amber-200"><AdminIcon name="health" className="h-5 w-5" /></span><div><p className="text-sm font-black text-amber-950">Attention needed</p><p className="mt-0.5 text-xs leading-5 text-amber-800">{unhealthySources} enabled source{unhealthySources === 1 ? "" : "s"} reporting failures · {missingImages.toLocaleString()} published stories missing images.</p></div></div><Link href="/admin/source-tools" className="shrink-0 rounded-xl border border-amber-300 bg-white px-3.5 py-2 text-xs font-black text-amber-900 hover:bg-amber-100">Review health</Link></div></section> : null}

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Published today" value={published24h.toLocaleString()} sub={`${articles.toLocaleString()} total articles`} href="/admin/articles" icon="articles"/><StatCard label="Active sources" value={`${activeSources}/${sources}`} sub={sourceHealth} href="/admin/sources" icon="sources" attention={unhealthySources > 0}/><StatCard label="7-day page views" value={views7d.toLocaleString()} sub={`${subscribers.toLocaleString()} active newsletter subscribers`} href="/admin/traffic" icon="analytics"/><StatCard label="Image coverage" value={`${imageCoverage}%`} sub={`${missingImages.toLocaleString()} need image recovery`} href="/admin/images" icon="images" attention={missingImages > 0}/></section>

    <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Editorial picks" value={breaking + featured} sub={`${breaking} breaking · ${featured} featured`} href="/admin/articles" icon="official"/><StatCard label="Social queue" value={socialQueued.toLocaleString()} sub="Queued or approved posts" href="/admin/social" icon="social"/><StatCard label="Newsletter" value={subscribers.toLocaleString()} sub="Active Daily Brief subscribers" href="/admin/newsletter" icon="newsletter"/><StatCard label="Audit events" value={audit.toLocaleString()} sub="Recorded admin activity" href="/admin/audit" icon="audit"/></section>

    <section className="mt-7"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-black text-slate-950">Quick actions</h2><p className="mt-0.5 text-xs text-slate-500">Publishing and growth tools</p></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{QUICK_ACTIONS.map(([title, sub, href, icon]) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-black group-hover:text-white"><AdminIcon name={icon} className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-black text-slate-950">{title}</p><p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p></div><span className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-black">→</span></Link>)}</div></section>

    <section className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-black text-slate-950">Latest ingestion</h2><p className="mt-0.5 text-xs text-slate-500">Recent automated publishing runs</p></div><Link href="/admin/ingestion" className="text-xs font-black text-slate-500 hover:text-black">View all →</Link></div><div className="divide-y divide-slate-100">{(latestRuns ?? []).length ? (latestRuns ?? []).map((run: any) => { const bad = Boolean(run.error_message) || Number(run.failed_count) > 0; return <div key={run.id} className="flex items-center gap-3 px-5 py-3.5"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${bad ? "bg-amber-500" : "bg-emerald-500"}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{run.sources?.name ?? "System task"}</p><p className="mt-0.5 text-xs text-slate-500">{new Date(run.started_at).toLocaleString("en-AU")} · {run.inserted_count ?? 0} new · {run.failed_count ?? 0} failed</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${bad ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{bad ? "Check" : "OK"}</span></div>; }) : <p className="p-5 text-sm text-slate-500">No ingestion runs yet.</p>}</div></div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-black text-slate-950">Newest stories</h2><p className="mt-0.5 text-xs text-slate-500">What was most recently published</p></div><Link href="/admin/articles" className="text-xs font-black text-slate-500 hover:text-black">Manage →</Link></div><div className="divide-y divide-slate-100">{(latestStories ?? []).map((story: any) => <Link key={story.id} href={`/story/${story.slug}`} className="block px-5 py-3.5 hover:bg-slate-50"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-bold leading-5 text-slate-900">{story.title}</p><p className="mt-1 text-xs text-slate-500">{story.sources?.name ?? "Source"} · {story.published_at ? new Date(story.published_at).toLocaleString("en-AU") : "Recently"}</p></div>{story.is_main_headline ? <span className="rounded-full bg-black px-2 py-1 text-[9px] font-black text-white">MAIN</span> : story.is_breaking ? <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-700">BREAKING</span> : story.is_featured ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600">FEATURED</span> : null}</div></Link>)}</div></div>
    </section>

    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4"><div><p className="text-sm font-black text-slate-900">System safeguards</p><p className="mt-0.5 text-xs text-slate-500">AI processing is off. Public articles require verified publisher images. Repeatedly failing sources auto-pause after 12 failures.</p></div><Link href="/admin/audit" className="text-xs font-black text-slate-500 hover:text-black">Audit log →</Link></div>
  </main>;
}
