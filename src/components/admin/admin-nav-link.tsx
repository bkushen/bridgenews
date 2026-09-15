"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon } from "@/components/admin/admin-icon";

export function AdminNavLink({ href, label, icon, mobile = false }: { href: string; label: string; icon: string; mobile?: boolean }) {
  const pathname = usePathname();
  const active = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`admin-mobile-nav-item flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${active ? "is-active border-black bg-black text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-black"}`}
      >
        <AdminIcon name={icon} className="h-4 w-4" />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`admin-nav-item group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition ${active ? "is-active bg-black text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
    >
      <span className={`admin-nav-icon grid h-8 w-8 place-items-center rounded-lg transition ${active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-black"}`}>
        <AdminIcon name={icon} className="h-4 w-4" />
      </span>
      <span className="truncate">{label}</span>
      {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" /> : null}
    </Link>
  );
}
