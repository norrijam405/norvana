import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import {
  evaluateHarnessEnvironmentSnapshot,
  evaluateHarnessWatcherSnapshot,
  evaluateStaleHarnessRetirement,
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

  const initialEnvironment = currentHarnessEnvironment();
  if (!initialEnvironment.ok) {
    return NextResponse.json(
      {
        error: "Stale harness retirement requires queue, executor, and all external action paths to remain disabled.",
        code: "WATCHTOWER_STALE_RETIREMENT_REQUIRES_LOCKDOWN",
      },
      { status: 409 }
    );
  }

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1}, ${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2})`
    );

    const environment = currentHarnessEnvironment();
    if (!environment.ok) {
      return {
        error: "Stale harness retirement requires queue, executor, and all external action paths to remain disabled.",
        code: "WATCHTOWER_STALE_RETIREMENT_REQUIRES_LOCKDOWN",
        status: 409,
      } as const;
    }

    const jobs = await tx.select().from(watchJobs).orderBy(asc(watchJobs.id));
    const watcherDecision = evaluateHarnessWatcherSnapshot(jobs);
    if (!watcherDecision.ok) {
      return {
        error: "All real watchers must remain PAUSED and within R0 policy before stale harness retirement.",
        code: "WATCHTOWER_STALE_RETIREMENT_WATCHERS_NOT_SAFE",
        status: 409,
      } as const;
    }

    const activeRuns = await tx
      .select()
      .from(watchRuns)
      .where(inArray(watchRuns.status, ["QUEUED", "RUNNING"]))
      .orderBy(asc(watchRuns.createdAt))
      .limit(20);

    if (!activeRuns.length) {
      return {
        retired: false,
        activeRunCount: 0,
        message: "No executable Watchtower run requires retirement.",
        status: 200,
      } as const;
    }

    if (activeRuns.length !== 1) {
      return {
        error: "Stale harness retirement refuses to act while multiple executable runs require review.",
        code: "WATCHTOWER_STALE_RETIREMENT_MULTIPLE_ACTIVE_RUNS",
        activeRunCount: activeRuns.length,
        status: 409,
      } as const;
    }

    const candidate = activeRuns[0];
    const decision = evaluateStaleHarnessRetirement({
      trigger: candidate.trigger,
      status: candidate.status,
      runRuntimeId: candidate.runtimeId,
      currentRuntimeId: runtimeId,
    });

    if (!decision.ok) {
      return {
        error: decision.reason,
        code: decision.code,
        runId: candidate.id,
        trigger: candidate.trigger,
        runStatus: candidate.status,
        status: 409,
      } as const;
    }

    const staleRuntimeId = candidate.runtimeId!;
    const now = new Date();

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
      .where(
        and(
          eq(watchRuns.id, candidate.id),
          eq(watchRuns.trigger, "HARNESS_TEST"),
          eq(watchRuns.status, "QUEUED"),
          eq(watchRuns.runtimeId, staleRuntimeId)
        )
      )
      .returning();

    if (!run) {
      return {
        error: "Stale harness run changed before the protected retirement transition completed.",
        code: "WATCHTOWER_STALE_RETIREMENT_STATE_CHANGED",
        status: 409,
      } as const;
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
          staleRuntimeId,
          currentRuntimeId: runtimeId,
          originalTrigger: "HARNESS_TEST",
          originalStatus: "QUEUED",
          reason: "WORKER_SECRET_ROTATION_RECOVERY",
          realWatcherStatus: "PAUSED",
          realWatcherCount: jobs.length,
          queueEnabled: false,
          executorEnabled: false,
          externalActionsEnabled: false,
          estimatedCostCents: 0,
          safetyLock: "WATCHTOWER_HARNESS_GLOBAL",
        },
      })
      .returning();

    return {
      retired: true,
      run,
      receipt,
      staleRuntimeId,
      realWatcherCount: jobs.length,
      status: 200,
    } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json(outcome, { status: outcome.status });
  }

  if (!outcome.retired) {
    return NextResponse.json({
      retired: false,
      activeRunCount: outcome.activeRunCount,
      message: outcome.message,
    });
  }

  return NextResponse.json({
    retired: true,
    runId: outcome.run.id,
    receiptId: outcome.receipt.id,
    status: outcome.run.status,
    staleRuntimeId: outcome.staleRuntimeId,
    currentRuntimeId: runtimeId,
    realWatchersPaused: true,
    realWatcherCount: outcome.realWatcherCount,
    queueEnabled: false,
    executorEnabled: false,
    externalActionsEnabled: false,
    estimatedCostCents: 0,
  });
}
