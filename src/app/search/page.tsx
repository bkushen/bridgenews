import { StoryCard } from "@/components/story-card";
import { searchStories } from "@/lib/data/search";
import { getSourceDirectory } from "@/lib/data/portal";
import { createClient } from "@/lib/supabase/server";
import { EDITIONS, getActiveRegion } from "@/lib/region-context";

const controlClass = "min-w-0 rounded-lg border border-[var(--news-line)] bg-[var(--news-card)] px-3.5 py-3 text-sm text-[var(--news-ink)] outline-none transition focus:border-[var(--news-accent)] focus:ring-2 focus:ring-[#a5232f18]";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; language?: string; source?: string; date?: string; region?: string; category?: string; topic?: string }> }) {
  const params = await searchParams;
  const activeRegion = await getActiveRegion();
  const query = (params.q || "").trim();
  const language = ["en", "si", "ta"].includes(params.language || "") ? params.language! : "all";
  const source = params.source || "all";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.date || "") ? params.date! : "";
  const region = ["sri-lanka", "australia", "international"].includes(params.region || "") ? params.region! : activeRegion;
  const edition = EDITIONS[region as keyof typeof EDITIONS];
  const category = params.category || "all";
  const topic = params.topic || "all";
  const supabase = await createClient();
  const [rawStories, sources, regionsResult, categoriesResult, topicsResult] = await Promise.all([
    query ? searchStories(query, 100) : Promise.resolve([]),
    getSourceDirectory(120),
    supabase.from("regions").select("name,slug").in("slug", ["sri-lanka","australia","international"]).order("name"),
    supabase.from("categories").select("name,slug").order("name"),
    supabase.from("topics").select("name,slug").order("trending_score", { ascending: false }).limit(100),
  ]);
  const regions = regionsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const topics = topicsResult.data ?? [];
  const stories = rawStories.filter((story) => {
    if (language !== "all" && story.languageCode !== language) return false;
    if (source !== "all" && story.sourceSlug !== source) return false;
    if (!story.regionSlugs?.includes(region)) return false;
    if (category !== "all" && story.categorySlug !== category) return false;
    if (topic !== "all" && !story.topicSlugs?.includes(topic)) return false;
    if (date && story.publishedAt && story.publishedAt.slice(0, 10) !== date) return false;
    return true;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="max-w-3xl border-b border-[var(--news-line)] pb-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--news-accent)]">{edition.flag} {edition.label} · Discovery</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--news-ink)] md:text-5xl">Search {edition.label}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--news-muted)]">Search published {edition.adjective} headlines and snippets, then narrow results by language, publisher, category, topic or date.</p>
      </div>

      <form action="/search" method="get" className="mt-6 rounded-xl border border-[var(--news-line)] bg-[var(--news-card)] p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="md:col-span-2 xl:col-span-2"><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-muted)]">Search</span><input name="q" defaultValue={query} placeholder="News, people, places or topics" className={`${controlClass} w-full`} /></label>
          <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-muted)]">Region</span><select name="region" defaultValue={region} className={`${controlClass} w-full font-bold`}>{regions.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-muted)]">Language</span><select name="language" defaultValue={language} className={`${controlClass} w-full font-bold`}><option value="all">All languages</option><option value="en">English</option><option value="si">සිංහල</option><option value="ta">தமிழ்</option></select></label>
          <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-muted)]">Publisher</span><select name="source" defaultValue={source} className={`${controlClass} w-full font-bold`}><option value="all">All sources</option>{sources.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-muted)]">Category</span><select name="category" defaultValue={category} className={`${controlClass} w-full font-bold`}><option value="all">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-muted)]">Topic</span><select name="topic" defaultValue={topic} className={`${controlClass} w-full font-bold`}><option value="all">All topics</option>{topics.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[10px] font-black uppercase tracking-[0.14em] text-[var(--news-muted)]">Date</span><input type="date" name="date" defaultValue={date} className={`${controlClass} w-full font-bold`} /></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--news-line-soft)] pt-4"><button className="rounded-lg bg-[var(--news-ink)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--news-accent-deep)]">Search news</button><a href="/search" className="rounded-lg border border-[var(--news-line)] bg-[var(--news-card)] px-5 py-3 text-sm font-black text-[var(--news-ink)] hover:border-[#bcae9e]">Clear filters</a></div>
      </form>

      {query ? <section className="mt-9"><div className="mb-5 border-b border-[var(--news-line)] pb-3"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--news-accent)]">{edition.label} results</p><h2 className="mt-1 text-2xl font-bold text-[var(--news-ink)]">{stories.length} result{stories.length === 1 ? "" : "s"} for “{query}”</h2></div>{stories.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div> : <div className="rounded-xl border border-dashed border-[var(--news-line)] bg-[var(--news-card)] p-8 text-[var(--news-muted)]"><p className="font-serif text-xl font-bold text-[var(--news-ink)]">No matching {edition.label} stories</p><p className="mt-2 text-sm leading-6">Try a broader keyword or remove one or more filters.</p></div>}</section> : <section className="mt-8 rounded-xl border border-[var(--news-line-soft)] bg-[#f4eee5] p-6"><p className="font-serif text-xl font-bold text-[var(--news-ink)]">Start with a {edition.label} headline, person or place</p><p className="mt-2 text-sm leading-6 text-[var(--news-muted)]">You can then refine the results using the filters above.</p></section>}
    </main>
  );
}
