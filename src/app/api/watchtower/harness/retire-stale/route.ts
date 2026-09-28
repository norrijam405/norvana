import { NextRequest, NextResponse } from "next/server";
import { asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import {
  evaluateR0Job,
  evaluateStaleHarnessRetirement,
} from "@/lib/watchtower/policy";
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

  if (
    process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true" ||
    process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true" ||
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true" ||
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true" ||
    process.env.IGNIAQUA_FEDERATION_ENABLED === "true"
  ) {
    return NextResponse.json(
      {
        error: "Stale harness retirement requires queue, executor, and all external action paths to remain disabled.",
        code: "WATCHTOWER_STALE_RETIREMENT_REQUIRES_LOCKDOWN",
      },
      { status: 409 }
    );
  }

  const jobs = await db.select().from(watchJobs).orderBy(asc(watchJobs.id));
  const unsafeJob = jobs.find(
    (job) => job.status !== "PAUSED" || !evaluateR0Job(job.authority, job.budgetCents).ok
  );
  if (!jobs.length || unsafeJob) {
    return NextResponse.json(
      {
        error: "All real watchers must remain PAUSED and within R0 policy before stale harness retirement.",
        code: "WATCHTOWER_STALE_RETIREMENT_WATCHERS_NOT_SAFE",
      },
      { status: 409 }
    );
  }

  const activeRuns = await db
    .select()
    .from(watchRuns)
    .where(inArray(watchRuns.status, ["QUEUED", "RUNNING"]))
    .orderBy(asc(watchRuns.createdAt))
    .limit(20);

  if (!activeRuns.length) {
    return NextResponse.json({
      retired: false,
      activeRunCount: 0,
      message: "No executable Watchtower run requires retirement.",
    });
  }

  if (activeRuns.length !== 1) {
    return NextResponse.json(
      {
        error: "Stale harness retirement refuses to act while multiple executable runs require review.",
        code: "WATCHTOWER_STALE_RETIREMENT_MULTIPLE_ACTIVE_RUNS",
        activeRunCount: activeRuns.length,
      },
      { status: 409 }
    );
  }

  const candidate = activeRuns[0];
  const decision = evaluateStaleHarnessRetirement({
    trigger: candidate.trigger,
    status: candidate.status,
    runRuntimeId: candidate.runtimeId,
    currentRuntimeId: runtimeId,
  });

  if (!decision.ok) {
    return NextResponse.json(
      {
        error: decision.reason,
        code: decision.code,
        runId: candidate.id,
        trigger: candidate.trigger,
        status: candidate.status,
      },
      { status: 409 }
    );
  }

  const now = new Date();
  const retired = await db.transaction(async (tx) => {
    const [run] = await tx
      .update(watchRuns)
      .set({
        status: "BLOCKED",
        summary:
          "Stale HARNESS_TEST retired after worker-secret recovery required a new deployment. No harness execution occurred.",
        errorMessage:
          "Retired as stale after unrecoverable sensitive worker secret required controlled rotation and redeployment.",
        completedAt: now,
      })
      .where(inArray(watchRuns.id, [candidate.id]))
      .returning();

    if (!run || run.status !== "BLOCKED") {
      throw new Error("Stale harness run retirement failed.");
    }

    const [receipt] = await tx
      .insert(actionReceipts)
      .values({
        actionType: "WATCH_HARNESS_STALE_RUN_RETIRED",
        authorityClass: "OBSERVE",
        subjectType: "watch_run",
        subjectId: String(run.id),
        status: "BLOCKED",
        actor: "watchtower-owner-stale-run-retirement",
        details: {
          staleRuntimeId: candidate.runtimeId,
          currentRuntimeId: runtimeId,
          originalTrigger: candidate.trigger,
          originalStatus: candidate.status,
          reason: "WORKER_SECRET_ROTATION_RECOVERY",
          queueEnabled: false,
          executorEnabled: false,
          externalActionsEnabled: false,
          estimatedCostCents: 0,
        },
      })
      .returning();

    return { run, receipt };
  });

  return NextResponse.json({
    retired: true,
    runId: retired.run.id,
    receiptId: retired.receipt.id,
    status: retired.run.status,
    staleRuntimeId: candidate.runtimeId,
    currentRuntimeId: runtimeId,
    realWatchersPaused: true,
    queueEnabled: false,
    executorEnabled: false,
    externalActionsEnabled: false,
    estimatedCostCents: 0,
  });
}
