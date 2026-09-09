import Link from "next/link";
import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { requireAdmin } from "./actions";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

type NavItem = readonly [label: string, href: string, icon: string];
type NavGroup = { label: string; items: readonly NavItem[] };

const GROUPS: readonly NavGroup[] = [
  { label: "Overview", items: [["Dashboard", "/admin", "D"], ["Health", "/admin/health", "H"]] },
  { label: "Content", items: [["Articles", "/admin/articles", "A"], ["Pages", "/admin/pages", "P"], ["Categories", "/admin/categories", "C"], ["Topics", "/admin/topics", "T"], ["Homepage", "/admin/homepage", "M"]] },
  { label: "Publishing", items: [["Sources", "/admin/sources", "S"], ["Source tools", "/admin/source-tools", "Q"], ["Regions", "/admin/regions", "R"], ["Official", "/admin/official", "O"], ["Videos", "/admin/videos", "V"]] },
  { label: "Website", items: [["Navigation", "/admin/navigation", "N"], ["SEO", "/admin/seo", "E"], ["Settings", "/admin/settings", "G"]] },
  { label: "Operations", items: [["Ingestion", "/admin/ingestion", "I"], ["Users", "/admin/users", "U"], ["Audit log", "/admin/audit", "L"]] },
];

const MOBILE_NAV: readonly NavItem[] = GROUPS.flatMap((group) => [...group.items]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const email = session.user?.email ?? "Administrator";

  return (
    <div data-admin-shell data-admin-theme="light" className="admin-theme-shell min-h-screen bg-slate-50 text-slate-950">
      <header className="admin-mobile-header sticky top-0 z-[70] border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/admin" className="mr-auto flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-[11px] font-black tracking-wide text-white">BN</span>
            <div>
              <span className="block text-sm font-black leading-tight">BridgeNews</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Admin</span>
            </div>
          </Link>
          <AdminThemeToggle compact />
          <Link href="/" className="admin-secondary-action rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">View site</Link>
        </div>
        <nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2.5">{MOBILE_NAV.map(([label, href, icon]) => <AdminNavLink key={href} href={href} label={label} icon={icon} mobile />)}</nav>
      </header>

      <div className="mx-auto grid min-h-screen max-w-[1800px] lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="admin-sidebar sticky top-0 hidden h-screen border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-5 py-5">
            <Link href="/admin" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-xs font-black tracking-wide text-white">BN</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">BridgeNews</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Administration</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {GROUPS.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{group.label}</p>
                <div className="space-y-0.5">{group.items.map(([label, href, icon]) => <AdminNavLink key={href} href={href} label={label} icon={icon} />)}</div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-200 p-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="truncate text-xs font-black text-slate-800">{email}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-400">Administrator account</p>
            </div>
            <div className="mt-2"><AdminThemeToggle /></div>
            <Link href="/" className="admin-footer-link mt-1 flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-950"><span>Open website</span><span aria-hidden>↗</span></Link>
            <form action={logout} className="mt-1"><button className="admin-signout w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50">Sign out</button></form>
          </div>
        </aside>

        <div className="admin-content min-w-0 bg-slate-50">
          <div className="hidden min-h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:flex xl:px-8">
            <div>
              <p className="text-sm font-black text-slate-900">BridgeNews Admin</p>
              <p className="text-xs font-semibold text-slate-400">Content, publishing and operations</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700">System online</span>
              <Link href="/" className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-600 hover:bg-slate-50">View website ↗</Link>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
