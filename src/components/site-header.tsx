import Link from "next/link";

const NAV = [
  ["Top Stories", "/top-stories"],
  ["Latest", "/latest"],
  ["Sri Lanka", "/region/sri-lanka"],
  ["Australia", "/region/australia"],
  ["World", "/region/international"],
  ["Popular", "/popular"],
  ["Topics", "/topics"],
  ["Sources", "/sources"],
  ["Videos", "/videos"],
  ["Map", "/map"],
  ["Archive", "/archive"],
  ["Official", "/official"],
  ["Following", "/following"],
  ["Saved", "/saved"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-5">
        <Link href="/" className="mr-auto flex items-center gap-2 text-xl font-black tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gray-950 text-sm text-white">BN</span>
          <span>BridgeNews</span>
        </Link>
        <form action="/search" method="get" className="hidden md:flex">
          <input name="q" aria-label="Search news" placeholder="Search news" className="w-44 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs outline-none focus:border-gray-400 focus:bg-white xl:w-56" />
        </form>
        <Link href="/following" className="hidden rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-800 sm:inline-flex">Following</Link>
        <Link href="/login" className="rounded-full bg-gray-950 px-4 py-2 text-xs font-bold text-white">Sign in</Link>
      </div>
      <div className="border-t border-gray-100">
        <div className="mx-auto flex max-w-[1440px] items-center overflow-x-auto px-4 sm:px-5">
          <nav className="flex shrink-0 items-center gap-5 py-2.5 text-xs font-bold text-gray-600">
            {NAV.map(([label, href]) => <Link key={href} href={href} className="shrink-0 whitespace-nowrap hover:text-black">{label}</Link>)}
          </nav>
          <div className="ml-5 flex shrink-0 items-center gap-1 border-l border-gray-200 pl-5 text-[10px] font-black">
            <Link href="/top-stories?language=en" className="rounded-full bg-gray-100 px-2.5 py-1.5">EN</Link>
            <Link href="/top-stories?language=si" className="rounded-full bg-gray-100 px-2.5 py-1.5">සිං</Link>
            <Link href="/top-stories?language=ta" className="rounded-full bg-gray-100 px-2.5 py-1.5">தமிழ்</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
