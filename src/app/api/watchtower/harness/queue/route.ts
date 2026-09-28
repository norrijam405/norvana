import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { ownerCredentialState } from "@/lib/admin-identity";
import { evaluateR0Job } from "@/lib/watchtower/policy";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";

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

  if (process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true") {
    return NextResponse.json(
      {
        error: "Harness queueing requires the normal scheduler queue to remain disabled.",
        code: "WATCHTOWER_HARNESS_REQUIRES_QUEUE_DISABLED",
      },
      { status: 409 }
    );
  }

  if (process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true") {
    return NextResponse.json(
      {
        error: "Queue the harness proof while the executor is still disabled.",
        code: "WATCHTOWER_HARNESS_QUEUE_REQUIRES_EXECUTOR_DISABLED",
      },
      { status: 409 }
    );
  }

  if (
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true" ||
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true" ||
    process.env.IGNIAQUA_FEDERATION_ENABLED === "true"
  ) {
    return NextResponse.json(
      {
        error: "Harness proof requires all consequential external action paths to remain disabled.",
        code: "WATCHTOWER_HARNESS_REQUIRES_EXTERNAL_LOCK",
      },
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

  const [controlProof] = await db
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

  const [workerProof] = await db
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
    return NextResponse.json(
      {
        error: "Current-deployment Control Proof and Worker Proof are required first.",
        code: "WATCHTOWER_HARNESS_PREREQUISITES_REQUIRED",
      },
      { status: 409 }
    );
  }

  const activeRuns = await db
    .select({ id: watchRuns.id, status: watchRuns.status })
    .from(watchRuns)
    .where(inArray(watchRuns.status, ["QUEUED", "RUNNING"]))
    .limit(10);

  if (activeRuns.length) {
    return NextResponse.json(
      {
        error: "Harness proof requires an empty executable queue.",
        code: "WATCHTOWER_STALE_EXECUTABLE_RUNS_PRESENT",
        activeRunCount: activeRuns.length,
      },
      { status: 409 }
    );
  }

  const jobs = await db.select().from(watchJobs).orderBy(asc(watchJobs.id));
  const unsafe = jobs.find((job) => job.status !== "PAUSED" || !evaluateR0Job(job.authority, job.budgetCents).ok);

  if (!jobs.length || unsafe) {
    return NextResponse.json(
      {
        error: "All real watchers must remain PAUSED and within R0 policy for harness proof.",
        code: "WATCHTOWER_HARNESS_WATCHERS_NOT_SAFE",
      },
      { status: 409 }
    );
  }

  const job = jobs.find((item) => item.authority === "OBSERVE");
  if (!job) {
    return NextResponse.json(
      {
        error: "Harness proof requires an OBSERVE watcher.",
        code: "WATCHTOWER_HARNESS_OBSERVE_JOB_REQUIRED",
      },
      { status: 409 }
    );
  }

  const proof = await db.transaction(async (tx) => {
    const [run] = await tx
      .insert(watchRuns)
      .values({
        jobId: job.id,
        status: "QUEUED",
        trigger: "HARNESS_TEST",
        runtimeId,
        summary:
          "Queued for external deterministic worker harness proof. Real watcher remains PAUSED.",
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
          realWatcherStatus: "PAUSED",
          normalQueueEnabled: false,
          executorEnabled: false,
          externalActionsEnabled: false,
          estimatedCostCents: 0,
        },
      })
      .returning();

    return { run, receipt };
  });

  return NextResponse.json({
    queued: true,
    proofClass: "EXTERNAL_DETERMINISTIC_WORKER_HARNESS",
    runtimeId,
    runId: proof.run.id,
    receiptId: proof.receipt.id,
    realWatchersPaused: true,
    normalQueueEnabled: false,
    executorEnabled: false,
    estimatedCostCents: 0,
  });
}
