import { createClient } from "@/lib/supabase/server";

export type SiteControl = {
  settings: Record<string, unknown>;
  homepage: Record<string, { enabled: boolean; sortOrder: number }>;
};

export async function getSiteControl(): Promise<SiteControl> {
  const supabase = await createClient();
  const [{ data: settings }, { data: sections }] = await Promise.all([
    supabase.from("site_settings").select("key,value"),
    supabase.from("homepage_sections").select("section_key,enabled,sort_order"),
  ]);
  return {
    settings: Object.fromEntries((settings ?? []).map((row: any) => [row.key, row.value])),
    homepage: Object.fromEntries((sections ?? []).map((row: any) => [row.section_key, { enabled: Boolean(row.enabled), sortOrder: Number(row.sort_order) }])),
  };
}

export function sectionEnabled(control: SiteControl, key: string, fallback = true) {
  return control.homepage[key]?.enabled ?? fallback;
}
