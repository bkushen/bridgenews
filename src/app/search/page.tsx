import { StoryCard } from "@/components/story-card";
import { searchStories } from "@/lib/data/search";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const stories = query ? await searchStories(query, 40) : [];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Discovery</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Search BridgeNews</h1>
        <p className="mt-3 text-base leading-7 text-gray-600">Search published headlines and feed summaries across Sri Lanka, Australia and international sources.</p>
      </div>

      <form action="/search" method="get" className="mt-7 flex max-w-3xl gap-3">
        <input name="q" defaultValue={query} placeholder="Search news, people, places or topics" className="min-w-0 flex-1 rounded-2xl border border-gray-300 bg-white px-5 py-3.5 outline-none focus:border-gray-600" />
        <button className="rounded-2xl bg-gray-950 px-6 py-3.5 font-bold text-white">Search</button>
      </form>

      {query ? (
        <section className="mt-9">
          <div className="mb-5 flex items-end justify-between gap-4 border-b border-gray-200 pb-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Results</p>
              <h2 className="mt-1 text-2xl font-black">{stories.length} result{stories.length === 1 ? "" : "s"} for “{query}”</h2>
            </div>
          </div>
          {stories.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No matching published stories yet. Try a broader keyword.</div>
          )}
        </section>
      ) : null}
    </main>
  );
}
