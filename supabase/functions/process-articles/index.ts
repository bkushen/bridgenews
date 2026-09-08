import { createClient } from "@supabase/supabase-js";

type Article = {
  id: string;
  source_id: string;
  title: string;
  description: string | null;
  language_code: string;
  auto_publish_requested: boolean;
};

type Classification = {
  summary: string;
  language: string;
  regions: Array<{ code: "sri_lanka" | "australia" | "international"; confidence: number }>;
  category: {
    slug: "news" | "politics" | "business" | "technology" | "education" | "sport" | "entertainment" | "health" | "science" | "lifestyle" | "jobs-careers" | "migration";
    confidence: number;
  };
  topics: Array<{ name: string; confidence: number }>;
  sentiment: "positive" | "neutral" | "negative";
  cluster_headline: string;
};

const OPENAI_URL = "https://api.openai.com/v1";
const REGION_CODES = new Set(["sri_lanka", "australia", "international"]);
const CATEGORY_SLUGS = new Set([
  "news", "politics", "business", "technology", "education", "sport",
  "entertainment", "health", "science", "lifestyle", "jobs-careers", "migration",
]);

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "topic";
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function parseResponseText(payload: Record<string, unknown>): string {
  if (typeof payload.output_text === "string") return payload.output_text;
  const output = payload.output;
  if (!Array.isArray(output)) throw new Error("OpenAI response contained no output");
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") return text;
    }
  }
  throw new Error("OpenAI response contained no text output");
}

async function openaiJson(apiKey: string, article: Article): Promise<{ value: Classification; model: string }> {
  const model = Deno.env.get("OPENAI_CLASSIFICATION_MODEL") || "gpt-5-mini";
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["summary", "language", "regions", "category", "topics", "sentiment", "cluster_headline"],
    properties: {
      summary: { type: "string", minLength: 1, maxLength: 700 },
      language: { type: "string", minLength: 2, maxLength: 20 },
      regions: {
        type: "array", minItems: 1, maxItems: 3,
        items: {
          type: "object", additionalProperties: false,
          required: ["code", "confidence"],
          properties: {
            code: { type: "string", enum: ["sri_lanka", "australia", "international"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
        },
      },
      category: {
        type: "object", additionalProperties: false,
        required: ["slug", "confidence"],
        properties: {
          slug: { type: "string", enum: [...CATEGORY_SLUGS] },
          confidence: { type: "number", minimum: 0, maximum: 1 },
        },
      },
      topics: {
        type: "array", maxItems: 8,
        items: {
          type: "object", additionalProperties: false,
          required: ["name", "confidence"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 80 },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
        },
      },
      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
      cluster_headline: { type: "string", minLength: 5, maxLength: 180 },
    },
  };

  const input = [
    "Classify this external news/feed item for a Sri Lanka + Australia + International news discovery service.",
    "Use only the supplied title and feed description; do not invent facts.",
    "Region rules: choose Sri Lanka and/or Australia when materially relevant. Use international when it is primarily world news or has material international relevance. Multi-region is allowed.",
    "Summary: neutral, concise, factual, about 2-3 sentences. Do not copy long phrases from the description.",
    "Topics: concise named entities or durable subjects, not generic filler.",
    "Cluster headline: a neutral canonical headline useful for grouping different publishers reporting the same event.",
    `Title: ${article.title}`,
    `Feed description: ${article.description || "(none provided)"}`,
  ].join("\n\n");

  const response = await fetch(`${OPENAI_URL}/responses`, {
    method: "POST",
    headers: { "authorization": `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      input,
      text: {
        format: {
          type: "json_schema",
          name: "news_classification",
          strict: true,
          schema,
        },
      },
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) throw new Error(`OpenAI classification HTTP ${response.status}: ${(await response.text()).slice(0, 800)}`);
  const payload = await response.json() as Record<string, unknown>;
  const value = JSON.parse(parseResponseText(payload)) as Classification;
  return { value, model };
}

async function embed(apiKey: string, text: string): Promise<number[]> {
  const model = Deno.env.get("OPENAI_EMBEDDING_MODEL") || "text-embedding-3-small";
  const response = await fetch(`${OPENAI_URL}/embeddings`, {
    method: "POST",
    headers: { "authorization": `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model, input: text, dimensions: 1536, encoding_format: "float" }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`OpenAI embedding HTTP ${response.status}: ${(await response.text()).slice(0, 800)}`);
  const payload = await response.json() as { data?: Array<{ embedding?: number[] }> };
  const embedding = payload.data?.[0]?.embedding;
  if (!embedding || embedding.length !== 1536) throw new Error("Embedding response was missing the expected 1536 dimensions");
  return embedding;
}

async function applyRegions(supabase: ReturnType<typeof createClient>, articleId: string, regions: Classification["regions"]) {
  const normalized = regions
    .filter((r) => REGION_CODES.has(r.code) && clamp01(r.confidence) >= 0.35)
    .map((r) => ({ ...r, confidence: clamp01(r.confidence) }));
  if (!normalized.length) normalized.push({ code: "international", confidence: 0.5 });

  const codes = [...new Set(normalized.map((r) => r.code))];
  const { data: dbRegions, error } = await supabase.from("regions").select("id,code").in("code", codes);
  if (error) throw error;
  await supabase.from("article_regions").delete().eq("article_id", articleId);
  const rows = (dbRegions ?? []).map((region) => {
    const found = normalized.find((x) => x.code === region.code)!;
    return { article_id: articleId, region_id: region.id, confidence: found.confidence };
  });
  if (rows.length) {
    const inserted = await supabase.from("article_regions").insert(rows);
    if (inserted.error) throw inserted.error;
  }
}

async function applyCategory(supabase: ReturnType<typeof createClient>, articleId: string, category: Classification["category"]) {
  const slug = CATEGORY_SLUGS.has(category.slug) ? category.slug : "news";
  const { data, error } = await supabase.from("categories").select("id").eq("slug", slug).single();
  if (error) throw error;
  await supabase.from("article_categories").delete().eq("article_id", articleId);
  const inserted = await supabase.from("article_categories").insert({
    article_id: articleId,
    category_id: data.id,
    confidence: clamp01(category.confidence),
  });
  if (inserted.error) throw inserted.error;
}

async function applyTopics(supabase: ReturnType<typeof createClient>, articleId: string, topics: Classification["topics"]) {
  await supabase.from("article_topics").delete().eq("article_id", articleId);
  const cleaned = topics
    .map((t) => ({ name: t.name.trim().replace(/\s+/g, " ").slice(0, 80), confidence: clamp01(t.confidence) }))
    .filter((t) => t.name.length >= 2 && t.confidence >= 0.35)
    .slice(0, 8);

  for (const topic of cleaned) {
    const slug = slugify(topic.name);
    const upsert = await supabase
      .from("topics")
      .upsert({ name: topic.name, slug }, { onConflict: "slug", ignoreDuplicates: true });
    if (upsert.error) throw upsert.error;

    const found = await supabase.from("topics").select("id").eq("slug", slug).single();
    if (found.error) throw found.error;
    const link = await supabase.from("article_topics").insert({
      article_id: articleId,
      topic_id: found.data.id,
      confidence: topic.confidence,
    });
    if (link.error && link.error.code !== "23505") throw link.error;
  }
}

async function assignCluster(
  supabase: ReturnType<typeof createClient>,
  article: Article,
  classification: Classification,
  vector: number[],
): Promise<string> {
  const threshold = Number(Deno.env.get("STORY_CLUSTER_THRESHOLD") || "0.86");
  const match = await supabase.rpc("match_story_clusters", {
    query_embedding: vector,
    match_threshold: threshold,
    max_age_hours: 120,
    match_count: 3,
  });
  if (match.error) throw match.error;

  const existing = match.data?.[0];
  if (existing?.id) {
    const count = await supabase.from("articles").select("id", { count: "exact", head: true }).eq("story_cluster_id", existing.id);
    const nextCount = (count.count ?? 0) + 1;
    const update = await supabase.from("story_clusters").update({
      last_updated_at: new Date().toISOString(),
      article_count: nextCount,
    }).eq("id", existing.id);
    if (update.error) throw update.error;
    return existing.id as string;
  }

  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${classification.cluster_headline}\n${article.id}`));
  const suffix = [...new Uint8Array(hash)].slice(0, 5).map((b) => b.toString(16).padStart(2, "0")).join("");
  const inserted = await supabase.from("story_clusters").insert({
    headline: classification.cluster_headline,
    slug: `${slugify(classification.cluster_headline)}-${suffix}`,
    summary: classification.summary,
    article_count: 1,
    embedding: vector,
  }).select("id").single();
  if (inserted.error) throw inserted.error;
  return inserted.data.id;
}

async function processOne(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  article: Article,
) {
  const claimed = await supabase
    .from("articles")
    .update({ status: "processing", processing_error: null })
    .eq("id", article.id)
    .is("ai_processed_at", null)
    .select("id")
    .maybeSingle();
  if (claimed.error) throw claimed.error;
  if (!claimed.data) return { articleId: article.id, skipped: true };

  try {
    const { value, model } = await openaiJson(apiKey, article);
    const vectorText = `${value.cluster_headline}\n${value.summary}\n${article.title}`.slice(0, 6000);
    const vector = await embed(apiKey, vectorText);

    await applyRegions(supabase, article.id, value.regions);
    await applyCategory(supabase, article.id, value.category);
    await applyTopics(supabase, article.id, value.topics);
    const clusterId = await assignCluster(supabase, article, value, vector);

    const status = article.auto_publish_requested ? "published" : "review_required";
    const updated = await supabase.from("articles").update({
      story_cluster_id: clusterId,
      ai_summary: value.summary,
      language_code: value.language || article.language_code || "en",
      sentiment: value.sentiment,
      status,
      embedding: vector,
      ai_classification: value,
      ai_model: model,
      ai_processed_at: new Date().toISOString(),
      processing_error: null,
    }).eq("id", article.id);
    if (updated.error) throw updated.error;

    return { articleId: article.id, status, clusterId };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase.from("articles").update({
      status: "failed",
      processing_error: message.slice(0, 2000),
    }).eq("id", article.id);
    throw error;
  }
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!supabaseUrl || !serviceRole) return Response.json({ error: "Missing Supabase server secrets" }, { status: 500 });
    if (!apiKey) return Response.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

    const cronSecret = Deno.env.get("PROCESS_CRON_SECRET");
    if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { articleId?: string; limit?: number } = {};
    try { body = await req.json(); } catch { /* queue mode */ }
    const limit = Math.min(Math.max(Number(body.limit || 10), 1), 25);

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let query = supabase
      .from("articles")
      .select("id,source_id,title,description,language_code,auto_publish_requested")
      .is("ai_processed_at", null)
      .in("status", ["processing", "discovered", "review_required"])
      .order("discovered_at", { ascending: true })
      .limit(limit);
    if (body.articleId) query = query.eq("id", body.articleId).limit(1);

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const results = [];
    for (const article of (data ?? []) as Article[]) {
      try {
        results.push(await processOne(supabase, apiKey, article));
      } catch (error) {
        results.push({ articleId: article.id, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return Response.json({ processed: results.length, results });
  },
};
