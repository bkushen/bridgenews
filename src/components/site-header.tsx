import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-3">
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
          <Link href="/categories" className="hover:text-black">Categories</Link>
          <Link href="/saved" className="hover:text-black">Saved</Link>
        </nav>
        <form action="/search" method="get" className="hidden xl:flex">
          <input name="q" aria-label="Search news" placeholder="Search" className="w-40 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs outline-none focus:border-gray-400 focus:bg-white" />
        </form>
        <Link href="/login" className="rounded-full bg-gray-950 px-4 py-2 text-xs font-bold text-white">Sign in</Link>
      </div>
      <div className="border-t border-gray-100 lg:hidden">
        <nav className="mx-auto flex max-w-7xl gap-5 overflow-x-auto px-5 py-2.5 text-xs font-bold text-gray-600">
          <Link href="/region/sri-lanka" className="shrink-0">🇱🇰 Sri Lanka</Link>
          <Link href="/region/australia" className="shrink-0">🇦🇺 Australia</Link>
          <Link href="/region/international" className="shrink-0">🌍 World</Link>
          <Link href="/latest" className="shrink-0">Latest</Link>
          <Link href="/trending" className="shrink-0">Trending</Link>
          <Link href="/categories" className="shrink-0">Categories</Link>
          <Link href="/search" className="shrink-0">Search</Link>
          <Link href="/saved" className="shrink-0">Saved</Link>
        </nav>
      </div>
    </header>
  );
}
