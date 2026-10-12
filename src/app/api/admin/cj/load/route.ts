import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { loadCjProductBySku } from "@/lib/cj/api";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  let body: { sku?: string };
  try {
    body = (await req.json()) as { sku?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sku = body.sku?.trim();
  if (!sku) return NextResponse.json({ error: "CJ SKU is required." }, { status: 400 });

  try {
    const result = await loadCjProductBySku(sku);
    return NextResponse.json({
      ...result,
      authority: "READ_ONLY_CJ_DISCOVERY",
      note: "This action reads CJ product data only. It does not import, list, order, or enable fulfillment.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CJ product lookup failed." },
      { status: 502 }
    );
  }
}
