export type SourceHealthInfo = {
  title: string;
  message: string;
  recommendation: string;
  severity: "warning" | "error";
};

export function getSourceHealthInfo(errorMessage?: string | null, consecutiveFailures = 0): SourceHealthInfo | null {
  const raw = String(errorMessage ?? "").trim();
  if (!raw && consecutiveFailures <= 0) return null;

  const lower = raw.toLowerCase();

  if (lower.includes("http 403")) {
    return {
      title: "Publisher blocked feed access",
      message: "The publisher returned HTTP 403, so BridgeNews is not permitted to fetch this feed from the current endpoint.",
      recommendation: "Keep this source disabled until an official accessible feed or permitted public endpoint is available.",
      severity: "warning",
    };
  }

  if (lower.includes("http 404")) {
    return {
      title: "Feed not found",
      message: "The configured feed URL returned HTTP 404 and may have moved or been removed.",
      recommendation: "Check the publisher website for a current official RSS or public feed URL before re-enabling the source.",
      severity: "warning",
    };
  }

  if (lower.includes("http 429")) {
    return {
      title: "Publisher rate limit reached",
      message: "The publisher temporarily rejected requests because too many were made in a short period.",
      recommendation: "Increase the fetch interval and retry later. Do not bypass publisher rate limits.",
      severity: "warning",
    };
  }

  if (/http 5\d\d/.test(lower)) {
    return {
      title: "Publisher server error",
      message: "The publisher server returned a 5xx response and could not serve the feed successfully.",
      recommendation: "Leave the source disabled if failures continue and retry only after the publisher endpoint is healthy again.",
      severity: "warning",
    };
  }

  if (lower.includes("timeout") || lower.includes("timed out")) {
    return {
      title: "Feed request timed out",
      message: "The publisher did not respond before the BridgeNews request timed out.",
      recommendation: "Check the feed URL and publisher availability. Re-enable only if the endpoint becomes reliably reachable.",
      severity: "warning",
    };
  }

  return {
    title: "Latest ingestion issue",
    message: raw || `${consecutiveFailures} consecutive ingestion failures were recorded.`,
    recommendation: "Review the feed URL and source status before re-enabling automatic ingestion.",
    severity: "error",
  };
}
