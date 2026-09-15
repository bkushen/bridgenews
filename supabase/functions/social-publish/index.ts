import { createClient } from "@supabase/supabase-js";

type QueueRow = {
  id: string;
  article_id: string;
  platform: string;
  status: string;
  post_text: string | null;
  attempts: number;
  scheduled_for: string | null;
  articles: any;
};

const NETWORK_MAP: Record<string, string> = {
  facebook: "facebook",
  instagram: "instagram",
  x: "twitter",
  threads: "threads",
  linkedin: "linkedin",
};

function articleOf(value: any) {
  return Array.isArray(value) ? value[0] : value;
}

function metricoolDate(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}:${pick("second")}`;
}

function textFor(platform: string, title: string, storyUrl: string) {
  const link = `\n\n${storyUrl}`;
  const limit = platform === "x" ? 270 : platform === "threads" ? 490 : 2800;
  const available = Math.max(40, limit - link.length);
  const clean = title.replace(/\s+/g, " ").trim();
  const headline = clean.length > available ? `${clean.slice(0, Math.max(1, available - 1)).trim()}…` : clean;
  return `${headline}${link}`;
}

async function parseResponse(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text.slice(0, 2000) }; }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return Response.json({ error: "Missing Supabase server secrets" }, { status: 500 });

  const userToken = Deno.env.get("METRICOOL_USER_TOKEN");
  const userId = Deno.env.get("METRICOOL_USER_ID");
  const blogId = Deno.env.get("METRICOOL_BLOG_ID");
  const siteUrl = (Deno.env.get("BRIDGENEWS_SITE_URL") || Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://bridgenews-live-bkushen-5488.vercel.app").replace(/\/$/, "");

  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: config, error: configError } = await supabase
    .from("social_publish_config")
    .select("enabled,platforms,attach_article_image,timezone,max_attempts")
    .eq("id", 1)
    .maybeSingle();

  if (configError) return Response.json({ error: configError.message }, { status: 500 });
  if (!config?.enabled) return Response.json({ enabled: false, processed: 0 });

  if (!userToken || !userId || !blogId) {
    return Response.json({
      enabled: true,
      configured: false,
      processed: 0,
      missing: [!userToken && "METRICOOL_USER_TOKEN", !userId && "METRICOOL_USER_ID", !blogId && "METRICOOL_BLOG_ID"].filter(Boolean),
    });
  }

  let body: { limit?: number } = {};
  try { body = await req.json(); } catch {}
  const limit = Math.max(1, Math.min(Number(body.limit ?? 20), 50));
  const maxAttempts = Math.max(1, Math.min(Number(config.max_attempts ?? 5), 20));
  const enabledPlatforms = new Set<string>((config.platforms ?? []).map((value: string) => value.toLowerCase()));
  const now = new Date();

  const { data, error } = await supabase
    .from("social_post_queue")
    .select("id,article_id,platform,status,post_text,attempts,scheduled_for,articles(id,slug,title,image_url,published_at,status)")
    .in("status", ["queued", "failed"])
    .lt("attempts", maxAttempts)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const candidates = (data ?? []).filter((row: QueueRow) => {
    if (!enabledPlatforms.has(row.platform)) return false;
    if (!row.scheduled_for) return true;
    return new Date(row.scheduled_for).getTime() <= now.getTime();
  }).slice(0, limit);

  let scheduled = 0;
  let failed = 0;
  let skipped = 0;
  const results: Array<Record<string, unknown>> = [];

  for (const row of candidates as QueueRow[]) {
    const article = articleOf(row.articles);
    const network = NETWORK_MAP[row.platform];
    if (!network || !article?.slug || article?.status !== "published") {
      skipped++;
      await supabase.from("social_post_queue").update({
        status: "skipped",
        error_message: network ? "Article is no longer public" : "Platform is not supported by the automatic Metricool worker",
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
      continue;
    }

    const publishAt = new Date(Date.now() + 2 * 60 * 1000);
    const storyUrl = `${siteUrl}/story/${encodeURIComponent(article.slug)}?utm_source=${encodeURIComponent(row.platform)}&utm_medium=organic_social&utm_campaign=auto_news`;
    const postText = textFor(row.platform, row.post_text || article.title || "BridgeNews", storyUrl);
    const requestBody: Record<string, unknown> = {
      publicationDate: {
        dateTime: metricoolDate(publishAt, config.timezone || "Australia/Melbourne"),
        timezone: config.timezone || "Australia/Melbourne",
      },
      text: postText,
      providers: [{ network }],
      autoPublish: true,
      draft: false,
      shortener: false,
    };

    if (config.attach_article_image && article.image_url) {
      requestBody.media = [article.image_url];
      requestBody.saveExternalMediaFiles = true;
    }

    try {
      const response = await fetch(`https://app.metricool.com/api/v2/scheduler/posts?blogId=${encodeURIComponent(blogId)}&userId=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Mc-Auth": userToken,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(20_000),
      });
      const responseBody = await parseResponse(response);
      const attempts = Number(row.attempts ?? 0) + 1;

      if (!response.ok) {
        const delayMinutes = Math.min(60, Math.pow(2, Math.max(0, attempts - 1)) * 2);
        await supabase.from("social_post_queue").update({
          status: "failed",
          attempts,
          last_attempt_at: new Date().toISOString(),
          scheduled_for: new Date(Date.now() + delayMinutes * 60 * 1000).toISOString(),
          error_message: `Metricool ${response.status}: ${JSON.stringify(responseBody).slice(0, 1000)}`,
          provider_response: responseBody,
          updated_at: new Date().toISOString(),
        }).eq("id", row.id);
        failed++;
        results.push({ id: row.id, platform: row.platform, ok: false, status: response.status });
        continue;
      }

      const providerId = String(responseBody?.id ?? responseBody?.postId ?? responseBody?.data?.id ?? "") || null;
      await supabase.from("social_post_queue").update({
        status: "scheduled",
        post_text: postText,
        attempts,
        last_attempt_at: new Date().toISOString(),
        scheduled_for: publishAt.toISOString(),
        provider_post_id: providerId,
        provider_response: responseBody,
        error_message: null,
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
      scheduled++;
      results.push({ id: row.id, platform: row.platform, ok: true, providerId });
    } catch (cause) {
      const attempts = Number(row.attempts ?? 0) + 1;
      const message = cause instanceof Error ? cause.message : String(cause);
      const delayMinutes = Math.min(60, Math.pow(2, Math.max(0, attempts - 1)) * 2);
      await supabase.from("social_post_queue").update({
        status: "failed",
        attempts,
        last_attempt_at: new Date().toISOString(),
        scheduled_for: new Date(Date.now() + delayMinutes * 60 * 1000).toISOString(),
        error_message: message.slice(0, 1000),
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
      failed++;
      results.push({ id: row.id, platform: row.platform, ok: false, error: message.slice(0, 300) });
    }
  }

  return Response.json({
    enabled: true,
    configured: true,
    scanned: candidates.length,
    scheduled,
    failed,
    skipped,
    results,
  });
});
