import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { searchStockVideos } from "@/lib/media/stock-video-providers";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const limit = Number.isFinite(Number(body.limit)) ? Number(body.limit) : 12;
  const orientation =
    body.orientation === "LANDSCAPE" || body.orientation === "PORTRAIT"
      ? body.orientation
      : "ANY";

  if (!query) {
    return NextResponse.json({ error: "Stock video query is required." }, { status: 400 });
  }

  try {
    const result = await searchStockVideos({
      query,
      limit,
      orientation,
    });

    return NextResponse.json({
      ...result,
      authority: "DISCOVERY_ONLY",
      autoApproved: false,
      customerFacing: false,
      reviewRequiredBeforeEraUse: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "STOCK_VIDEO_SEARCH_FAILED",
      },
      { status: 400 }
    );
  }
}
