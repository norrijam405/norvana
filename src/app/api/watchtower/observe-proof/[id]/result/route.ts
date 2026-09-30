import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import {
  evaluateActiveObserveProofInvariant,
  evaluateObserveProofEnvironmentSnapshot,
  evaluateObserveProofResultEffects,
  evaluateObserveProofWatcherSnapshot,
  WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_1,
  WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_2,
  WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG,
} from "@/lib/watchtower/policy";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";
import { requireWatchtowerObserveProofWorker } from "@/lib/watchtower/worker-auth";

const MAX_RESULT_BODY_BYTES = 64 * 1024;
const MAX_FINDINGS = 25;
const MAX_EVIDENCE_REFS = 25;
const FINAL_STATUSES = new Set(["PASS", "NO_MATERIAL_CHANGE", "FAILED", "BLOCKED"]);
const APPROVED_SOURCE_HOSTS = new Set(["ag.ok.gov", "ams.usda.gov", "www.ams.usda.gov"]);

function currentObserveProofEnvironment() {
  return evaluateObserveProofEnvironmentSnapshot({
    queueEnabled: process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true",
    executorEnabled: process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true",
    fulfillmentEnabled: process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true",
    supplierConnectorsEnabled: process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true",
    federationEnabled: process.env.IGNIAQUA_FEDERATION_ENABLED === "true",
  });
}

function objectRecords(value: unknown, max: number): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item)
    )
    .slice(0, max);
}

function approvedEvidenceUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !APPROVED_SOURCE_HOSTS.has(url.hostname.toLowerCase())) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireWatchtowerObserveProofWorker(req);
  if (gate) return gate;

  const environment = currentObserveProofEnvironment();
  if (!environment.ok) {
    return NextResponse.json(
      { error: environment.reason, code: environment.code },
      { status: 409 }
    );
  }

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

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_RESULT_BODY_BYTES) {
    return NextResponse.json(
      { error: "Observe-proof result payload is too large.", code: "WATCH_RESULT_TOO_LARGE" },
      { status: 413 }
    );
  }

  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_RESULT_BODY_BYTES) {
    return NextResponse.json(
      { error: "Observe-proof result payload is too large.", code: "WATCH_RESULT_TOO_LARGE" },
      { status: 413 }
    );
  }

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = rawBody ? JSON.parse(rawBody) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid object");
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Observe-proof result must be a JSON object.", code: "WATCH_RESULT_INVALID_JSON" },
      { status: 400 }
    );
  }

  const requestedStatus = String(body.status || "").toUpperCase();
  if (!FINAL_STATUSES.has(requestedStatus)) {
    return NextResponse.json({ error: "Invalid final run status." }, { status: 400 });
  }

  const estimatedCostCents =
    body.estimatedCostCents === undefined ? 0 : Number(body.estimatedCostCents);
  const candidates = Array.isArray(body.candidates) ? body.candidates : [];
  const effectDecision = evaluateObserveProofResultEffects({
    estimatedCostCents,
    candidateCount: candidates.length,
  });
  if (!effectDecision.ok) {
    return NextResponse.json(
      { error: effectDecision.reason, code: effectDecision.code },
      { status: 409 }
    );
  }

  const findings = objectRecords(body.findings, MAX_FINDINGS);
  const rawEvidenceRefs = objectRecords(body.evidenceRefs, MAX_EVIDENCE_REFS);
  const normalizedEvidence: Record<string, unknown>[] = [];

  for (const item of rawEvidenceRefs) {
    const sourceUrl = approvedEvidenceUrl(item.sourceUrl);
    if (!sourceUrl) {
      return NextResponse.json(
        {
          error: "Observe-proof evidence must use approved HTTPS public-source hosts.",
          code: "WATCHTOWER_OBSERVE_PROOF_EVIDENCE_SOURCE_NOT_APPROVED",
        },
        { status: 409 }
      );
    }

    normalizedEvidence.push({ ...item, sourceUrl });
  }

  if (
    (requestedStatus === "PASS" || requestedStatus === "NO_MATERIAL_CHANGE") &&
    normalizedEvidence.length === 0
  ) {
    return NextResponse.json(
      {
        error: "Successful observe proof requires at least one approved public-source evidence reference.",
        code: "WATCHTOWER_OBSERVE_PROOF_EVIDENCE_REQUIRED",
      },
      { status: 409 }
    );
  }

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_1}, ${WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_2})`
    );

    const [run] = await tx.select().from(watchRuns).where(eq(watchRuns.id, runId)).limit(1);
    if (!run) {
      return { error: "Watch run not found.", code: "WATCH_RUN_NOT_FOUND", status: 404 } as const;
    }

    if (
      run.trigger !== "OBSERVE_PROOF" ||
      run.status !== "RUNNING" ||
      run.runtimeId !== runtimeId
    ) {
      return {
        error: "Observe-proof result is stale, out of scope, or not RUNNING.",
        code: "WATCHTOWER_OBSERVE_PROOF_RESULT_SCOPE_INVALID",
        status: 409,
      } as const;
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

    const blockForSafetyDrift = async (code: string, reason: string) => {
      const [blocked] = await tx
        .update(watchRuns)
        .set({
          status: "BLOCKED",
          errorMessage: reason,
          summary: "Observe proof blocked because required safety state drifted.",
          completedAt: new Date(),
        })
        .where(
          and(
            eq(watchRuns.id, run.id),
            eq(watchRuns.status, "RUNNING"),
            eq(watchRuns.trigger, "OBSERVE_PROOF")
          )
        )
        .returning();

      if (blocked) {
        await tx.insert(actionReceipts).values({
          actionType: "WATCH_OBSERVE_PROOF_SAFETY_BLOCKED",
          authorityClass: "OBSERVE",
          subjectType: "watch_run",
          subjectId: String(blocked.id),
          status: "BLOCKED",
          actor: "watchtower-observe-proof-worker",
          details: {
            code,
            reason,
            runtimeId,
            estimatedCostCents: 0,
            candidateCount: 0,
          },
        });
      }

      return { error: reason, code, status: 409 } as const;
    };

    if (!controlProof || !workerProof) {
      return blockForSafetyDrift(
        "WATCHTOWER_OBSERVE_PROOF_PREREQUISITES_STALE",
        "Current-runtime Control Proof and Worker Proof are required at observe-proof finalization."
      );
    }

    const jobs = await tx.select().from(watchJobs).orderBy(asc(watchJobs.id));
    const watcherDecision = evaluateObserveProofWatcherSnapshot(jobs);
    if (!watcherDecision.ok) {
      return blockForSafetyDrift(watcherDecision.code, watcherDecision.reason);
    }

    const target = jobs.find((job) => job.slug === WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG);
    if (!target || target.id !== run.jobId) {
      return blockForSafetyDrift(
        "WATCHTOWER_OBSERVE_PROOF_TARGET_DRIFT",
        "Observe-proof run target no longer matches the approved Local Producer Watch."
      );
    }

    const activeExecutable = await tx
      .select({ id: watchRuns.id, trigger: watchRuns.trigger, status: watchRuns.status })
      .from(watchRuns)
      .where(inArray(watchRuns.status, ["QUEUED", "RUNNING"]))
      .orderBy(asc(watchRuns.createdAt));

    const activeObserve = activeExecutable.filter(
      (active) => active.trigger === "OBSERVE_PROOF"
    );
    const invariant = evaluateActiveObserveProofInvariant({
      activeRuns: activeObserve,
      expectedRunId: run.id,
      expectedStatus: "RUNNING",
    });

    if (!invariant.ok || activeExecutable.length !== 1) {
      return blockForSafetyDrift(
        invariant.ok
          ? "WATCHTOWER_OBSERVE_PROOF_EXECUTABLE_MULTIPLICITY"
          : invariant.code,
        invariant.ok
          ? "Observe-proof finalization refuses concurrent executable runs."
          : invariant.reason
      );
    }

    const [finalized] = await tx
      .update(watchRuns)
      .set({
        status: requestedStatus,
        summary: String(body.summary || "").slice(0, 10_000),
        findings,
        evidenceRefs: normalizedEvidence,
        modelProvider: String(
          body.modelProvider || "deterministic-public-source-observe-proof"
        ).slice(0, 100),
        estimatedCostCents: 0,
        errorMessage:
          requestedStatus === "FAILED" || requestedStatus === "BLOCKED"
            ? String(body.errorMessage || "").slice(0, 5_000)
            : null,
        completedAt: new Date(),
      })
      .where(
        and(
          eq(watchRuns.id, run.id),
          eq(watchRuns.status, "RUNNING"),
          eq(watchRuns.trigger, "OBSERVE_PROOF"),
          eq(watchRuns.runtimeId, runtimeId)
        )
      )
      .returning();

    if (!finalized) {
      return {
        error: "Observe-proof run was already finalized.",
        code: "WATCHTOWER_OBSERVE_PROOF_ALREADY_FINALIZED",
        status: 409,
      } as const;
    }

    const [receipt] = await tx
      .insert(actionReceipts)
      .values({
        actionType: "WATCH_OBSERVE_PROOF_COMPLETED",
        authorityClass: "OBSERVE",
        subjectType: "watch_run",
        subjectId: String(finalized.id),
        status: requestedStatus,
        actor: "watchtower-observe-proof-worker",
        details: {
          runtimeId,
          jobId: target.id,
          jobSlug: target.slug,
          authMode: "GITHUB_OIDC_OBSERVE_PROOF",
          estimatedCostCents: 0,
          candidateCount: 0,
          evidenceCount: normalizedEvidence.length,
          findingCount: findings.length,
        },
      })
      .returning();

    return { finalized, receipt, status: 200 } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json(
      { error: outcome.error, code: outcome.code },
      { status: outcome.status }
    );
  }

  return NextResponse.json({
    accepted: true,
    runId: outcome.finalized.id,
    status: outcome.finalized.status,
    receiptId: outcome.receipt.id,
    candidateCount: 0,
    estimatedCostCents: 0,
    evidenceCount: normalizedEvidence.length,
  });
}
