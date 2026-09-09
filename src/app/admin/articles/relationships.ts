"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/app/admin/actions";

export async function setArticleTaxonomy(formData: FormData) {
  const session = await requireAdmin();
  const articleId = String(formData.get("article_id") || "");
  if (!articleId) return;
  const categoryIds = formData.getAll("category_ids").map(String).filter(Boolean);
  const topicIds = formData.getAll("topic_ids").map(String).filter(Boolean);
  const admin = await createClient();
  const [{ error: cDel }, { error: tDel }] = await Promise.all([
    admin.from("article_categories").delete().eq("article_id", articleId),
    admin.from("article_topics").delete().eq("article_id", articleId),
  ]);
  if (cDel) throw cDel; if (tDel) throw tDel;
  if (categoryIds.length) { const { error } = await admin.from("article_categories").insert(categoryIds.map((category_id) => ({ article_id: articleId, category_id, confidence: 1 }))); if (error) throw error; }
  if (topicIds.length) { const { error } = await admin.from("article_topics").insert(topicIds.map((topic_id) => ({ article_id: articleId, topic_id, confidence: 1 }))); if (error) throw error; }
  await admin.from("admin_audit_log").insert({ user_id: session.user?.id ?? null, action: "set_taxonomy", entity_type: "article", entity_id: articleId, details: { category_ids: categoryIds, topic_ids: topicIds } });
  revalidatePath("/admin/articles");
  revalidatePath("/");
}
