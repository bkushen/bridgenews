"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `bridgenews:view:${articleId}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 30 * 60 * 1000) return;
    sessionStorage.setItem(key, String(Date.now()));
    const supabase = createClient();
    void supabase.rpc("increment_article_view", { target_article_id: articleId });
  }, [articleId]);

  return null;
}
