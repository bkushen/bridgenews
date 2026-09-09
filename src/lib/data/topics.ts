import { getStories } from "@/lib/data/stories";
import type { Story } from "@/lib/mock-data";

export type TopicItem = {
  name: string;
  slug: string;
  description: string | null;
  trendingScore: number;
  storyCount?: number;
};

const STOP_WORDS = new Set([
  "about","after","again","against","also","been","before","being","between","could","from","have","into","more","news","over","said","says","than","that","their","there","these","they","this","through","under","what","when","where","which","while","with","would","your","sri","lanka","lankan"
]);

function slugify(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function topicTokens(title: string) {
  return title
    .normalize("NFKC")
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word.toLocaleLowerCase()) && !/^\d+$/.test(word));
}

function displayName(token: string) {
  if (/^[a-z]/i.test(token)) return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
  return token;
}

export async function getTopics(limit = 24): Promise<TopicItem[]> {
  const stories = await getStories({ limit: 220 });
  const counts = new Map<string, { token: string; count: number; categories: Set<string> }>();

  for (const story of stories) {
    for (const token of new Set(topicTokens(story.title))) {
      const key = token.toLocaleLowerCase();
      const current = counts.get(key) || { token, count: 0, categories: new Set<string>() };
      current.count += 1;
      current.categories.add(story.category);
      counts.set(key, current);
    }
  }

  return [...counts.values()]
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count || b.categories.size - a.categories.size || a.token.localeCompare(b.token))
    .slice(0, limit)
    .map((item) => ({
      name: displayName(item.token),
      slug: slugify(item.token),
      description: `Appears in ${item.count} recent stories across ${item.categories.size} section${item.categories.size === 1 ? "" : "s"}.`,
      trendingScore: item.count * 10 + item.categories.size,
      storyCount: item.count,
    }));
}

export async function getTopicBySlug(slug: string): Promise<TopicItem | null> {
  const topics = await getTopics(120);
  return topics.find((topic) => topic.slug === slug) || null;
}

export async function getTopicStories(slug: string, limit = 20): Promise<(Story & { imageUrl?: string | null })[]> {
  const topics = await getTopics(120);
  const topic = topics.find((item) => item.slug === slug);
  if (!topic) return [];
  const needle = topic.name.toLocaleLowerCase();
  const stories = await getStories({ limit: 240 });
  return stories.filter((story) => `${story.title} ${story.summary} ${story.category}`.toLocaleLowerCase().includes(needle)).slice(0, limit);
}
