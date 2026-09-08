import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-3">
        <Link href="/" className="mr-auto flex items-center gap-2 text-xl font-black tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gray-950 text-sm text-white">BN</span>
          <span>BridgeNews</span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-gray-700 lg:flex">
          <Link href="/region/sri-lanka" className="hover:text-black">Sri Lanka</Link>
          <Link href="/region/australia" className="hover:text-black">Australia</Link>
          <Link href="/region/international" className="hover:text-black">World</Link>
          <Link href="/latest" className="hover:text-black">Latest</Link>
          <Link href="/trending" className="hover:text-black">Trending</Link>
          <Link href="/topics" className="hover:text-black">Topics</Link>
        </nav>
        <Link href="/latest" className="rounded-full border border-gray-200 px-3.5 py-2 text-xs font-bold lg:hidden">Latest</Link>
        <Link href="/admin" className="rounded-full bg-gray-950 px-4 py-2 text-xs font-bold text-white">Admin</Link>
      </div>
      <div className="border-t border-gray-100 lg:hidden">
        <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-5 py-2.5 text-xs font-bold text-gray-600">
          <Link href="/region/sri-lanka" className="shrink-0">🇱🇰 Sri Lanka</Link>
          <Link href="/region/australia" className="shrink-0">🇦🇺 Australia</Link>
          <Link href="/region/international" className="shrink-0">🌍 World</Link>
          <Link href="/trending" className="shrink-0">Trending</Link>
          <Link href="/topics" className="shrink-0">Topics</Link>
        </nav>
      </div>
    </header>
  );
}
