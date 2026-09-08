import { StoryCard } from "@/components/story-card";
import { stories } from "@/lib/mock-data";
export default function LatestPage() { return <main className="mx-auto max-w-6xl px-5 py-10"><h1 className="mb-7 text-4xl font-black">Latest</h1><div className="grid gap-5 md:grid-cols-2">{stories.map(s => <StoryCard key={s.slug} story={s} />)}</div></main>; }
