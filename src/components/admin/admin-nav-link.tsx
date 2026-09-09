"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavLink({ href, label, icon, mobile = false }: { href: string; label: string; icon: string; mobile?: boolean }) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`admin-mobile-nav-item flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-extrabold ${active ? "is-active bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
      >
        <span className={`grid h-5 w-5 place-items-center rounded-md text-[9px] font-black ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`admin-nav-item group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-bold ${active ? "is-active bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`}
    >
      <span className={`admin-nav-icon grid h-7 w-7 place-items-center rounded-md text-[9px] font-black ${active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"}`}>{icon}</span>
      <span className="truncate">{label}</span>
      {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500" /> : null}
    </Link>
  );
}
