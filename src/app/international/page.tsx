import type { Metadata } from "next";
import { RegionalHomepageV2 } from "@/components/regional-homepage-v2";

export const metadata: Metadata = {
  title: "International News | BridgeNews",
  description: "International news across sources, with trending coverage and global updates.",
  alternates: { canonical: "/international" },
};

export default function InternationalPage() {
  return <RegionalHomepageV2 region="international" />;
}
