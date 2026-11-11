import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const { id: rawId } = await context.params;
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid receipt id." }, { status: 400 });
  }

  try {
    const [receipt] = await db.select({
      id: actionReceipts.id,
      actionType: actionReceipts.actionType,
      subjectId: actionReceipts.subjectId,
      status: actionReceipts.status,
      details: actionReceipts.details,
      createdAt: actionReceipts.createdAt,
    }).from(actionReceipts).where(and(
      eq(actionReceipts.id, id),
      eq(actionReceipts.actionType, "CJ_VARIANT_QUALIFICATION")
    )).limit(1);

    if (!receipt) return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    return NextResponse.json({
      ...receipt,
      verification: "SERVER_OBSERVED_NOT_INDEPENDENTLY_VERIFIED",
      authority: "OBSERVE_ONLY",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("CJ receipt readback failed:", error);
    return NextResponse.json({ error: "Receipt store is unavailable." }, { status: 503 });
  }
}
