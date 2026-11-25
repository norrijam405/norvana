import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { readJsonObjectLimited } from "@/lib/request-body";
import { previewAwinProductFeed } from "@/lib/awin/product-feed";
export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;
  const parsed = await readJsonObjectLimited(req, 2_100_000);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error, code: parsed.code }, { status: parsed.status });
  const csvText = parsed.body.csvText;
  if (typeof csvText !== "string") return NextResponse.json({ error: "csvText is required.", code: "AWIN_CSV_REQUIRED" }, { status: 400 });
  try {
    const preview = previewAwinProductFeed(csvText, 100);
    return NextResponse.json({ ...preview, authority: "AWIN_FEED_PREVIEW_ONLY", imported: false, staged: false, published: false }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Awin feed could not be parsed.";
    return NextResponse.json({ error: message, code: "AWIN_FEED_INVALID" }, { status: 400 });
  }
}
