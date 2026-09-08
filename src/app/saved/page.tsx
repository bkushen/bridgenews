import { redirect } from "next/navigation";
import { StoryCard } from "@/components/story-card";
import { createClient } from "@/lib/supabase/server";
import { removeBookmark } from "./actions";

function relativeTime(value: string | null) {
  if (!value) return "Recently";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return minutes < 1 ? "Just now" : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function SavedPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=%2Fsaved");

  const bookmarks = await supabase.from("bookmarks").select("article_id,created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false });
  if (bookmarks.error) throw bookmarks.error;
  const articleIds = (bookmarks.data ?? []).map((row) => row.article_id);

  let stories: Array<{
    articleId: string; slug: string; title: string; summary: string; source: string; published: string;
    regions: []; category: string; sourceCount: number; imageUrl: string | null;
  }> = [];

  if (articleIds.length) {
    const [articlesResult, categoryLinks] = await Promise.all([
      supabase.from("articles").select("id,source_id,slug,title,description,ai_summary,image_url,published_at,discovered_at").in("id", articleIds).eq("status", "published"),
      supabase.from("article_categories").select("article_id,category_id").in("article_id", articleIds),
    ]);
    if (articlesResult.error) throw articlesResult.error;
    if (categoryLinks.error) throw categoryLinks.error;

    const sourceIds = [...new Set((articlesResult.data ?? []).map((article) => article.source_id))];
    const categoryIds = [...new Set((categoryLinks.data ?? []).map((row) => row.category_id))];
    const [sourcesResult, categoriesResult] = await Promise.all([
      sourceIds.length ? supabase.from("sources").select("id,name").in("id", sourceIds) : Promise.resolve({ data: [], error: null }),
      categoryIds.length ? supabase.from("categories").select("id,name").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (sourcesResult.error) throw sourcesResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    const sourceNames = new Map((sourcesResult.data ?? []).map((source) => [source.id, source.name]));
    const categoryNames = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.name]));
    const categoryByArticle = new Map<string, string>();
    for (const link of categoryLinks.data ?? []) {
      const name = categoryNames.get(link.category_id);
      if (name && !categoryByArticle.has(link.article_id)) categoryByArticle.set(link.article_id, name);
    }
    const order = new Map(articleIds.map((id, index) => [id, index]));
    stories = (articlesResult.data ?? []).map((article) => ({
      articleId: article.id,
      slug: article.slug,
      title: article.title,
      summary: article.ai_summary || article.description || "Open the story for the latest coverage.",
      source: sourceNames.get(article.source_id) || "Source",
      published: relativeTime(article.published_at || article.discovered_at),
      regions: [] as [],
      category: categoryByArticle.get(article.id) || "News",
      sourceCount: 1,
      imageUrl: article.image_url,
    })).sort((a, b) => (order.get(a.articleId) ?? 999) - (order.get(b.articleId) ?? 999));
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Your account</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Saved stories</h1>
        <p className="mt-3 text-base leading-7 text-gray-600">Stories you save are private to your BridgeNews account.</p>
      </div>
      {stories.length ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <div key={story.slug} className="space-y-2">
              <StoryCard story={story} />
              <form action={removeBookmark}>
                <input type="hidden" name="articleId" value={story.articleId} />
                <button className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Remove from saved</button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">You have not saved any stories yet.</div>
      )}
    </main>
  );
}
