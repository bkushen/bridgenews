import type { Metadata } from "next";
import { RegionalHomepage } from "@/components/regional-homepage";

export const metadata: Metadata = {
  title: "International News | BridgeNews",
  description: "International news across sources, with trending coverage and global updates.",
  alternates: { canonical: "/international" },
};

export default function InternationalPage() {
  return <RegionalHomepage region="international" />;
}
