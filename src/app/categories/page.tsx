import Link from "next/link";
import { getCategories } from "@/lib/data/categories";

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="max-w-3xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Browse</p>
        <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Categories</h1>
        <p className="mt-3 text-base leading-7 text-gray-600">Deterministic categories generated from publisher source and headline rules—no AI required.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <Link key={category.slug} href={`/categories/${category.slug}`} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-xl font-black tracking-tight">{category.name}</h2>
            <p className="mt-2 text-sm text-gray-500">{category.articleCount} published stor{category.articleCount === 1 ? "y" : "ies"}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
