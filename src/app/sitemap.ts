import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bridgenews-live-bkushen-5488.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "", "/top-stories", "/latest", "/trending", "/popular", "/search", "/categories", "/topics", "/sources", "/videos", "/map", "/archive", "/official",
    "/region/sri-lanka", "/region/australia", "/region/international",
    "/about", "/contact", "/privacy", "/terms",
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency: path === "" || ["/top-stories", "/latest", "/popular"].includes(path) ? "hourly" : "daily",
    priority: path === "" ? 1 : path.startsWith("/region/") || ["/top-stories", "/latest", "/sources", "/topics"].includes(path) ? 0.8 : 0.6,
  }));

  try {
    const supabase = await createClient();
    const [articlesResult, sourcesResult] = await Promise.all([
      supabase.from("articles").select("slug,updated_at,published_at").eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(1000),
      supabase.from("sources").select("slug,updated_at").eq("enabled", true).order("name", { ascending: true }).limit(200),
    ]);
    const articleRoutes: MetadataRoute.Sitemap = (articlesResult.data ?? []).map((article) => ({
      url: `${BASE_URL}/story/${article.slug}`,
      lastModified: article.updated_at || article.published_at || undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    const sourceRoutes: MetadataRoute.Sitemap = (sourcesResult.data ?? []).map((source) => ({
      url: `${BASE_URL}/sources/${source.slug}`,
      lastModified: source.updated_at || undefined,
      changeFrequency: "daily",
      priority: 0.6,
    }));
    return [...staticRoutes, ...sourceRoutes, ...articleRoutes];
  } catch {
    return staticRoutes;
  }
}
