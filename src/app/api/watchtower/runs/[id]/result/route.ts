import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchCandidates, watchJobs, watchRuns } from "@/db/schema";
import { requireWatchtowerWorker } from "@/lib/watchtower/worker-auth";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";
import {
  evaluateActiveHarnessInvariant,
  evaluateHarnessEnvironmentSnapshot,
  evaluateHarnessResultEffects,
  evaluateHarnessTargetJob,
  evaluateHarnessWatcherSnapshot,
  evaluateR0Job,
  evaluateRunFinalizationState,
  WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1,
  WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2,
} from "@/lib/watchtower/policy";

const FINAL_STATUSES = new Set(["PASS", "NO_MATERIAL_CHANGE", "FAILED", "BLOCKED"]);
const MAX_RESULT_BODY_BYTES = 512_000;
const MAX_FINDINGS = 100;
const MAX_EVIDENCE_REFS = 100;

function objectRecords(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item)
    )
    .slice(0, limit);
}

function safeSourceUrl(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) return "";
  return raw.slice(0, 1000);
}

function currentHarnessEnvironment() {
  return evaluateHarnessEnvironmentSnapshot({
    queueEnabled: process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true",
    executorEnabled: process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true",
    fulfillmentEnabled: process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true",
    supplierConnectorsEnabled: process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true",
    federationEnabled: process.env.IGNIAQUA_FEDERATION_ENABLED === "true",
  });
}

type CandidateInput = {
  title?: unknown;
  lane?: unknown;
  sourceName?: unknown;
  sourceUrl?: unknown;
  sourceCountry?: unknown;
  truthState?: unknown;
  economics?: unknown;
  riskFlags?: unknown;
  evidence?: unknown;
  recommendation?: unknown;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestedMode = (req.headers.get("x-norvana-worker-mode") || "standard").toLowerCase();
  const gate = await requireWatchtowerWorker(req);
  if (gate) return gate;

  const { id } = await params;
  const runId = Number(id);
  if (!Number.isInteger(runId) || runId <= 0) {
    return NextResponse.json({ error: "Invalid run id." }, { status: 400 });
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

  const [initialRun] = await db.select().from(watchRuns).where(eq(watchRuns.id, runId)).limit(1);
  if (!initialRun) {
    return NextResponse.json({ error: "Watch run not found." }, { status: 404 });
  }

  if (initialRun.trigger === "HARNESS_TEST" && requestedMode !== "harness") {
    return NextResponse.json(
      {
        error: "HARNESS_TEST results require authenticated harness mode.",
        code: "WATCHTOWER_HARNESS_RESULT_REQUIRES_HARNESS_MODE",
      },
      { status: 409 }
    );
  }

  if (requestedMode === "harness" && initialRun.trigger !== "HARNESS_TEST") {
    return NextResponse.json(
      {
        error: "Harness mode may finalize HARNESS_TEST runs only.",
        code: "WATCHTOWER_HARNESS_MODE_RESULT_SCOPE_VIOLATION",
      },
      { status: 409 }
    );
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_RESULT_BODY_BYTES) {
    return NextResponse.json(
      { error: "Watch result payload is too large.", code: "WATCH_RESULT_TOO_LARGE" },
      { status: 413 }
    );
  }

  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_RESULT_BODY_BYTES) {
    return NextResponse.json(
      { error: "Watch result payload is too large.", code: "WATCH_RESULT_TOO_LARGE" },
      { status: 413 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed: unknown = rawBody ? JSON.parse(rawBody) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json(
        {
          error: "Watch result payload must be a JSON object.",
          code: "WATCH_RESULT_INVALID_OBJECT",
        },
        { status: 400 }
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Watch result payload must be valid JSON.", code: "WATCH_RESULT_INVALID_JSON" },
      { status: 400 }
    );
  }

  const requestedStatus = String(body.status || "").toUpperCase();
  if (!FINAL_STATUSES.has(requestedStatus)) {
    return NextResponse.json({ error: "Invalid final run status." }, { status: 400 });
  }

  const rawEstimatedCost =
    body.estimatedCostCents === undefined ? 0 : Number(body.estimatedCostCents);
  if (
    !Number.isFinite(rawEstimatedCost) ||
    rawEstimatedCost < 0 ||
    !Number.isInteger(rawEstimatedCost)
  ) {
    return NextResponse.json(
      {
        error: "estimatedCostCents must be a non-negative integer.",
        code: "WATCH_RESULT_INVALID_COST",
      },
      { status: 400 }
    );
  }

  const estimatedCostCents = rawEstimatedCost;
  const findings = objectRecords(body.findings, MAX_FINDINGS);
  const evidenceRefs = objectRecords(body.evidenceRefs, MAX_EVIDENCE_REFS);
  const candidates = objectRecords(body.candidates, 100) as CandidateInput[];

  const harnessEffectDecision = evaluateHarnessResultEffects({
    trigger: initialRun.trigger,
    estimatedCostCents,
    candidateCount: candidates.length,
  });
  if (!harnessEffectDecision.ok) {
    return NextResponse.json(
      { error: harnessEffectDecision.reason, code: harnessEffectDecision.code },
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

  const outcome = await db.transaction(async (tx) => {
    if (requestedMode === "harness") {
      await tx.execute(
        sql`select pg_advisory_xact_lock(${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1}, ${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2})`
      );
    }

    const [run] = await tx.select().from(watchRuns).where(eq(watchRuns.id, runId)).limit(1);
    if (!run) {
      return { error: "Watch run not found.", httpStatus: 404 } as const;
    }

    if (run.runtimeId !== runtimeId) {
      return {
        error: "Watch run belongs to a different deployment and cannot be finalized here.",
        code: "WATCHTOWER_STALE_RUNTIME_RUN",
        httpStatus: 409,
      } as const;
    }

    if (requestedMode === "harness") {
      const activeHarnesses = await tx
        .select({ id: watchRuns.id, status: watchRuns.status })
        .from(watchRuns)
        .where(
          and(
            eq(watchRuns.trigger, "HARNESS_TEST"),
            inArray(watchRuns.status, ["QUEUED", "RUNNING"])
          )
        )
        .orderBy(asc(watchRuns.createdAt));

      if (activeHarnesses.length > 1) {
        const observedActiveHarnessIds = activeHarnesses.map((active) => active.id);
        const blockedHarnesses = await tx
          .update(watchRuns)
          .set({
            status: "BLOCKED",
            errorMessage:
              "HARNESS_TEST finalization blocked because multiple active harness runs were present.",
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
            actor: "watchtower-harness-result",
            details: {
              stage: "FINALIZATION",
              observedActiveHarnessIds,
              observedActiveHarnessCount: activeHarnesses.length,
              requestedRunId: run.id,
              runtimeId,
              estimatedCostCents: 0,
              candidateCount: 0,
              safetyLock: "WATCHTOWER_HARNESS_GLOBAL",
            },
          });
        }

        return {
          error: "Harness finalization requires exactly one active HARNESS_TEST.",
          code: "WATCHTOWER_HARNESS_ACTIVE_CARDINALITY_INVALID",
          httpStatus: 409,
        } as const;
      }

      const activeInvariant = evaluateActiveHarnessInvariant({
        activeRuns: activeHarnesses,
        expectedRunId: run.id,
        expectedStatus: "RUNNING",
      });

      if (!activeInvariant.ok) {
        return {
          error: activeInvariant.reason,
          code: activeInvariant.code,
          httpStatus: 409,
        } as const;
      }
    }

    const stateDecision = evaluateRunFinalizationState(run.status);
    if (!stateDecision.ok) {
      return {
        error: stateDecision.reason,
        code: stateDecision.code,
        currentStatus: run.status,
        httpStatus: 409,
      } as const;
    }

    if (requestedMode === "harness" && run.trigger !== "HARNESS_TEST") {
      return {
        error: "Harness mode may finalize HARNESS_TEST runs only.",
        code: "WATCHTOWER_HARNESS_MODE_RESULT_SCOPE_VIOLATION",
        httpStatus: 409,
      } as const;
    }

    const [job] = await tx.select().from(watchJobs).where(eq(watchJobs.id, run.jobId)).limit(1);
    if (!job) {
      return { error: "Watch job not found.", httpStatus: 409 } as const;
    }

    if (requestedMode === "harness") {
      const blockForSafetyDrift = async (code: string, reason: string) => {
        const [blocked] = await tx
          .update(watchRuns)
          .set({
            status: "BLOCKED",
            errorMessage: reason,
            summary: "HARNESS_TEST finalization blocked because required safety state drifted.",
            completedAt: new Date(),
          })
          .where(and(eq(watchRuns.id, run.id), eq(watchRuns.status, "RUNNING")))
          .returning();

        if (blocked) {
          await tx.insert(actionReceipts).values({
            actionType: "WATCH_HARNESS_RESULT_SAFETY_BLOCKED",
            authorityClass: "OBSERVE",
            subjectType: "watch_run",
            subjectId: String(blocked.id),
            status: "BLOCKED",
            actor: "watchtower-harness-result",
            details: {
              code,
              reason,
              runtimeId,
              estimatedCostCents: 0,
              candidateCount: 0,
              safetyLock: "WATCHTOWER_HARNESS_GLOBAL",
            },
          });
        }

        return { error: reason, code, httpStatus: 409 } as const;
      };

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
        return blockForSafetyDrift(
          "WATCHTOWER_HARNESS_PREREQUISITES_STALE",
          "Current-runtime Control Proof and Worker Proof are required at finalization time."
        );
      }

      const jobs = await tx.select().from(watchJobs).orderBy(asc(watchJobs.id));
      const watcherDecision = evaluateHarnessWatcherSnapshot(jobs);
      if (!watcherDecision.ok) {
        return blockForSafetyDrift(watcherDecision.code, watcherDecision.reason);
      }

      const targetDecision = evaluateHarnessTargetJob(job.authority, job.budgetCents);
      if (!targetDecision.ok) {
        return blockForSafetyDrift(targetDecision.code, targetDecision.reason);
      }
    } else {
      const policy = evaluateR0Job(job.authority, job.budgetCents);
      if (!policy.ok) {
        return { error: policy.reason, code: policy.code, httpStatus: 409 } as const;
      }
    }

    const budgetExceeded = estimatedCostCents > job.budgetCents;
    const status = budgetExceeded ? "FAILED" : requestedStatus;
    const completedAt = new Date();

    const [finalizedRun] = await tx
      .update(watchRuns)
      .set({
        status,
        summary: String(body.summary || "").slice(0, 10_000),
        findings,
        evidenceRefs,
        modelProvider: body.modelProvider ? String(body.modelProvider).slice(0, 100) : null,
        estimatedCostCents,
        errorMessage: budgetExceeded
          ? `Reported execution cost ${estimatedCostCents} exceeded job budget ${job.budgetCents}.`
          : body.errorMessage
            ? String(body.errorMessage).slice(0, 5_000)
            : null,
        completedAt,
      })
      .where(and(eq(watchRuns.id, run.id), eq(watchRuns.status, "RUNNING")))
      .returning();

    if (!finalizedRun) {
      return {
        error: "Watch run was already finalized by another worker response.",
        code: "WATCH_RUN_ALREADY_FINALIZED",
        httpStatus: 409,
      } as const;
    }

    let insertedCandidateCount = 0;

    if (!budgetExceeded && (status === "PASS" || status === "NO_MATERIAL_CHANGE")) {
      for (const candidate of candidates) {
        const title = String(candidate.title || "").trim();
        if (!title) continue;

        await tx.insert(watchCandidates).values({
          jobId: job.id,
          runId: run.id,
          title: title.slice(0, 255),
          lane: String(candidate.lane || "general").slice(0, 60),
          sourceName: String(candidate.sourceName || "").slice(0, 255),
          sourceUrl: safeSourceUrl(candidate.sourceUrl),
          sourceCountry: candidate.sourceCountry
            ? String(candidate.sourceCountry).slice(0, 100)
            : null,
          truthState: String(candidate.truthState || "DISCOVERED").slice(0, 60),
          economics:
            candidate.economics &&
            typeof candidate.economics === "object" &&
            !Array.isArray(candidate.economics)
              ? (candidate.economics as Record<string, unknown>)
              : {},
          riskFlags: Array.isArray(candidate.riskFlags)
            ? candidate.riskFlags
                .filter((flag): flag is string => typeof flag === "string")
                .map((flag) => flag.slice(0, 200))
                .slice(0, 50)
            : [],
          evidence: objectRecords(candidate.evidence, 50),
          recommendation: String(candidate.recommendation || "").slice(0, 5000),
          status: "NEW",
        });

        insertedCandidateCount += 1;
      }
    }

    await tx.insert(actionReceipts).values({
      actionType: budgetExceeded ? "WATCH_RUN_BUDGET_OVERRUN" : "WATCH_RUN_COMPLETED",
      authorityClass: job.authority,
      subjectType: "watch_run",
      subjectId: String(run.id),
      status,
      actor: "watchtower-worker",
      details: {
        jobId: job.id,
        jobSlug: job.slug,
        estimatedCostCents,
        budgetCents: job.budgetCents,
        candidateCount: insertedCandidateCount,
        runtimeId,
        workerMode: requestedMode,
        authMode: requestedMode === "harness" ? "GITHUB_OIDC" : "WORKER_SECRET",
        ...(requestedMode === "harness"
          ? {
              globalWatcherSnapshot: "ALL_PAUSED_R0_ZERO_BUDGET",
              safetyLock: "WATCHTOWER_HARNESS_GLOBAL",
            }
          : {}),
      },
    });

    return {
      run: finalizedRun,
      candidateCount: insertedCandidateCount,
      budgetExceeded,
      status,
    } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json(
      {
        error: outcome.error,
        ...("code" in outcome ? { code: outcome.code } : {}),
        ...("currentStatus" in outcome ? { currentStatus: outcome.currentStatus } : {}),
      },
      { status: outcome.httpStatus }
    );
  }

  return NextResponse.json({
    accepted: true,
    runId: outcome.run.id,
    status: outcome.status,
    budgetExceeded: outcome.budgetExceeded,
    candidateCount: outcome.candidateCount,
  });
}
