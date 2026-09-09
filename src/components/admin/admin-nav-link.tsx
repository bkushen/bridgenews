"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({ href, label, icon, mobile = false }: { href: string; label: string; icon: string; mobile?: boolean }) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  if (mobile) {
    return (
      <Link href={href} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${active ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
        <span>{icon}</span>{label}
      </Link>
    );
  }

  return (
    <Link href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${active ? "bg-gray-950 text-white" : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"}`}>
      <span className={`grid h-7 w-7 place-items-center rounded-lg text-xs ${active ? "bg-white/15 text-white" : "bg-gray-100 text-gray-600"}`}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
