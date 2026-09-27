import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { ownerCredentialState } from "@/lib/admin-identity";
import { evaluateR0Job } from "@/lib/watchtower/policy";

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  if (
    process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true" ||
    process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true"
  ) {
    return NextResponse.json(
      {
        error: "Worker contract proof requires queueing and execution to remain disabled.",
        code: "WATCHTOWER_WORKER_PROOF_REQUIRES_DISABLED_EXECUTION",
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
        error: "Worker contract proof requires external action paths to remain disabled.",
        code: "WATCHTOWER_WORKER_PROOF_REQUIRES_EXTERNAL_LOCK",
      },
      { status: 409 }
    );
  }

  const ownerCredential = await ownerCredentialState();
  if (!ownerCredential.rotated) {
    return NextResponse.json(
      {
        error: "Permanent owner credential is required before worker contract proof.",
        code: "WATCHTOWER_OWNER_PASSWORD_ROTATION_REQUIRED",
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
        error: "Worker contract proof refuses to run while executable runs remain queued or running.",
        code: "WATCHTOWER_STALE_EXECUTABLE_RUNS_PRESENT",
        activeRunCount: activeRuns.length,
      },
      { status: 409 }
    );
  }

  const jobs = await db.select().from(watchJobs).orderBy(asc(watchJobs.id));
  if (!jobs.length) {
    return NextResponse.json(
      { error: "Watchtower is not initialized yet." },
      { status: 409 }
    );
  }

  const unsafe = jobs.find((job) => {
    const policy = evaluateR0Job(job.authority, job.budgetCents);
    return job.status !== "PAUSED" || !policy.ok;
  });

  if (unsafe) {
    return NextResponse.json(
      {
        error: "All watchers must remain PAUSED and within R0 policy for worker proof.",
        code: "WATCHTOWER_WORKER_PROOF_PRECONDITION_FAILED",
      },
      { status: 409 }
    );
  }

  const [controlProof] = await db
    .select({ id: watchRuns.id })
    .from(watchRuns)
    .where(and(eq(watchRuns.trigger, "CONTROL_TEST"), eq(watchRuns.status, "PASS")))
    .limit(1);

  if (!controlProof) {
    return NextResponse.json(
      {
        error: "Run the safe control-plane self-test before worker contract proof.",
        code: "WATCHTOWER_CONTROL_SELF_TEST_REQUIRED",
      },
      { status: 409 }
    );
  }

  const job = jobs.find((item) => item.authority === "OBSERVE") ?? jobs[0];
  const now = new Date();

  const proof = await db.transaction(async (tx) => {
    const [queued] = await tx
      .insert(watchRuns)
      .values({
        jobId: job.id,
        status: "QUEUED",
        trigger: "WORKER_TEST",
        summary: "Deterministic worker contract proof queued with no external execution.",
        findings: [],
        evidenceRefs: [],
        modelProvider: null,
        estimatedCostCents: 0,
      })
      .returning();

    const [queueReceipt] = await tx
      .insert(actionReceipts)
      .values({
        actionType: "WATCH_WORKER_TEST_QUEUED",
        authorityClass: job.authority,
        subjectType: "watch_run",
        subjectId: String(queued.id),
        status: "QUEUED",
        actor: "watchtower-worker-contract-self-test",
        details: {
          jobId: job.id,
          jobSlug: job.slug,
          externalNetworkUsed: false,
          executorUsed: false,
          estimatedCostCents: 0,
        },
      })
      .returning();

    const [running] = await tx
      .update(watchRuns)
      .set({
        status: "RUNNING",
        startedAt: now,
        summary: "Deterministic worker contract proof entered RUNNING state.",
      })
      .where(and(eq(watchRuns.id, queued.id), eq(watchRuns.status, "QUEUED")))
      .returning();

    if (!running) {
      throw new Error("Worker proof could not transition QUEUED to RUNNING.");
    }

    const [claimReceipt] = await tx
      .insert(actionReceipts)
      .values({
        actionType: "WATCH_WORKER_TEST_CLAIMED",
        authorityClass: job.authority,
        subjectType: "watch_run",
        subjectId: String(running.id),
        status: "RUNNING",
        actor: "watchtower-worker-contract-self-test",
        details: {
          jobId: job.id,
          jobSlug: job.slug,
          externalNetworkUsed: false,
          executorUsed: false,
          estimatedCostCents: 0,
        },
      })
      .returning();

    const [completed] = await tx
      .update(watchRuns)
      .set({
        status: "PASS",
        summary:
          "Worker contract proof passed: QUEUED -> RUNNING -> PASS with durable receipts, zero network, zero spend, and no candidates.",
        findings: [
          { check: "state_transition", result: "PASS", path: ["QUEUED", "RUNNING", "PASS"] },
          { check: "external_network", result: "PASS", used: false },
          { check: "automation_cost", result: "PASS", cents: 0 },
          { check: "candidate_emission", result: "PASS", count: 0 },
        ],
        evidenceRefs: [],
        modelProvider: "deterministic-worker-self-test",
        estimatedCostCents: 0,
        completedAt: now,
      })
      .where(and(eq(watchRuns.id, running.id), eq(watchRuns.status, "RUNNING")))
      .returning();

    if (!completed) {
      throw new Error("Worker proof could not transition RUNNING to PASS.");
    }

    const [completionReceipt] = await tx
      .insert(actionReceipts)
      .values({
        actionType: "WATCH_WORKER_TEST_COMPLETED",
        authorityClass: job.authority,
        subjectType: "watch_run",
        subjectId: String(completed.id),
        status: "PASS",
        actor: "watchtower-worker-contract-self-test",
        details: {
          jobId: job.id,
          jobSlug: job.slug,
          statePath: ["QUEUED", "RUNNING", "PASS"],
          externalNetworkUsed: false,
          executorUsed: false,
          candidateCount: 0,
          estimatedCostCents: 0,
        },
      })
      .returning();

    const [readback] = await tx
      .select()
      .from(watchRuns)
      .where(eq(watchRuns.id, completed.id))
      .limit(1);

    if (!readback || readback.status !== "PASS") {
      throw new Error("Worker proof final readback failed.");
    }

    return {
      run: completed,
      receipts: [queueReceipt.id, claimReceipt.id, completionReceipt.id],
    };
  });

  return NextResponse.json({
    ok: true,
    proofClass: "DETERMINISTIC_WORKER_CONTRACT",
    runId: proof.run.id,
    receiptIds: proof.receipts,
    statePath: ["QUEUED", "RUNNING", "PASS"],
    activeRunCount: 0,
    allWatchersPaused: true,
    queueEnabled: false,
    executorEnabled: false,
    externalNetworkUsed: false,
    externalActionsEnabled: false,
    candidateCount: 0,
    estimatedCostCents: 0,
  });
}
