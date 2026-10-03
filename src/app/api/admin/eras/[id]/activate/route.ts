import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  actionReceipts,
  eraEvents,
  eras,
} from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { evaluateEraActivationReadiness } from "@/lib/era-engine/readiness";

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const { id } = await params;
  const eraId = Number(id);
  if (!Number.isInteger(eraId) || eraId <= 0) {
    return NextResponse.json({ error: "Invalid Era id." }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const activationEvidenceRef = clean(body.activationEvidenceRef, 1500);
  const expectedReadinessDigest = clean(body.expectedReadinessDigest, 64);
  const makePrimary = body.makePrimary === true;

  if (!activationEvidenceRef) {
    return NextResponse.json(
      { error: "Activation evidence reference is required." },
      { status: 409 }
    );
  }

  if (!/^[a-f0-9]{64}$/.test(expectedReadinessDigest)) {
    return NextResponse.json(
      { error: "A valid readiness digest is required." },
      { status: 409 }
    );
  }

  const readiness = await evaluateEraActivationReadiness(eraId);
  if (!readiness) return NextResponse.json({ error: "Era not found." }, { status: 404 });
  if (!readiness.ready) {
    return NextResponse.json(
      { error: "Era is not ready for activation.", blockers: readiness.blockers, warnings: readiness.warnings },
      { status: 409 }
    );
  }

  if (readiness.readinessDigest !== expectedReadinessDigest) {
    return NextResponse.json(
      {
        error: "Era readiness changed. Re-read readiness before activation.",
        expectedReadinessDigest,
        currentReadinessDigest: readiness.readinessDigest,
      },
      { status: 409 }
    );
  }

  const [current] = await db.select().from(eras).where(eq(eras.id, eraId)).limit(1);
  if (!current) return NextResponse.json({ error: "Era not found." }, { status: 404 });

  if (!["DRAFT", "QUALIFYING", "SCHEDULED"].includes(current.lifecycleState)) {
    return NextResponse.json(
      { error: "Era lifecycle state cannot be activated from here." },
      { status: 409 }
    );
  }

  if (current.updatedAt.toISOString() !== readiness.eraUpdatedAt) {
    return NextResponse.json(
      { error: "Era changed after readiness evaluation. Re-read and retry." },
      { status: 409 }
    );
  }

  const now = new Date();

  try {
    const activated = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(eras)
        .set({
          lifecycleState: "ACTIVE",
          visibility: "PUBLIC",
          isPrimary: makePrimary,
          startAt: current.startAt ?? now,
          updatedAt: now,
        })
        .where(
          and(
            eq(eras.id, eraId),
            eq(eras.updatedAt, current.updatedAt)
          )
        )
        .returning();

      if (!updated) throw new Error("ERA_CHANGED_BEFORE_ACTIVATION");

      await tx.insert(eraEvents).values({
        eraId,
        eventType: "ERA_ACTIVATED",
        actor: "owner",
        payload: {
          activationEvidenceRef,
          makePrimary,
          readiness,
          expectedReadinessDigest,
        },
      });

      await tx.insert(actionReceipts).values({
        actionType: "ERA_ACTIVATE",
        authorityClass: "ACT",
        subjectType: "era",
        subjectId: String(eraId),
        status: "PASS",
        actor: "owner",
        details: {
          activationEvidenceRef,
          makePrimary,
          readiness,
          expectedReadinessDigest,
        },
      });

      return updated;
    });

    return NextResponse.json({
      era: activated,
      authority: "ADMIN_ACT_WITH_EVIDENCE",
    });
  } catch (error) {
    console.error("Era activation failed:", error);
    return NextResponse.json(
      { error: "Era activation failed. Another active primary Era may already exist." },
      { status: 409 }
    );
  }
}
