"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseServerConfig } from "@/lib/supabase/admin";

export async function requireAdmin() {
  if (!hasSupabaseServerConfig()) return { preview: true as const, user: null };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  if (data.user.app_metadata?.role !== "admin") redirect("/");
  return { preview: false as const, user: data.user };
}
