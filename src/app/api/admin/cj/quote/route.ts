import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { parseAging, quoteCjVariantToUs } from "@/lib/cj/api";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  let body: { vid?: string };
  try {
    body = (await req.json()) as { vid?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const vid = body.vid?.trim();
  if (!vid) return NextResponse.json({ error: "CJ variant id is required." }, { status: 400 });

  try {
    const result = await quoteCjVariantToUs(vid);
    const methods = result.methods.map((method) => ({
      ...method,
      aging: parseAging(method.logisticAging),
    }));

    return NextResponse.json({
      ...result,
      methods,
      authority: "READ_ONLY_CJ_ROUTE_QUOTE",
      note: "Freight is a quote only. This action does not create an order or enable fulfillment.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "CJ route quote failed." },
      { status: 502 }
    );
  }
}
