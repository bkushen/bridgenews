import { createSource } from "../actions";

export default async function NewSourcePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Admin / Sources</p>
      <h1 className="mt-2 text-4xl font-black">Add RSS source</h1>
      <p className="mt-3 text-gray-600">Add only feeds you are permitted to aggregate. BridgeNews stores metadata and links readers back to the publisher.</p>
      {params.error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">Could not save this source. Check the required fields and URLs.</div>}
      <form action={createSource} className="mt-8 space-y-5 rounded-2xl border border-[var(--border)] bg-white p-6">
        <label className="block"><span className="text-sm font-bold">Source name</span><input name="name" required placeholder="Example News" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
        <label className="block"><span className="text-sm font-bold">Website URL</span><input name="website_url" type="url" required placeholder="https://example.com" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
        <label className="block"><span className="text-sm font-bold">RSS / Atom URL</span><input name="feed_url" type="url" required placeholder="https://example.com/feed.xml" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3" /></label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="text-sm font-bold">Primary region</span><select name="region" defaultValue="sri-lanka" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3"><option value="sri-lanka">Sri Lanka</option><option value="australia">Australia</option><option value="international">International</option></select></label>
          <label className="block"><span className="text-sm font-bold">Fetch frequency</span><select name="fetch_interval_minutes" defaultValue="30" className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option><option value="120">2 hours</option><option value="360">6 hours</option></select></label>
        </div>
        <label className="flex gap-3 rounded-xl bg-gray-50 p-4"><input name="auto_publish" type="checkbox" className="mt-1" /><span><span className="block font-bold">Automatic publishing</span><span className="text-sm text-gray-600">Keep this off for new sources until feed quality is verified.</span></span></label>
        <button className="rounded-xl bg-gray-950 px-5 py-3 font-bold text-white">Save source</button>
      </form>
    </main>
  );
}
