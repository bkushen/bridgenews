import { createClient } from "@/lib/supabase/server";

export async function getContentPage(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("content_pages").select("slug,title,body,excerpt,seo_title,seo_description,updated_at").eq("slug",slug).eq("published",true).maybeSingle();
  return data ?? null;
}
