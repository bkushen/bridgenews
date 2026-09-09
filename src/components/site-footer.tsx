import Link from "next/link";

export function SiteFooter({ siteName = "BridgeNews" }: { siteName?: string }) {
  return <footer className="mt-16 border-t border-[var(--border)] bg-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 md:grid-cols-[1.3fr_1fr_1fr]">
      <div><Link href="/" className="inline-flex items-center gap-2 text-lg font-black tracking-tight"><span className="grid h-8 w-8 place-items-center rounded-xl bg-gray-950 text-xs text-white">BN</span>{siteName}</Link><p className="mt-3 max-w-md text-sm leading-6 text-gray-600">Fast, source-attributed news discovery across Sri Lanka, Australia and the world. {siteName} links readers to original publishers and does not republish full copyrighted articles.</p></div>
      <div><p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">Explore</p><div className="mt-3 grid gap-2 text-sm font-semibold text-gray-700"><Link href="/latest">Latest</Link><Link href="/trending">Trending</Link><Link href="/categories">Categories</Link><Link href="/search">Search</Link></div></div>
      <div><p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">{siteName}</p><div className="mt-3 grid gap-2 text-sm font-semibold text-gray-700"><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div>
    </div>
    <div className="border-t border-gray-100 px-5 py-5 text-center text-xs text-gray-500">© {new Date().getFullYear()} {siteName}. Publisher names, headlines and linked content remain the property of their respective owners.</div>
  </footer>;
}
