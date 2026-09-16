import type { Metadata } from "next";
import { RegionalHomepage } from "@/components/regional-homepage";

export const metadata: Metadata = {
  title: "Sri Lanka News | BridgeNews",
  description: "Live Sri Lanka news across sources, with Colombo weather, trending coverage and regional updates.",
  alternates: { canonical: "/sri-lanka" },
};

export default function SriLankaPage() {
  return <RegionalHomepage region="sri-lanka" />;
}
