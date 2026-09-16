import Link from "next/link";
import { getSiteControl } from "@/lib/data/site-control";
import { getSiteMenu } from "@/lib/data/site-menu";
import { RegionNav } from "@/components/region-nav";

export async function SiteHeader() {
  const [control, menu] = await Promise.all([getSiteControl(), getSiteMenu("header")]);
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  const secondaryButton = "rounded-full border border-[#d8d0c4] bg-[#fffdf8] text-[#5f5851] transition-colors hover:border-[#a5232f] hover:bg-[#f8e8e8] hover:text-[#7f1822]";

  return <header data-public-header className="sticky top-0 z-50 border-b backdrop-blur">
    <div className="mx-auto flex max-w-[1180px] items-center gap-2.5 px-4 py-3 sm:gap-3 sm:px-5">
      <Link href="/" className="mr-auto flex min-w-0 items-center gap-2.5 sm:gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#a5232f] text-[10px] font-black tracking-[-0.08em] text-[#fffaf3]">BN</span><span className="news-wordmark truncate text-[20px] font-black text-[#1d1b19] sm:text-[22px]">{siteName}</span></Link>
      <form action="/search" method="get" className="hidden md:flex"><input name="q" aria-label="Search news" placeholder="Search news" className="news-search w-44 rounded-full border px-4 py-2 text-xs text-[#1d1b19] outline-none transition xl:w-60" /></form>
      <Link href="/search" aria-label="Search news" className={`inline-flex px-3 py-2 text-xs font-bold md:hidden ${secondaryButton}`}>Search</Link>
      <Link href="/brief" className="hidden rounded-full border border-[#a5232f] bg-[#a5232f] px-4 py-2 text-xs font-black text-[#fffaf3] transition-colors hover:border-[#7f1822] hover:bg-[#7f1822] sm:inline-flex">Daily Brief</Link>
      <Link href="/following" className={`hidden px-4 py-2 text-xs font-bold lg:inline-flex ${secondaryButton}`}>Following</Link>
      <Link href="/login" className="news-signin rounded-full border border-[#1d1b19] px-3.5 py-2 text-xs font-bold transition-colors sm:px-4">Sign in</Link>
    </div>
    <div className="border-t border-[#ebe4da]"><div className="mx-auto flex max-w-[1180px] items-center overflow-x-auto px-4 sm:px-5"><RegionNav/><nav className="ml-4 flex shrink-0 items-center gap-5 py-2.5 text-xs font-bold text-[#6f675f]"><Link href="/brief" className="news-nav-link shrink-0 whitespace-nowrap font-black text-[#a5232f] sm:hidden">Daily Brief</Link>{menu.map((item:any)=><Link key={item.id} href={item.href} className="news-nav-link shrink-0 whitespace-nowrap transition-colors">{item.label}</Link>)}</nav><div className="ml-5 flex shrink-0 items-center gap-1 border-l border-[#d8d0c4] pl-5 text-[10px] font-black"><Link href="/top-stories?language=en" className="news-language-link rounded-full border border-transparent bg-[#f3ece2] px-2.5 py-1.5 text-[#5f5851] transition-colors hover:border-[#a5232f] hover:bg-[#f8e8e8] hover:text-[#7f1822]">EN</Link><Link href="/top-stories?language=si" className="news-language-link rounded-full border border-transparent bg-[#f3ece2] px-2.5 py-1.5 text-[#5f5851] transition-colors hover:border-[#a5232f] hover:bg-[#f8e8e8] hover:text-[#7f1822]">සිං</Link><Link href="/top-stories?language=ta" className="news-language-link rounded-full border border-transparent bg-[#f3ece2] px-2.5 py-1.5 text-[#5f5851] transition-colors hover:border-[#a5232f] hover:bg-[#f8e8e8] hover:text-[#7f1822]">தமிழ்</Link></div></div></div>
  </header>;
}
