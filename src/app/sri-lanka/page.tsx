import type { Metadata } from "next";
import { RegionalHomepageV2 } from "@/components/regional-homepage-v2";

export const metadata: Metadata = {
  title: "Sri Lanka News | BridgeNews",
  description: "Live Sri Lanka news in English, Sinhala and Tamil, with Colombo weather, trending coverage and regional updates.",
  alternates: { canonical: "/sri-lanka" },
};

export default async function SriLankaPage({ searchParams }: { searchParams: Promise<{ language?: string }> }) {
  const params = await searchParams;
  const language = params.language === "si" || params.language === "ta" ? params.language : "en";
  return <RegionalHomepageV2 region="sri-lanka" language={language} />;
}
