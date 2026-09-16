"use client";

import { useEffect } from "react";

export function RegionPreference({ region }: { region: "sri-lanka" | "australia" | "international" }) {
  useEffect(() => {
    try {
      localStorage.setItem("bridgenews_region", region);
      document.cookie = `bridgenews_region=${region}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {}
  }, [region]);

  return null;
}
