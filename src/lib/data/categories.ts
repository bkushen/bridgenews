import { createClient } from "@/lib/supabase/server";
import { getStories } from "@/lib/data/stories";
import type { Story } from "@/lib/mock-data";
import type { EditionRegion } from "@/lib/region-context";

export type CategoryItem = { name: string; slug: string; articleCount: number };

export async function getCategories(region?: EditionRegion): Promise<CategoryItem[]> {
  try {
    const supabase = await createClient();
    const categoriesResult = await supabase.from("categories").select("id,name,slug").order("name");
    if (categoriesResult.error) throw categoriesResult.error;

    if (!region) {
      const linksResult = await supabase.from("article_categories").select("category_id,article_id");
      if (linksResult.error) throw linksResult.error;
      const counts = new Map<string, number>();
      for (const row of linksResult.data ?? []) counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
      return (categoriesResult.data ?? [])
        .map((category) => ({ name: category.name, slug: category.slug, articleCount: counts.get(category.id) ?? 0 }))
        .filter((category) => category.articleCount > 0)
        .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name));
    }

    // Public category counts must come only from stories visible in the selected edition.
    const regionalStories = await getStories({ region, limit: 1500 });
    const countsByName = new Map<string, number>();
    for (const story of regionalStories) countsByName.set(story.category, (countsByName.get(story.category) ?? 0) + 1);

    return (categoriesResult.data ?? [])
      .map((category) => ({ name: category.name, slug: category.slug, articleCount: countsByName.get(category.name) ?? 0 }))
      .filter((category) => category.articleCount > 0)
      .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name));
  } catch (error) {
    console.error("BridgeNews category query failed.", error);
    return [];
  }
}

export async function getCategoryStories(slug: string, limit = 40, region?: EditionRegion): Promise<(Story & { imageUrl?: string | null })[]> {
  try {
    const supabase = await createClient();
    const category = await supabase.from("categories").select("id,name").eq("slug", slug).maybeSingle();
    if (category.error || !category.data) return [];

    if (region) {
      const regionalStories = await getStories({ region, limit: 1500 });
      return regionalStories.filter((story) => story.category === category.data.name).slice(0, limit) as (Story & { imageUrl?: string | null })[];
    }

    const categoryId = category.data.id;
    const categoryName = category.data.name;
    const links = await supabase.from("article_categories").select("article_id").eq("category_id", categoryId).limit(limit * 4);
    if (links.error) throw links.error;
    const ids = (links.data ?? []).map((row) => row.article_id);
    if (!ids.length) return [];
    const articles = await supabase
      .from("articles")
      .select("id,source_id,slug,title,description,ai_summary,image_url,published_at,discovered_at")
      .in("id", ids)
      .eq("status", "published")
      .not("image_url", "is", null)
      .neq("image_url", "")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);
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
      published: article.published_at || article.discovered_at || "Recently",
      regions: [],
      category: categoryName,
      sourceCount: 1,
      imageUrl: article.image_url,
    }));
  } catch (error) {
    console.error("BridgeNews category story query failed.", error);
    return [];
  }
}
