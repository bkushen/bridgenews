import type { PublicSource } from "@/lib/data/sources";

function sourceIcon(source: PublicSource) {
  if (source.logoUrl) return source.logoUrl;
  if (!source.websiteUrl) return null;
  try {
    const url = new URL(source.websiteUrl);
    return `${url.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

function SourceCard({ source }: { source: PublicSource }) {
  const icon = sourceIcon(source);
  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white text-xs font-black text-gray-500">
        {icon ? <img src={icon} alt="" className="h-full w-full object-contain p-1" /> : source.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black text-gray-900">{source.name}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{source.languageCode}</p>
      </div>
    </>
  );

  const className = "flex min-w-[180px] items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 transition hover:-translate-y-0.5 hover:border-gray-400 hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900";

  if (!source.websiteUrl) return <div className={className}>{content}</div>;

  return (
    <a href={source.websiteUrl} target="_blank" rel="noopener noreferrer" className={className} aria-label={`Open ${source.name}`}>
      {content}
    </a>
  );
}

export function SourceRail({ sources }: { sources: PublicSource[] }) {
  if (!sources.length) return null;
  const loop = [...sources, ...sources];

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">Publishers</p>
          <p className="text-sm font-black">Live sources</p>
        </div>
        <p className="text-[10px] font-semibold text-gray-400">Click a source to open publisher</p>
      </div>
      <div className="source-rail-mask overflow-hidden py-4">
        <div className="source-rail-track flex w-max gap-3 px-4">
          {loop.map((source, index) => <SourceCard key={`${source.id}-${index}`} source={source} />)}
        </div>
      </div>
    </section>
  );
}
