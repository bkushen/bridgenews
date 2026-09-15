import Link from "next/link";
import { LiveAutoRefresh } from "@/components/live-auto-refresh";
import { createClient } from "@/lib/supabase/server";
import { runImageRecovery } from "./actions";

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-AU", { timeZone: "Australia/Melbourne" });
}

export default async function AdminImagesPage() {
  const supabase = await createClient();
  const [pendingResult, pendingCountResult, publishedCountResult] = await Promise.all([
    supabase
      .from("articles")
      .select("id,source_id,title,original_url,discovered_at,image_recovery_attempts,image_recovery_attempted_at,image_recovery_last_error,sources(name,slug)")
      .in("status", ["review_required", "discovered"])
      .or("image_url.is.null,image_url.eq.")
      .order("image_recovery_attempted_at", { ascending: true, nullsFirst: true })
      .order("discovered_at", { ascending: false })
      .limit(1000),
    supabase.from("articles").select("id", { count: "exact", head: true }).in("status", ["review_required", "discovered"]).or("image_url.is.null,image_url.eq."),
    supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published").not("image_url", "is", null),
  ]);

  const pending = pendingResult.data ?? [];
  const pendingCount = pendingCountResult.count ?? pending.length;
  const publishedCount = publishedCountResult.count ?? 0;
  const neverTried = pending.filter((row: any) => !row.image_recovery_attempted_at).length;
  const repeatedFailures = pending.filter((row: any) => Number(row.image_recovery_attempts ?? 0) >= 3).length;

  const bySource = new Map<string, { id: string; name: string; slug: string; waiting: number; attempts: number; lastAttempt: string | null }>();
  for (const row of pending as any[]) {
    const id = row.source_id;
    const current = bySource.get(id) ?? {
      id,
      name: row.sources?.name ?? "Unknown source",
      slug: row.sources?.slug ?? "unknown",
      waiting: 0,
      attempts: 0,
      lastAttempt: null,
    };
    current.waiting += 1;
    current.attempts += Number(row.image_recovery_attempts ?? 0);
    if (row.image_recovery_attempted_at && (!current.lastAttempt || row.image_recovery_attempted_at > current.lastAttempt)) current.lastAttempt = row.image_recovery_attempted_at;
    bySource.set(id, current);
  }
  const sourceRows = [...bySource.values()].sort((a, b) => b.waiting - a.waiting || a.name.localeCompare(b.name));

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <LiveAutoRefresh intervalMs={15000} />
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Operations</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Image recovery</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">BridgeNews publishes only articles with a verified real publisher image. This queue shows articles hidden from the public site while the recovery worker searches the publisher page for a valid news photo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/ingestion" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50">Ingestion</Link>
          <Link href="/admin/sources" className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50">Sources</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Published with image" value={publishedCount.toLocaleString()} tone="good" />
        <Metric label="Waiting for image" value={pendingCount.toLocaleString()} tone={pendingCount ? "warn" : "good"} />
        <Metric label="Never attempted" value={neverTried.toLocaleString()} />
        <Metric label="3+ failed attempts" value={repeatedFailures.toLocaleString()} tone={repeatedFailures ? "warn" : "good"} />
      </div>

      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Queue controls</p>
            <h2 className="mt-1 text-lg font-black">Recover and verify publisher photos</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">Recovery checks RSS candidates and the original publisher page. Verification rechecks currently public images and removes any image that fails the strict rules.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={runImageRecovery}>
              <input type="hidden" name="mode" value="recover" />
              <input type="hidden" name="limit" value="100" />
              <button className="rounded-xl bg-black px-4 py-2.5 text-sm font-black text-white hover:bg-slate-800">Recover next 100</button>
            </form>
            <form action={runImageRecovery}>
              <input type="hidden" name="mode" value="verify" />
              <input type="hidden" name="limit" value="100" />
              <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50">Verify 100 public images</button>
            </form>
          </div>
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Source quality</p>
          <h2 className="mt-1 text-lg font-black">Publishers with image backlog</h2>
          <p className="mt-1 text-xs text-slate-500">Use source-specific retry for publishers with high pending counts. A high queue usually means the publisher blocks metadata requests or exposes a site-wide image instead of a story photo.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left"><th className="p-3">Publisher</th><th>Waiting</th><th>Total attempts</th><th>Last attempt</th><th className="pr-3 text-right">Action</th></tr></thead>
            <tbody>
              {sourceRows.length ? sourceRows.map((source) => (
                <tr key={source.id} className="border-b border-slate-100 last:border-0">
                  <td className="p-3"><p className="font-black text-slate-900">{source.name}</p><p className="text-xs text-slate-400">{source.slug}</p></td>
                  <td><span className={`rounded-full px-2.5 py-1 text-xs font-black ${source.waiting >= 50 ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{source.waiting}</span></td>
                  <td>{source.attempts.toLocaleString()}</td>
                  <td className="text-xs text-slate-500">{formatDate(source.lastAttempt)}</td>
                  <td className="pr-3 text-right"><form action={runImageRecovery} className="inline"><input type="hidden" name="mode" value="recover" /><input type="hidden" name="limit" value="100" /><input type="hidden" name="sourceId" value={source.id} /><button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">Retry source</button></form></td>
                </tr>
              )) : <tr><td colSpan={5} className="p-6 text-center text-sm text-slate-500">No articles are waiting for images.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Recovery queue</p><h2 className="mt-1 text-lg font-black">Next articles to process</h2><p className="mt-1 text-xs text-slate-500">The queue prioritizes articles never tried before, then rotates by oldest recovery attempt so one broken publisher cannot starve the rest.</p></div>
        <div className="divide-y divide-slate-100">
          {(pending as any[]).slice(0, 60).map((article) => (
            <article key={article.id} className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1fr)_210px_150px] lg:items-center lg:p-5">
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-800">WAITING FOR IMAGE</span><span className="text-xs font-bold text-slate-400">{article.sources?.name ?? "Unknown source"}</span></div><h3 className="mt-2 text-sm font-black leading-5 text-slate-900">{article.title}</h3>{article.image_recovery_last_error ? <p className="mt-1 text-xs text-rose-700">{article.image_recovery_last_error}</p> : null}</div>
              <div className="text-xs text-slate-500"><p><b className="text-slate-700">Attempts:</b> {article.image_recovery_attempts ?? 0}</p><p className="mt-1"><b className="text-slate-700">Last try:</b> {formatDate(article.image_recovery_attempted_at)}</p><p className="mt-1"><b className="text-slate-700">Discovered:</b> {formatDate(article.discovered_at)}</p></div>
              <div className="flex flex-wrap gap-2 lg:justify-end"><form action={runImageRecovery}><input type="hidden" name="mode" value="recover" /><input type="hidden" name="limit" value="1" /><input type="hidden" name="articleId" value={article.id} /><button className="rounded-lg bg-black px-3 py-2 text-xs font-black text-white">Retry now</button></form>{article.original_url ? <a href={article.original_url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700">Publisher ↗</a> : null}</div>
            </article>
          ))}
          {!pending.length ? <p className="p-6 text-sm text-slate-500">Image recovery queue is empty.</p> : null}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "good" | "warn" }) {
  const color = tone === "good" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-slate-950";
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-2 text-3xl font-black ${color}`}>{value}</p></div>;
}
