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
  "a","an","and","are","as","at","be","been","but","by","for","from","has","have","he","her","his","how","in","into","is","it","its","new","news","latest","update","updates","live","breaking","of","on","or","our","she","that","the","their","they","this","to","was","were","what","when","where","which","who","why","will","with","you","your"
]);

function tokenList(title: string) {
  return title
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[|:•·–—_-]+/gu, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/u)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function tokens(title: string) {
  return [...new Set(tokenList(title))];
}

function bigrams(title: string) {
  const words = tokenList(title);
  const result = new Set<string>();
  for (let index = 0; index < words.length - 1; index += 1) result.add(`${words[index]} ${words[index + 1]}`);
  return result;
}

function numericTokens(title: string) {
  return new Set(title.match(/\b\d+(?:\.\d+)?%?\b/g) ?? []);
}

function intersectionSize<T>(a: Set<T>, b: Set<T>) {
  let count = 0;
  for (const value of a) if (b.has(value)) count += 1;
  return count;
}

function similarity(a: string, b: string) {
  const leftTokens = new Set(tokens(a));
  const rightTokens = new Set(tokens(b));
  if (!leftTokens.size || !rightTokens.size) return 0;

  const tokenOverlap = intersectionSize(leftTokens, rightTokens);
  if (tokenOverlap < 2) return 0;
  const union = new Set([...leftTokens, ...rightTokens]).size;
  const jaccard = union ? tokenOverlap / union : 0;
  const containment = tokenOverlap / Math.min(leftTokens.size, rightTokens.size);

  const leftBigrams = bigrams(a);
  const rightBigrams = bigrams(b);
  const bigramOverlap = leftBigrams.size && rightBigrams.size
    ? intersectionSize(leftBigrams, rightBigrams) / Math.min(leftBigrams.size, rightBigrams.size)
    : 0;

  const leftNumbers = numericTokens(a);
  const rightNumbers = numericTokens(b);
  const numberConflict = leftNumbers.size && rightNumbers.size && intersectionSize(leftNumbers, rightNumbers) === 0;
  if (numberConflict && containment < 0.8) return Math.min(0.45, containment);

  return Math.max(containment * 0.72 + jaccard * 0.18 + bigramOverlap * 0.10, bigramOverlap * 0.82 + containment * 0.18);
}

function belongs(story: TopicStory, group: TopicGroup) {
  const scores = group.stories.map((candidate) => similarity(story.title, candidate.title));
  const score = Math.max(...scores, 0);
  if (score >= 0.76) return true;
  if (score >= 0.64 && story.category === group.category) return true;
  return false;
}

function isNearDuplicateFromSameSource(story: TopicStory, group: TopicGroup) {
  return group.stories.some((candidate) => candidate.source === story.source && similarity(story.title, candidate.title) >= 0.9);
}

export function groupStoriesIntoTopics(stories: TopicStory[], limit = 30): TopicGroup[] {
  const groups: TopicGroup[] = [];

  for (const story of stories) {
    const match = groups.find((group) => belongs(story, group));
    if (match) {
      if (!isNearDuplicateFromSameSource(story, match)) match.stories.push(story);
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
