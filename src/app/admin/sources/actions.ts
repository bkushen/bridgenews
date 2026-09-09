"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient, hasSupabaseServerConfig } from "@/lib/supabase/admin";
import { requireAdmin } from "@/app/admin/actions";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function audit(
  admin: ReturnType<typeof createAdminClient>,
  userId: string | null,
  action: string,
  entityId: string,
  details: Record<string, unknown> = {},
) {
  const { error } = await admin.from("admin_audit_log").insert({
    user_id: userId,
    action,
    entity_type: "source",
    entity_id: entityId,
    details,
  });
  if (error) console.error("Source audit log failed", error.message);
}

export async function createSource(formData: FormData) {
  const session = await requireAdmin();
  if (!hasSupabaseServerConfig()) redirect("/admin/sources?preview=1");

  const name = text(formData, "name");
  const websiteUrl = text(formData, "website_url");
  const feedUrl = text(formData, "feed_url");
  const logoUrl = text(formData, "logo_url");
  const regionSlug = text(formData, "region");
  const languageCode = text(formData, "default_language_code") || "en";
  const enabled = formData.get("enabled") === "on";
  const autoPublish = formData.get("auto_publish") === "on";
  const interval = Number(formData.get("fetch_interval_minutes") ?? 30);
  const maxItems = Number(formData.get("max_items_per_fetch") ?? 20);

  if (!name || !websiteUrl || !feedUrl || !regionSlug) redirect("/admin/sources/new?error=missing");
  if (!isHttpUrl(websiteUrl) || !isHttpUrl(feedUrl) || (logoUrl && !isHttpUrl(logoUrl))) {
    redirect("/admin/sources/new?error=url");
  }
  if (!["en", "si", "ta"].includes(languageCode)) redirect("/admin/sources/new?error=language");
  if (![15, 30, 60, 120, 360].includes(interval)) redirect("/admin/sources/new?error=interval");
  if (!Number.isInteger(maxItems) || maxItems < 1 || maxItems > 100) redirect("/admin/sources/new?error=max_items");

  const admin = createAdminClient();
  const { data: region, error: regionError } = await admin.from("regions").select("id").eq("slug", regionSlug).single();
  if (regionError || !region?.id) redirect("/admin/sources/new?error=region");

  const { data: source, error } = await admin.from("sources").insert({
    name,
    slug: `${slugify(name)}-${crypto.randomUUID().slice(0, 8)}`,
    website_url: websiteUrl,
    feed_url: feedUrl,
    source_type: "rss",
    logo_url: logoUrl || null,
    enabled,
    auto_publish: autoPublish,
    ai_summary_enabled: false,
    ai_classification_enabled: false,
    default_language_code: languageCode,
    fetch_interval_minutes: interval,
    max_items_per_fetch: maxItems,
  }).select("id").single();
  if (error || !source?.id) redirect(`/admin/sources/new?error=${encodeURIComponent(error?.code ?? "db")}`);

  const { error: relationshipError } = await admin.from("source_regions").insert({
    source_id: source.id,
    region_id: region.id,
    is_primary: true,
  });
  if (relationshipError) {
    await admin.from("sources").delete().eq("id", source.id);
    redirect(`/admin/sources/new?error=${encodeURIComponent(relationshipError.code ?? "region_link")}`);
  }

  await audit(admin, session.user?.id ?? null, "create", source.id, {
    name,
    region: regionSlug,
    language: languageCode,
    enabled,
    auto_publish: autoPublish,
  });

  revalidatePath("/admin/sources");
  revalidatePath("/sources");
  revalidatePath("/");
  redirect("/admin/sources?saved=1");
}

export async function testSource(formData: FormData) {
  const session = await requireAdmin();
  if (!hasSupabaseServerConfig()) redirect("/admin/sources?error=Supabase%20server%20connection%20required");

  const id = text(formData, "id");
  if (!id) redirect("/admin/sources?error=Missing%20source%20ID");

  const admin = createAdminClient();
  const { data: source, error } = await admin.from("sources").select("id,name,feed_url").eq("id", id).single();
  if (error || !source) redirect("/admin/sources?error=Source%20not%20found");
  if (!source.feed_url || !isHttpUrl(source.feed_url)) redirect("/admin/sources?error=Source%20does%20not%20have%20a%20valid%20feed%20URL");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  let result: { ok: true; status: number } | { ok: false; message: string; status?: number };

  try {
    const response = await fetch(source.feed_url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
        "User-Agent": "BridgeNews/1.0 feed-check",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      result = { ok: false, status: response.status, message: `Feed returned HTTP ${response.status}` };
    } else {
      const body = (await response.text()).slice(0, 250_000);
      const looksLikeFeed = /<(rss|feed|rdf:RDF)(\s|>)/i.test(body) && /<(item|entry)(\s|>)/i.test(body);
      result = looksLikeFeed
        ? { ok: true, status: response.status }
        : { ok: false, status: response.status, message: "URL responded, but it does not look like an RSS or Atom feed" };
    }
  } catch (error) {
    result = {
      ok: false,
      message: error instanceof Error && error.name === "AbortError" ? "Feed test timed out after 10 seconds" : "Feed could not be reached",
    };
  } finally {
    clearTimeout(timeout);
  }

  if (result.ok) {
    await audit(admin, session.user?.id ?? null, "test_success", id, { status: result.status });
    redirect(`/admin/sources?tested=ok&source=${encodeURIComponent(source.name)}`);
  }

  await audit(admin, session.user?.id ?? null, "test_failed", id, { status: result.status ?? null, reason: result.message });
  redirect(`/admin/sources?tested=failed&source=${encodeURIComponent(source.name)}&error=${encodeURIComponent(result.message)}`);
}
