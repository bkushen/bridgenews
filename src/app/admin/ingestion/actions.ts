"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/app/admin/actions";

const ALLOWED = new Set(["ingest-rss","ingest-web","ingest-generic-web","backfill-source-logos","backfill-images"]);

export async function runOperation(formData: FormData) {
  const session = await requireAdmin();
  if (session.preview) throw new Error("Supabase admin connection required");
  const operation = String(formData.get("operation") || "");
  if (!ALLOWED.has(operation)) throw new Error("Unsupported operation");
  const admin = createAdminClient();
  const { data, error } = await admin.functions.invoke(operation, { body: {} });
  await admin.from("admin_audit_log").insert({
    user_id: session.user?.id ?? null,
    action: error ? "run_failed" : "run",
    entity_type: "edge_function",
    entity_id: operation,
    details: error ? { message: error.message } : { result: data ?? null },
  });
  if (error) throw error;
  revalidatePath("/admin/ingestion");
  revalidatePath("/admin/sources");
  revalidatePath("/");
}
