import { cookies } from "next/headers";

export type EditionRegion = "sri-lanka" | "australia" | "international";

export const EDITIONS: Record<EditionRegion, { label: string; adjective: string; flag: string; timeZone: string; city: string }> = {
  "sri-lanka": { label: "Sri Lanka", adjective: "Sri Lankan", flag: "🇱🇰", timeZone: "Asia/Colombo", city: "Colombo" },
  australia: { label: "Australia", adjective: "Australian", flag: "🇦🇺", timeZone: "Australia/Melbourne", city: "Melbourne" },
  international: { label: "International", adjective: "international", flag: "🌍", timeZone: "UTC", city: "World" },
};

export async function getActiveRegion(): Promise<EditionRegion> {
  const store = await cookies();
  const value = store.get("bridgenews_region")?.value;
  return value === "australia" || value === "international" || value === "sri-lanka" ? value : "sri-lanka";
}

export function withRegion(path: string, region: EditionRegion) {
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}region=${encodeURIComponent(region)}`;
}
