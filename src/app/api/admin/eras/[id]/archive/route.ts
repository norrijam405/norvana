import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  actionReceipts,
  eraArchiveSnapshots,
  eraEvents,
  eras,
} from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";

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

  const archiveEvidenceRef = clean(body.archiveEvidenceRef, 1500);
  if (!archiveEvidenceRef) {
    return NextResponse.json(
      { error: "Archive evidence reference is required." },
      { status: 409 }
    );
  }

  const [snapshot] = await db
    .select({ id: eraArchiveSnapshots.id, digest: eraArchiveSnapshots.snapshotDigest })
    .from(eraArchiveSnapshots)
    .where(
      and(
        eq(eraArchiveSnapshots.eraId, eraId),
        eq(eraArchiveSnapshots.snapshotKind, "CLOSURE")
      )
    )
    .orderBy(desc(eraArchiveSnapshots.createdAt), desc(eraArchiveSnapshots.id))
    .limit(1);

  if (!snapshot) {
    return NextResponse.json(
      { error: "Era cannot be archived without an immutable closure snapshot." },
      { status: 409 }
    );
  }

  try {
    const archived = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(eras)
        .set({
          lifecycleState: "ARCHIVED",
          isPrimary: false,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(eras.id, eraId),
            eq(eras.lifecycleState, "CLOSED")
          )
        )
        .returning();

      if (!updated) throw new Error("ERA_NOT_CLOSED");

      await tx.insert(eraEvents).values({
        eraId,
        eventType: "ERA_ARCHIVED",
        actor: "owner",
        payload: {
          archiveEvidenceRef,
          snapshotId: snapshot.id,
          snapshotDigest: snapshot.digest,
        },
      });

      await tx.insert(actionReceipts).values({
        actionType: "ERA_ARCHIVE",
        authorityClass: "ACT",
        subjectType: "era",
        subjectId: String(eraId),
        status: "PASS",
        actor: "owner",
        details: {
          archiveEvidenceRef,
          snapshotId: snapshot.id,
          snapshotDigest: snapshot.digest,
        },
      });

      return updated;
    });

    return NextResponse.json({
      era: archived,
      snapshot,
      authority: "ADMIN_ACT_AFTER_IMMUTABLE_CLOSURE",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ERA_ARCHIVE_FAILED" },
      { status: 409 }
    );
  }
}
