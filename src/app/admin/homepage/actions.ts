"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/app/admin/actions";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function bool(formData: FormData, key: string) {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

function number(formData: FormData, key: string, fallback = 100) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

async function context() {
  const session = await requireAdmin();
  const supabase = await createClient();
  return { supabase, userId: session.user?.id ?? null };
}

async function audit(supabase: Awaited<ReturnType<typeof createClient>>, userId: string | null, action: string, entityId: string, details: Record<string, unknown> = {}) {
  await supabase.from("admin_audit_log").insert({
    user_id: userId,
    action,
    entity_type: "homepage_section",
    entity_id: entityId,
    details,
  });
}

export async function saveHomepageSection(formData: FormData) {
  const { supabase, userId } = await context();
  const id = text(formData, "id");
  const payload = {
    enabled: bool(formData, "enabled"),
    sort_order: number(formData, "sort_order", 100),
  };

  const { data, error } = await supabase.from("homepage_sections").update(payload).eq("id", id).select("id").single();
  if (error) redirect(`/admin/homepage?error=${encodeURIComponent(error.message)}`);
  if (!data?.id) redirect("/admin/homepage?error=Section%20was%20not%20updated");

  await audit(supabase, userId, "update", id, payload);
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  redirect("/admin/homepage?saved=1");
}

export async function moveHomepageSection(formData: FormData) {
  const { supabase, userId } = await context();
  const id = text(formData, "id");
  const direction = text(formData, "direction");

  const { data: rows, error } = await supabase
    .from("homepage_sections")
    .select("id,sort_order")
    .order("sort_order", { ascending: true })
    .order("section_key", { ascending: true });

  if (error) redirect(`/admin/homepage?error=${encodeURIComponent(error.message)}`);
  const ordered = rows ?? [];
  const index = ordered.findIndex((row) => row.id === id);
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) redirect("/admin/homepage");

  const current = ordered[index];
  const target = ordered[targetIndex];
  const currentOrder = Number(current.sort_order ?? index * 10);
  const targetOrder = Number(target.sort_order ?? targetIndex * 10);

  const [{ error: firstError }, { error: secondError }] = await Promise.all([
    supabase.from("homepage_sections").update({ sort_order: targetOrder }).eq("id", current.id),
    supabase.from("homepage_sections").update({ sort_order: currentOrder }).eq("id", target.id),
  ]);

  const moveError = firstError ?? secondError;
  if (moveError) redirect(`/admin/homepage?error=${encodeURIComponent(moveError.message)}`);

  await audit(supabase, userId, `move_${direction}`, id, { swapped_with: target.id });
  revalidatePath("/admin/homepage");
  revalidatePath("/");
  redirect("/admin/homepage?saved=1");
}
