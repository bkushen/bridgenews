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
  ["Topics", "/topics"],
  ["Map", "/map"],
  ["Sources", "/sources"],
] as const;

export async function SiteHeader() {
  const [control, region] = await Promise.all([getSiteControl(), getActiveRegion()]);
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  const edition = EDITIONS[region];
  const now = new Date();
  const dateText = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: edition.timeZone }).format(now);
  const timeText = new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: edition.timeZone }).format(now);
  const editionHome = region === "sri-lanka" ? "/sri-lanka" : region === "australia" ? "/australia" : "/international";

  return <header data-public-header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
    <div className="border-b border-[#e5e5e5] bg-[#f4f4f2]">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#777] sm:px-6">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <span className="shrink-0 text-[#111]">{dateText}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{edition.flag} {timeText} · {edition.label}</span>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/brief" className="hover:text-[var(--news-accent)]">Newsletter</Link>
          <Link href="/following" className="hidden sm:inline hover:text-[var(--news-accent)]">Following</Link>
          <Link href="/login" className="font-black text-[#111] hover:text-[var(--news-accent)]">Sign in</Link>
        </div>
      </div>
    </div>

    <div className="mx-auto grid max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center px-4 py-5 sm:px-6 lg:py-7">
      <form action="/search" method="get" className="hidden max-w-[260px] md:block">
        <div className="flex items-center border-b border-[#bdbdbd] py-2 text-sm">
          <span className="mr-2 text-[#888]">⌕</span>
          <input name="q" aria-label="Search news" placeholder="Search" className="min-w-0 flex-1 bg-transparent text-[#111] outline-none placeholder:text-[#8a8a8a]" />
        </div>
      </form>

      <Link href={editionHome} className="news-wordmark col-start-2 text-center text-[34px] font-black leading-none tracking-[-0.06em] text-[#0c0c0c] sm:text-[45px] lg:text-[58px]">
        {siteName}<span className="text-[var(--news-accent)]">.</span>
        <span className="mt-2 block text-[8px] font-extrabold uppercase tracking-[0.32em] text-[#888] sm:text-[9px]">Sri Lanka · Australia · World</span>
      </Link>

      <div className="col-start-3 ml-auto flex items-center gap-3">
        <div className="hidden xl:block"><RegionNav/></div>
        <Link href="/search" className="grid h-9 w-9 place-items-center rounded-full border border-[#d8d8d8] text-sm md:hidden">⌕</Link>
      </div>
    </div>

    <div className="border-t border-[#e5e5e5] border-b bg-white">
      <div className="mx-auto flex max-w-[1320px] items-center gap-4 overflow-x-auto px-4 py-3 sm:px-6">
        <nav className="flex shrink-0 items-center gap-5">
          {primaryNav.map(([label, href], index) => <Link key={label} href={href === "/" ? editionHome : href} className={`news-nav-link shrink-0 text-[11px] font-black uppercase tracking-[0.08em] transition ${index === 0 ? "text-[var(--news-accent)]" : "text-[#222] hover:text-[var(--news-accent)]"}`}>{label}</Link>)}
        </nav>
        <div className="ml-auto hidden shrink-0 items-center gap-3 xl:flex"><RegionNav/></div>
      </div>
    </div>
  </header>;
}
