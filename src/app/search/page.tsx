import { StoryCard } from "@/components/story-card";
import { searchStories } from "@/lib/data/search";
import { getSourceDirectory } from "@/lib/data/portal";
import { createClient } from "@/lib/supabase/server";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; language?: string; source?: string; date?: string; region?: string; category?: string; topic?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const language = ["en", "si", "ta"].includes(params.language || "") ? params.language! : "all";
  const source = params.source || "all";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date || "") ? params.date! : "";
  const region = params.region || "all";
  const category = params.category || "all";
  const topic = params.topic || "all";
  const supabase = await createClient();
  const [rawStories, sources, regionsResult, categoriesResult, topicsResult] = await Promise.all([
    query ? searchStories(query, 100) : Promise.resolve([]),
    getSourceDirectory(120),
    supabase.from("regions").select("name,slug").eq("is_active", true).order("name"),
    supabase.from("categories").select("name,slug").order("name"),
    supabase.from("topics").select("name,slug").order("trending_score", { ascending: false }).limit(100),
  ]);
  const regions = regionsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const topics = topicsResult.data ?? [];
  const stories = rawStories.filter((story) => {
    if (language !== "all" && story.languageCode !== language) return false;
    if (source !== "all" && story.sourceSlug !== source) return false;
    if (region !== "all" && !story.regionSlugs?.includes(region)) return false;
    if (category !== "all" && story.categorySlug !== category) return false;
    if (topic !== "all" && !story.topicSlugs?.includes(topic)) return false;
    if (date && story.publishedAt && story.publishedAt.slice(0, 10) !== date) return false;
    return true;
  });

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Discovery</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Search BridgeNews</h1>
        <p className="mt-3 text-base leading-7 text-gray-600">Search published headlines and snippets, then narrow results by region, language, publisher, category, topic or date.</p>
      </div>

      <form action="/search" method="get" className="mt-7 grid max-w-7xl gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-4 xl:grid-cols-8">
        <input name="q" defaultValue={query} placeholder="Search news, people, places or topics" className="min-w-0 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-gray-600 lg:col-span-2" />
        <select name="region" defaultValue={region} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold"><option value="all">All regions</option>{regions.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        <select name="language" defaultValue={language} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold"><option value="all">All languages</option><option value="en">English</option><option value="si">සිංහල</option><option value="ta">தமிழ்</option></select>
        <select name="source" defaultValue={source} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold"><option value="all">All sources</option>{sources.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        <select name="category" defaultValue={category} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold"><option value="all">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        <select name="topic" defaultValue={topic} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold"><option value="all">All topics</option>{topics.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
        <input type="date" name="date" defaultValue={date} className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-sm font-bold" />
        <div className="flex gap-2 lg:col-span-4 xl:col-span-8"><button className="rounded-xl bg-gray-950 px-6 py-3 font-bold text-white hover:bg-gray-800">Search</button><a href="/search" className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">Clear filters</a></div>
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
