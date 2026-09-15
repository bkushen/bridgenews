import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COOKIE = "bn_seen_articles";
const MAX_SEEN = 24;

function readSeen(request: NextRequest) {
  const raw = request.cookies.get(COOKIE)?.value || "";
  return raw.split(".").filter((value) => UUID_RE.test(value)).slice(-MAX_SEEN);
}

export async function POST(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let articleId = "";
  try {
    const body = (await request.json()) as { articleId?: string };
    articleId = String(body.articleId || "");
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!UUID_RE.test(articleId)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const seen = readSeen(request);
  if (seen.includes(articleId)) {
    return NextResponse.json({ ok: true, counted: false });
  }

  const admin = createAdminClient();
  const { data: article } = await admin.from("articles").select("id").eq("id", articleId).eq("status", "published").maybeSingle();
  if (!article) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const { error } = await admin.rpc("increment_article_view", { target_article_id: articleId });
  if (error) {
    console.error("Article view tracking failed", error.message);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, counted: true });
  const nextSeen = [...seen.filter((id) => id !== articleId), articleId].slice(-MAX_SEEN);
  response.cookies.set(COOKIE, nextSeen.join("."), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return response;
}
