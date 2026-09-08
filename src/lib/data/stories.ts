import { createClient } from "@/lib/supabase/server";
import type { RegionSlug, Story } from "@/lib/mock-data";

type StoryQueryOptions = {
  region?: RegionSlug;
  limit?: number;
  trending?: boolean;
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

export async function getStories({ region, limit = 24, trending = false }: StoryQueryOptions = {}): Promise<Story[]> {
  try {
    const supabase = await createClient();
    const fetchLimit = Math.max(limit * 3, 30);
    const { data: articles, error: articleError } = await supabase
      .from("articles")
      .select("id,source_id,story_cluster_id,slug,title,ai_summary,description,image_url,published_at,discovered_at")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(fetchLimit);

    if (articleError) throw articleError;
    if (!articles?.length) return [];

    const articleIds = articles.map((article) => article.id);
    const sourceIds = [...new Set(articles.map((article) => article.source_id))];
    const clusterIds = [...new Set(articles.map((article) => article.story_cluster_id).filter(Boolean))] as string[];

    const [regionsResult, categoriesResult, sourcesResult, clustersResult] = await Promise.all([
      supabase.from("article_regions").select("article_id,region_id").in("article_id", articleIds),
      supabase.from("article_categories").select("article_id,category_id").in("article_id", articleIds),
      supabase.from("sources").select("id,name").in("id", sourceIds),
      clusterIds.length ? supabase.from("story_clusters").select("id,article_count,trending_score").in("id", clusterIds) : Promise.resolve({ data: [], error: null }),
    ]);

    if (regionsResult.error) throw regionsResult.error;
    if (categoriesResult.error) throw categoriesResult.error;
    if (sourcesResult.error) throw sourcesResult.error;
    if (clustersResult.error) throw clustersResult.error;

    const regionIds = [...new Set((regionsResult.data ?? []).map((row) => row.region_id))];
    const categoryIds = [...new Set((categoriesResult.data ?? []).map((row) => row.category_id))];
    const [regionMetaResult, categoryMetaResult] = await Promise.all([
      regionIds.length ? supabase.from("regions").select("id,slug").in("id", regionIds) : Promise.resolve({ data: [], error: null }),
      categoryIds.length ? supabase.from("categories").select("id,name").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
    ]);

    if (regionMetaResult.error) throw regionMetaResult.error;
    if (categoryMetaResult.error) throw categoryMetaResult.error;

    const regionSlugById = new Map((regionMetaResult.data ?? []).map((row) => [row.id, row.slug as RegionSlug]));
    const categoryNameById = new Map((categoryMetaResult.data ?? []).map((row) => [row.id, row.name]));
    const sourceNameById = new Map((sourcesResult.data ?? []).map((row) => [row.id, row.name]));
    const clusterById = new Map((clustersResult.data ?? []).map((row) => [row.id, row]));

    const regionsByArticle = new Map<string, RegionSlug[]>();
    for (const row of regionsResult.data ?? []) {
      const slug = regionSlugById.get(row.region_id);
      if (!slug) continue;
      regionsByArticle.set(row.article_id, [...(regionsByArticle.get(row.article_id) ?? []), slug]);
    }

    const categoryByArticle = new Map<string, string>();
    for (const row of categoriesResult.data ?? []) {
      const category = categoryNameById.get(row.category_id);
      if (category && !categoryByArticle.has(row.article_id)) categoryByArticle.set(row.article_id, category);
    }

    let mapped = articles.map((article) => {
      const cluster = article.story_cluster_id ? clusterById.get(article.story_cluster_id) : undefined;
      return {
        slug: article.slug,
        title: article.title,
        summary: article.ai_summary || article.description || "Open the story to see the latest coverage.",
        source: sourceNameById.get(article.source_id) || "Source",
        published: relativeTime(article.published_at || article.discovered_at),
        regions: regionsByArticle.get(article.id) ?? [],
        category: categoryByArticle.get(article.id) || "News",
        sourceCount: Number(cluster?.article_count ?? 1),
        imageUrl: article.image_url,
        trendingScore: Number(cluster?.trending_score ?? 0),
      };
    });

    if (region) mapped = mapped.filter((story) => story.regions.includes(region));
    if (trending) mapped.sort((a, b) => b.trendingScore - a.trendingScore);
    return mapped.slice(0, limit).map(({ trendingScore: _trendingScore, ...story }) => story);
  } catch (error) {
    console.error("BridgeNews live story query failed.", error);
    return [];
  }
}
