"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, hasSupabaseServerConfig } from "@/lib/supabase/admin";
import { requireAdmin } from "@/app/admin/actions";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function createSource(formData: FormData) {
  await requireAdmin();
  if (!hasSupabaseServerConfig()) redirect("/admin/sources?preview=1");

  const name = String(formData.get("name") ?? "").trim();
  const websiteUrl = String(formData.get("website_url") ?? "").trim();
  const feedUrl = String(formData.get("feed_url") ?? "").trim();
  const regionSlug = String(formData.get("region") ?? "");
  const autoPublish = formData.get("auto_publish") === "on";
  const interval = Number(formData.get("fetch_interval_minutes") ?? 30);

  if (!name || !websiteUrl || !feedUrl || !regionSlug) redirect("/admin/sources/new?error=missing");
  try { new URL(websiteUrl); new URL(feedUrl); } catch { redirect("/admin/sources/new?error=url"); }
  if (![15, 30, 60, 120, 360].includes(interval)) redirect("/admin/sources/new?error=interval");

  const admin = createAdminClient();
  const { data: source, error } = await admin.from("sources").insert({
    name,
    slug: `${slugify(name)}-${crypto.randomUUID().slice(0, 8)}`,
    website_url: websiteUrl,
    feed_url: feedUrl,
    source_type: "rss",
    enabled: true,
    auto_publish: autoPublish,
    ai_summary_enabled: false,
    ai_classification_enabled: false,
    fetch_interval_minutes: interval,
  }).select("id").single();
  if (error) redirect(`/admin/sources/new?error=${encodeURIComponent(error.code ?? "db")}`);

  const { data: region } = await admin.from("regions").select("id").eq("slug", regionSlug).single();
  if (region) await admin.from("source_regions").insert({ source_id: source.id, region_id: region.id, is_primary: true });

  revalidatePath("/admin/sources");
  revalidatePath("/sources");
  revalidatePath("/");
  redirect("/admin/sources");
}
