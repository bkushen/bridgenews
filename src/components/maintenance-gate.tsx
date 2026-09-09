"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MaintenanceGate({ enabled, siteName, children }: { enabled: boolean; siteName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  if (!enabled || pathname.startsWith("/admin") || pathname.startsWith("/login")) return <>{children}</>;
  return <main className="grid min-h-screen place-items-center bg-gray-50 px-5"><div className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-gray-950 text-sm font-black text-white">BN</div><h1 className="mt-5 text-3xl font-black">{siteName} is temporarily unavailable</h1><p className="mt-3 leading-7 text-gray-600">We’re carrying out website maintenance. Please check again shortly.</p><Link href="/login" className="mt-6 inline-flex rounded-lg border px-4 py-2 text-sm font-bold text-gray-700">Admin sign in</Link></div></main>;
}
