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
    const supabase = await createClient();
    // Fetch a wider window before applying the regional relation filter. This keeps
    // lower-volume regions visible even when another region publishes heavily.
    const fetchLimit = Math.min(Math.max(limit * 12, 240), 1500);
    const { data: articles, error: articleError } = await supabase
      .from("articles")
      .select("id,source_id,story_cluster_id,slug,title,ai_summary,description,image_url,published_at,discovered_at,is_main_headline,is_breaking,is_featured,editorial_priority,pinned_until")
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(fetchLimit);

    if (articleError) throw articleError;
    if (!articles?.length) return [];

    const articleIds = articles.map((article) => article.id);
    const sourceIds = [...new Set(articles.map((article) => article.source_id))];
    const clusterIds = [...new Set(articles.map((article) => article.story_cluster_id).filter(Boolean))] as string[];

    // Metadata enrichments should never make the whole public feed disappear.
    const [regionsResult, categoriesResult, sourcesResult, clustersResult] = await Promise.all([
      supabase.from("article_regions").select("article_id,region_id").in("article_id", articleIds),
      supabase.from("article_categories").select("article_id,category_id").in("article_id", articleIds),
      supabase.from("sources").select("id,name").in("id", sourceIds),
      clusterIds.length ? supabase.from("story_clusters").select("id,article_count,trending_score").in("id", clusterIds) : Promise.resolve({ data: [], error: null }),
    ]);

    const regionRows = regionsResult.error ? [] : (regionsResult.data ?? []);
    const categoryRows = categoriesResult.error ? [] : (categoriesResult.data ?? []);
    const sourceRows = sourcesResult.error ? [] : (sourcesResult.data ?? []);
    const clusterRows = clustersResult.error ? [] : (clustersResult.data ?? []);

    const regionIds = [...new Set(regionRows.map((row) => row.region_id))];
    const categoryIds = [...new Set(categoryRows.map((row) => row.category_id))];
    const [regionMetaResult, categoryMetaResult] = await Promise.all([
      regionIds.length ? supabase.from("regions").select("id,slug").in("id", regionIds) : Promise.resolve({ data: [], error: null }),
      categoryIds.length ? supabase.from("categories").select("id,name").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
    ]);

    const regionMetaRows = regionMetaResult.error ? [] : (regionMetaResult.data ?? []);
    const categoryMetaRows = categoryMetaResult.error ? [] : (categoryMetaResult.data ?? []);

    const regionSlugById = new Map(regionMetaRows.map((row) => [row.id, row.slug as RegionSlug]));
    const categoryNameById = new Map(categoryMetaRows.map((row) => [row.id, row.name]));
    const sourceNameById = new Map(sourceRows.map((row) => [row.id, row.name]));
    const clusterById = new Map(clusterRows.map((row) => [row.id, row]));

    const regionsByArticle = new Map<string, RegionSlug[]>();
    for (const row of regionRows) {
      const slug = regionSlugById.get(row.region_id);
      if (!slug) continue;
      regionsByArticle.set(row.article_id, [...(regionsByArticle.get(row.article_id) ?? []), slug]);
    }

    const categoryByArticle = new Map<string, string>();
    for (const row of categoryRows) {
      const category = categoryNameById.get(row.category_id);
      if (category && !categoryByArticle.has(row.article_id)) categoryByArticle.set(row.article_id, category);
    }

    const mapped = articles.map((article) => {
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
        editorialRank: editorialRank(article),
        publishedMs: new Date(article.published_at || article.discovered_at || 0).getTime(),
      };
    });

    const regional = region ? mapped.filter((story) => story.regions.includes(region)) : mapped;
    // If regional metadata is temporarily unavailable, show the live stream rather
    // than rendering a homepage with no posts.
    const visible = region && regional.length === 0 ? mapped : regional;

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
