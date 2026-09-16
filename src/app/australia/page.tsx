import type { Metadata } from "next";
import { RegionalHomepage } from "@/components/regional-homepage";

export const metadata: Metadata = {
  title: "Australia News | BridgeNews",
  description: "Live Australia news across sources, with Melbourne weather, trending coverage and regional updates.",
  alternates: { canonical: "/australia" },
};

export default function AustraliaPage() {
  return <RegionalHomepage region="australia" />;
}
