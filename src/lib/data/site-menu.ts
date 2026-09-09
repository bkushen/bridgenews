import { createClient } from "@/lib/supabase/server";

export async function getSiteMenu(area: "header" | "footer") {
  const supabase = await createClient();
  const { data } = await supabase.from("site_menu_items").select("id,label,href,sort_order").eq("area",area).eq("enabled",true).order("sort_order").order("label");
  return data ?? [];
}
