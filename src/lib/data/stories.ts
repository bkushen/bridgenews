import { createClient } from "@/lib/supabase/server";
import type { RegionSlug, Story } from "@/lib/mock-data";
import { getActiveRegion } from "@/lib/region-context";

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

function editorialRank(article: {
  is_main_headline?: boolean | null;
  is_breaking?: boolean | null;
  is_featured?: boolean | null;
  editorial_priority?: number | null;
  pinned_until?: string | null;
}) {
  const pinned = article.pinned_until ? new Date(article.pinned_until).getTime() > Date.now() : false;
  return (article.is_main_headline ? 100000 : 0)
    + (article.is_breaking ? 50000 : 0)
    + (article.is_featured ? 20000 : 0)
    + (pinned ? 10000 : 0)
    + Number(article.editorial_priority ?? 0);
}

export async function getStories({ region, limit = 24, trending = false }: StoryQueryOptions = {}): Promise<Story[]> {
  try {
    const selectedRegion = (region ?? await getActiveRegion()) as RegionSlug;
    const supabase = await createClient();

    // Resolve the active edition first, then filter the article query by that
    // relation before applying any result limit. This prevents a busy edition
    // from crowding another edition out of the initial global fetch window.
    const regionResult = await supabase.from("regions").select("id,slug").eq("slug", selectedRegion).maybeSingle();
    if (regionResult.error) throw regionResult.error;
    if (!regionResult.data) return [];

    const fetchLimit = Math.min(Math.max(limit * 12, 240), 1500);
    const { data: articles, error: articleError } = await supabase
      .from("articles")
      .select("id,source_id,story_cluster_id,slug,title,ai_summary,description,image_url,published_at,discovered_at,is_main_headline,is_breaking,is_featured,editorial_priority,pinned_until,article_regions!inner(region_id)")
      .eq("status", "published")
      .eq("article_regions.region_id", regionResult.data.id)
      .not("image_url", "is", null)
      .neq("image_url", "")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(fetchLimit);

    if (articleError) throw articleError;
    if (!articles?.length) return [];

    const articleIds = articles.map((article) => article.id);
    const sourceIds = [...new Set(articles.map((article) => article.source_id))];
    const clusterIds = [...new Set(articles.map((article) => article.story_cluster_id).filter(Boolean))] as string[];

    const [categoriesResult, sourcesResult, clustersResult] = await Promise.all([
      supabase.from("article_categories").select("article_id,category_id").in("article_id", articleIds),
      supabase.from("sources").select("id,name").in("id", sourceIds),
      clusterIds.length ? supabase.from("story_clusters").select("id,article_count,trending_score").in("id", clusterIds) : Promise.resolve({ data: [], error: null }),
    ]);

    const categoryRows = categoriesResult.error ? [] : (categoriesResult.data ?? []);
    const sourceRows = sourcesResult.error ? [] : (sourcesResult.data ?? []);
    const clusterRows = clustersResult.error ? [] : (clustersResult.data ?? []);

    const categoryIds = [...new Set(categoryRows.map((row) => row.category_id))];
    const categoryMetaResult = categoryIds.length
      ? await supabase.from("categories").select("id,name").in("id", categoryIds)
      : { data: [], error: null };
    const categoryMetaRows = categoryMetaResult.error ? [] : (categoryMetaResult.data ?? []);

    const categoryNameById = new Map(categoryMetaRows.map((row) => [row.id, row.name]));
    const sourceNameById = new Map(sourceRows.map((row) => [row.id, row.name]));
    const clusterById = new Map(clusterRows.map((row) => [row.id, row]));

    const categoryByArticle = new Map<string, string>();
    for (const row of categoryRows) {
      const category = categoryNameById.get(row.category_id);
      if (category && !categoryByArticle.has(row.article_id)) categoryByArticle.set(row.article_id, category);
    }

    const visible = articles.map((article) => {
      const cluster = article.story_cluster_id ? clusterById.get(article.story_cluster_id) : undefined;
      return {
        slug: article.slug,
        title: article.title,
        summary: article.ai_summary || article.description || "Open the story to see the latest coverage.",
        source: sourceNameById.get(article.source_id) || "Source",
        published: relativeTime(article.published_at || article.discovered_at),
        regions: [selectedRegion],
        category: categoryByArticle.get(article.id) || "News",
        sourceCount: Number(cluster?.article_count ?? 1),
        imageUrl: article.image_url,
        trendingScore: Number(cluster?.trending_score ?? 0),
        editorialRank: editorialRank(article),
        publishedMs: new Date(article.published_at || article.discovered_at || 0).getTime(),
      };
    });

    if (trending) {
      visible.sort((a, b) => b.editorialRank - a.editorialRank || b.trendingScore - a.trendingScore || b.publishedMs - a.publishedMs);
    } else {
      visible.sort((a, b) => b.editorialRank - a.editorialRank || b.publishedMs - a.publishedMs);
    }

    return visible.slice(0, limit).map(({ trendingScore: _trendingScore, editorialRank: _editorialRank, publishedMs: _publishedMs, ...story }) => story);
  } catch (error) {
    console.error("BridgeNews live story query failed.", error);
    return [];
  }
}
