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
        className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-extrabold transition ${active ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
      >
        <span className="text-[11px]">{icon}</span>{label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${active ? "bg-white/12 text-white shadow-sm ring-1 ring-white/10" : "text-slate-300 hover:bg-white/7 hover:text-white"}`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-lg text-xs transition ${active ? "bg-indigo-500 text-white shadow-sm" : "bg-white/6 text-slate-400 group-hover:bg-white/10 group-hover:text-white"}`}>{icon}</span>
      <span>{label}</span>
      {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-300" /> : null}
    </Link>
  );
}
