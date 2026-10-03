import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  actionReceipts,
  eraArchiveSnapshots,
  eraEvents,
  eras,
} from "@/db/schema";
import { buildEraArchiveSnapshot } from "./archive";
import { evaluateEraActivationReadiness } from "./readiness";

export class EraLifecycleError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, status = 409, details?: Record<string, unknown>) {
    super(code);
    this.name = "EraLifecycleError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function requireEvidence(value: string, code: string) {
  const cleaned = String(value || "").trim().slice(0, 1500);
  if (!cleaned) throw new EraLifecycleError(code, 409);
  return cleaned;
}

export async function activateEra(input: {
  eraId: number;
  activationEvidenceRef: string;
  expectedReadinessDigest: string;
  makePrimary: boolean;
  actor?: string;
  now?: Date;
}) {
  const activationEvidenceRef = requireEvidence(
    input.activationEvidenceRef,
    "ERA_ACTIVATION_EVIDENCE_REQUIRED"
  );
  const expectedReadinessDigest = String(input.expectedReadinessDigest || "")
    .trim()
    .slice(0, 64);
  if (!/^[a-f0-9]{64}$/.test(expectedReadinessDigest)) {
    throw new EraLifecycleError("ERA_READINESS_DIGEST_INVALID", 409);
  }

  const now = input.now ?? new Date();
  const actor = input.actor ?? "owner";
  const readiness = await evaluateEraActivationReadiness(input.eraId, now);
  if (!readiness) throw new EraLifecycleError("ERA_NOT_FOUND", 404);
  if (!readiness.ready) {
    throw new EraLifecycleError("ERA_NOT_READY", 409, {
      blockers: readiness.blockers,
      warnings: readiness.warnings,
    });
  }
  if (readiness.readinessDigest !== expectedReadinessDigest) {
    throw new EraLifecycleError("ERA_READINESS_CHANGED", 409, {
      expectedReadinessDigest,
      currentReadinessDigest: readiness.readinessDigest,
    });
  }

  const [current] = await db
    .select()
    .from(eras)
    .where(eq(eras.id, input.eraId))
    .limit(1);
  if (!current) throw new EraLifecycleError("ERA_NOT_FOUND", 404);
  if (!["DRAFT", "QUALIFYING", "SCHEDULED"].includes(current.lifecycleState)) {
    throw new EraLifecycleError("ERA_LIFECYCLE_ACTIVATION_INVALID", 409);
  }
  if (current.updatedAt.toISOString() !== readiness.eraUpdatedAt) {
    throw new EraLifecycleError("ERA_CHANGED_AFTER_READINESS", 409);
  }

  try {
    const activated = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(eras)
        .set({
          lifecycleState: "ACTIVE",
          visibility: "PUBLIC",
          isPrimary: input.makePrimary,
          startAt: current.startAt ?? now,
          updatedAt: now,
        })
        .where(
          and(
            eq(eras.id, input.eraId),
            eq(eras.updatedAt, current.updatedAt)
          )
        )
        .returning();

      if (!updated) throw new Error("ERA_CHANGED_BEFORE_ACTIVATION");

      await tx.insert(eraEvents).values({
        eraId: input.eraId,
        eventType: "ERA_ACTIVATED",
        actor,
        payload: {
          activationEvidenceRef,
          makePrimary: input.makePrimary,
          readiness,
          expectedReadinessDigest,
        },
      });

      await tx.insert(actionReceipts).values({
        actionType: "ERA_ACTIVATE",
        authorityClass: "ACT",
        subjectType: "era",
        subjectId: String(input.eraId),
        status: "PASS",
        actor,
        details: {
          activationEvidenceRef,
          makePrimary: input.makePrimary,
          readiness,
          expectedReadinessDigest,
        },
      });

      return updated;
    });

    return {
      era: activated,
      readiness,
      authority: "ADMIN_ACT_WITH_EVIDENCE" as const,
    };
  } catch (error) {
    if (error instanceof EraLifecycleError) throw error;
    const code = error instanceof Error ? error.message : "ERA_ACTIVATION_FAILED";
    throw new EraLifecycleError(code === "ERA_CHANGED_BEFORE_ACTIVATION" ? code : "ERA_ACTIVATION_FAILED", 409);
  }
}

export async function closeEra(input: {
  eraId: number;
  closureEvidenceRef: string;
  publicNote?: string;
  actor?: string;
  now?: Date;
}) {
  const closureEvidenceRef = requireEvidence(
    input.closureEvidenceRef,
    "ERA_CLOSURE_EVIDENCE_REQUIRED"
  );
  const publicNote = String(input.publicNote || "").trim().slice(0, 2000);
  const actor = input.actor ?? "owner";
  const now = input.now ?? new Date();

  const built = await buildEraArchiveSnapshot(input.eraId);
  if (!built) throw new EraLifecycleError("ERA_NOT_FOUND", 404);

  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(eras)
        .where(eq(eras.id, input.eraId))
        .limit(1);

      if (!current) throw new Error("ERA_NOT_FOUND");
      if (current.lifecycleState !== "ACTIVE") throw new Error("ERA_NOT_ACTIVE");
      if (current.updatedAt.toISOString() !== built.eraUpdatedAt) {
        throw new Error("ERA_CHANGED_DURING_SNAPSHOT");
      }

      const [saved] = await tx
        .insert(eraArchiveSnapshots)
        .values({
          eraId: input.eraId,
          snapshotKind: "CLOSURE",
          snapshotDigest: built.digest,
          snapshot: built.snapshot,
          evidenceRef: closureEvidenceRef,
          actor,
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
            eq(eras.id, input.eraId),
            eq(eras.lifecycleState, "ACTIVE"),
            eq(eras.updatedAt, current.updatedAt)
          )
        )
        .returning();

      if (!closed) throw new Error("ERA_CHANGED_BEFORE_CLOSURE");

      await tx.insert(eraEvents).values({
        eraId: input.eraId,
        eventType: "ERA_CLOSED",
        actor,
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
        subjectId: String(input.eraId),
        status: "PASS",
        actor,
        details: {
          closureEvidenceRef,
          snapshotId: snapshot.id,
          snapshotDigest: snapshot.snapshotDigest,
        },
      });

      return {
        era: closed,
        snapshot,
        authority: "ADMIN_ACT_WITH_IMMUTABLE_SNAPSHOT" as const,
      };
    });
  } catch (error) {
    if (error instanceof EraLifecycleError) throw error;
    const code = error instanceof Error ? error.message : "ERA_CLOSE_FAILED";
    throw new EraLifecycleError(code, code === "ERA_NOT_FOUND" ? 404 : 409);
  }
}

export async function archiveEra(input: {
  eraId: number;
  archiveEvidenceRef: string;
  actor?: string;
  now?: Date;
}) {
  const archiveEvidenceRef = requireEvidence(
    input.archiveEvidenceRef,
    "ERA_ARCHIVE_EVIDENCE_REQUIRED"
  );
  const actor = input.actor ?? "owner";
  const now = input.now ?? new Date();

  const [snapshot] = await db
    .select({ id: eraArchiveSnapshots.id, digest: eraArchiveSnapshots.snapshotDigest })
    .from(eraArchiveSnapshots)
    .where(
      and(
        eq(eraArchiveSnapshots.eraId, input.eraId),
        eq(eraArchiveSnapshots.snapshotKind, "CLOSURE")
      )
    )
    .orderBy(desc(eraArchiveSnapshots.createdAt), desc(eraArchiveSnapshots.id))
    .limit(1);

  if (!snapshot) {
    throw new EraLifecycleError("ERA_ARCHIVE_CLOSURE_SNAPSHOT_REQUIRED", 409);
  }

  try {
    const archived = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(eras)
        .set({
          lifecycleState: "ARCHIVED",
          isPrimary: false,
          updatedAt: now,
        })
        .where(
          and(
            eq(eras.id, input.eraId),
            eq(eras.lifecycleState, "CLOSED")
          )
        )
        .returning();

      if (!updated) throw new Error("ERA_NOT_CLOSED");

      await tx.insert(eraEvents).values({
        eraId: input.eraId,
        eventType: "ERA_ARCHIVED",
        actor,
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
        subjectId: String(input.eraId),
        status: "PASS",
        actor,
        details: {
          archiveEvidenceRef,
          snapshotId: snapshot.id,
          snapshotDigest: snapshot.digest,
        },
      });

      return updated;
    });

    return {
      era: archived,
      snapshot,
      authority: "ADMIN_ACT_AFTER_IMMUTABLE_CLOSURE" as const,
    };
  } catch (error) {
    if (error instanceof EraLifecycleError) throw error;
    const code = error instanceof Error ? error.message : "ERA_ARCHIVE_FAILED";
    throw new EraLifecycleError(code, 409);
  }
}
