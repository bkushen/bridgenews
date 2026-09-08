import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bridgenews-live-bkushen-5488.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "BridgeNews",
  title: { default: "BridgeNews", template: "%s | BridgeNews" },
  description: "Fast, source-attributed news discovery across Sri Lanka, Australia and the world.",
  keywords: ["news", "Sri Lanka news", "Australia news", "world news", "news aggregator"],
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "BridgeNews",
    description: "Fast, source-attributed news discovery across Sri Lanka, Australia and the world.",
    url: siteUrl,
    siteName: "BridgeNews",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BridgeNews",
    description: "Fast, source-attributed news discovery across Sri Lanka, Australia and the world.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteHeader />{children}<SiteFooter /></body></html>;
}
