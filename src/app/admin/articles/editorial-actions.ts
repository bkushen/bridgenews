"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/app/admin/actions";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function checked(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export async function updateArticleEditorial(formData: FormData) {
  const session = await requireAdmin();
  const supabase = await createClient();
  const id = text(formData, "id");
  const priority = Math.min(100, Math.max(0, Number(formData.get("editorial_priority") ?? 0) || 0));
  const pinnedRaw = text(formData, "pinned_until");
  const pinnedUntil = pinnedRaw ? new Date(pinnedRaw) : null;
  const isMainHeadline = checked(formData, "is_main_headline");

  if (!id) redirect("/admin/articles?error=Missing%20article%20ID");
  if (pinnedUntil && Number.isNaN(pinnedUntil.getTime())) redirect("/admin/articles?error=Invalid%20pin%20expiry");

  if (isMainHeadline) {
    const { error: clearError } = await supabase
      .from("articles")
      .update({ is_main_headline: false })
      .neq("id", id)
      .eq("is_main_headline", true);
    if (clearError) redirect(`/admin/articles?error=${encodeURIComponent(clearError.message)}`);
  }

  const payload = {
    is_breaking: checked(formData, "is_breaking"),
    is_featured: checked(formData, "is_featured"),
    is_main_headline: isMainHeadline,
    editorial_priority: priority,
    pinned_until: pinnedUntil ? pinnedUntil.toISOString() : null,
  };

  const { error } = await supabase.from("articles").update(payload).eq("id", id);
  if (error) redirect(`/admin/articles?error=${encodeURIComponent(error.message)}`);

  await supabase.from("admin_audit_log").insert({
    user_id: session.user?.id ?? null,
    action: "update_editorial_placement",
    entity_type: "article",
    entity_id: id,
    details: payload,
  });

  revalidatePath("/admin/articles");
  revalidatePath("/");
  revalidatePath("/top-stories");
  revalidatePath("/latest");
  redirect("/admin/articles?saved=1");
}
