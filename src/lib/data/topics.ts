import { createClient } from "@/lib/supabase/server";
import { stories as fallbackStories, type Story } from "@/lib/mock-data";

export type TopicItem = {
  name: string;
  slug: string;
  description: string | null;
  trendingScore: number;
};

const fallbackTopics: TopicItem[] = [
  { name: "Artificial Intelligence", slug: "artificial-intelligence", description: "AI products, policy, jobs and research.", trendingScore: 92 },
  { name: "Sri Lankan Economy", slug: "sri-lankan-economy", description: "Economy, markets, trade and policy in Sri Lanka.", trendingScore: 86 },
  { name: "Australian Migration", slug: "australian-migration", description: "Migration, visas and policy changes in Australia.", trendingScore: 82 },
  { name: "International Students", slug: "international-students", description: "Education, visas and student life across borders.", trendingScore: 78 },
  { name: "Technology", slug: "technology", description: "Technology companies, products and digital change.", trendingScore: 74 },
  { name: "Cricket", slug: "cricket", description: "Sri Lankan, Australian and international cricket.", trendingScore: 70 },
  { name: "Housing", slug: "housing", description: "Housing supply, affordability and property markets.", trendingScore: 66 },
  { name: "Education", slug: "education", description: "Universities, schools, policy and skills.", trendingScore: 62 },
];

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

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

export async function getTopics(limit = 24): Promise<TopicItem[]> {
  if (!configured()) return fallbackTopics.slice(0, limit);
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("topics").select("name,slug,description,trending_score").order("trending_score", { ascending: false }).limit(limit);
    if (error) throw error;
    if (!data?.length) return fallbackTopics.slice(0, limit);
    return data.map((topic) => ({ name: topic.name, slug: topic.slug, description: topic.description, trendingScore: Number(topic.trending_score ?? 0) }));
  } catch (error) {
    console.error("BridgeNews topic query failed; using fallback topics.", error);
    return fallbackTopics.slice(0, limit);
  }
}

export async function getTopicBySlug(slug: string): Promise<TopicItem | null> {
  if (!configured()) return fallbackTopics.find((topic) => topic.slug === slug) ?? null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("topics").select("id,name,slug,description,trending_score").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!data) return fallbackTopics.find((topic) => topic.slug === slug) ?? null;
    return { name: data.name, slug: data.slug, description: data.description, trendingScore: Number(data.trending_score ?? 0) };
  } catch {
    return fallbackTopics.find((topic) => topic.slug === slug) ?? null;
  }
}

export async function getTopicStories(slug: string, limit = 20): Promise<(Story & { imageUrl?: string | null })[]> {
  if (!configured()) {
    const words = slug.replace(/-/g, " ").toLowerCase().split(" ").filter((word) => word.length > 3);
    const matched = fallbackStories.filter((story) => words.some((word) => `${story.title} ${story.summary} ${story.category}`.toLowerCase().includes(word)));
    return (matched.length ? matched : fallbackStories).slice(0, limit);
  }

  try {
    const supabase = await createClient();
    const topic = await supabase.from("topics").select("id").eq("slug", slug).maybeSingle();
    if (topic.error || !topic.data) return [];
    const links = await supabase.from("article_topics").select("article_id").eq("topic_id", topic.data.id).limit(limit * 2);
    if (links.error) throw links.error;
    const ids = (links.data ?? []).map((row) => row.article_id);
    if (!ids.length) return [];

    const articles = await supabase.from("articles").select("id,source_id,slug,title,ai_summary,description,image_url,published_at,discovered_at").in("id", ids).eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(limit);
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
      regions: [],
      category: "News",
      sourceCount: 1,
      imageUrl: article.image_url,
    }));
  } catch (error) {
    console.error("BridgeNews topic story query failed.", error);
    return [];
  }
}
