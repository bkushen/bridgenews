import { createClient } from "@/lib/supabase/server";
import { getStories } from "@/lib/data/stories";
import type { Story } from "@/lib/mock-data";
import { getActiveRegion, type EditionRegion } from "@/lib/region-context";

export type CategoryItem = { name: string; slug: string; articleCount: number };

export async function getCategories(region?: EditionRegion): Promise<CategoryItem[]> {
  try {
    const selectedRegion = region ?? await getActiveRegion();
    const supabase = await createClient();
    const categoriesResult = await supabase.from("categories").select("id,name,slug").order("name");
    if (categoriesResult.error) throw categoriesResult.error;

    const regionalStories = await getStories({ region: selectedRegion, limit: 1500 });
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
    const selectedRegion = region ?? await getActiveRegion();
    const supabase = await createClient();
    const category = await supabase.from("categories").select("id,name").eq("slug", slug).maybeSingle();
    if (category.error || !category.data) return [];
    const categoryName = category.data.name;

    const regionalStories = await getStories({ region: selectedRegion, limit: 1500 });
    return regionalStories.filter((story) => story.category === categoryName).slice(0, limit) as (Story & { imageUrl?: string | null })[];
  } catch (error) {
    console.error("BridgeNews category story query failed.", error);
    return [];
  }
}
