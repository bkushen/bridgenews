import Link from "next/link";
import { getSiteControl } from "@/lib/data/site-control";
import { RegionNav } from "@/components/region-nav";
import { EDITIONS, getActiveRegion } from "@/lib/region-context";

const primaryNav = [
  ["Home", "/"],
  ["Top Stories", "/top-stories"],
  ["News", "/latest"],
  ["Videos", "/videos"],
  ["What's On", "#whats-on"],
  ["Map", "/map"],
  ["Topics", "/topics"],
  ["Sources", "/sources"],
] as const;

const quickLinks = [
  ["Google", "https://www.google.com", "G"],
  ["Gmail", "https://mail.google.com", "✉"],
  ["YouTube", "https://www.youtube.com", "▶"],
  ["Facebook", "https://www.facebook.com", "f"],
  ["WhatsApp", "https://www.whatsapp.com", "◉"],
  ["Wikipedia", "https://www.wikipedia.org", "W"],
  ["X.com", "https://x.com", "𝕏"],
  ["LinkedIn", "https://www.linkedin.com", "in"],
  ["Instagram", "https://www.instagram.com", "◎"],
  ["Reddit", "https://www.reddit.com", "●"],
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
    <div className="border-b border-[#e9e1d6] bg-[#f8f3ea]/95">
      <div className="mx-auto flex max-w-[1480px] items-center gap-4 px-4 py-3 lg:px-6">
        <Link href={editionHome} className="news-wordmark shrink-0 text-[24px] font-black tracking-tight text-[#1d1b19] sm:text-[26px]">
          {siteName}<span className="text-[#a5232f]">.</span>
        </Link>

        <form action="/search" method="get" className="hidden min-w-0 flex-1 md:block md:max-w-[520px] xl:ml-8">
          <div className="news-search flex items-center rounded-full border px-4 py-2.5">
            <span className="mr-2 text-[#8a8178]">⌕</span>
            <input name="q" aria-label="Search news" placeholder="Search news — English for best results..." className="min-w-0 flex-1 bg-transparent text-sm text-[#1d1b19] outline-none placeholder:text-[#8a8178]" />
            <span className="ml-2 rounded-full bg-[#f1eadf] px-2 py-1 text-[9px] font-black uppercase tracking-wider text-[#8a8178]">Hybrid</span>
          </div>
        </form>

        <div className="ml-auto hidden items-center gap-2 xl:flex">
          <RegionNav />
          <Link href="/brief" className="rounded-full bg-[#f2aa32] px-4 py-2 text-xs font-black text-[#39260d] transition hover:-translate-y-0.5 hover:bg-[#e99b1e]">● Brief</Link>
          <Link href="/following" className="grid h-10 w-10 place-items-center rounded-full border border-[#d8d0c4] bg-[#fffdf8] text-sm text-[#403a35] transition hover:-translate-y-0.5 hover:border-[#a5232f]">♡</Link>
          <Link href="/login" className="news-signin rounded-lg border px-4 py-2.5 text-xs font-bold">Sign in</Link>
        </div>

        <div className="ml-auto flex items-center gap-2 xl:hidden">
          <Link href="/search" className="grid h-10 w-10 place-items-center rounded-full border border-[#d8d0c4] bg-[#fffdf8]">⌕</Link>
          <Link href="/login" className="news-signin rounded-full border px-3.5 py-2 text-xs font-bold">Sign in</Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1480px] items-center gap-2 overflow-x-auto px-4 pb-3 lg:px-6">
        <nav className="flex shrink-0 items-center gap-2">
          {primaryNav.map(([label, href], index) => {
            const resolvedHref = href.startsWith("#") ? `${editionHome}${href}` : href;
            return <Link key={label} href={resolvedHref} className={`news-nav-link shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${index === 0 ? "bg-[#201d1a] text-white hover:bg-[#a5232f]" : "bg-[#f0eadf] text-[#554e47] hover:-translate-y-0.5 hover:bg-[#e8ded1] hover:text-[#7f1822]"}`}>{label}</Link>;
          })}
        </nav>
      </div>
    </div>

    <div className="bg-[#f7f2e9] px-4 py-3 lg:px-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-[#dfd6c9] bg-[#fffdf8] px-4 py-2.5 text-[11px] text-[#564f48] shadow-[0_1px_4px_rgba(53,42,31,.04)]">
          <span className="shrink-0 font-black text-[#1d1b19]">{dateText}</span>
          <span>·</span>
          <span className="shrink-0">{edition.flag} {timeText} in {edition.label}</span>
          <span>·</span>
          <span className="shrink-0">📍 {edition.city}</span>
          <span>·</span>
          <Link href="/latest" className="shrink-0 font-bold text-[#a5232f] hover:underline">Latest regional updates →</Link>
        </div>

        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-0.5">
          {quickLinks.map(([label, href, icon]) => <a key={label} href={href} target="_blank" rel="noreferrer" className="group flex shrink-0 items-center gap-2 rounded-full border border-[#ddd4c8] bg-[#fffdf8] px-3 py-2 text-[11px] font-semibold text-[#403a35] shadow-[0_1px_3px_rgba(53,42,31,.04)] transition hover:-translate-y-0.5 hover:border-[#b9aa99] hover:shadow-md"><span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#f2ece3] px-1 text-[10px] font-black group-hover:bg-[#f8e8e8] group-hover:text-[#a5232f]">{icon}</span>{label}</a>)}
        </div>
      </div>
    </div>
  </header>;
}
