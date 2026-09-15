"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/app/admin/actions";

export async function runImageRecovery(formData: FormData) {
  const session = await requireAdmin();
  if (session.preview) throw new Error("Supabase admin connection required");

  const mode = String(formData.get("mode") || "recover");
  const sourceId = String(formData.get("sourceId") || "").trim() || undefined;
  const articleId = String(formData.get("articleId") || "").trim() || undefined;
  const requested = Number(formData.get("limit") || 50);
  const limit = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 50, 100));
  const verifyExisting = mode === "verify";

  const admin = createAdminClient();
  const { data, error } = await admin.functions.invoke("backfill-images", {
    body: { limit, verifyExisting, sourceId, articleId },
  });

  await admin.from("admin_audit_log").insert({
    user_id: session.user?.id ?? null,
    action: error ? "image_recovery_failed" : "image_recovery_run",
    entity_type: articleId ? "article" : sourceId ? "source" : "image_recovery",
    entity_id: articleId ?? sourceId ?? mode,
    details: error ? { message: error.message, mode, limit } : { result: data ?? null, mode, limit },
  });

  if (error) throw error;
  revalidatePath("/admin/images");
  revalidatePath("/admin/ingestion");
  revalidatePath("/admin");
  revalidatePath("/");
}
