import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/mock-data";

export type SearchStory = Story & { articleId?: string; imageUrl?: string | null };

type SearchRpcRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  ai_summary: string | null;
  image_url: string | null;
  source_id: string;
  published_at: string | null;
  discovered_at: string | null;
  rank: number;
};

function relativeTime(value: string | null) {
  if (!value) return "Recently";
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export async function searchStories(query: string, limit = 30): Promise<SearchStory[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_published_articles", {
      search_term: q,
      result_limit: Math.min(Math.max(limit, 1), 100),
    });
    if (error) throw error;
    const rows = (data ?? []) as SearchRpcRow[];
    if (!rows.length) return [];

    const articleIds = rows.map((row) => row.id);
    const sourceIds = [...new Set(rows.map((row) => row.source_id))];
    const [sourcesResult, categoryLinks] = await Promise.all([
      supabase.from("sources").select("id,name").in("id", sourceIds),
      supabase.from("article_categories").select("article_id,category_id").in("article_id", articleIds),
    ]);
    if (sourcesResult.error) throw sourcesResult.error;
    if (categoryLinks.error) throw categoryLinks.error;

    const categoryIds = [...new Set((categoryLinks.data ?? []).map((row) => row.category_id))];
    const categoriesResult = categoryIds.length
      ? await supabase.from("categories").select("id,name").in("id", categoryIds)
      : { data: [], error: null };
    if (categoriesResult.error) throw categoriesResult.error;

    const sourceNames = new Map((sourcesResult.data ?? []).map((source) => [source.id, source.name]));
    const categoryNames = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.name]));
    const categoryByArticle = new Map<string, string>();
    for (const link of categoryLinks.data ?? []) {
      const name = categoryNames.get(link.category_id);
      if (name && !categoryByArticle.has(link.article_id)) categoryByArticle.set(link.article_id, name);
    }

    return rows.map((row) => ({
      articleId: row.id,
      slug: row.slug,
      title: row.title,
      summary: row.ai_summary || row.description || "Open the story to read the latest coverage.",
      source: sourceNames.get(row.source_id) || "Source",
      published: relativeTime(row.published_at || row.discovered_at),
      regions: [],
      category: categoryByArticle.get(row.id) || "News",
      sourceCount: 1,
      imageUrl: row.image_url,
    }));
  } catch (error) {
    console.error("BridgeNews search failed.", error);
    return [];
  }
}
