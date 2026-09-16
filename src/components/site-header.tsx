import Link from "next/link";
import { getSiteControl } from "@/lib/data/site-control";
import { RegionNav } from "@/components/region-nav";
import { EDITIONS, getActiveRegion } from "@/lib/region-context";

const primaryNav = [
  ["Home", "/"],
  ["Top Stories", "/top-stories"],
  ["News", "/latest"],
  ["Videos", "/videos"],
  ["What's On", "/whats-on"],
  ["Map", "/map"],
  ["Topics", "/topics"],
  ["Sources", "/sources"],
] as const;

export async function SiteHeader() {
  const [control, region] = await Promise.all([getSiteControl(), getActiveRegion()]);
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  const edition = EDITIONS[region];
  const editionHome = region === "sri-lanka" ? "/sri-lanka" : region === "australia" ? "/australia" : "/international";

  return <header data-public-header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
    <div className="mx-auto max-w-[1240px] px-4 sm:px-5">
      <div className="flex items-center gap-4 py-3">
        <Link href={editionHome} className="news-wordmark shrink-0 text-[24px] font-black tracking-[-0.045em] text-[#101828] sm:text-[28px]">
          {siteName}<span className="text-[#3157d5]">.</span>
        </Link>

        <form action="/search" method="get" className="hidden min-w-0 flex-1 md:block md:max-w-[430px] lg:ml-8">
          <div className="news-search flex items-center rounded-full border border-[#e4e7ec] bg-[#f8fafc] px-4 py-2.5">
            <span className="mr-2 text-[#98a2b3]">⌕</span>
            <input name="q" aria-label="Search news" placeholder="Search news — English for best results..." className="min-w-0 flex-1 bg-transparent text-xs text-[#101828] outline-none placeholder:text-[#98a2b3]" />
            <span className="ml-2 rounded-full bg-[#eef3ff] px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-[#3157d5]">Hybrid</span>
          </div>
        </form>

        <div className="ml-auto hidden items-center gap-2 xl:flex">
          <RegionNav />
          <Link href="/brief" className="rounded-full border border-[#e4e7ec] bg-white px-3 py-2 text-[11px] font-bold text-[#344054] hover:border-[#3157d5] hover:text-[#3157d5]">Daily Brief</Link>
          <Link href="/following" className="grid h-9 w-9 place-items-center rounded-full border border-[#e4e7ec] bg-white text-sm text-[#344054] hover:border-[#3157d5] hover:text-[#3157d5]">♡</Link>
          <Link href="/login" className="news-signin rounded-lg border px-4 py-2 text-[11px] font-bold">Sign in</Link>
        </div>

        <div className="ml-auto flex items-center gap-2 xl:hidden">
          <Link href="/search" className="grid h-9 w-9 place-items-center rounded-full border border-[#e4e7ec] bg-white text-[#344054]">⌕</Link>
          <Link href="/login" className="news-signin rounded-lg border px-3 py-2 text-[11px] font-bold">Sign in</Link>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-[#f2f4f7]">
        <nav className="flex min-w-max items-center gap-2 py-2.5">
          {primaryNav.map(([label, href], index) => <Link key={label} href={href === "/" ? editionHome : href} className={`news-nav-link shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold transition ${index === 0 ? "bg-[#101828] text-white" : "bg-[#f2f4f7] text-[#475467] hover:bg-[#eef3ff] hover:text-[#3157d5]"}`}>{label}</Link>)}
        </nav>
      </div>
    </div>
  </header>;
}
