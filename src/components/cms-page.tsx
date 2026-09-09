import { notFound } from "next/navigation";
import { getContentPage } from "@/lib/data/content-pages";

export async function CmsPage({ slug }: { slug: string }) {
  const page = await getContentPage(slug);
  if (!page) notFound();
  return <main className="mx-auto max-w-4xl px-5 py-12"><p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">BridgeNews</p><h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">{page.title}</h1>{page.excerpt?<p className="mt-4 text-lg leading-8 text-gray-500">{page.excerpt}</p>:null}<div className="mt-8 whitespace-pre-wrap text-base leading-8 text-gray-700">{page.body}</div><p className="mt-10 text-xs text-gray-400">Last updated {new Date(page.updated_at).toLocaleDateString("en-AU")}</p></main>;
}

export async function cmsMetadata(slug: string) {
  const page = await getContentPage(slug);
  return { title: page?.seo_title || page?.title || "BridgeNews", description: page?.seo_description || page?.excerpt || undefined };
}
