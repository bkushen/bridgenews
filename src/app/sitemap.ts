import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bridgenews-live-bkushen-5488.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "", "/latest", "/trending", "/search", "/categories",
    "/region/sri-lanka", "/region/australia", "/region/international",
    "/about", "/contact", "/privacy", "/terms",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: path === "" ? "hourly" : "daily",
    priority: path === "" ? 1 : path.startsWith("/region/") || ["/latest", "/categories"].includes(path) ? 0.8 : 0.6,
  }));

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return staticRoutes;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("articles").select("slug,updated_at,published_at").eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(1000);
    const articleRoutes: MetadataRoute.Sitemap = (data ?? []).map((article) => ({
      url: `${BASE_URL}/story/${article.slug}`,
      lastModified: article.updated_at || article.published_at || undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticRoutes, ...articleRoutes];
  } catch {
    return staticRoutes;
  }
}
