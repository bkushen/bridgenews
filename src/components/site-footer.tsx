import Link from "next/link";
import { getSiteMenu } from "@/lib/data/site-menu";
import { NewsletterSignup } from "@/components/newsletter-signup";

export async function SiteFooter({ siteName = "BridgeNews" }: { siteName?: string }) {
  const menu = await getSiteMenu("footer");
  return <footer data-public-footer className="mt-16 border-t">
    <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-12 lg:grid-cols-[1.1fr_.8fr_1.1fr]">
      <div><Link href="/" className="inline-flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#a5232f] text-[10px] font-black tracking-[-0.08em] text-[#fffaf3]">BN</span><span className="font-serif text-xl font-black tracking-tight">{siteName}</span></Link><p className="news-footer-muted mt-4 max-w-lg text-sm leading-7">Fast, source-attributed news discovery across Sri Lanka, Australia and the world. {siteName} sends readers to original publishers and does not republish full copyrighted articles.</p><div className="mt-5 flex flex-wrap gap-3 text-sm font-bold"><Link href="/brief" className="news-footer-link">Daily Brief</Link><Link href="/latest" className="news-footer-link">Latest</Link><Link href="/trending" className="news-footer-link">Trending</Link></div></div>
      <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#9f9488]">Explore</p><div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold text-[#ddd4c9]">{menu.map((item:any)=><Link key={item.id} href={item.href} className="news-footer-link transition">{item.label}</Link>)}</div></div>
      <NewsletterSignup source="footer" />
    </div>
    <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-[#a99f94]">© {new Date().getFullYear()} {siteName}. Publisher names, headlines and linked content remain the property of their respective owners.</div>
  </footer>;
}
