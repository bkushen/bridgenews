export type AdminSource = {
  name: string;
  region: "Sri Lanka" | "Australia" | "International";
  type: "RSS" | "API";
  status: "Healthy" | "Needs review";
  autoPublish: boolean;
  interval: string;
  lastFetch: string;
  newItems: number;
  duplicates: number;
};

export const adminSources: AdminSource[] = [
  { name: "Sri Lanka Demo Feed", region: "Sri Lanka", type: "RSS", status: "Healthy", autoPublish: false, interval: "30 min", lastFetch: "12 min ago", newItems: 18, duplicates: 4 },
  { name: "Australia Demo Feed", region: "Australia", type: "RSS", status: "Healthy", autoPublish: false, interval: "30 min", lastFetch: "16 min ago", newItems: 24, duplicates: 7 },
  { name: "International Demo Feed", region: "International", type: "RSS", status: "Needs review", autoPublish: false, interval: "60 min", lastFetch: "1 hr ago", newItems: 11, duplicates: 2 },
];
