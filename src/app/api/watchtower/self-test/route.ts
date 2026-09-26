import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireRecoveryAdmin } from "@/lib/admin-guard";

export async function POST(req: NextRequest) {
  const gate = requireRecoveryAdmin(req);
  if (gate) return gate;

  if (process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true") {
    return NextResponse.json(
      { error: "Self-test requires Watchtower queueing to remain disabled." },
      { status: 409 }
    );
  }

  if (process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true") {
    return NextResponse.json(
      { error: "Self-test requires the Watchtower executor to remain disabled." },
      { status: 409 }
    );
  }

  if (
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true" ||
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true"
  ) {
    return NextResponse.json(
      { error: "Self-test requires consequential commerce actions to remain disabled." },
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

  const nonPaused = jobs.filter((job) => job.status !== "PAUSED");
  const unsafeAuthority = jobs.filter(
    (job) => job.authority !== "OBSERVE" && job.authority !== "RECOMMEND"
  );
  const nonZeroBudgets = jobs.filter((job) => job.budgetCents !== 0);

  if (nonPaused.length || unsafeAuthority.length || nonZeroBudgets.length) {
    return NextResponse.json(
      {
        error: "Safe self-test preconditions are not satisfied.",
        allPaused: nonPaused.length === 0,
        boundedAuthority: unsafeAuthority.length === 0,
        zeroBudget: nonZeroBudgets.length === 0,
      },
      { status: 409 }
    );
  }

  const observeJob =
    jobs.find((job) => job.authority === "OBSERVE") ?? jobs[0];

  const [run] = await db
    .insert(watchRuns)
    .values({
      jobId: observeJob.id,
      status: "PASS",
      trigger: "CONTROL_TEST",
      summary:
        "Watchtower control-plane self-test passed. No source research, external network action, supplier action, publishing, spending, or fulfillment occurred.",
      findings: [
        {
          check: "jobs_paused",
          result: "PASS",
          count: jobs.length,
        },
        {
          check: "authority_ceiling",
          result: "PASS",
          allowed: ["OBSERVE", "RECOMMEND"],
        },
        {
          check: "budget_ceiling",
          result: "PASS",
          cents: 0,
        },
        {
          check: "queue",
          result: "PASS",
          state: "DISABLED",
        },
        {
          check: "executor",
          result: "PASS",
          state: "DISABLED",
        },
        {
          check: "external_actions",
          result: "PASS",
          state: "DISABLED",
        },
      ],
      evidenceRefs: [],
      modelProvider: null,
      estimatedCostCents: 0,
      startedAt: new Date(),
      completedAt: new Date(),
    })
    .returning();

  const [receipt] = await db
    .insert(actionReceipts)
    .values({
      actionType: "WATCHTOWER_CONTROL_SELF_TEST",
      authorityClass: "OBSERVE",
      subjectType: "watch_run",
      subjectId: String(run.id),
      status: "PASS",
      actor: "watchtower-control-self-test",
      details: {
        jobCount: jobs.length,
        allPaused: true,
        boundedAuthority: true,
        zeroBudget: true,
        queueEnabled: false,
        executorEnabled: false,
        externalActionsEnabled: false,
        researchPerformed: false,
      },
    })
    .returning();

  const [runReadback] = await db
    .select()
    .from(watchRuns)
    .where(eq(watchRuns.id, run.id))
    .limit(1);

  const [receiptReadback] = await db
    .select()
    .from(actionReceipts)
    .where(eq(actionReceipts.id, receipt.id))
    .limit(1);

  if (!runReadback || !receiptReadback) {
    return NextResponse.json(
      { error: "Self-test write/readback verification failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    proofClass: "CONTROL_PLANE_ONLY",
    runId: run.id,
    receiptId: receipt.id,
    jobCount: jobs.length,
    allPaused: true,
    boundedAuthority: true,
    zeroBudget: true,
    queueEnabled: false,
    executorEnabled: false,
    externalActionsEnabled: false,
    researchPerformed: false,
  });
}
