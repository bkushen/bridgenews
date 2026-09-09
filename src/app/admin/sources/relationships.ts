"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/app/admin/actions";

export async function setSourceRegion(formData: FormData) {
  const session = await requireAdmin();
  const sourceId = String(formData.get("source_id") || "");
  const regionId = String(formData.get("region_id") || "");
  if (!sourceId || !regionId) return;
  const admin = await createClient();
  const { error: deleteError } = await admin.from("source_regions").delete().eq("source_id", sourceId);
  if (deleteError) throw deleteError;
  const { error } = await admin.from("source_regions").insert({ source_id: sourceId, region_id: regionId, is_primary: true });
  if (error) throw error;
  await admin.from("admin_audit_log").insert({ user_id: session.user?.id ?? null, action: "set_region", entity_type: "source", entity_id: sourceId, details: { region_id: regionId } });
  revalidatePath("/admin/sources");
  revalidatePath("/sources");
  revalidatePath("/");
}
