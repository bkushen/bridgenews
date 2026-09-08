"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | null, fallback = "/saved") {
  const next = String(value || fallback);
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password) redirect(`/login?error=missing&next=${encodeURIComponent(next)}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=invalid&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || password.length < 8) redirect(`/login?mode=signup&error=signup&next=${encodeURIComponent(next)}`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/login?mode=signup&error=signup&next=${encodeURIComponent(next)}`);
  if (data.session) redirect(next);
  redirect(`/login?message=check-email&next=${encodeURIComponent(next)}`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
