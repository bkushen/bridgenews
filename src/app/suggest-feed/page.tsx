import Link from "next/link";

export const metadata = {
  title: "Suggest a Feed",
  description: "Suggest a news publisher, RSS feed or video channel for BridgeNews.",
};

export default function SuggestFeedPage() {
  return <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
    <Link href="/" className="text-xs font-black text-slate-500 hover:text-black">← Back to BridgeNews</Link>
    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">Community submissions</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Suggest a Feed</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Missing a reliable news publisher, RSS feed or YouTube channel? Send the details for review. Suggestions open as a BridgeNews repository issue so they can be tracked transparently.</p>
      <form action="https://github.com/bkushen/bridgenews/issues/new" method="get" target="_blank" className="mt-7 space-y-5">
        <div><label htmlFor="title" className="text-xs font-black text-slate-700">Suggestion title</label><input id="title" name="title" required defaultValue="Feed suggestion: " className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500" /></div>
        <div><label htmlFor="body" className="text-xs font-black text-slate-700">Publisher / feed details</label><textarea id="body" name="body" required rows={8} placeholder={'Publisher name:\nWebsite:\nRSS/feed URL:\nRegion/language:\nWhy it should be added:'} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500" /></div>
        <button type="submit" className="rounded-xl bg-black px-5 py-3 text-sm font-black text-white hover:bg-slate-800">Submit suggestion ↗</button>
      </form>
      <p className="mt-5 text-[11px] leading-5 text-slate-400">BridgeNews reviews source reliability, attribution, feed stability and duplication before enabling automatic publishing.</p>
    </div>
  </main>;
}
