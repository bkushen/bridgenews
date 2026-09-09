"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeReturnPath(value: FormDataEntryValue | null, fallback: string) {
  const path = String(value || fallback);
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

async function requireUser(returnTo: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return { supabase, user: data.user };
}

export async function followSource(formData: FormData) {
  const sourceId = String(formData.get("sourceId") || "");
  const returnTo = safeReturnPath(formData.get("returnTo"), "/sources");
  if (!sourceId) return;
  const { supabase, user } = await requireUser(returnTo);
  const { error } = await supabase.from("source_follows").upsert({ user_id: user.id, source_id: sourceId });
  if (error) throw error;
  revalidatePath(returnTo);
  revalidatePath("/following");
}

export async function unfollowSource(formData: FormData) {
  const sourceId = String(formData.get("sourceId") || "");
  const returnTo = safeReturnPath(formData.get("returnTo"), "/following");
  if (!sourceId) return;
  const { supabase, user } = await requireUser(returnTo);
  const { error } = await supabase.from("source_follows").delete().eq("user_id", user.id).eq("source_id", sourceId);
  if (error) throw error;
  revalidatePath(returnTo);
  revalidatePath("/following");
}

export async function followTopic(formData: FormData) {
  const topicKey = String(formData.get("topicKey") || "").trim();
  const topicLabel = String(formData.get("topicLabel") || topicKey).trim();
  const returnTo = safeReturnPath(formData.get("returnTo"), "/topics");
  if (!topicKey || !topicLabel) return;
  const { supabase, user } = await requireUser(returnTo);
  const { error } = await supabase.from("topic_follows").upsert({ user_id: user.id, topic_key: topicKey, topic_label: topicLabel });
  if (error) throw error;
  revalidatePath(returnTo);
  revalidatePath("/following");
}

export async function unfollowTopic(formData: FormData) {
  const topicKey = String(formData.get("topicKey") || "").trim();
  const returnTo = safeReturnPath(formData.get("returnTo"), "/following");
  if (!topicKey) return;
  const { supabase, user } = await requireUser(returnTo);
  const { error } = await supabase.from("topic_follows").delete().eq("user_id", user.id).eq("topic_key", topicKey);
  if (error) throw error;
  revalidatePath(returnTo);
  revalidatePath("/following");
}

export async function saveNotificationPreferences(formData: FormData) {
  const returnTo = safeReturnPath(formData.get("returnTo"), "/following");
  const language = String(formData.get("preferredLanguage") || "all");
  const preferredLanguage = ["all", "en", "si", "ta"].includes(language) ? language : "all";
  const { supabase, user } = await requireUser(returnTo);
  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    breaking_news: formData.get("breakingNews") === "on",
    daily_digest: formData.get("dailyDigest") === "on",
    source_updates: formData.get("sourceUpdates") === "on",
    topic_updates: formData.get("topicUpdates") === "on",
    preferred_language: preferredLanguage,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  revalidatePath(returnTo);
}
