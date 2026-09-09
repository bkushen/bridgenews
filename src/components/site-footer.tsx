import Link from "next/link";
import { getSiteMenu } from "@/lib/data/site-menu";

export async function SiteFooter({ siteName = "BridgeNews" }: { siteName?: string }) {
  const menu = await getSiteMenu("footer");
  return <footer className="mt-16 border-t border-[var(--border)] bg-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-[1.3fr_1fr]">
      <div><Link href="/" className="inline-flex items-center gap-2 text-lg font-black tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-xl bg-gray-950 text-xs text-white">BN</span>{siteName}</Link><p className="mt-3 max-w-md text-sm leading-6 text-gray-600">Fast, source-attributed news discovery across Sri Lanka, Australia and the world. {siteName} links readers to original publishers and does not republish full copyrighted articles.</p></div>
      <div><p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Explore</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-gray-700 sm:grid-cols-3">{menu.map((item:any)=><Link key={item.id} href={item.href} className="hover:text-black">{item.label}</Link>)}</div></div>
    </div>
    <div className="border-t border-gray-100 px-5 py-5 text-center text-xs text-gray-500">© {new Date().getFullYear()} {siteName}. Publisher names, headlines and linked content remain the property of their respective owners.</div>
  </footer>;
}
