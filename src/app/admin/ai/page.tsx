import { createAdminClient, hasSupabaseServerConfig } from "@/lib/supabase/admin";

async function getCounts() {
  if (!hasSupabaseServerConfig()) {
    return {
      processing: 18,
      review_required: 7,
      published: 126,
      failed: 2,
      ai_processed: 133,
      preview: true,
    };
  }

  const supabase = createAdminClient();
  const statuses = ["processing", "review_required", "published", "failed"] as const;
  const counts: Record<string, number> = {};

  for (const status of statuses) {
    const result = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    if (result.error) throw result.error;
    counts[status] = result.count ?? 0;
  }

  const processed = await supabase
    .from("articles")
    .select("id", { count: "exact", head: true })
    .not("ai_processed_at", "is", null);
  if (processed.error) throw processed.error;

  return {
    processing: counts.processing,
    review_required: counts.review_required,
    published: counts.published,
    failed: counts.failed,
    ai_processed: processed.count ?? 0,
    preview: false,
  };
}

export default async function AiOperationsPage() {
  const stats = await getCounts();
  const cards = [
    ["Queued / processing", stats.processing],
    ["AI processed", stats.ai_processed],
    ["Awaiting review", stats.review_required],
    ["Published", stats.published],
    ["Failed", stats.failed],
  ];

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500">AI operations</p>
          <h1 className="mt-2 text-4xl font-black">Enrichment & clustering</h1>
          <p className="mt-3 max-w-3xl text-gray-600">
            Track automatic summaries, region/category/topic classification and semantic story grouping.
          </p>
        </div>
        {stats.preview && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">Preview data</span>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <div className="text-3xl font-black">{value}</div>
            <div className="mt-2 text-sm text-gray-600">{label}</div>
          </div>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-xl font-bold">Current processing order</h2>
        <div className="mt-4 grid gap-3 text-sm text-gray-700 md:grid-cols-5">
          {["1. Summarise", "2. Detect regions", "3. Categorise", "4. Create embedding", "5. Match story cluster"].map((step) => (
            <div key={step} className="rounded-xl bg-gray-50 p-4 font-semibold">{step}</div>
          ))}
        </div>
        <p className="mt-5 text-sm text-gray-600">
          Items from auto-publish sources become public only after enrichment succeeds. Review-first sources remain hidden until approved.
        </p>
      </section>
    </main>
  );
}
