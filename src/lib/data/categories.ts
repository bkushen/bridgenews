import { createClient } from "@/lib/supabase/server";
import type { Story } from "@/lib/mock-data";
import { getActiveRegion, type EditionRegion } from "@/lib/region-context";

export type CategoryItem = { name: string; slug: string; articleCount: number };

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

async function regionalPublishedIds(region: EditionRegion) {
  const supabase = await createClient();
  const regionRow = await supabase.from("regions").select("id").eq("slug", region).maybeSingle();
  if (regionRow.error || !regionRow.data) return [];
  const links = await supabase.from("article_regions").select("article_id").eq("region_id", regionRow.data.id).limit(10000);
  if (links.error) throw links.error;
  const ids = [...new Set((links.data ?? []).map((row) => row.article_id))];
  if (!ids.length) return [];
  const published = await supabase.from("articles").select("id").in("id", ids).eq("status", "published").not("image_url", "is", null).neq("image_url", "").limit(10000);
  if (published.error) throw published.error;
  return (published.data ?? []).map((row) => row.id);
}

export async function getCategories(region?: EditionRegion): Promise<CategoryItem[]> {
  try {
    const activeRegion = region ?? await getActiveRegion();
    const articleIds = await regionalPublishedIds(activeRegion);
    if (!articleIds.length) return [];
    const supabase = await createClient();
    const [categoriesResult, linksResult] = await Promise.all([
      supabase.from("categories").select("id,name,slug").order("name"),
      supabase.from("article_categories").select("category_id,article_id").in("article_id", articleIds),
    ]);
    if (categoriesResult.error) throw categoriesResult.error;
    if (linksResult.error) throw linksResult.error;
    const counts = new Map<string, number>();
    for (const row of linksResult.data ?? []) counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
    return (categoriesResult.data ?? []).map((category) => ({ name: category.name, slug: category.slug, articleCount: counts.get(category.id) ?? 0 })).filter((category) => category.articleCount > 0).sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name));
  } catch (error) {
    console.error("BridgeNews category query failed.", error);
    return [];
  }
}

export async function getCategoryStories(slug: string, limit = 40, region?: EditionRegion): Promise<(Story & { imageUrl?: string | null })[]> {
  try {
    const activeRegion = region ?? await getActiveRegion();
    const regionalIds = new Set(await regionalPublishedIds(activeRegion));
    if (!regionalIds.size) return [];
    const supabase = await createClient();
    const category = await supabase.from("categories").select("id,name").eq("slug", slug).maybeSingle();
    if (category.error || !category.data) return [];
    const categoryId = category.data.id;
    const categoryName = category.data.name;
    const links = await supabase.from("article_categories").select("article_id").eq("category_id", categoryId).limit(limit * 20);
    if (links.error) throw links.error;
    const ids = (links.data ?? []).map((row) => row.article_id).filter((id) => regionalIds.has(id));
    if (!ids.length) return [];
    const articles = await supabase.from("articles").select("id,source_id,slug,title,description,ai_summary,image_url,published_at,discovered_at").in("id", ids).eq("status", "published").not("image_url", "is", null).neq("image_url", "").order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
    if (articles.error) throw articles.error;
    const sourceIds = [...new Set((articles.data ?? []).map((article) => article.source_id))];
    const sources = sourceIds.length ? await supabase.from("sources").select("id,name").in("id", sourceIds) : { data: [], error: null };
    if (sources.error) throw sources.error;
    const sourceNames = new Map((sources.data ?? []).map((source) => [source.id, source.name]));
    return (articles.data ?? []).map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.ai_summary || article.description || "Open the story to read the latest coverage.",
      source: sourceNames.get(article.source_id) || "Source",
      published: relativeTime(article.published_at || article.discovered_at),
      regions: [activeRegion],
      category: categoryName,
      sourceCount: 1,
      imageUrl: article.image_url,
    }));
  } catch (error) {
    console.error("BridgeNews category story query failed.", error);
    return [];
  }
}
