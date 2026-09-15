import { NextResponse } from "next/server";
import { createAdminClient, hasSupabaseServerConfig } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!hasSupabaseServerConfig()) return NextResponse.json({ ok: false, error: "Newsletter service unavailable" }, { status: 503 });
  let body: { email?: string; source?: string } = {};
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 }); }

  const email = String(body.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return NextResponse.json({ ok: false, error: "Enter a valid email address" }, { status: 400 });

  const admin = createAdminClient();
  const existing = await admin.from("newsletter_subscribers").select("id,status").ilike("email", email).maybeSingle();
  if (existing.error) return NextResponse.json({ ok: false, error: "Could not subscribe" }, { status: 500 });

  if (existing.data) {
    const update = await admin.from("newsletter_subscribers").update({
      email,
      status: "active",
      unsubscribed_at: null,
      source: String(body.source || "website").slice(0, 80),
      updated_at: new Date().toISOString(),
    }).eq("id", existing.data.id);
    if (update.error) return NextResponse.json({ ok: false, error: "Could not subscribe" }, { status: 500 });
  } else {
    const insert = await admin.from("newsletter_subscribers").insert({
      email,
      source: String(body.source || "website").slice(0, 80),
    });
    if (insert.error) return NextResponse.json({ ok: false, error: "Could not subscribe" }, { status: 500 });
  }

  await admin.from("traffic_events").insert({ event_type: "newsletter_signup", path: "/newsletter", metadata: { source: String(body.source || "website").slice(0, 80) } });
  return NextResponse.json({ ok: true });
}
