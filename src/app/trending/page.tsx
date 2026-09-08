import { StoryCard } from "@/components/story-card";
import { stories } from "@/lib/mock-data";
export default function TrendingPage() { return <main className="mx-auto max-w-6xl px-5 py-10"><p className="text-sm font-semibold uppercase tracking-wide text-gray-500">Ranked by recency + source velocity + engagement</p><h1 className="mb-7 mt-1 text-4xl font-black">Trending</h1><div className="grid gap-5 md:grid-cols-2">{[...stories].sort((a,b)=>b.sourceCount-a.sourceCount).map(s => <StoryCard key={s.slug} story={s} />)}</div></main>; }
