import { createAdminClient } from "@/lib/supabase/admin";
import { runOperation } from "./actions";

const OPERATIONS = [
  ["ingest-rss","Run RSS ingestion","Collect enabled RSS sources now"],
  ["ingest-web","Run web ingestion","Collect configured public web sources now"],
  ["ingest-generic-web","Run generic web ingestion","Collect generic publisher metadata sources"],
  ["backfill-source-logos","Refresh source logos","Discover/update missing publisher icons"],
  ["backfill-images","Backfill article images","Find missing public article thumbnails"],
] as const;

export default async function AdminIngestion() {
  const admin = createAdminClient();
  const { data } = await admin.from("ingestion_runs").select("id,started_at,finished_at,fetched_count,inserted_count,duplicate_count,failed_count,error_message,sources(name,slug)").order("started_at", { ascending: false }).limit(200);
  return <main className="mx-auto max-w-7xl px-5 py-8"><h1 className="text-3xl font-black">Ingestion & operations</h1><p className="mt-2 text-gray-600">Run collection/maintenance jobs manually and review ingestion history.</p>
    <section className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{OPERATIONS.map(([operation,title,description]) => <form action={runOperation} key={operation} className="rounded-xl border bg-white p-4"><input type="hidden" name="operation" value={operation}/><h2 className="font-black">{title}</h2><p className="mt-1 min-h-10 text-sm text-gray-500">{description}</p><button className="mt-4 rounded-lg bg-gray-950 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800">Run now</button></form>)}</section>
    <div className="mt-7 overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[1000px] text-sm"><thead><tr className="border-b bg-gray-50 text-left text-xs uppercase text-gray-400"><th className="p-3">Source</th><th>Started</th><th>Duration</th><th>Fetched</th><th>Inserted</th><th>Duplicates</th><th>Failed</th><th>Error</th></tr></thead><tbody>{(data??[]).map((r:any)=>{const ms=r.finished_at?new Date(r.finished_at).getTime()-new Date(r.started_at).getTime():null;return <tr key={r.id} className="border-b last:border-0"><td className="p-3 font-bold">{r.sources?.name??"System"}</td><td>{new Date(r.started_at).toLocaleString("en-AU")}</td><td>{ms==null?"Running":`${(ms/1000).toFixed(1)}s`}</td><td>{r.fetched_count}</td><td>{r.inserted_count}</td><td>{r.duplicate_count}</td><td className={r.failed_count?"font-bold text-red-600":""}>{r.failed_count}</td><td className="max-w-[300px] truncate text-red-600" title={r.error_message??""}>{r.error_message??"—"}</td></tr>})}</tbody></table></div></main>;
}
