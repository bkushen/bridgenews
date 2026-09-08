import Link from "next/link";
import { requireAdmin } from "./actions";
import { logout } from "../login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <>
      <div className="border-b border-[var(--border)] bg-gray-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-5 py-3 text-sm">
          <span className="font-black">Admin</span>
          <Link href="/admin">Dashboard</Link>
          <Link href="/admin/sources">Sources</Link>
          <Link href="/admin/ai">AI operations</Link>
          {session.preview ? <span className="ml-auto rounded-full bg-amber-400/20 px-3 py-1 font-bold text-amber-200">Preview mode · Supabase not connected</span> : <form action={logout} className="ml-auto"><button className="font-bold">Sign out</button></form>}
        </div>
      </div>
      {children}
    </>
  );
}
