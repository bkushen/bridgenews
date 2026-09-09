import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LiveAutoRefresh } from "@/components/live-auto-refresh";
import { MaintenanceGate } from "@/components/maintenance-gate";
import { getSiteControl } from "@/lib/data/site-control";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bridgenews-live-bkushen-5488.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "BridgeNews",
  title: { default: "BridgeNews", template: "%s | BridgeNews" },
  description: "Fast, source-attributed news discovery across Sri Lanka, Australia and the world.",
  keywords: ["news", "Sri Lanka news", "Australia news", "world news", "news aggregator"],
  icons: { icon: "/icon.svg" },
  openGraph: { title: "BridgeNews", description: "Fast, source-attributed news discovery across Sri Lanka, Australia and the world.", url: siteUrl, siteName: "BridgeNews", type: "website" },
  twitter: { card: "summary_large_image", title: "BridgeNews", description: "Fast, source-attributed news discovery across Sri Lanka, Australia and the world." },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const control = await getSiteControl();
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  const maintenance = control.settings.maintenance_mode === true;
  return <html lang="en"><body><MaintenanceGate enabled={maintenance} siteName={siteName}><LiveAutoRefresh intervalMs={60000}/><SiteHeader/>{children}<SiteFooter siteName={siteName}/></MaintenanceGate></body></html>;
}
