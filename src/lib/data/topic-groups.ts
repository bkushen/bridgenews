import type { Story } from "@/lib/mock-data";

export type TopicStory = Story & { imageUrl?: string | null };

export type TopicGroup = {
  key: string;
  lead: TopicStory;
  stories: TopicStory[];
  sources: string[];
  sourceCount: number;
  category: string;
};

const STOP_WORDS = new Set([
  "a","an","and","are","as","at","be","been","but","by","for","from","has","have","he","her","his","how","in","into","is","it","its","new","of","on","or","our","she","that","the","their","they","this","to","was","were","what","when","where","which","who","why","will","with","you","your"
]);

function tokens(title: string) {
  return [...new Set(
    title
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/u)
      .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
  )];
}

function similarity(a: string, b: string) {
  const left = tokens(a);
  const right = tokens(b);
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  const overlap = left.filter((word) => rightSet.has(word)).length;
  if (overlap < 2) return 0;
  return overlap / Math.min(left.length, right.length);
}

function belongs(story: TopicStory, group: TopicGroup) {
  const score = Math.max(...group.stories.map((candidate) => similarity(story.title, candidate.title)));
  if (score >= 0.72) return true;
  if (score >= 0.58 && story.category === group.category) return true;
  return false;
}

export function groupStoriesIntoTopics(stories: TopicStory[], limit = 30): TopicGroup[] {
  const groups: TopicGroup[] = [];

  for (const story of stories) {
    const match = groups.find((group) => belongs(story, group));
    if (match) {
      match.stories.push(story);
      if (!match.sources.includes(story.source)) match.sources.push(story.source);
      match.sourceCount = match.sources.length;
      continue;
    }

    groups.push({
      key: story.slug,
      lead: story,
      stories: [story],
      sources: [story.source],
      sourceCount: 1,
      category: story.category,
    });
  }

  return groups.slice(0, limit);
}

export function rankTrendingTopics(groups: TopicGroup[]) {
  return [...groups].sort((a, b) => {
    const sourceDelta = b.sourceCount - a.sourceCount;
    if (sourceDelta) return sourceDelta;
    const coverageDelta = b.stories.length - a.stories.length;
    if (coverageDelta) return coverageDelta;
    return 0;
  });
}
