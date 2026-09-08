import Link from "next/link";

const metrics = [
  ["Articles collected", "1,284"], ["Published", "748"], ["Duplicates", "394"], ["Review required", "130"], ["Active sources", "24"], ["Healthy sources", "22"]
];

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">Admin prototype</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-4xl font-black">Content operations</h1><p className="mt-3 text-gray-600">Monitor ingestion, review content and control automatic sources.</p></div>
        <Link href="/admin/sources" className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-bold text-white">Manage sources</Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([label,value]) => <div key={label} className="rounded-2xl border border-[var(--border)] bg-white p-6"><div className="text-3xl font-black">{value}</div><div className="mt-2 text-gray-600">{label}</div></div>)}
      </div>
      <div className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6"><h2 className="text-xl font-bold">Ingestion pipeline</h2><p className="mt-2 text-gray-600">RSS parsing, canonical URL duplicate protection, source-region defaults and health logging are now represented in the backend starter.</p></div>
    </main>
  );
}
