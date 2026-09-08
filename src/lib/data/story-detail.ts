import { createClient } from "@/lib/supabase/server";

export type StorySource = { name: string; url: string; publishedAt: string | null };
export type StoryDetail = {
  articleId: string | null;
  slug: string;
  title: string;
  summary: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  source: string;
  sourceCount: number;
  regions: string[];
  published: string;
  sources: StorySource[];
};

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

export async function getStoryBySlug(slug: string): Promise<StoryDetail | null> {
  try {
    const supabase = await createClient();
    const article = await supabase.from("articles").select("id,source_id,story_cluster_id,slug,title,description,ai_summary,image_url,original_url,published_at,discovered_at").eq("slug", slug).eq("status", "published").maybeSingle();
    if (article.error) throw article.error;
    if (!article.data) return null;
    const a = article.data;
    const [sourceResult, regionLinks, categoryLinks] = await Promise.all([
      supabase.from("sources").select("id,name").eq("id", a.source_id).maybeSingle(),
      supabase.from("article_regions").select("region_id").eq("article_id", a.id),
      supabase.from("article_categories").select("category_id").eq("article_id", a.id).limit(1),
    ]);
    const regionIds = (regionLinks.data ?? []).map((row) => row.region_id);
    const categoryIds = (categoryLinks.data ?? []).map((row) => row.category_id);
    const [regionsResult, categoriesResult] = await Promise.all([
      regionIds.length ? supabase.from("regions").select("id,name").in("id", regionIds) : Promise.resolve({ data: [], error: null }),
      categoryIds.length ? supabase.from("categories").select("id,name").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
    ]);
    let sourceRows: StorySource[] = [{ name: sourceResult.data?.name || "Source", url: a.original_url, publishedAt: a.published_at }];
    if (a.story_cluster_id) {
      const peers = await supabase.from("articles").select("source_id,original_url,published_at").eq("story_cluster_id", a.story_cluster_id).eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(12);
      if (!peers.error && peers.data?.length) {
        const sourceIds = [...new Set(peers.data.map((peer) => peer.source_id))];
        const peerSources = await supabase.from("sources").select("id,name").in("id", sourceIds);
        const names = new Map((peerSources.data ?? []).map((source) => [source.id, source.name]));
        sourceRows = peers.data.map((peer) => ({ name: names.get(peer.source_id) || "Source", url: peer.original_url, publishedAt: peer.published_at }));
      }
    }
    return {
      articleId: a.id,
      slug: a.slug,
      title: a.title,
      summary: a.ai_summary || a.description || "Open the original publisher links for full coverage.",
      description: a.description,
      imageUrl: a.image_url,
      category: categoriesResult.data?.[0]?.name || "News",
      source: sourceResult.data?.name || "Source",
      sourceCount: sourceRows.length,
      regions: (regionsResult.data ?? []).map((region) => region.name),
      published: relativeTime(a.published_at || a.discovered_at),
      sources: sourceRows,
    };
  } catch (error) {
    console.error("BridgeNews story detail query failed.", error);
    return null;
  }
}
