import Link from "next/link";
import { getSiteControl } from "@/lib/data/site-control";
import { getSiteMenu } from "@/lib/data/site-menu";

export async function SiteHeader() {
  const [control, menu] = await Promise.all([getSiteControl(), getSiteMenu("header")]);
  const siteName = String(control.settings.site_name ?? "BridgeNews");
  return <header data-public-header className="sticky top-0 z-50 border-b backdrop-blur">
    <div className="mx-auto flex max-w-[1180px] items-center gap-2.5 px-4 py-3 sm:gap-3 sm:px-5">
      <Link href="/" className="mr-auto flex min-w-0 items-center gap-2.5 sm:gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#a5232f] text-[10px] font-black tracking-[-0.08em] text-[#fffaf3]">BN</span><span className="news-wordmark truncate text-[20px] font-black text-[#1d1b19] sm:text-[22px]">{siteName}</span></Link>
      <form action="/search" method="get" className="hidden md:flex"><input name="q" aria-label="Search news" placeholder="Search news" className="news-search w-44 rounded-full border px-4 py-2 text-xs text-[#1d1b19] outline-none transition xl:w-60" /></form>
      <Link href="/search" aria-label="Search news" className="inline-flex rounded-full border border-[#d8d0c4] bg-[#fffdf8] px-3 py-2 text-xs font-bold text-[#5f5851] transition hover:border-[#a5232f] hover:text-[#a5232f] md:hidden">Search</Link>
      <Link href="/following" className="hidden rounded-full border border-[#d8d0c4] bg-[#fffdf8] px-4 py-2 text-xs font-bold text-[#5f5851] transition hover:border-[#a5232f] hover:text-[#a5232f] sm:inline-flex">Following</Link><Link href="/login" className="news-signin rounded-full px-3.5 py-2 text-xs font-bold transition sm:px-4">Sign in</Link>
    </div>
    <div className="border-t border-[#ebe4da]"><div className="mx-auto flex max-w-[1180px] items-center overflow-x-auto px-4 sm:px-5"><nav className="flex shrink-0 items-center gap-5 py-2.5 text-xs font-bold text-[#6f675f]">{menu.map((item:any)=><Link key={item.id} href={item.href} className="news-nav-link shrink-0 whitespace-nowrap transition">{item.label}</Link>)}</nav><div className="ml-5 flex shrink-0 items-center gap-1 border-l border-[#d8d0c4] pl-5 text-[10px] font-black"><Link href="/top-stories?language=en" className="news-language-link rounded-full bg-[#f3ece2] px-2.5 py-1.5 transition">EN</Link><Link href="/top-stories?language=si" className="news-language-link rounded-full bg-[#f3ece2] px-2.5 py-1.5 transition">සිං</Link><Link href="/top-stories?language=ta" className="news-language-link rounded-full bg-[#f3ece2] px-2.5 py-1.5 transition">தமிழ்</Link></div></div></div>
  </header>;
}
