import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireWatchtowerWorker } from "@/lib/watchtower/worker-auth";
import { ownerCredentialState } from "@/lib/admin-identity";
import { evaluateR0Job, evaluateWorkerModeExecutorState } from "@/lib/watchtower/policy";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";

function r0ExternalActionsDisabled() {
  return (
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED !== "true" &&
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED !== "true"
  );
}

export async function POST(req: NextRequest) {
  const requestedMode = (req.headers.get("x-norvana-worker-mode") || "standard").toLowerCase();
  const gate = await requireWatchtowerWorker(req);
  if (gate) return gate;
  const executorGate = evaluateWorkerModeExecutorState(
    requestedMode,
    process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true"
  );
  if (!executorGate.ok) {
    const status =
      executorGate.code === "WATCHTOWER_INVALID_WORKER_MODE"
        ? 400
        : executorGate.code === "WATCHTOWER_EXECUTOR_DISABLED"
          ? 503
          : 409;

    return NextResponse.json(
      { error: executorGate.reason, code: executorGate.code },
      { status }
    );
  }

  if (
    requestedMode === "harness" &&
    (process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true" ||
      process.env.IGNIAQUA_FEDERATION_ENABLED === "true")
  ) {
    return NextResponse.json(
      {
        error:
          "Harness worker mode requires the normal queue and IgniAqua federation to remain disabled.",
        code: "WATCHTOWER_HARNESS_REQUIRES_EXTERNAL_LOCK",
      },
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
    .where(
      and(
        eq(watchRuns.trigger, "CONTROL_TEST"),
        eq(watchRuns.status, "PASS"),
        eq(watchRuns.runtimeId, runtimeId)
      )
    )
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
    .where(
      and(
        eq(watchRuns.trigger, "WORKER_TEST"),
        eq(watchRuns.status, "PASS"),
        eq(watchRuns.runtimeId, runtimeId)
      )
    )
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

  const candidateWhere =
    requestedMode === "harness"
      ? and(eq(watchRuns.status, "QUEUED"), eq(watchRuns.trigger, "HARNESS_TEST"))
      : and(eq(watchRuns.status, "QUEUED"), ne(watchRuns.trigger, "HARNESS_TEST"));

  const [candidate] = await db
    .select()
    .from(watchRuns)
    .where(candidateWhere)
    .orderBy(asc(watchRuns.createdAt))
    .limit(1);

  if (!candidate) {
    return new NextResponse(null, { status: 204 });
  }

  if (candidate.runtimeId !== runtimeId) {
    return NextResponse.json(
      {
        error: "Queued run belongs to a different deployment and requires review.",
        code: "WATCHTOWER_STALE_RUNTIME_RUN",
        runId: candidate.id,
      },
      { status: 409 }
    );
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

  if (requestedMode === "harness" && job.authority !== "OBSERVE") {
    return NextResponse.json(
      {
        error: "Harness worker mode accepts OBSERVE authority only.",
        code: "WATCHTOWER_HARNESS_REQUIRES_OBSERVE",
      },
      { status: 409 }
    );
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
    details: {
      jobId: job.id,
      jobSlug: job.slug,
      workerMode: requestedMode,
      authMode: requestedMode === "harness" ? "GITHUB_OIDC" : "WORKER_SECRET",
    },
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
    workerMode: requestedMode,
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
