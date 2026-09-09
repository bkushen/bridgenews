"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./actions";

function text(fd: FormData, key: string) { return String(fd.get(key) ?? "").trim(); }
function bool(fd: FormData, key: string) { return fd.get(key) === "on" || fd.get(key) === "true"; }
function num(fd: FormData, key: string, fallback = 100) { const n = Number(fd.get(key)); return Number.isFinite(n) ? n : fallback; }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }

async function ctx() {
  const session = await requireAdmin();
  const supabase = await createClient();
  return { supabase, userId: session.user.id };
}

async function audit(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, action: string, entityType: string, entityId?: string, details: Record<string, unknown> = {}) {
  await supabase.from("admin_audit_log").insert({ user_id: userId, action, entity_type: entityType, entity_id: entityId ?? null, details });
}

export async function createManualArticle(fd: FormData) {
  const { supabase, userId } = await ctx();
  const title = text(fd, "title");
  const description = text(fd, "description");
  if (!title) redirect("/admin/articles/new?error=Headline%20is%20required");

  const { data: source, error: sourceError } = await supabase.from("sources").select("id").eq("slug", "bridgenews-editorial").single();
  if (sourceError || !source?.id) redirect("/admin/articles/new?error=BridgeNews%20Editorial%20source%20is%20missing");

  const baseSlug = slugify(title) || "story";
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const canonical = `${siteUrl.replace(/\/$/, "")}/story/${slug}`;
  const status = text(fd, "status") || "review_required";
  const now = new Date().toISOString();

  const payload = {
    source_id: source.id,
    title,
    slug,
    original_url: canonical,
    canonical_url: canonical,
    description: description || null,
    author: text(fd, "author") || "BridgeNews Editorial",
    image_url: text(fd, "image_url") || null,
    language_code: text(fd, "language_code") || "en",
    status,
    published_at: status === "published" ? now : null,
    raw_metadata: { manual: true, editor_user_id: userId },
    ai_summary: null,
    ai_classification: {},
    ai_processed_at: null,
    ai_model: null,
    auto_publish_requested: false,
  };

  const { data, error } = await supabase.from("articles").insert(payload).select("id").single();
  if (error) redirect(`/admin/articles/new?error=${encodeURIComponent(error.message)}`);
  await audit(supabase, userId, "create", "article", data.id, { manual: true, status, title });
  revalidatePath("/admin/articles"); revalidatePath("/"); revalidatePath("/latest");
  redirect("/admin/articles?created=1");
}

export async function bulkSourceAction(fd: FormData) {
  const { supabase, userId } = await ctx();
  const ids = fd.getAll("source_ids").map(String).filter(Boolean);
  const action = text(fd, "bulk_action");
  if (!ids.length) redirect("/admin/sources?error=Select%20at%20least%20one%20source");
  if (!['enable','disable'].includes(action)) redirect("/admin/sources?error=Choose%20a%20bulk%20action");
  const enabled = action === "enable";
  const { error } = await supabase.from("sources").update({ enabled }).in("id", ids);
  if (error) redirect(`/admin/sources?error=${encodeURIComponent(error.message)}`);
  await audit(supabase, userId, `bulk_${action}`, "source", undefined, { ids });
  revalidatePath("/admin/sources"); revalidatePath("/sources"); revalidatePath("/");
  redirect(`/admin/sources?bulk=${action}`);
}

export async function saveContentPage(fd: FormData) {
  const { supabase, userId } = await ctx();
  const id = text(fd, "id");
  const slug = slugify(text(fd, "slug"));
  const payload = {
    slug,
    title: text(fd, "title"),
    body: text(fd, "body"),
    excerpt: text(fd, "excerpt") || null,
    published: bool(fd, "published"),
    seo_title: text(fd, "seo_title") || null,
    seo_description: text(fd, "seo_description") || null,
    updated_at: new Date().toISOString(),
  };
  if (!payload.title || !payload.slug) redirect("/admin/pages?error=Title%20and%20slug%20are%20required");
  const query = id ? supabase.from("content_pages").update(payload).eq("id", id) : supabase.from("content_pages").insert(payload);
  const { error } = await query;
  if (error) redirect(`/admin/pages?error=${encodeURIComponent(error.message)}`);
  await audit(supabase, userId, id ? "update" : "create", "content_page", id || slug, { slug, published: payload.published });
  revalidatePath("/admin/pages"); revalidatePath(`/${slug}`); revalidatePath("/");
  redirect("/admin/pages?saved=1");
}

export async function deleteContentPage(fd: FormData) {
  const { supabase, userId } = await ctx(); const id = text(fd, "id");
  const { error } = await supabase.from("content_pages").delete().eq("id", id);
  if (error) redirect(`/admin/pages?error=${encodeURIComponent(error.message)}`);
  await audit(supabase, userId, "delete", "content_page", id);
  revalidatePath("/admin/pages"); redirect("/admin/pages?deleted=1");
}

export async function saveMenuItem(fd: FormData) {
  const { supabase, userId } = await ctx(); const id = text(fd, "id");
  const payload = { area: text(fd, "area") || "footer", label: text(fd, "label"), href: text(fd, "href"), enabled: bool(fd, "enabled"), sort_order: num(fd, "sort_order"), updated_at: new Date().toISOString() };
  const query = id ? supabase.from("site_menu_items").update(payload).eq("id", id) : supabase.from("site_menu_items").insert(payload);
  const { error } = await query; if (error) redirect(`/admin/navigation?error=${encodeURIComponent(error.message)}`);
  await audit(supabase, userId, id ? "update" : "create", "menu_item", id || payload.label, payload);
  revalidatePath("/admin/navigation"); revalidatePath("/"); redirect("/admin/navigation?saved=1");
}

export async function deleteMenuItem(fd: FormData) {
  const { supabase, userId } = await ctx(); const id = text(fd, "id");
  const { error } = await supabase.from("site_menu_items").delete().eq("id", id); if (error) redirect(`/admin/navigation?error=${encodeURIComponent(error.message)}`);
  await audit(supabase, userId, "delete", "menu_item", id); revalidatePath("/admin/navigation"); revalidatePath("/"); redirect("/admin/navigation?deleted=1");
}

export async function saveSeoSettings(fd: FormData) {
  const { supabase, userId } = await ctx();
  const values: Record<string, unknown> = {
    seo_default_title: text(fd, "seo_default_title") || "BridgeNews",
    seo_default_description: text(fd, "seo_default_description"),
    seo_social_image: text(fd, "seo_social_image"),
    seo_robots_index: bool(fd, "seo_robots_index"),
  };
  for (const [key, value] of Object.entries(values)) {
    const { error } = await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) redirect(`/admin/seo?error=${encodeURIComponent(error.message)}`);
  }
  await audit(supabase, userId, "update", "seo_settings", "global", values);
  revalidatePath("/admin/seo"); revalidatePath("/"); redirect("/admin/seo?saved=1");
}
