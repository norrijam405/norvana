import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireWatchtowerWorker } from "@/lib/watchtower/worker-auth";
import { ownerCredentialState } from "@/lib/admin-identity";
import { evaluateR0Job } from "@/lib/watchtower/policy";

function r0ExternalActionsDisabled() {
  return (
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED !== "true" &&
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED !== "true"
  );
}

export async function POST(req: NextRequest) {
  const gate = requireWatchtowerWorker(req);
  if (gate) return gate;

  if (process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Watchtower execution is disabled.", code: "WATCHTOWER_EXECUTOR_DISABLED" },
      { status: 503 }
    );
  }

  if (!r0ExternalActionsDisabled()) {
    return NextResponse.json(
      {
        error: "Watchtower R0 execution requires external commerce actions to remain disabled.",
        code: "WATCHTOWER_EXTERNAL_ACTIONS_MUST_BE_DISABLED",
      },
      { status: 409 }
    );
  }

  const ownerCredential = await ownerCredentialState();
  if (!ownerCredential.rotated) {
    return NextResponse.json(
      {
        error: "Permanent owner credential is required before Watchtower execution.",
        code: "WATCHTOWER_OWNER_PASSWORD_ROTATION_REQUIRED",
      },
      { status: 409 }
    );
  }

  const [controlProof] = await db
    .select({ id: watchRuns.id })
    .from(watchRuns)
    .where(and(eq(watchRuns.trigger, "CONTROL_TEST"), eq(watchRuns.status, "PASS")))
    .orderBy(desc(watchRuns.completedAt))
    .limit(1);

  if (!controlProof) {
    return NextResponse.json(
      {
        error: "Safe control-plane proof is required before Watchtower execution.",
        code: "WATCHTOWER_CONTROL_SELF_TEST_REQUIRED",
      },
      { status: 409 }
    );
  }

  const [workerProof] = await db
    .select({ id: watchRuns.id })
    .from(watchRuns)
    .where(and(eq(watchRuns.trigger, "WORKER_TEST"), eq(watchRuns.status, "PASS")))
    .orderBy(desc(watchRuns.completedAt))
    .limit(1);

  if (!workerProof) {
    return NextResponse.json(
      {
        error: "Deterministic worker contract proof is required before Watchtower execution.",
        code: "WATCHTOWER_WORKER_PROOF_REQUIRED",
      },
      { status: 409 }
    );
  }

  const [candidate] = await db
    .select()
    .from(watchRuns)
    .where(eq(watchRuns.status, "QUEUED"))
    .orderBy(asc(watchRuns.createdAt))
    .limit(1);

  if (!candidate) {
    return new NextResponse(null, { status: 204 });
  }

  const [job] = await db.select().from(watchJobs).where(eq(watchJobs.id, candidate.jobId)).limit(1);

  if (!job) {
    await db
      .update(watchRuns)
      .set({
        status: "FAILED",
        errorMessage: "Watch job no longer exists.",
        completedAt: new Date(),
      })
      .where(and(eq(watchRuns.id, candidate.id), eq(watchRuns.status, "QUEUED")));

    return NextResponse.json({ error: "Watch job not found." }, { status: 409 });
  }

  const policy = evaluateR0Job(job.authority, job.budgetCents);
  if (!policy.ok) {
    const reason = policy.code;

    const [blockedRun] = await db
      .update(watchRuns)
      .set({
        status: "BLOCKED",
        errorMessage: `Worker refused queued run: ${reason}.`,
        completedAt: new Date(),
      })
      .where(and(eq(watchRuns.id, candidate.id), eq(watchRuns.status, "QUEUED")))
      .returning();

    if (blockedRun) {
      await db.insert(actionReceipts).values({
        actionType: "WATCH_RUN_CLAIM_BLOCKED",
        authorityClass: job.authority,
        subjectType: "watch_run",
        subjectId: String(blockedRun.id),
        status: "BLOCKED",
        actor: "watchtower-worker",
        details: {
          jobId: job.id,
          jobSlug: job.slug,
          reason,
          budgetCents: job.budgetCents,
          authority: job.authority,
        },
      });
    }

    return NextResponse.json(
      { error: "Queued run violates Watchtower R0 execution limits.", code: reason },
      { status: 409 }
    );
  }

  const [run] = await db
    .update(watchRuns)
    .set({ status: "RUNNING", startedAt: new Date() })
    .where(and(eq(watchRuns.id, candidate.id), eq(watchRuns.status, "QUEUED")))
    .returning();

  if (!run) {
    return NextResponse.json({ retry: true }, { status: 409 });
  }

  await db.insert(actionReceipts).values({
    actionType: "WATCH_RUN_CLAIMED",
    authorityClass: job.authority,
    subjectType: "watch_run",
    subjectId: String(run.id),
    status: "RUNNING",
    actor: "watchtower-worker",
    details: { jobId: job.id, jobSlug: job.slug },
  });

  return NextResponse.json({
    run: {
      id: run.id,
      trigger: run.trigger,
      createdAt: run.createdAt,
    },
    job: {
      id: job.id,
      slug: job.slug,
      name: job.name,
      category: job.category,
      description: job.description,
      instructions: job.instructions,
      authority: job.authority,
      budgetCents: job.budgetCents,
      sourcePolicy: job.sourcePolicy,
    },
    hardLimits: {
      maySpendMoney: false,
      mayPublishProducts: false,
      mayPlaceOrders: false,
      mayChangePrices: false,
      mayActivateSuppliers: false,
      mayIssueRefunds: false,
    },
  });
}
