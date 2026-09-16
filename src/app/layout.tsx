import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import "./editorial-theme.css";
import "./urban-observer-theme.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LiveAutoRefresh } from "@/components/live-auto-refresh";
import { MaintenanceGate } from "@/components/maintenance-gate";
import { PublicOnly } from "@/components/public-only";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { getSiteControl } from "@/lib/data/site-control";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://bridgenews-live-bkushen-5488.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const control = await getSiteControl();
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  const title = String(control.settings.seo_default_title ?? siteName);
  const description = String(control.settings.seo_default_description ?? "Fast, source-attributed news discovery across Sri Lanka, Australia and the world.");
  const socialImage = String(control.settings.seo_social_image ?? "").trim();
  const allowIndex = control.settings.seo_robots_index !== false;
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  return {
    metadataBase: new URL(siteUrl), applicationName: siteName,
    title: { default: title, template: `%s | ${siteName}` }, description,
    keywords: ["news", "Sri Lanka news", "Australia news", "world news", "news aggregator"],
    icons: { icon: "/icon.svg" },
    robots: { index: allowIndex, follow: allowIndex },
    verification: {
      google: googleVerification || undefined,
      other: bingVerification ? { "msvalidate.01": bingVerification } : undefined,
    },
    openGraph: { title, description, url: siteUrl, siteName, type: "website", images: socialImage ? [socialImage] : undefined },
    twitter: { card: "summary_large_image", title, description, images: socialImage ? [socialImage] : undefined },
    alternates: { canonical: siteUrl },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const control = await getSiteControl();
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  const maintenance = control.settings.maintenance_mode === true;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${siteUrl}/#organization`, name: siteName, url: siteUrl },
      { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: siteName, url: siteUrl, publisher: { "@id": `${siteUrl}/#organization` }, potentialAction: { "@type": "SearchAction", target: `${siteUrl}/search?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    ],
  };

  return <html lang="en"><body className="site-root">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    {gaId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/><Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}</Script></> : null}
    <Suspense fallback={null}><AnalyticsTracker/></Suspense>
    <MaintenanceGate enabled={maintenance} siteName={siteName}><LiveAutoRefresh intervalMs={60000}/><PublicOnly><SiteHeader/></PublicOnly>{children}<PublicOnly><SiteFooter siteName={siteName}/></PublicOnly></MaintenanceGate>
  </body></html>;
}
