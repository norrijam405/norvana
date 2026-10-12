import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchCandidates } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

const ACTIONS = ["SHORTLIST", "UNSHORTLIST", "PASS", "STAGE"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const { id } = await params;
  const candidateId = Number(id);
  if (!Number.isInteger(candidateId) || candidateId <= 0) {
    return NextResponse.json({ error: "Invalid candidate id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const action = String(body.action || "").trim().toUpperCase();
  if (!ACTIONS.includes(action as (typeof ACTIONS)[number])) {
    return NextResponse.json({ error: "Unknown candidate action." }, { status: 400 });
  }

  const [current] = await db
    .select()
    .from(watchCandidates)
    .where(eq(watchCandidates.id, candidateId))
    .limit(1);

  if (!current) {
    return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  }

  const nextStatus =
    action === "SHORTLIST"
      ? "SHORTLISTED"
      : action === "UNSHORTLIST"
        ? "NEW"
        : action === "PASS"
          ? "DISMISSED"
          : "STAGED";

  const [updated] = await db
    .update(watchCandidates)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(watchCandidates.id, candidateId))
    .returning();

  return NextResponse.json({
    candidate: updated,
    authority:
      action === "STAGE"
        ? "MERCHANDISING_STAGE_ONLY_NO_PUBLICATION"
        : "OWNER_CANDIDATE_DECISION_ONLY",
    note:
      action === "STAGE"
        ? "Staging does not publish, activate checkout, enroll a merchant, or create fulfillment."
        : "This action only changes the owner-review state.",
  });
}
