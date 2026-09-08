"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function safePath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || fallback);
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

export async function saveBookmark(formData: FormData) {
  const articleId = String(formData.get("articleId") || "");
  const returnTo = safePath(formData.get("returnTo"), "/saved");
  if (!articleId) return;

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);

  const { error } = await supabase.from("bookmarks").upsert({ user_id: auth.user.id, article_id: articleId });
  if (error) throw error;
  revalidatePath(returnTo);
  revalidatePath("/saved");
}

export async function removeBookmark(formData: FormData) {
  const articleId = String(formData.get("articleId") || "");
  if (!articleId) return;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=%2Fsaved");
  const { error } = await supabase.from("bookmarks").delete().eq("user_id", auth.user.id).eq("article_id", articleId);
  if (error) throw error;
  revalidatePath("/saved");
}
