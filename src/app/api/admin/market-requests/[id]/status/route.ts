import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { marketRequestEvents, marketRequests } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import {
  canTransitionMarketRequest,
  MARKET_REQUEST_STATES,
  marketRequestTransitionNeedsEvidence,
} from "@/lib/customer-intent/policy";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const { id } = await params;
  const requestId = Number(id);
  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "Invalid request id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const toStatus = String(body.toStatus || "").trim().toUpperCase();
  const evidenceRef = String(body.evidenceRef || "").trim().slice(0, 1500) || null;
  const publicNote = String(body.publicNote || "").trim().slice(0, 2000);

  if (
    !MARKET_REQUEST_STATES.includes(
      toStatus as (typeof MARKET_REQUEST_STATES)[number]
    )
  ) {
    return NextResponse.json({ error: "Unknown request status." }, { status: 400 });
  }

  const [current] = await db
    .select()
    .from(marketRequests)
    .where(eq(marketRequests.id, requestId))
    .limit(1);

  if (!current) return NextResponse.json({ error: "Request not found." }, { status: 404 });

  if (!canTransitionMarketRequest(current.status, toStatus)) {
    return NextResponse.json(
      { error: "That request-status transition is not allowed." },
      { status: 409 }
    );
  }

  if (marketRequestTransitionNeedsEvidence(toStatus) && !evidenceRef) {
    return NextResponse.json(
      { error: "This status transition requires an evidence reference." },
      { status: 409 }
    );
  }

  const now = new Date();
  const [updated] = await db
    .update(marketRequests)
    .set({
      status: toStatus,
      statusEvidenceRef: evidenceRef,
      updatedAt: now,
    })
    .where(eq(marketRequests.id, requestId))
    .returning();

  await db.insert(marketRequestEvents).values({
    marketRequestId: requestId,
    eventType: "STATUS_CHANGED",
    fromStatus: current.status,
    toStatus,
    evidenceRef,
    publicNote,
    actor: "owner",
  });

  return NextResponse.json({
    request: updated,
    authority: "REQUEST_STATUS_ONLY_NO_CATALOG_ACT",
  });
}
