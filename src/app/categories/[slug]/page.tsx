import { notFound } from "next/navigation";
import { StoryCard } from "@/components/story-card";
import { getCategories, getCategoryStories } from "@/lib/data/categories";

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const stories = await getCategoryStories(slug, 40);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Category</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{category.name}</h1>
        <p className="mt-3 text-base leading-7 text-gray-600">{category.articleCount} published stor{category.articleCount === 1 ? "y" : "ies"} currently classified here.</p>
      </div>
      {stories.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{stories.map((story) => <StoryCard key={story.slug} story={story} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-gray-600">No published stories in this category yet.</div>}
    </main>
  );
}
