import { createClient } from "@/lib/supabase/server";
import type { RegionSlug } from "@/lib/mock-data";

export type HotHashtag = {
  label: string;
  mentions: number;
  sourceCount: number;
  newestAt: string;
  ageMinutes: number;
  sources: string[];
};

type LanguageCode = "en" | "si" | "ta";

type HotHashtagOptions = {
  region: RegionSlug;
  language?: LanguageCode;
  hours?: number;
  limit?: number;
};

export async function getHotHashtags({
  region,
  language,
  hours = 36,
  limit = 12,
}: HotHashtagOptions): Promise<HotHashtag[]> {
  try {
    const supabase = await createClient();
    const regionResult = await supabase
      .from("regions")
      .select("id")
      .eq("slug", region)
      .maybeSingle();

    if (regionResult.error) throw regionResult.error;
    if (!regionResult.data) return [];

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    let articleQuery = supabase
      .from("articles")
      .select("id,source_id,published_at,discovered_at,language_code,article_regions!inner(region_id)")
      .eq("status", "published")
      .eq("article_regions.region_id", regionResult.data.id)
      .gte("published_at", cutoff)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(700);

    if (language) articleQuery = articleQuery.eq("language_code", language);

    const articleResult = await articleQuery;
    if (articleResult.error) throw articleResult.error;
    const articles = articleResult.data ?? [];
    if (!articles.length) return [];

    const articleIds = articles.map((article) => article.id);
    const sourceIds = [...new Set(articles.map((article) => article.source_id))];

    const [topicLinksResult, sourcesResult] = await Promise.all([
      supabase.from("article_topics").select("article_id,topic_id").in("article_id", articleIds),
      supabase.from("sources").select("id,name,website_url").in("id", sourceIds),
    ]);

    if (topicLinksResult.error) throw topicLinksResult.error;
    const topicLinks = topicLinksResult.data ?? [];
    if (!topicLinks.length) return [];

    const topicIds = [...new Set(topicLinks.map((row) => row.topic_id))];
    const topicsResult = await supabase
      .from("topics")
      .select("id,name,trending_score")
      .in("id", topicIds);

    if (topicsResult.error) throw topicsResult.error;

    const articleById = new Map(articles.map((article) => [article.id, article]));
    const sourceById = new Map(
      (sourcesResult.error ? [] : sourcesResult.data ?? []).map((source) => [source.id, source]),
    );
    const topicById = new Map((topicsResult.data ?? []).map((topic) => [topic.id, topic]));

    const aggregates = new Map<
      string,
      {
        label: string;
        mentions: number;
        sourceIds: Set<string>;
        sourceNames: Set<string>;
        newestMs: number;
        topicScore: number;
      }
    >();

    for (const link of topicLinks) {
      const article = articleById.get(link.article_id);
      const topic = topicById.get(link.topic_id);
      if (!article || !topic?.name?.trim()) continue;

      const publishedMs = new Date(article.published_at || article.discovered_at || 0).getTime();
      if (!Number.isFinite(publishedMs) || publishedMs <= 0) continue;

      const key = topic.name.normalize("NFKC").toLocaleLowerCase().trim();
      const current = aggregates.get(key) ?? {
        label: topic.name.trim(),
        mentions: 0,
        sourceIds: new Set<string>(),
        sourceNames: new Set<string>(),
        newestMs: 0,
        topicScore: Number(topic.trending_score ?? 0),
      };

      current.mentions += 1;
      current.sourceIds.add(article.source_id);
      const source = sourceById.get(article.source_id);
      if (source?.name) current.sourceNames.add(source.name);
      current.newestMs = Math.max(current.newestMs, publishedMs);
      current.topicScore = Math.max(current.topicScore, Number(topic.trending_score ?? 0));
      aggregates.set(key, current);
    }

    const now = Date.now();

    return [...aggregates.values()]
      .map((tag) => {
        const ageMinutes = Math.max(0, Math.round((now - tag.newestMs) / 60_000));
        const ageHours = ageMinutes / 60;
        const recencyBoost = Math.max(0, hours - ageHours) / Math.max(1, hours);
        const sourceCount = tag.sourceIds.size;
        const score = sourceCount * 12 + tag.mentions * 3 + recencyBoost * 10 + Math.min(tag.topicScore, 25);
        return {
          label: tag.label,
          mentions: tag.mentions,
          sourceCount,
          newestAt: new Date(tag.newestMs).toISOString(),
          ageMinutes,
          sources: [...tag.sourceNames].slice(0, 4),
          score,
        };
      })
      .filter((tag) => tag.sourceCount >= 2 || tag.mentions >= 3)
      .sort((a, b) => b.score - a.score || b.sourceCount - a.sourceCount || b.mentions - a.mentions || a.ageMinutes - b.ageMinutes)
      .slice(0, limit)
      .map(({ score: _score, ...tag }) => tag);
  } catch (error) {
    console.error("BridgeNews hot hashtag query failed.", error);
    return [];
  }
}
