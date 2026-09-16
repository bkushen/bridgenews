import type { Metadata } from "next";
import { RegionalHomepageV2 } from "@/components/regional-homepage-v2";

export const metadata: Metadata = {
  title: "Australia News | BridgeNews",
  description: "Live Australia news across sources, with Melbourne weather, trending coverage and regional updates.",
  alternates: { canonical: "/australia" },
};

export default function AustraliaPage() {
  return <RegionalHomepageV2 region="australia" />;
}
