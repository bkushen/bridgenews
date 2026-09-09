import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LiveAutoRefresh } from "@/components/live-auto-refresh";
import { MaintenanceGate } from "@/components/maintenance-gate";
import { PublicOnly } from "@/components/public-only";
import { getSiteControl } from "@/lib/data/site-control";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bridgenews-live-bkushen-5488.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const control = await getSiteControl();
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  const title = String(control.settings.seo_default_title ?? siteName);
  const description = String(control.settings.seo_default_description ?? "Fast, source-attributed news discovery across Sri Lanka, Australia and the world.");
  const socialImage = String(control.settings.seo_social_image ?? "").trim();
  const allowIndex = control.settings.seo_robots_index !== false;
  return {
    metadataBase: new URL(siteUrl), applicationName: siteName,
    title: { default: title, template: `%s | ${siteName}` }, description,
    keywords: ["news", "Sri Lanka news", "Australia news", "world news", "news aggregator"],
    icons: { icon: "/icon.svg" },
    robots: { index: allowIndex, follow: allowIndex },
    openGraph: { title, description, url: siteUrl, siteName, type: "website", images: socialImage ? [socialImage] : undefined },
    twitter: { card: "summary_large_image", title, description, images: socialImage ? [socialImage] : undefined },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const control = await getSiteControl();
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  const maintenance = control.settings.maintenance_mode === true;
  return <html lang="en"><body><MaintenanceGate enabled={maintenance} siteName={siteName}><LiveAutoRefresh intervalMs={60000}/><PublicOnly><SiteHeader/></PublicOnly>{children}<PublicOnly><SiteFooter siteName={siteName}/></PublicOnly></MaintenanceGate></body></html>;
}
