import Link from "next/link";

type TickerItem = {
  key: string;
  title: string;
  href: string;
};

export function LiveNewsTicker({ items }: { items: TickerItem[] }) {
  if (!items.length) return null;

  const repeated = [...items, ...items];

  return (
    <section className="live-ticker mt-3 overflow-hidden rounded-2xl border border-red-200 bg-red-50" aria-label="Live news ticker">
      <div className="flex items-stretch">
        <div className="relative z-10 shrink-0 bg-red-600 px-4 py-3 text-[11px] font-black uppercase tracking-[0.15em] text-white">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
          Live
        </div>
        <div className="live-ticker-window min-w-0 flex-1 overflow-hidden">
          <div className="live-ticker-track flex w-max items-center py-3 text-sm font-bold text-gray-900">
            {repeated.map((item, index) => (
              <Link
                key={`${item.key}-${index}`}
                href={item.href}
                className="live-ticker-item shrink-0 whitespace-nowrap hover:underline"
              >
                {item.title}
                <span className="mx-5 text-red-500" aria-hidden="true">●</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
