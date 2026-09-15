import { createClient } from "@supabase/supabase-js";
import { resolvePublisherImage, verifyPublisherImage } from "../_shared/article-image.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return Response.json({ error: "Missing Supabase server secrets" }, { status: 500 });

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: { limit?: number; verifyExisting?: boolean } = {};
  try { body = await req.json(); } catch {}
  const limit = Math.max(1, Math.min(body.limit ?? 50, 100));

  let query = supabase
    .from("articles")
    .select("id,original_url,title,published_at,status,auto_publish_requested,image_url,raw_metadata")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  query = body.verifyExisting
    ? query.eq("status", "published").not("image_url", "is", null)
    : query.in("status", ["review_required", "discovered"]).or("image_url.is.null,image_url.eq.");

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let updated = 0, published = 0, demoted = 0, skipped = 0, failed = 0;

  for (const article of data ?? []) {
    try {
      if (!article.original_url) { skipped++; continue; }

      if (body.verifyExisting && article.image_url) {
        const duplicateCheck = await supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published").eq("image_url", article.image_url);
        const overused = (duplicateCheck.count ?? 0) >= 20;
        const directValid = !overused && await verifyPublisherImage(article.image_url);
        if (directValid) { skipped++; continue; }

        const replacement = await resolvePublisherImage(article.original_url, undefined, [article.image_url]);
        if (!replacement) {
          const result = await supabase.from("articles").update({ image_url: null, status: "review_required", processing_error: "Public image removed: no verified publisher news image available" }).eq("id", article.id);
          if (result.error) { failed++; continue; }
          demoted++;
          continue;
        }
        const result = await supabase.from("articles").update({ image_url: replacement, raw_metadata: { ...(article.raw_metadata ?? {}), image_verified: true, image_pending: false } }).eq("id", article.id);
        if (result.error) { failed++; continue; }
        updated++;
        continue;
      }

      const imageUrl = await resolvePublisherImage(article.original_url, article.image_url);
      if (!imageUrl) { skipped++; continue; }
      const nextStatus = article.auto_publish_requested ? "published" : article.status;
      const result = await supabase.from("articles").update({
        image_url: imageUrl,
        status: nextStatus,
        processing_error: null,
        raw_metadata: { ...(article.raw_metadata ?? {}), image_verified: true, image_pending: false },
      }).eq("id", article.id);
      if (result.error) { failed++; continue; }
      updated++;
      if (nextStatus === "published") published++;
    } catch {
      failed++;
    }
  }

  return Response.json({ scanned: (data ?? []).length, updated, published, demoted, skipped, failed, mode: body.verifyExisting ? "verify-existing" : "recover-missing" });
});
