import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bridgenews-live-bkushen-5488.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/login", "/saved"] },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
