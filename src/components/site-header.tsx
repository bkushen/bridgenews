import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-5 px-5 py-4">
        <Link href="/" className="mr-auto text-xl font-black tracking-tight">BridgeNews</Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/region/sri-lanka">🇱🇰 Sri Lanka</Link>
          <Link href="/region/australia">🇦🇺 Australia</Link>
          <Link href="/region/international">🌍 International</Link>
          <Link href="/latest">Latest</Link>
          <Link href="/trending">Trending</Link>
          <Link href="/topics">Topics</Link>
          <Link href="/admin" className="rounded-full bg-black px-4 py-2 text-white">Admin</Link>
        </nav>
      </div>
    </header>
  );
}
