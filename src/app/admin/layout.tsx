import Link from "next/link";
import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { AdminIcon } from "@/components/admin/admin-icon";
import { requireAdmin } from "./actions";
import { logout } from "../login/actions";
import "./button-contrast.css";

export const dynamic = "force-dynamic";

type NavItem = readonly [label: string, href: string, icon: string];
type NavGroup = { label: string; items: readonly NavItem[] };

const GROUPS: readonly NavGroup[] = [
  { label: "Overview", items: [["Dashboard", "/admin", "dashboard"], ["Health", "/admin/health", "health"]] },
  { label: "Content", items: [["Articles", "/admin/articles", "articles"], ["Pages", "/admin/pages", "pages"], ["Categories", "/admin/categories", "categories"], ["Topics", "/admin/topics", "topics"], ["Homepage", "/admin/homepage", "homepage"]] },
  { label: "Publishing", items: [["Sources", "/admin/sources", "sources"], ["Source tools", "/admin/source-tools", "tools"], ["Regions", "/admin/regions", "regions"], ["Official", "/admin/official", "official"], ["Videos", "/admin/videos", "videos"]] },
  { label: "Website", items: [["Navigation", "/admin/navigation", "navigation"], ["SEO", "/admin/seo", "seo"], ["Settings", "/admin/settings", "settings"]] },
  { label: "Operations", items: [["Ingestion", "/admin/ingestion", "ingestion"], ["Users", "/admin/users", "users"], ["Audit log", "/admin/audit", "audit"]] },
];

const MOBILE_NAV: readonly NavItem[] = GROUPS.flatMap((group) => [...group.items]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const email = session.user?.email ?? "Administrator";

  return (
    <div data-admin-shell data-admin-theme="light" className="admin-theme-shell min-h-screen bg-[#f6f6f6] text-slate-950">
      <header className="admin-mobile-header sticky top-0 z-[70] border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/admin" className="mr-auto flex items-center gap-2.5" aria-label="BridgeNews admin dashboard">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-black text-[11px] font-black tracking-wide text-white">BN</span>
            <div>
              <span className="block text-sm font-black leading-tight">BridgeNews</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Admin</span>
            </div>
          </Link>
          <AdminThemeToggle compact />
          <Link href="/" className="admin-secondary-action inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
            <span>Site</span><AdminIcon name="external" className="h-3.5 w-3.5" />
          </Link>
        </div>
        <nav aria-label="Admin navigation" className="flex gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2.5">{MOBILE_NAV.map(([label, href, icon]) => <AdminNavLink key={href} href={href} label={label} icon={icon} mobile />)}</nav>
      </header>

      <div className="mx-auto grid min-h-screen max-w-[1920px] lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="admin-sidebar sticky top-0 hidden h-screen border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="px-5 py-5">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-black text-xs font-black tracking-wide text-white">BN</span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-black text-slate-950">BridgeNews</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Administration</p>
              </div>
            </Link>
          </div>

          <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto border-t border-slate-100 px-3 py-4">
            {GROUPS.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
                <div className="space-y-1">{group.items.map(([label, href, icon]) => <AdminNavLink key={href} href={href} label={label} icon={icon} />)}</div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-xs font-black text-slate-700 ring-1 ring-slate-200">{email.slice(0,1).toUpperCase()}</span>
                <div className="min-w-0"><p className="truncate text-xs font-black text-slate-800">{email}</p><p className="mt-0.5 text-[11px] font-semibold text-slate-400">Administrator</p></div>
              </div>
            </div>
            <div className="mt-2"><AdminThemeToggle /></div>
            <Link href="/" className="admin-footer-link mt-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"><span>Open website</span><AdminIcon name="external" className="h-4 w-4" /></Link>
            <form action={logout} className="mt-1"><button className="admin-signout w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50">Sign out</button></form>
          </div>
        </aside>

        <div className="admin-content min-w-0 bg-[#f6f6f6]">
          <div className="hidden min-h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:flex xl:px-8">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <div><p className="text-sm font-black text-slate-900">BridgeNews Admin</p><p className="text-xs font-semibold text-slate-400">Live content and publishing workspace</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/ingestion" className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">Live ingestion</Link>
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-xl bg-black px-3.5 py-2 text-xs font-black text-white hover:bg-slate-800">View website <AdminIcon name="external" className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
