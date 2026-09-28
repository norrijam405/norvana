import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { ownerCredentialState } from "@/lib/admin-identity";
import {
  evaluateHarnessEnvironmentSnapshot,
  evaluateHarnessTargetJob,
  evaluateHarnessWatcherSnapshot,
  WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1,
  WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2,
} from "@/lib/watchtower/policy";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";

function currentHarnessEnvironment() {
  return evaluateHarnessEnvironmentSnapshot({
    queueEnabled: process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true",
    executorEnabled: process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true",
    fulfillmentEnabled: process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true",
    supplierConnectorsEnabled: process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true",
    federationEnabled: process.env.IGNIAQUA_FEDERATION_ENABLED === "true",
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const runtimeId = currentWatchtowerRuntimeId();
  if (!runtimeId) {
    return NextResponse.json(
      { error: "Watchtower runtime identity is unavailable.", code: "WATCHTOWER_RUNTIME_ID_REQUIRED" },
      { status: 503 }
    );
  }

  const environment = currentHarnessEnvironment();
  if (!environment.ok) {
    return NextResponse.json(
      { error: environment.reason, code: environment.code },
      { status: 409 }
    );
  }

  const owner = await ownerCredentialState();
  if (!owner.rotated) {
    return NextResponse.json(
      {
        error: "Permanent owner credential is required before harness proof.",
        code: "WATCHTOWER_OWNER_PASSWORD_ROTATION_REQUIRED",
      },
      { status: 409 }
    );
  }

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1}, ${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2})`
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
        error: "Current-deployment Control Proof and Worker Proof are required first.",
        code: "WATCHTOWER_HARNESS_PREREQUISITES_REQUIRED",
        status: 409,
      } as const;
    }

    const activeRuns = await tx
      .select({ id: watchRuns.id, status: watchRuns.status })
      .from(watchRuns)
      .where(inArray(watchRuns.status, ["QUEUED", "RUNNING"]))
      .limit(10);

    if (activeRuns.length) {
      return {
        error: "Harness proof requires an empty executable queue.",
        code: "WATCHTOWER_STALE_EXECUTABLE_RUNS_PRESENT",
        status: 409,
        activeRunCount: activeRuns.length,
      } as const;
    }

    const jobs = await tx.select().from(watchJobs).orderBy(asc(watchJobs.id));
    const watcherDecision = evaluateHarnessWatcherSnapshot(jobs);
    if (!watcherDecision.ok) {
      return {
        error: watcherDecision.reason,
        code: watcherDecision.code,
        status: 409,
      } as const;
    }

    const job = jobs.find((item) => item.authority === "OBSERVE");
    if (!job) {
      return {
        error: "Harness proof requires an OBSERVE watcher.",
        code: "WATCHTOWER_HARNESS_OBSERVE_JOB_REQUIRED",
        status: 409,
      } as const;
    }

    const targetDecision = evaluateHarnessTargetJob(job.authority, job.budgetCents);
    if (!targetDecision.ok) {
      return {
        error: targetDecision.reason,
        code: targetDecision.code,
        status: 409,
      } as const;
    }

    const [run] = await tx
      .insert(watchRuns)
      .values({
        jobId: job.id,
        status: "QUEUED",
        trigger: "HARNESS_TEST",
        runtimeId,
        summary:
          "Queued for external deterministic worker harness proof. Real watchers remain PAUSED.",
        findings: [],
        evidenceRefs: [],
        modelProvider: null,
        estimatedCostCents: 0,
      })
      .returning();

    const [receipt] = await tx
      .insert(actionReceipts)
      .values({
        actionType: "WATCH_HARNESS_TEST_QUEUED",
        authorityClass: "OBSERVE",
        subjectType: "watch_run",
        subjectId: String(run.id),
        status: "QUEUED",
        actor: "watchtower-harness-queue",
        details: {
          jobId: job.id,
          jobSlug: job.slug,
          runtimeId,
          controlProofId: controlProof.id,
          workerProofId: workerProof.id,
          realWatcherStatus: "PAUSED",
          normalQueueEnabled: false,
          executorEnabled: false,
          externalActionsEnabled: false,
          estimatedCostCents: 0,
          safetyLock: "WATCHTOWER_HARNESS_GLOBAL",
        },
      })
      .returning();

    return { run, receipt, status: 200 } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json(outcome, { status: outcome.status });
  }

  return NextResponse.json({
    queued: true,
    proofClass: "EXTERNAL_DETERMINISTIC_WORKER_HARNESS",
    runtimeId,
    runId: outcome.run.id,
    receiptId: outcome.receipt.id,
    realWatchersPaused: true,
    normalQueueEnabled: false,
    executorEnabled: false,
    estimatedCostCents: 0,
  });
}
