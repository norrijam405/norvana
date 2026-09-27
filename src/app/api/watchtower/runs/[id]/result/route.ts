import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchCandidates, watchJobs, watchRuns } from "@/db/schema";
import { requireWatchtowerWorker } from "@/lib/watchtower/worker-auth";
import {
  evaluateR0Job,
  evaluateRunFinalizationState,
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
  const gate = requireWatchtowerWorker(req);
  if (gate) return gate;

  const { id } = await params;
  const runId = Number(id);
  if (!Number.isInteger(runId) || runId <= 0) {
    return NextResponse.json({ error: "Invalid run id." }, { status: 400 });
  }

  const [run] = await db.select().from(watchRuns).where(eq(watchRuns.id, runId)).limit(1);
  if (!run) {
    return NextResponse.json({ error: "Watch run not found." }, { status: 404 });
  }

  const stateDecision = evaluateRunFinalizationState(run.status);
  if (!stateDecision.ok) {
    return NextResponse.json(
      {
        error: stateDecision.reason,
        code: stateDecision.code,
        currentStatus: run.status,
      },
      { status: 409 }
    );
  }

  const [job] = await db.select().from(watchJobs).where(eq(watchJobs.id, run.jobId)).limit(1);
  if (!job) {
    return NextResponse.json({ error: "Watch job not found." }, { status: 409 });
  }

  const policy = evaluateR0Job(job.authority, job.budgetCents);
  if (!policy.ok) {
    return NextResponse.json(
      {
        error: policy.reason,
        code: policy.code,
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

  const rawEstimatedCost = body.estimatedCostCents === undefined
    ? 0
    : Number(body.estimatedCostCents);

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
  const budgetExceeded = estimatedCostCents > job.budgetCents;
  const status = budgetExceeded ? "FAILED" : requestedStatus;
  const completedAt = new Date();

  const findings = objectRecords(body.findings, MAX_FINDINGS);
  const evidenceRefs = objectRecords(body.evidenceRefs, MAX_EVIDENCE_REFS);

  const candidates = objectRecords(body.candidates, 100) as CandidateInput[];

  const finalized = await db.transaction(async (tx) => {
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

    if (!finalizedRun) return null;

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
      },
    });

    return {
      run: finalizedRun,
      candidateCount: insertedCandidateCount,
    };
  });

  if (!finalized) {
    return NextResponse.json(
      {
        error: "Watch run was already finalized by another worker response.",
        code: "WATCH_RUN_ALREADY_FINALIZED",
      },
      { status: 409 }
    );
  }

  return NextResponse.json({
    accepted: true,
    runId: finalized.run.id,
    status,
    budgetExceeded,
    candidateCount: finalized.candidateCount,
  });
}
