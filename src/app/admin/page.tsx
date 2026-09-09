import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

async function count(table: string, filter?: (q: any) => any) {
  const admin = createAdminClient();
  let q = admin.from(table).select("*", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminPage() {
  const admin = createAdminClient();
  const [articles, published, sources, activeSources, categories, topics, runs, audit] = await Promise.all([
    count("articles"), count("articles", (q) => q.eq("status", "published")), count("sources"), count("sources", (q) => q.eq("enabled", true)), count("categories"), count("topics"), count("ingestion_runs"), count("admin_audit_log"),
  ]);
  const { data: latestRuns } = await admin.from("ingestion_runs").select("id,started_at,fetched_count,inserted_count,failed_count,error_message,sources(name)").order("started_at", { ascending: false }).limit(6);
  const cards = [["Articles",articles,"/admin/articles"],["Published",published,"/admin/articles"],["Sources",`${activeSources}/${sources}`,"/admin/sources"],["Categories",categories,"/admin/categories"],["Topics",topics,"/admin/topics"],["Ingestion runs",runs,"/admin/ingestion"],["Audit events",audit,"/admin/audit"]] as const;
  const areas = [
    ["Homepage","Turn sections on/off and control order","/admin/homepage"],["Site settings","Branding and global behaviour","/admin/settings"],["Official sources","Government/public-service links","/admin/official"],["Video channels","Publisher video feeds","/admin/videos"],["Regions","Country/region availability","/admin/regions"],["Users","Reader/admin account overview","/admin/users"]
  ] as const;
  return <main className="mx-auto max-w-7xl px-5 py-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-gray-400">BridgeNews Control Center</p><h1 className="mt-1 text-4xl font-black">Admin dashboard</h1><p className="mt-2 text-gray-600">Manage content, sources, homepage, users, ingestion and site configuration.</p></div><Link href="/" className="rounded-lg border px-4 py-2 text-sm font-bold">Open website ↗</Link></div>
    <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label,value,href]) => <Link key={label} href={href} className="rounded-xl border bg-white p-5 hover:border-gray-400"><div className="text-3xl font-black">{value}</div><div className="mt-1 text-sm font-bold text-gray-600">{label}</div></Link>)}</section>
    <section className="mt-7 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{areas.map(([title,sub,href]) => <Link key={title} href={href} className="rounded-xl border bg-white p-5 hover:border-gray-400"><h2 className="font-black">{title}</h2><p className="mt-1 text-sm text-gray-500">{sub}</p></Link>)}</section>
    <section className="mt-7 rounded-xl border bg-white p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-black">Latest ingestion runs</h2><Link href="/admin/ingestion" className="text-sm font-bold">View all →</Link></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b text-left text-xs uppercase text-gray-400"><th className="py-2">Source</th><th>Started</th><th>Fetched</th><th>Inserted</th><th>Failed</th><th>Status</th></tr></thead><tbody>{(latestRuns ?? []).map((run:any) => <tr key={run.id} className="border-b last:border-0"><td className="py-3 font-bold">{run.sources?.name ?? "System"}</td><td>{new Date(run.started_at).toLocaleString("en-AU")}</td><td>{run.fetched_count}</td><td>{run.inserted_count}</td><td>{run.failed_count}</td><td>{run.error_message ? <span className="text-red-600">Error</span> : <span className="text-emerald-700">OK</span>}</td></tr>)}</tbody></table></div></section>
  </main>;
}
