import Link from "next/link";
import { PortalStoryRow } from "@/components/portal-story-row";
import { getPortalStories } from "@/lib/data/portal";

function todaySriLanka() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ date?: string; language?: string }> }) {
  const params = await searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date || "") ? params.date! : todaySriLanka();
  const language = ["en", "si", "ta"].includes(params.language || "") ? params.language! : "all";
  const stories = await getPortalStories({ date, language: language === "all" ? undefined : language, limit: 120 });
  const base = new Date(`${date}T00:00:00+05:30`);
  const previous = new Date(base.getTime() - 86400000).toISOString().slice(0, 10);
  const next = new Date(base.getTime() + 86400000).toISOString().slice(0, 10);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-5 border-b border-gray-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">By date</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">News Archive</h1><p className="mt-3 text-gray-600">Browse BridgeNews coverage by publication date and language.</p></div>
        <form className="flex flex-wrap gap-2" action="/archive"><input type="date" name="date" defaultValue={date} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold" /><select name="language" defaultValue={language} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold"><option value="all">All languages</option><option value="en">English</option><option value="si">සිංහල</option><option value="ta">தமிழ்</option></select><button className="rounded-xl bg-gray-950 px-4 py-2 text-sm font-black text-white">Go</button></form>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3"><Link href={`/archive?date=${previous}&language=${language}`} className="rounded-full border bg-white px-4 py-2 text-xs font-black">← Previous</Link><p className="text-sm font-black">{date} · {stories.length} stories</p><Link href={`/archive?date=${next}&language=${language}`} className="rounded-full border bg-white px-4 py-2 text-xs font-black">Next →</Link></div>
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white px-5 shadow-sm">{stories.length ? stories.map((story) => <PortalStoryRow key={story.articleId} story={story} />) : <p className="py-10 text-center text-gray-500">No published stories found for this date and language.</p>}</section>
    </main>
  );
}
