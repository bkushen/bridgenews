import { NextResponse } from "next/server";
import { createAdminClient, hasSupabaseServerConfig } from "@/lib/supabase/admin";

const EVENTS = new Set(["page_view", "outbound_click", "social_share"]);

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : null;
}

export async function POST(request: Request) {
  if (!hasSupabaseServerConfig()) return NextResponse.json({ ok: false }, { status: 503 });
  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const eventType = clean(body.eventType, 40);
  const path = clean(body.path, 500);
  if (!eventType || !EVENTS.has(eventType) || !path || !path.startsWith("/")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const admin = createAdminClient();
  const metadata = body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata)
    ? JSON.parse(JSON.stringify(body.metadata)).valueOf()
    : {};

  const { error } = await admin.from("traffic_events").insert({
    event_type: eventType,
    path,
    referrer_host: clean(body.referrerHost, 255),
    utm_source: clean(body.utmSource, 120),
    utm_medium: clean(body.utmMedium, 120),
    utm_campaign: clean(body.utmCampaign, 160),
    session_id: clean(body.sessionId, 80),
    metadata,
  });

  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
