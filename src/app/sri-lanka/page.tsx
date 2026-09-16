import type { Metadata } from "next";
import { RegionalHomepageV2 } from "@/components/regional-homepage-v2";

export const metadata: Metadata = {
  title: "Sri Lanka News | BridgeNews",
  description: "Live Sri Lanka news across sources, with Colombo weather, trending coverage and regional updates.",
  alternates: { canonical: "/sri-lanka" },
};

export default function SriLankaPage() {
  return <RegionalHomepageV2 region="sri-lanka" />;
}
