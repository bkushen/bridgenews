import { NextRequest, NextResponse } from "next/server";
import { getHotHashtags } from "@/lib/data/hot-hashtags";
import type { RegionSlug } from "@/lib/mock-data";

const REGIONS = new Set<RegionSlug>(["sri-lanka", "australia", "international"]);
const LANGUAGES = new Set(["en", "si", "ta"] as const);

export async function GET(request: NextRequest) {
  const regionParam = request.nextUrl.searchParams.get("region") as RegionSlug | null;
  const languageParam = request.nextUrl.searchParams.get("language");

  const region: RegionSlug = regionParam && REGIONS.has(regionParam) ? regionParam : "sri-lanka";
  const language = region === "sri-lanka" && languageParam && LANGUAGES.has(languageParam as "en" | "si" | "ta")
    ? (languageParam as "en" | "si" | "ta")
    : undefined;

  const hashtags = await getHotHashtags({ region, language, hours: 36, limit: 12 });

  return NextResponse.json(
    { hashtags, generatedAt: new Date().toISOString(), windowHours: 36 },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
