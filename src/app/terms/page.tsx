export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Terms</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">Terms of use</h1>
      <div className="mt-8 space-y-6 text-base leading-8 text-gray-700">
        <p>BridgeNews is provided as a news discovery and aggregation service. It does not guarantee that every headline, feed item, publication time or external link is complete, current or error-free.</p>
        <p>Full articles remain with their original publishers. BridgeNews displays limited feed-derived metadata and links readers to the original source. Publisher names, trademarks and third-party content remain the property of their respective owners.</p>
        <p>Users must not misuse the service, attempt to bypass access controls, disrupt ingestion or account systems, or use BridgeNews in a way that violates applicable law or third-party rights.</p>
        <p>External sites are outside BridgeNews's control. Following a publisher link means the destination site's own terms, policies and access rules apply.</p>
      </div>
      <p className="mt-10 text-sm text-gray-500">Last updated: 8 September 2026.</p>
    </main>
  );
}
