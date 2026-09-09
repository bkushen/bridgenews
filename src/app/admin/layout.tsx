import Link from "next/link";
import { requireAdmin } from "./actions";
import { logout } from "../login/actions";

const NAV = [
  ["Dashboard","/admin"],["Articles","/admin/articles"],["Sources","/admin/sources"],["Categories","/admin/categories"],["Topics","/admin/topics"],["Regions","/admin/regions"],["Homepage","/admin/homepage"],["Official","/admin/official"],["Videos","/admin/videos"],["Users","/admin/users"],["Ingestion","/admin/ingestion"],["Settings","/admin/settings"],["Audit","/admin/audit"]
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return <>
    <header className="sticky top-0 z-[60] border-b bg-gray-950 text-white">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3"><Link href="/admin" className="mr-auto font-black">BridgeNews Admin</Link>{session.preview ? <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-200">Preview</span> : <form action={logout}><button className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-bold hover:bg-white/10">Sign out</button></form>}</div>
      <nav className="mx-auto flex max-w-[1500px] gap-4 overflow-x-auto border-t border-white/10 px-4 py-2 text-xs font-bold text-gray-300">{NAV.map(([label,href]) => <Link key={href} href={href} className="shrink-0 hover:text-white">{label}</Link>)}</nav>
    </header>
    {children}
  </>;
}
