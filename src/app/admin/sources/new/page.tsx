import Link from "next/link";
import { createSource } from "../actions";

const inputClass = "mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100";

export default async function NewSourcePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Admin / Sources</p>
          <h1 className="mt-2 text-4xl font-black">Add publisher</h1>
          <p className="mt-3 max-w-2xl text-gray-600">Add an RSS or Atom feed you are permitted to aggregate. BridgeNews stores metadata and sends readers to the original publisher.</p>
        </div>
        <Link href="/admin/sources" className="text-sm font-black text-gray-500 hover:text-gray-950">← Back to sources</Link>
      </div>

      {params.error ? (
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          Could not save this source. Check the required fields, URLs, region and limits.
        </div>
      ) : null}

      <form action={createSource} className="mt-8 space-y-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-7">
        <section>
          <h2 className="text-lg font-black">Publisher identity</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2"><span className="text-sm font-bold">Source name</span><input name="name" required placeholder="Example News" className={inputClass} /></label>
            <label className="block"><span className="text-sm font-bold">Website URL</span><input name="website_url" type="url" required placeholder="https://example.com" className={inputClass} /></label>
            <label className="block"><span className="text-sm font-bold">RSS / Atom URL</span><input name="feed_url" type="url" required placeholder="https://example.com/feed.xml" className={inputClass} /></label>
            <label className="block md:col-span-2"><span className="text-sm font-bold">Logo URL <span className="font-semibold text-gray-400">(optional)</span></span><input name="logo_url" type="url" placeholder="https://example.com/logo.png" className={inputClass} /></label>
          </div>
        </section>

        <section className="border-t border-gray-100 pt-6">
          <h2 className="text-lg font-black">Publishing behaviour</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block"><span className="text-sm font-bold">Primary region</span><select name="region" defaultValue="sri-lanka" className={inputClass}><option value="sri-lanka">Sri Lanka</option><option value="australia">Australia</option><option value="international">International</option></select></label>
            <label className="block"><span className="text-sm font-bold">Language</span><select name="default_language_code" defaultValue="en" className={inputClass}><option value="en">English</option><option value="si">Sinhala</option><option value="ta">Tamil</option></select></label>
            <label className="block"><span className="text-sm font-bold">Fetch frequency</span><select name="fetch_interval_minutes" defaultValue="30" className={inputClass}><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option><option value="120">2 hours</option><option value="360">6 hours</option></select></label>
            <label className="block"><span className="text-sm font-bold">Max items / fetch</span><input name="max_items_per_fetch" type="number" min={1} max={100} defaultValue={20} className={inputClass} /></label>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"><input name="enabled" type="checkbox" defaultChecked className="mt-1" /><span><span className="block font-bold">Enable source</span><span className="text-sm text-gray-600">Allow scheduled ingestion once the feed is saved.</span></span></label>
            <label className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4"><input name="auto_publish" type="checkbox" className="mt-1" /><span><span className="block font-bold">Automatic publishing</span><span className="text-sm text-gray-600">Keep this off for new sources until feed quality is verified.</span></span></label>
          </div>
          <p className="mt-3 text-xs font-semibold text-gray-400">AI summarisation and AI classification stay disabled for all new sources.</p>
        </section>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
          <Link href="/admin/sources" className="rounded-xl border border-gray-200 px-5 py-3 text-center text-sm font-black text-gray-600 hover:bg-gray-50">Cancel</Link>
          <button className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-black text-white hover:bg-gray-800">Save publisher</button>
        </div>
      </form>
    </main>
  );
}
