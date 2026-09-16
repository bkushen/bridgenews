import Link from "next/link";
import { getSiteControl } from "@/lib/data/site-control";
import { RegionNav } from "@/components/region-nav";
import { EDITIONS, getActiveRegion } from "@/lib/region-context";

const primaryNav = [
  ["Home", "/"],
  ["Top Stories", "/top-stories"],
  ["Latest", "/latest"],
  ["Videos", "/videos"],
  ["What's On", "/whats-on"],
  ["Topics", "/topics"],
  ["Map", "/map"],
  ["Sources", "/sources"],
] as const;

export async function SiteHeader() {
  const [control, region] = await Promise.all([getSiteControl(), getActiveRegion()]);
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  const edition = EDITIONS[region];
  const now = new Date();
  const dateText = new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "2-digit", month: "short", timeZone: edition.timeZone }).format(now);
  const timeText = new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: edition.timeZone }).format(now);
  const editionHome = region === "sri-lanka" ? "/sri-lanka" : region === "australia" ? "/australia" : "/international";

  return <header data-public-header className="sticky top-0 z-50 border-b backdrop-blur">
    <div className="border-b border-[#eef0f3] bg-white/95">
      <div className="mx-auto flex max-w-[1380px] items-center gap-4 px-4 py-2 text-[11px] text-[#667085] lg:px-6">
        <span className="font-semibold text-[#344054]">{dateText}</span>
        <span>·</span>
        <span>{edition.flag} {timeText} · {edition.city}</span>
        <Link href="/latest" className="ml-auto hidden font-semibold text-[#3157d5] hover:underline sm:inline">Latest updates</Link>
      </div>
    </div>

    <div className="bg-white/95">
      <div className="mx-auto flex max-w-[1380px] items-center gap-4 px-4 py-4 lg:px-6">
        <Link href={editionHome} className="news-wordmark shrink-0 text-[27px] font-black tracking-tight sm:text-[30px]">
          {siteName}<span className="text-[#3157d5]">.</span>
        </Link>

        <form action="/search" method="get" className="hidden min-w-0 flex-1 md:block md:max-w-[540px] lg:ml-4">
          <div className="news-search flex items-center rounded-xl border px-4 py-2.5">
            <span className="mr-2 text-[#98a2b3]">⌕</span>
            <input name="q" aria-label="Search news" placeholder="Search BridgeNews" className="min-w-0 flex-1 bg-transparent text-sm text-[#101828] outline-none placeholder:text-[#98a2b3]" />
          </div>
        </form>

        <div className="ml-auto hidden items-center gap-2 xl:flex">
          <RegionNav />
          <Link href="/following" className="rounded-lg border border-[#e4e7ec] bg-white px-3 py-2 text-xs font-semibold text-[#344054] hover:border-[#3157d5] hover:text-[#3157d5]">Following</Link>
          <Link href="/brief" className="rounded-lg border border-[#e4e7ec] bg-white px-3 py-2 text-xs font-semibold text-[#344054] hover:border-[#3157d5] hover:text-[#3157d5]">Daily Brief</Link>
          <Link href="/login" className="news-signin rounded-lg border px-4 py-2.5 text-xs font-bold">Sign in</Link>
        </div>

        <div className="ml-auto flex items-center gap-2 xl:hidden">
          <Link href="/search" className="grid h-10 w-10 place-items-center rounded-lg border border-[#e4e7ec] bg-white text-[#344054]">⌕</Link>
          <Link href="/login" className="news-signin rounded-lg border px-3.5 py-2 text-xs font-bold">Sign in</Link>
        </div>
      </div>

      <div className="border-t border-[#f2f4f7]">
        <div className="mx-auto max-w-[1380px] overflow-x-auto px-4 lg:px-6">
          <nav className="flex min-w-max items-center gap-1 py-2.5">
            {primaryNav.map(([label, href], index) => <Link key={label} href={href === "/" ? editionHome : href} className={`news-nav-link rounded-lg px-3 py-2 text-xs font-semibold transition ${index === 0 ? "bg-[#101828] text-white" : "text-[#475467] hover:bg-[#f2f4f7] hover:text-[#101828]"}`}>{label}</Link>)}
          </nav>
        </div>
      </div>
    </div>
  </header>;
}
