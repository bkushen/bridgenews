import { createClient } from "@/lib/supabase/server";

export type PublicSource = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  languageCode: string;
};

export async function getPublicSources(limit = 30): Promise<PublicSource[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("id,name,slug,website_url,logo_url,default_language_code")
    .eq("enabled", true)
    .order("name", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("getPublicSources", error);
    return [];
  }

  return (data ?? []).map((source) => ({
    id: source.id,
    name: source.name,
    slug: source.slug,
    websiteUrl: source.website_url,
    logoUrl: source.logo_url,
    languageCode: source.default_language_code || "en",
  }));
}
