import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

export function createAdminClient() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = secret || SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasSupabaseServerConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasSupabasePublicConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}
