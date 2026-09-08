export type RegionSlug = "sri-lanka" | "australia" | "international";

export type Story = {
  slug: string;
  title: string;
  summary: string;
  source: string;
  published: string;
  regions: RegionSlug[];
  category: string;
  sourceCount: number;
};

export const regionMeta = {
  "sri-lanka": { label: "Sri Lanka", flag: "🇱🇰", description: "Local news, economy, cricket, technology, education and the Sri Lankan community." },
  australia: { label: "Australia", flag: "🇦🇺", description: "National news, states, jobs, housing, migration, education and technology." },
  international: { label: "International", flag: "🌍", description: "Important global developments across business, technology, politics, science and culture." },
} satisfies Record<RegionSlug, { label: string; flag: string; description: string }>;

export const stories: Story[] = [
  {
    slug: "australia-sri-lanka-education-links",
    title: "Australia–Sri Lanka education links continue to expand",
    summary: "A cross-region story card demonstrating how one article can appear in both Sri Lanka and Australia feeds while keeping a single canonical story cluster.",
    source: "Demo Source",
    published: "18 min ago",
    regions: ["sri-lanka", "australia"],
    category: "Education",
    sourceCount: 4,
  },
  {
    slug: "sri-lanka-digital-economy",
    title: "Sri Lanka's digital economy becomes a growing focus",
    summary: "Technology, digital services and workforce skills can be grouped into a dedicated Sri Lanka technology topic page.",
    source: "Demo Source",
    published: "31 min ago",
    regions: ["sri-lanka"],
    category: "Technology",
    sourceCount: 3,
  },
  {
    slug: "australian-tech-market",
    title: "Australian technology market shifts toward AI-enabled roles",
    summary: "This sample story demonstrates automatic regional classification, AI summary placement and related-topic tagging.",
    source: "Demo Source",
    published: "42 min ago",
    regions: ["australia"],
    category: "Technology",
    sourceCount: 7,
  },
  {
    slug: "global-ai-governance",
    title: "Governments worldwide continue shaping AI governance",
    summary: "International reporting can be grouped into one evolving story with multiple publishers shown beneath the main summary.",
    source: "Demo Source",
    published: "1 hr ago",
    regions: ["international"],
    category: "World",
    sourceCount: 12,
  },
];
