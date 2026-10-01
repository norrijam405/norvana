import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { ownerCredentialState } from "@/lib/admin-identity";
import {
  evaluateObserveProofEnvironmentSnapshot,
  evaluateObserveProofWatcherSnapshot,
  evaluateR1QueueCadence,
  WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_1,
  WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_2,
  WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG,
  WATCHTOWER_R1_MIN_INTERVAL_MS,
  WATCHTOWER_R1_QUEUE_RECEIPT_ACTION,
} from "@/lib/watchtower/policy";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";
import { requireWatchtowerObserveProofWorker } from "@/lib/watchtower/worker-auth";

function currentR1Environment() {
  return evaluateObserveProofEnvironmentSnapshot({
    queueEnabled: process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true",
    executorEnabled: process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true",
    fulfillmentEnabled: process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true",
    supplierConnectorsEnabled: process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true",
    federationEnabled: process.env.IGNIAQUA_FEDERATION_ENABLED === "true",
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireWatchtowerObserveProofWorker(req);
  if (auth) return auth;

  const environment = currentR1Environment();
  if (!environment.ok) {
    return NextResponse.json(
      { error: environment.reason, code: environment.code },
      { status: 409 }
    );
  }

  const runtimeId = currentWatchtowerRuntimeId();
  if (!runtimeId) {
    return NextResponse.json(
      {
        error: "Watchtower runtime identity is unavailable.",
        code: "WATCHTOWER_RUNTIME_ID_REQUIRED",
      },
      { status: 503 }
    );
  }

  const owner = await ownerCredentialState();
  if (!owner.rotated) {
    return NextResponse.json(
      {
        error: "Permanent owner credential is required before R1 recurring observe.",
        code: "WATCHTOWER_OWNER_PASSWORD_ROTATION_REQUIRED",
      },
      { status: 409 }
    );
  }

  const now = new Date();
  const minimumIntervalHours = WATCHTOWER_R1_MIN_INTERVAL_MS / (60 * 60 * 1000);

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_1}, ${WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_2})`
    );

    const [controlProof] = await tx
      .select({ id: watchRuns.id })
      .from(watchRuns)
      .where(
        and(
          eq(watchRuns.trigger, "CONTROL_TEST"),
          eq(watchRuns.status, "PASS"),
          eq(watchRuns.runtimeId, runtimeId)
        )
      )
      .orderBy(desc(watchRuns.completedAt))
      .limit(1);

    const [workerProof] = await tx
      .select({ id: watchRuns.id })
      .from(watchRuns)
      .where(
        and(
          eq(watchRuns.trigger, "WORKER_TEST"),
          eq(watchRuns.status, "PASS"),
          eq(watchRuns.runtimeId, runtimeId)
        )
      )
      .orderBy(desc(watchRuns.completedAt))
      .limit(1);

    if (!controlProof || !workerProof) {
      return {
        error: "Current-runtime Control Proof and Worker Proof are required before R1 recurring observe.",
        code: "WATCHTOWER_R1_PREREQUISITES_REQUIRED",
        status: 409,
      } as const;
    }

    const jobs = await tx.select().from(watchJobs).orderBy(asc(watchJobs.id));
    const watcherDecision = evaluateObserveProofWatcherSnapshot(jobs);
    if (!watcherDecision.ok) {
      return {
        error: watcherDecision.reason,
        code: watcherDecision.code,
        status: 409,
      } as const;
    }

    const target = jobs.find(
      (job) => job.slug === WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG
    );
    if (!target) {
      return {
        error: "Local Producer Watch is missing.",
        code: "WATCHTOWER_R1_TARGET_MISSING",
        status: 409,
      } as const;
    }

    const activeRuns = await tx
      .select({ id: watchRuns.id, trigger: watchRuns.trigger, status: watchRuns.status })
      .from(watchRuns)
      .where(inArray(watchRuns.status, ["QUEUED", "RUNNING"]));

    if (activeRuns.length !== 0) {
      return {
        error: "R1 recurring observe requires an empty executable run queue.",
        code: "WATCHTOWER_R1_EXECUTABLE_QUEUE_NOT_EMPTY",
        status: 409,
      } as const;
    }

    const [lastR1Queue] = await tx
      .select({ createdAt: actionReceipts.createdAt })
      .from(actionReceipts)
      .where(eq(actionReceipts.actionType, WATCHTOWER_R1_QUEUE_RECEIPT_ACTION))
      .orderBy(desc(actionReceipts.createdAt))
      .limit(1);

    const cadenceDecision = evaluateR1QueueCadence({
      lastQueuedAt: lastR1Queue?.createdAt ?? null,
      now,
    });

    if (!cadenceDecision.ok) {
      const nextEligibleAt = lastR1Queue
        ? new Date(lastR1Queue.createdAt.getTime() + WATCHTOWER_R1_MIN_INTERVAL_MS)
        : null;

      await tx.insert(actionReceipts).values({
        actionType: "WATCH_R1_OBSERVE_CADENCE_BLOCKED",
        authorityClass: "OBSERVE",
        subjectType: "watch_job",
        subjectId: String(target.id),
        status: "BLOCKED",
        actor: "watchtower-r1-oidc-scheduler",
        details: {
          jobId: target.id,
          jobSlug: target.slug,
          runtimeId,
          minimumIntervalHours,
          lastQueuedAt: lastR1Queue?.createdAt?.toISOString() ?? null,
          nextEligibleAt: nextEligibleAt?.toISOString() ?? null,
          reason: cadenceDecision.code,
        },
      });

      return {
        error: cadenceDecision.reason,
        code: cadenceDecision.code,
        status: 409,
        nextEligibleAt: nextEligibleAt?.toISOString() ?? null,
      } as const;
    }

    const [run] = await tx
      .insert(watchRuns)
      .values({
        jobId: target.id,
        status: "QUEUED",
        trigger: "OBSERVE_PROOF",
        runtimeId,
        summary:
          "R1 bounded recurring Local Producer Watch observation queued with normal scheduler and executor disabled.",
      })
      .returning();

    const [receipt] = await tx
      .insert(actionReceipts)
      .values({
        actionType: WATCHTOWER_R1_QUEUE_RECEIPT_ACTION,
        authorityClass: "OBSERVE",
        subjectType: "watch_run",
        subjectId: String(run.id),
        status: "QUEUED",
        actor: "watchtower-r1-oidc-scheduler",
        details: {
          jobId: target.id,
          jobSlug: target.slug,
          runtimeId,
          budgetCents: 0,
          minimumIntervalHours,
          normalQueueEnabled: false,
          normalExecutorEnabled: false,
          r1Mode: "BOUNDED_RECURRING_OBSERVE",
        },
      })
      .returning();

    return { run, receipt, status: 200 } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json(
      {
        error: outcome.error,
        code: outcome.code,
        ...("nextEligibleAt" in outcome
          ? { nextEligibleAt: outcome.nextEligibleAt }
          : {}),
      },
      { status: outcome.status }
    );
  }

  return NextResponse.json({
    ok: true,
    queued: true,
    mode: "R1_BOUNDED_RECURRING_OBSERVE",
    runId: outcome.run.id,
    receiptId: outcome.receipt.id,
    runtimeId,
    trigger: "OBSERVE_PROOF",
    targetSlug: WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG,
    estimatedCostCents: 0,
    minimumIntervalHours,
  });
}
