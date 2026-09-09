import Link from "next/link";
import { requireAdmin } from "./actions";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

type NavItem = readonly [label: string, href: string, icon: string];
type NavGroup = { label: string; items: readonly NavItem[] };

const GROUPS: readonly NavGroup[] = [
  { label: "Overview", items: [["Dashboard","/admin","⌂"]] },
  { label: "Content", items: [["Articles","/admin/articles","▤"],["Categories","/admin/categories","#"],["Topics","/admin/topics","◎"],["Homepage","/admin/homepage","⌘"]] },
  { label: "Publishing", items: [["Sources","/admin/sources","◉"],["Regions","/admin/regions","◆"],["Official","/admin/official","✓"],["Videos","/admin/videos","▶"]] },
  { label: "Operations", items: [["Ingestion","/admin/ingestion","↻"],["Users","/admin/users","♙"],["Settings","/admin/settings","⚙"],["Audit log","/admin/audit","≡"]] },
];

const MOBILE_NAV: readonly NavItem[] = GROUPS.flatMap((group) => [...group.items]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return <div className="min-h-screen bg-gray-50 text-gray-950">
    <header className="sticky top-0 z-[70] border-b border-gray-200 bg-white/95 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href="/admin" className="mr-auto flex items-center gap-2 font-black"><span className="grid h-8 w-8 place-items-center rounded-lg bg-gray-950 text-xs text-white">BN</span><span>Admin</span></Link>
        <Link href="/" className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold">View site ↗</Link>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-gray-100 px-3 py-2">{MOBILE_NAV.map(([label,href,icon])=><Link key={href} href={href} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"><span>{icon}</span>{label}</Link>)}</nav>
    </header>

    <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-gray-100 p-5"><Link href="/admin" className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gray-950 text-sm font-black text-white">BN</span><div><p className="font-black leading-tight">BridgeNews</p><p className="text-xs font-semibold text-gray-400">Admin control center</p></div></Link></div>
        <nav className="flex-1 overflow-y-auto p-3">{GROUPS.map((group)=><div key={group.label} className="mb-5"><p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{group.label}</p><div className="space-y-1">{group.items.map(([label,href,icon])=><Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"><span className="grid h-7 w-7 place-items-center rounded-lg bg-gray-100 text-xs text-gray-600">{icon}</span><span>{label}</span></Link>)}</div></div>)}</nav>
        <div className="border-t border-gray-100 p-3"><Link href="/" className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100"><span>Open website</span><span>↗</span></Link>{session.preview?<div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">Preview mode</div>:<form action={logout} className="mt-1"><button className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 hover:bg-red-50">Sign out</button></form>}</div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  </div>;
}
