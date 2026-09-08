import { createClient } from "@/lib/supabase/server";

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

export async function getTopics(limit = 24): Promise<TopicItem[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return fallbackTopics.slice(0, limit);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("topics")
      .select("name,slug,description,trending_score")
      .order("trending_score", { ascending: false })
      .limit(limit);
    if (error) throw error;
    if (!data?.length) return fallbackTopics.slice(0, limit);
    return data.map((topic) => ({
      name: topic.name,
      slug: topic.slug,
      description: topic.description,
      trendingScore: Number(topic.trending_score ?? 0),
    }));
  } catch (error) {
    console.error("BridgeNews topic query failed; using fallback topics.", error);
    return fallbackTopics.slice(0, limit);
  }
}
