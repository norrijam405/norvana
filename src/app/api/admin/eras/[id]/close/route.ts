import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  actionReceipts,
  eraArchiveSnapshots,
  eraEvents,
  eras,
} from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { buildEraArchiveSnapshot } from "@/lib/era-engine/archive";

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

  const closureEvidenceRef = clean(body.closureEvidenceRef, 1500);
  const publicNote = clean(body.publicNote, 2000);

  if (!closureEvidenceRef) {
    return NextResponse.json(
      { error: "Closure evidence reference is required." },
      { status: 409 }
    );
  }

  const built = await buildEraArchiveSnapshot(eraId);
  if (!built) return NextResponse.json({ error: "Era not found." }, { status: 404 });

  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(eras)
        .where(eq(eras.id, eraId))
        .limit(1);

      if (!current) throw new Error("ERA_NOT_FOUND");
      if (current.lifecycleState !== "ACTIVE") throw new Error("ERA_NOT_ACTIVE");
      if (current.updatedAt.toISOString() !== built.eraUpdatedAt) {
        throw new Error("ERA_CHANGED_DURING_SNAPSHOT");
      }

      const [saved] = await tx
        .insert(eraArchiveSnapshots)
        .values({
          eraId,
          snapshotKind: "CLOSURE",
          snapshotDigest: built.digest,
          snapshot: built.snapshot,
          evidenceRef: closureEvidenceRef,
          actor: "owner",
        })
        .onConflictDoNothing({ target: eraArchiveSnapshots.snapshotDigest })
        .returning();

      const snapshot =
        saved ??
        (
          await tx
            .select()
            .from(eraArchiveSnapshots)
            .where(eq(eraArchiveSnapshots.snapshotDigest, built.digest))
            .limit(1)
        )[0];

      if (!snapshot) throw new Error("ERA_SNAPSHOT_PERSIST_FAILED");

      const now = new Date();
      const [closed] = await tx
        .update(eras)
        .set({
          lifecycleState: "CLOSED",
          isPrimary: false,
          endAt: current.endAt ?? now,
          updatedAt: now,
        })
        .where(
          and(
            eq(eras.id, eraId),
            eq(eras.lifecycleState, "ACTIVE"),
            eq(eras.updatedAt, current.updatedAt)
          )
        )
        .returning();

      if (!closed) throw new Error("ERA_CHANGED_BEFORE_CLOSURE");

      await tx.insert(eraEvents).values({
        eraId,
        eventType: "ERA_CLOSED",
        actor: "owner",
        payload: {
          closureEvidenceRef,
          publicNote,
          snapshotId: snapshot.id,
          snapshotDigest: snapshot.snapshotDigest,
        },
      });

      await tx.insert(actionReceipts).values({
        actionType: "ERA_CLOSE",
        authorityClass: "ACT",
        subjectType: "era",
        subjectId: String(eraId),
        status: "PASS",
        actor: "owner",
        details: {
          closureEvidenceRef,
          snapshotId: snapshot.id,
          snapshotDigest: snapshot.snapshotDigest,
        },
      });

      return { closed, snapshot };
    });

    return NextResponse.json({
      era: result.closed,
      archiveSnapshot: {
        id: result.snapshot.id,
        digest: result.snapshot.snapshotDigest,
        createdAt: result.snapshot.createdAt,
      },
      authority: "ADMIN_ACT_WITH_IMMUTABLE_SNAPSHOT",
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "ERA_CLOSE_FAILED";
    const status = code === "ERA_NOT_FOUND" ? 404 : 409;
    return NextResponse.json({ error: code }, { status });
  }
}
