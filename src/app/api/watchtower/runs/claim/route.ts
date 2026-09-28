import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireWatchtowerWorker } from "@/lib/watchtower/worker-auth";
import { ownerCredentialState } from "@/lib/admin-identity";
import {
  evaluateActiveHarnessInvariant,
  evaluateHarnessEnvironmentSnapshot,
  evaluateHarnessTargetJob,
  evaluateHarnessWatcherSnapshot,
  evaluateR0Job,
  evaluateWorkerModeExecutorState,
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

  if (requestedMode === "harness") {
    const environment = currentHarnessEnvironment();
    if (!environment.ok) {
      return NextResponse.json(
        { error: environment.reason, code: environment.code },
        { status: 409 }
      );
    }
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

  if (requestedMode === "harness") {
    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select pg_advisory_xact_lock(${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1}, ${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2})`
      );

      const activeHarnesses = await tx
        .select()
        .from(watchRuns)
        .where(
          and(
            eq(watchRuns.trigger, "HARNESS_TEST"),
            inArray(watchRuns.status, ["QUEUED", "RUNNING"])
          )
        )
        .orderBy(asc(watchRuns.createdAt));

      if (!activeHarnesses.length) {
        return { noContent: true, status: 204 } as const;
      }

      if (activeHarnesses.length > 1) {
        const observedActiveHarnessIds = activeHarnesses.map((run) => run.id);
        const blockedHarnesses = await tx
          .update(watchRuns)
          .set({
            status: "BLOCKED",
            errorMessage:
              "HARNESS_TEST execution blocked because multiple active harness runs were present.",
            summary:
              "Harness proof invalidated because active HARNESS_TEST cardinality was greater than one.",
            completedAt: new Date(),
          })
          .where(
            and(
              eq(watchRuns.trigger, "HARNESS_TEST"),
              inArray(watchRuns.status, ["QUEUED", "RUNNING"])
            )
          )
          .returning();

        for (const blocked of blockedHarnesses) {
          await tx.insert(actionReceipts).values({
            actionType: "WATCH_HARNESS_MULTIPLICITY_BLOCKED",
            authorityClass: "OBSERVE",
            subjectType: "watch_run",
            subjectId: String(blocked.id),
            status: "BLOCKED",
            actor: "watchtower-harness-claim",
            details: {
              stage: "CLAIM",
              observedActiveHarnessIds,
              observedActiveHarnessCount: activeHarnesses.length,
              runtimeId,
              estimatedCostCents: 0,
              safetyLock: "WATCHTOWER_HARNESS_GLOBAL",
            },
          });
        }

        return {
          error: "Harness execution requires exactly one active HARNESS_TEST.",
          code: "WATCHTOWER_HARNESS_ACTIVE_CARDINALITY_INVALID",
          status: 409,
        } as const;
      }

      const [candidate] = activeHarnesses;
      const activeInvariant = evaluateActiveHarnessInvariant({
        activeRuns: activeHarnesses.map((run) => ({ id: run.id, status: run.status })),
        expectedRunId: candidate.id,
        expectedStatus: "QUEUED",
      });

      if (!activeInvariant.ok) {
        return {
          error: activeInvariant.reason,
          code: activeInvariant.code,
          status: 409,
        } as const;
      }

      const blockCandidate = async (code: string, reason: string) => {
        const [blocked] = await tx
          .update(watchRuns)
          .set({
            status: "BLOCKED",
            errorMessage: reason,
            summary: "HARNESS_TEST blocked because its required safety state was no longer current.",
            completedAt: new Date(),
          })
          .where(and(eq(watchRuns.id, candidate.id), eq(watchRuns.status, "QUEUED")))
          .returning();

        if (blocked) {
          await tx.insert(actionReceipts).values({
            actionType: "WATCH_HARNESS_CLAIM_SAFETY_BLOCKED",
            authorityClass: "OBSERVE",
            subjectType: "watch_run",
            subjectId: String(blocked.id),
            status: "BLOCKED",
            actor: "watchtower-harness-claim",
            details: {
              code,
              reason,
              runtimeId,
              originalRuntimeId: candidate.runtimeId,
              estimatedCostCents: 0,
              safetyLock: "WATCHTOWER_HARNESS_GLOBAL",
            },
          });
        }

        return { error: reason, code, status: 409 } as const;
      };

      if (candidate.runtimeId !== runtimeId) {
        return blockCandidate(
          "WATCHTOWER_STALE_RUNTIME_RUN",
          "Queued run belongs to a different deployment and requires review."
        );
      }

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
        return blockCandidate(
          "WATCHTOWER_HARNESS_PREREQUISITES_STALE",
          "Current-runtime Control Proof and Worker Proof are required at claim time."
        );
      }

      const jobs = await tx.select().from(watchJobs).orderBy(asc(watchJobs.id));
      const watcherDecision = evaluateHarnessWatcherSnapshot(jobs);
      if (!watcherDecision.ok) {
        return blockCandidate(watcherDecision.code, watcherDecision.reason);
      }

      const [job] = jobs.filter((item) => item.id === candidate.jobId);
      if (!job) {
        return blockCandidate(
          "WATCHTOWER_HARNESS_JOB_MISSING",
          "Harness target job no longer exists."
        );
      }

      const targetDecision = evaluateHarnessTargetJob(job.authority, job.budgetCents);
      if (!targetDecision.ok) {
        return blockCandidate(targetDecision.code, targetDecision.reason);
      }

      const [run] = await tx
        .update(watchRuns)
        .set({ status: "RUNNING", startedAt: new Date() })
        .where(and(eq(watchRuns.id, candidate.id), eq(watchRuns.status, "QUEUED")))
        .returning();

      if (!run) {
        return {
          error: "Harness run changed state before claim completed.",
          code: "WATCHTOWER_HARNESS_CLAIM_RACE_LOST",
          status: 409,
        } as const;
      }

      await tx.insert(actionReceipts).values({
        actionType: "WATCH_RUN_CLAIMED",
        authorityClass: job.authority,
        subjectType: "watch_run",
        subjectId: String(run.id),
        status: "RUNNING",
        actor: "watchtower-worker",
        details: {
          jobId: job.id,
          jobSlug: job.slug,
          workerMode: "harness",
          authMode: "GITHUB_OIDC",
          controlProofId: controlProof.id,
          workerProofId: workerProof.id,
          globalWatcherSnapshot: "ALL_PAUSED_R0_ZERO_BUDGET",
          safetyLock: "WATCHTOWER_HARNESS_GLOBAL",
        },
      });

      return { run, job, status: 200 } as const;
    });

    if ("noContent" in outcome) {
      return new NextResponse(null, { status: 204 });
    }
    if ("error" in outcome) {
      return NextResponse.json(
        { error: outcome.error, code: outcome.code },
        { status: outcome.status }
      );
    }

    return NextResponse.json({
      run: {
        id: outcome.run.id,
        trigger: outcome.run.trigger,
        createdAt: outcome.run.createdAt,
      },
      job: {
        id: outcome.job.id,
        slug: outcome.job.slug,
        name: outcome.job.name,
        category: outcome.job.category,
        description: outcome.job.description,
        instructions: outcome.job.instructions,
        authority: outcome.job.authority,
        budgetCents: outcome.job.budgetCents,
        sourcePolicy: outcome.job.sourcePolicy,
      },
      workerMode: "harness",
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

  const [candidate] = await db
    .select()
    .from(watchRuns)
    .where(and(eq(watchRuns.status, "QUEUED"), ne(watchRuns.trigger, "HARNESS_TEST")))
    .orderBy(asc(watchRuns.createdAt))
    .limit(1);

  if (!candidate) return new NextResponse(null, { status: 204 });

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
    return NextResponse.json({ error: "Watch job not found." }, { status: 409 });
  }

  const policy = evaluateR0Job(job.authority, job.budgetCents);
  if (!policy.ok) {
    return NextResponse.json(
      { error: "Queued run violates Watchtower R0 execution limits.", code: policy.code },
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
      workerMode: "standard",
      authMode: "WORKER_SECRET",
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
    workerMode: "standard",
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
