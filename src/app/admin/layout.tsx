import Link from "next/link";
import { AdminNavLink } from "@/components/admin/admin-nav-link";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { requireAdmin } from "./actions";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

type NavItem = readonly [label: string, href: string, icon: string];
type NavGroup = { label: string; items: readonly NavItem[] };

const GROUPS: readonly NavGroup[] = [
  { label: "Overview", items: [["Dashboard", "/admin", "⌂"], ["Health", "/admin/health", "♥"]] },
  { label: "Content", items: [["Articles", "/admin/articles", "▤"], ["Pages", "/admin/pages", "□"], ["Categories", "/admin/categories", "#"], ["Topics", "/admin/topics", "◎"], ["Homepage", "/admin/homepage", "⌘"]] },
  { label: "Publishing", items: [["Sources", "/admin/sources", "◉"], ["Source tools", "/admin/source-tools", "☑"], ["Regions", "/admin/regions", "◆"], ["Official", "/admin/official", "✓"], ["Videos", "/admin/videos", "▶"]] },
  { label: "Website", items: [["Navigation", "/admin/navigation", "↔"], ["SEO", "/admin/seo", "⌕"], ["Settings", "/admin/settings", "⚙"]] },
  { label: "Operations", items: [["Ingestion", "/admin/ingestion", "↻"], ["Users", "/admin/users", "♙"], ["Audit log", "/admin/audit", "≡"]] },
];

const MOBILE_NAV: readonly NavItem[] = GROUPS.flatMap((group) => [...group.items]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div data-admin-shell data-admin-theme="light" className="admin-theme-shell min-h-screen bg-slate-100 text-slate-950">
    <header className="admin-mobile-header sticky top-0 z-[70] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur lg:hidden"><div className="flex items-center gap-3 px-4 py-3"><Link href="/admin" className="mr-auto flex items-center gap-2 font-black"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs text-white shadow-sm">BN</span><div><span className="block leading-tight">BridgeNews</span><span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Admin</span></div></Link><AdminThemeToggle compact/><Link href="/" className="admin-secondary-action rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-sm">View site ↗</Link></div><nav className="flex gap-2 overflow-x-auto border-t border-slate-100 px-3 py-2.5">{MOBILE_NAV.map(([label,href,icon])=><AdminNavLink key={href} href={href} label={label} icon={icon} mobile/>)}</nav></header>
    <div className="mx-auto grid min-h-screen max-w-[1720px] lg:grid-cols-[270px_minmax(0,1fr)]"><aside className="admin-sidebar sticky top-0 hidden h-screen overflow-hidden bg-slate-950 text-white shadow-2xl lg:flex lg:flex-col"><div className="border-b border-white/8 px-5 py-5"><Link href="/admin" className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-sm font-black text-white shadow-lg shadow-indigo-950/30">BN</span><div><p className="font-black leading-tight text-white">BridgeNews</p><p className="mt-0.5 text-xs font-semibold text-slate-400">Admin control center</p></div></Link></div><nav className="flex-1 overflow-y-auto px-3 py-5">{GROUPS.map(group=><div key={group.label} className="mb-6"><p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{group.label}</p><div className="space-y-1">{group.items.map(([label,href,icon])=><AdminNavLink key={href} href={href} label={label} icon={icon}/>)}</div></div>)}</nav><div className="border-t border-white/8 p-3"><div className="mb-2 rounded-2xl bg-white/5 p-3 ring-1 ring-white/8"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Workspace</p><p className="mt-1 text-sm font-black text-slate-100">BridgeNews Admin</p><p className="mt-1 text-xs leading-5 text-slate-400">Manage content, publishing and system health.</p></div><div className="mb-2"><AdminThemeToggle/></div><Link href="/" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/7 hover:text-white"><span>Open website</span><span>↗</span></Link><form action={logout} className="mt-1"><button className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200">Sign out</button></form></div></aside><div className="admin-content min-w-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_28rem)]">{children}</div></div>
  </div>;
}
