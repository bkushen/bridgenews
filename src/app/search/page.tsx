import { StoryCard } from "@/components/story-card";
import { searchStories } from "@/lib/data/search";
import { getSourceDirectory } from "@/lib/data/portal";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; language?: string; source?: string; date?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const language = ["en", "si", "ta"].includes(params.language || "") ? params.language! : "all";
  const source = params.source || "all";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date || "") ? params.date! : "";
  const [rawStories, sources] = await Promise.all([query ? searchStories(query, 100) : Promise.resolve([]), getSourceDirectory(120)]);
  const stories = rawStories.filter((story) => {
    if (language !== "all" && story.languageCode !== language) return false;
    if (source !== "all" && story.sourceSlug !== source) return false;
    if (date && story.publishedAt && story.publishedAt.slice(0, 10) !== date) return false;
    return true;
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Discovery</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Search BridgeNews</h1>
        <p className="mt-3 text-base leading-7 text-gray-600">Search published headlines and snippets, then narrow results by language, publisher or date.</p>
      </div>

      <form action="/search" method="get" className="mt-7 grid max-w-5xl gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_auto_auto_auto_auto]">
        <input name="q" defaultValue={query} placeholder="Search news, people, places or topics" className="min-w-0 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-600" />
        <select name="language" defaultValue={language} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold"><option value="all">All languages</option><option value="en">English</option><option value="si">සිංහල</option><option value="ta">தமிழ்</option></select>
        <select name="source" defaultValue={source} className="max-w-56 rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold"><option value="all">All sources</option>{sources.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        <input type="date" name="date" defaultValue={date} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold" />
        <button className="rounded-xl bg-gray-950 px-6 py-3 font-bold text-white">Search</button>
      </form>

      {query ? (
        <section className="mt-9">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-gray-200 pb-3"><div><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Results</p><h2 className="mt-1 text-2xl font-black">{stories.length} result{stories.length === 1 ? "" : "s"} for “{query}”</h2></div></div>
          {stories.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div> : <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No matching published stories for these filters. Try a broader keyword or remove a filter.</div>}
        </section>
      ) : null}
    </main>
  );
}
