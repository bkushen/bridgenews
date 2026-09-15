import { createClient } from "@supabase/supabase-js";
import { resolvePublisherImage, verifyPublisherImage } from "../_shared/article-image.ts";

type RequestBody = {
  limit?: number;
  verifyExisting?: boolean;
  sourceId?: string;
  articleId?: string;
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return Response.json({ error: "Missing Supabase server secrets" }, { status: 500 });

  const supabase = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  let body: RequestBody = {};
  try { body = await req.json(); } catch {}
  const limit = Math.max(1, Math.min(body.limit ?? 50, 100));

  let query = supabase
    .from("articles")
    .select("id,source_id,original_url,title,published_at,discovered_at,status,auto_publish_requested,image_url,raw_metadata,image_recovery_attempts,image_recovery_attempted_at,image_recovery_last_error")
    .limit(limit);

  if (body.verifyExisting) {
    query = query
      .eq("status", "published")
      .not("image_url", "is", null)
      .order("published_at", { ascending: false, nullsFirst: false });
  } else {
    query = query
      .in("status", ["review_required", "discovered"])
      .or("image_url.is.null,image_url.eq.")
      .order("image_recovery_attempted_at", { ascending: true, nullsFirst: true })
      .order("discovered_at", { ascending: false, nullsFirst: false });
  }

  if (body.sourceId) query = query.eq("source_id", body.sourceId);
  if (body.articleId) query = query.eq("id", body.articleId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let updated = 0, published = 0, demoted = 0, skipped = 0, failed = 0;

  for (const article of data ?? []) {
    try {
      if (!body.verifyExisting) {
        const attemptUpdate = await supabase.from("articles").update({
          image_recovery_attempts: Number(article.image_recovery_attempts ?? 0) + 1,
          image_recovery_attempted_at: new Date().toISOString(),
          image_recovery_last_error: null,
        }).eq("id", article.id);
        if (attemptUpdate.error) { failed++; continue; }
      }

      if (!article.original_url) {
        skipped++;
        if (!body.verifyExisting) {
          await supabase.from("articles").update({ image_recovery_last_error: "Missing original article URL" }).eq("id", article.id);
        }
        continue;
      }

      if (body.verifyExisting && article.image_url) {
        const duplicateCheck = await supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("status", "published")
          .eq("image_url", article.image_url);
        const overused = (duplicateCheck.count ?? 0) >= 20;
        const directValid = !overused && await verifyPublisherImage(article.image_url);
        if (directValid) { skipped++; continue; }

        const replacement = await resolvePublisherImage(article.original_url, undefined, [article.image_url]);
        if (!replacement) {
          const result = await supabase.from("articles").update({
            image_url: null,
            status: "review_required",
            processing_error: "Public image removed: no verified publisher news image available",
            image_recovery_attempted_at: null,
            image_recovery_last_error: "Existing public image failed verification",
          }).eq("id", article.id);
          if (result.error) { failed++; continue; }
          demoted++;
          continue;
        }
        const result = await supabase.from("articles").update({
          image_url: replacement,
          raw_metadata: { ...(article.raw_metadata ?? {}), image_verified: true, image_pending: false },
        }).eq("id", article.id);
        if (result.error) { failed++; continue; }
        updated++;
        continue;
      }

      const imageUrl = await resolvePublisherImage(article.original_url, article.image_url);
      if (!imageUrl) {
        skipped++;
        await supabase.from("articles").update({ image_recovery_last_error: "No verified publisher image found" }).eq("id", article.id);
        continue;
      }

      const nextStatus = article.auto_publish_requested ? "published" : article.status;
      const result = await supabase.from("articles").update({
        image_url: imageUrl,
        status: nextStatus,
        processing_error: null,
        image_recovery_last_error: null,
        raw_metadata: { ...(article.raw_metadata ?? {}), image_verified: true, image_pending: false },
      }).eq("id", article.id);
      if (result.error) { failed++; continue; }
      updated++;
      if (nextStatus === "published") published++;
    } catch (error) {
      failed++;
      if (!body.verifyExisting) {
        const message = error instanceof Error ? error.message : String(error);
        await supabase.from("articles").update({ image_recovery_last_error: message.slice(0, 500) }).eq("id", article.id);
      }
    }
  }

  return Response.json({
    scanned: (data ?? []).length,
    updated,
    published,
    demoted,
    skipped,
    failed,
    mode: body.verifyExisting ? "verify-existing" : "recover-missing",
    sourceId: body.sourceId ?? null,
    articleId: body.articleId ?? null,
  });
});
