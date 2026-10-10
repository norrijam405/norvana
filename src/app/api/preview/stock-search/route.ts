import { NextRequest, NextResponse } from "next/server";
import { searchStockVideos } from "@/lib/media/stock-video-providers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json(
      { error: "PREVIEW_ONLY" },
      { status: 404, headers: { "cache-control": "no-store" } }
    );
  }

  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const requestedLimit = Number(req.nextUrl.searchParams.get("limit") || 12);
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(20, Math.floor(requestedLimit))
      : 12;

  if (!query) {
    return NextResponse.json(
      { error: "QUERY_REQUIRED" },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }

  try {
    const result = await searchStockVideos({
      query,
      limit,
      orientation: "LANDSCAPE",
    });

    return NextResponse.json(
      {
        query,
        candidates: result.candidates,
        providerErrors: result.unavailableProviders,
        authority: "DISCOVERY_ONLY",
        reviewRequiredBeforeEraUse: true,
        secretIncluded: false,
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "STOCK_VIDEO_SEARCH_FAILED",
      },
      { status: 400, headers: { "cache-control": "no-store" } }
    );
  }
}
