"use client";

import { useEffect } from "react";

export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `bridgenews:view:${articleId}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 30 * 60 * 1000) return;
    sessionStorage.setItem(key, String(Date.now()));

    void fetch("/api/article-view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ articleId }),
      keepalive: true,
    }).catch(() => undefined);
  }, [articleId]);

  return null;
}
