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

type PublishResult = { providerId?: string | null; externalUrl?: string | null; response?: unknown };

function articleOf(value: any) { return Array.isArray(value) ? value[0] : value; }

async function parseResponse(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { return { raw: text.slice(0, 2000) }; }
}

function textFor(platform: string, title: string, storyUrl: string) {
  const link = `\n\n${storyUrl}`;
  const limit = platform === "x" ? 270 : platform === "threads" ? 490 : platform === "instagram" ? 2100 : 2800;
  const available = Math.max(40, limit - link.length);
  const clean = title.replace(/\s+/g, " ").trim();
  const headline = clean.length > available ? `${clean.slice(0, Math.max(1, available - 1)).trim()}…` : clean;
  return `${headline}${link}`;
}

function requireEnv(names: string[]) {
  const missing = names.filter((name) => !Deno.env.get(name));
  if (missing.length) throw new Error(`Missing social secrets: ${missing.join(", ")}`);
}

async function fetchImage(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`Image fetch failed (${response.status})`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (!bytes.length) throw new Error("Image fetch returned an empty body");
  return { bytes, contentType };
}

async function publishFacebook(text: string, imageUrl: string | null): Promise<PublishResult> {
  requireEnv(["FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN"]);
  const pageId = Deno.env.get("FACEBOOK_PAGE_ID")!;
  const token = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN")!;
  const version = Deno.env.get("META_GRAPH_VERSION") || "v24.0";
  const base = `https://graph.facebook.com/${version}/${encodeURIComponent(pageId)}`;
  const params = new URLSearchParams({ access_token: token });
  let endpoint = `${base}/feed`;
  if (imageUrl) {
    endpoint = `${base}/photos`;
    params.set("url", imageUrl);
    params.set("caption", text);
    params.set("published", "true");
  } else {
    params.set("message", text);
  }
  const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: params, signal: AbortSignal.timeout(25_000) });
  const body = await parseResponse(response);
  if (!response.ok) throw new Error(`Facebook ${response.status}: ${JSON.stringify(body).slice(0, 700)}`);
  const id = String(body?.post_id ?? body?.id ?? "") || null;
  return { providerId: id, response: body };
}

async function publishInstagram(text: string, imageUrl: string): Promise<PublishResult> {
  requireEnv(["INSTAGRAM_ACCOUNT_ID", "META_PAGE_ACCESS_TOKEN"]);
  const accountId = Deno.env.get("INSTAGRAM_ACCOUNT_ID")!;
  const token = Deno.env.get("META_PAGE_ACCESS_TOKEN")!;
  const version = Deno.env.get("META_GRAPH_VERSION") || "v24.0";
  const create = new URLSearchParams({ image_url: imageUrl, caption: text, access_token: token });
  const createResponse = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(accountId)}/media`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: create, signal: AbortSignal.timeout(25_000) });
  const createBody = await parseResponse(createResponse);
  if (!createResponse.ok || !createBody?.id) throw new Error(`Instagram container ${createResponse.status}: ${JSON.stringify(createBody).slice(0, 700)}`);
  const publish = new URLSearchParams({ creation_id: String(createBody.id), access_token: token });
  const publishResponse = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(accountId)}/media_publish`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: publish, signal: AbortSignal.timeout(25_000) });
  const publishBody = await parseResponse(publishResponse);
  if (!publishResponse.ok) throw new Error(`Instagram publish ${publishResponse.status}: ${JSON.stringify(publishBody).slice(0, 700)}`);
  return { providerId: String(publishBody?.id ?? "") || null, response: { container: createBody, publish: publishBody } };
}

async function publishThreads(text: string, imageUrl: string | null): Promise<PublishResult> {
  requireEnv(["THREADS_USER_ID", "THREADS_ACCESS_TOKEN"]);
  const userId = Deno.env.get("THREADS_USER_ID")!;
  const token = Deno.env.get("THREADS_ACCESS_TOKEN")!;
  const base = (Deno.env.get("THREADS_API_BASE") || "https://graph.threads.net/v1.0").replace(/\/$/, "");
  const create = new URLSearchParams({ access_token: token, text, media_type: imageUrl ? "IMAGE" : "TEXT" });
  if (imageUrl) create.set("image_url", imageUrl);
  const createResponse = await fetch(`${base}/${encodeURIComponent(userId)}/threads`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: create, signal: AbortSignal.timeout(25_000) });
  const createBody = await parseResponse(createResponse);
  if (!createResponse.ok || !createBody?.id) throw new Error(`Threads container ${createResponse.status}: ${JSON.stringify(createBody).slice(0, 700)}`);
  const publish = new URLSearchParams({ access_token: token, creation_id: String(createBody.id) });
  const publishResponse = await fetch(`${base}/${encodeURIComponent(userId)}/threads_publish`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: publish, signal: AbortSignal.timeout(25_000) });
  const publishBody = await parseResponse(publishResponse);
  if (!publishResponse.ok) throw new Error(`Threads publish ${publishResponse.status}: ${JSON.stringify(publishBody).slice(0, 700)}`);
  return { providerId: String(publishBody?.id ?? "") || null, response: { container: createBody, publish: publishBody } };
}

async function publishX(text: string, imageUrl: string | null): Promise<PublishResult> {
  requireEnv(["X_USER_ACCESS_TOKEN"]);
  const token = Deno.env.get("X_USER_ACCESS_TOKEN")!;
  let mediaId: string | null = null;
  let mediaResponse: unknown = null;
  if (imageUrl) {
    const image = await fetchImage(imageUrl);
    const base64 = btoa(String.fromCharCode(...image.bytes));
    const uploadResponse = await fetch("https://api.x.com/2/media/upload", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ media: base64, media_category: "tweet_image", media_type: image.contentType.split(";")[0] || "image/jpeg", shared: false }),
      signal: AbortSignal.timeout(30_000),
    });
    mediaResponse = await parseResponse(uploadResponse);
    if (!uploadResponse.ok) throw new Error(`X media ${uploadResponse.status}: ${JSON.stringify(mediaResponse).slice(0, 700)}`);
    mediaId = String((mediaResponse as any)?.data?.id ?? "") || null;
  }
  const payload: Record<string, unknown> = { text };
  if (mediaId) payload.media = { media_ids: [mediaId] };
  const response = await fetch("https://api.x.com/2/tweets", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify(payload), signal: AbortSignal.timeout(25_000) });
  const body = await parseResponse(response);
  if (!response.ok) throw new Error(`X ${response.status}: ${JSON.stringify(body).slice(0, 700)}`);
  const id = String(body?.data?.id ?? "") || null;
  return { providerId: id, externalUrl: id ? `https://x.com/i/web/status/${id}` : null, response: { media: mediaResponse, post: body } };
}

async function publishLinkedIn(text: string, imageUrl: string | null): Promise<PublishResult> {
  requireEnv(["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_ORGANIZATION_ID"]);
  const token = Deno.env.get("LINKEDIN_ACCESS_TOKEN")!;
  const organizationId = Deno.env.get("LINKEDIN_ORGANIZATION_ID")!;
  const version = Deno.env.get("LINKEDIN_VERSION") || "202609";
  const author = `urn:li:organization:${organizationId}`;
  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json", "Linkedin-Version": version, "X-Restli-Protocol-Version": "2.0.0" };
  let imageUrn: string | null = null;
  let uploadInfo: unknown = null;
  if (imageUrl) {
    const initResponse = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", { method: "POST", headers, body: JSON.stringify({ initializeUploadRequest: { owner: author } }), signal: AbortSignal.timeout(25_000) });
    const initBody = await parseResponse(initResponse);
    if (!initResponse.ok || !initBody?.value?.uploadUrl || !initBody?.value?.image) throw new Error(`LinkedIn image init ${initResponse.status}: ${JSON.stringify(initBody).slice(0, 700)}`);
    const image = await fetchImage(imageUrl);
    const uploadResponse = await fetch(String(initBody.value.uploadUrl), { method: "PUT", headers: { authorization: `Bearer ${token}`, "content-type": image.contentType }, body: image.bytes, signal: AbortSignal.timeout(30_000) });
    if (!uploadResponse.ok) throw new Error(`LinkedIn image upload ${uploadResponse.status}`);
    imageUrn = String(initBody.value.image);
    uploadInfo = initBody;
  }
  const payload: Record<string, unknown> = {
    author,
    commentary: text,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
  if (imageUrn) payload.content = { media: { title: "BridgeNews", id: imageUrn } };
  const response = await fetch("https://api.linkedin.com/rest/posts", { method: "POST", headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(25_000) });
  const body = await parseResponse(response);
  if (!response.ok) throw new Error(`LinkedIn ${response.status}: ${JSON.stringify(body).slice(0, 700)}`);
  const id = response.headers.get("x-restli-id") || String(body?.id ?? "") || null;
  return { providerId: id, response: { image: uploadInfo, post: body } };
}

async function publish(platform: string, text: string, imageUrl: string | null): Promise<PublishResult> {
  if (platform === "facebook") return publishFacebook(text, imageUrl);
  if (platform === "instagram") {
    if (!imageUrl) throw new Error("Instagram requires an article image");
    return publishInstagram(text, imageUrl);
  }
  if (platform === "threads") return publishThreads(text, imageUrl);
  if (platform === "x") return publishX(text, imageUrl);
  if (platform === "linkedin") return publishLinkedIn(text, imageUrl);
  throw new Error(`Unsupported direct platform: ${platform}`);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return Response.json({ error: "Missing Supabase server secrets" }, { status: 500 });
  const siteUrl = (Deno.env.get("BRIDGENEWS_SITE_URL") || Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://bridgenews-live-bkushen-5488.vercel.app").replace(/\/$/, "");
  const supabase = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: config, error: configError } = await supabase.from("social_publish_config").select("enabled,platforms,attach_article_image,max_attempts").eq("id", 1).maybeSingle();
  if (configError) return Response.json({ error: configError.message }, { status: 500 });
  if (!config?.enabled) return Response.json({ enabled: false, processed: 0 });
  let body: { limit?: number; platform?: string } = {};
  try { body = await req.json(); } catch {}
  const limit = Math.max(1, Math.min(Number(body.limit ?? 20), 50));
  const maxAttempts = Math.max(1, Math.min(Number(config.max_attempts ?? 5), 20));
  const enabledPlatforms = new Set<string>((config.platforms ?? []).map((value: string) => value.toLowerCase()));
  const now = Date.now();
  const { data, error } = await supabase.from("social_post_queue").select("id,article_id,platform,status,post_text,attempts,scheduled_for,articles(id,slug,title,image_url,published_at,status)").in("status", ["queued", "failed"]).lt("attempts", maxAttempts).order("created_at", { ascending: true }).limit(300);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const candidates = (data ?? []).filter((row: QueueRow) => enabledPlatforms.has(row.platform) && (!body.platform || body.platform === row.platform) && (!row.scheduled_for || new Date(row.scheduled_for).getTime() <= now)).slice(0, limit);
  let published = 0, failed = 0, skipped = 0;
  const results: Array<Record<string, unknown>> = [];
  for (const row of candidates as QueueRow[]) {
    const article = articleOf(row.articles);
    if (!article?.slug || article?.status !== "published") {
      skipped++;
      await supabase.from("social_post_queue").update({ status: "skipped", error_message: "Article is no longer public", updated_at: new Date().toISOString() }).eq("id", row.id);
      continue;
    }
    const storyUrl = `${siteUrl}/story/${encodeURIComponent(article.slug)}?utm_source=${encodeURIComponent(row.platform)}&utm_medium=organic_social&utm_campaign=auto_news`;
    const postText = textFor(row.platform, row.post_text || article.title || "BridgeNews", storyUrl);
    const imageUrl = config.attach_article_image ? (article.image_url || null) : null;
    const attempts = Number(row.attempts ?? 0) + 1;
    try {
      const result = await publish(row.platform, postText, imageUrl);
      await supabase.from("social_post_queue").update({ status: "published", post_text: postText, attempts, last_attempt_at: new Date().toISOString(), published_at: new Date().toISOString(), provider_post_id: result.providerId ?? null, provider_response: result.response ?? {}, external_url: result.externalUrl ?? null, error_message: null, updated_at: new Date().toISOString() }).eq("id", row.id);
      published++;
      results.push({ id: row.id, platform: row.platform, ok: true, providerId: result.providerId ?? null });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const delayMinutes = Math.min(120, Math.pow(2, Math.max(0, attempts - 1)) * 2);
      await supabase.from("social_post_queue").update({ status: "failed", attempts, last_attempt_at: new Date().toISOString(), scheduled_for: new Date(Date.now() + delayMinutes * 60 * 1000).toISOString(), error_message: message.slice(0, 1000), provider_response: { error: message.slice(0, 1000) }, updated_at: new Date().toISOString() }).eq("id", row.id);
      failed++;
      results.push({ id: row.id, platform: row.platform, ok: false, error: message.slice(0, 300) });
    }
  }
  return Response.json({ enabled: true, configured: true, scanned: candidates.length, published, failed, skipped, results });
});
