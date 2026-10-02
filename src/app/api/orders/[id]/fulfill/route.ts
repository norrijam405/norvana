import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

export async function POST(
  req: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  return NextResponse.json(
    {
      error: "External supplier fulfillment is locked in Norvana R0.",
      code: "NORVANA_SUPPLIER_ACT_LOCKED_R0",
      authority: "OBSERVE_RECOMMEND_ONLY",
      next:
        "Complete supplier qualification, read-only shadow proving, independent assurance, and a later explicit founder ACT-authority decision before implementing external order submission.",
    },
    { status: 409 }
  );
}
