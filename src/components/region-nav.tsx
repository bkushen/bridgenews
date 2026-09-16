"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const REGIONS = [
  { href: "/sri-lanka", key: "sri-lanka", label: "Sri Lanka", flag: "🇱🇰" },
  { href: "/australia", key: "australia", label: "Australia", flag: "🇦🇺" },
  { href: "/international", key: "international", label: "International", flag: "🌍" },
] as const;

export function RegionNav() {
  const pathname = usePathname();

  function remember(region: string) {
    try {
      localStorage.setItem("bridgenews_region", region);
      document.cookie = `bridgenews_region=${region}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {}
  }

  return <div className="flex shrink-0 items-center gap-1 border-r border-[#d8d0c4] pr-4">
    {REGIONS.map((region) => {
      const active = pathname === region.href;
      return <Link key={region.key} href={region.href} onClick={() => remember(region.key)} aria-current={active ? "page" : undefined} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black transition ${active ? "bg-[#1d1b19] text-white" : "bg-[#f3ece2] text-[#5f5851] hover:bg-[#e9dfd1] hover:text-[#a5232f]"}`}><span className="mr-1">{region.flag}</span>{region.label}</Link>;
    })}
  </div>;
}
