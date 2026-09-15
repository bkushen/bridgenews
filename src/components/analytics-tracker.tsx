"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function sessionId() {
  const key = "bn_session_id";
  try {
    let value = sessionStorage.getItem(key);
    if (!value) {
      value = crypto.randomUUID();
      sessionStorage.setItem(key, value);
    }
    return value;
  } catch {
    return undefined;
  }
}

function referrerHost() {
  try { return document.referrer ? new URL(document.referrer).hostname : undefined; } catch { return undefined; }
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true });
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    send({
      eventType: "page_view",
      path: pathname,
      referrerHost: referrerHost(),
      sessionId: sessionId(),
      utmSource: searchParams.get("utm_source") || undefined,
      utmMedium: searchParams.get("utm_medium") || undefined,
      utmCampaign: searchParams.get("utm_campaign") || undefined,
    });
  }, [pathname, searchParams]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement | null)?.closest("a") as HTMLAnchorElement | null;
      if (!link?.href) return;
      try {
        const url = new URL(link.href);
        if (url.origin === location.origin) return;
        send({
          eventType: "outbound_click",
          path: location.pathname,
          sessionId: sessionId(),
          metadata: { targetHost: url.hostname, targetPath: url.pathname.slice(0, 300) },
        });
      } catch {}
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true } as AddEventListenerOptions);
  }, []);

  return null;
}
