import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchCandidates, watchJobs, watchRuns } from "@/db/schema";
import { requireWatchtowerWorker } from "@/lib/watchtower/worker-auth";

const FINAL_STATUSES = new Set(["PASS", "NO_MATERIAL_CHANGE", "FAILED", "BLOCKED"]);

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

  if (run.status !== "RUNNING") {
    return NextResponse.json(
      {
        error: "Watch run is not in RUNNING state.",
        code: "WATCH_RUN_INVALID_STATE",
        currentStatus: run.status,
      },
      { status: 409 }
    );
  }

  const [job] = await db.select().from(watchJobs).where(eq(watchJobs.id, run.jobId)).limit(1);
  if (!job) {
    return NextResponse.json({ error: "Watch job not found." }, { status: 409 });
  }

  if (
    (job.authority !== "OBSERVE" && job.authority !== "RECOMMEND") ||
    job.budgetCents !== 0
  ) {
    return NextResponse.json(
      {
        error: "Watch run violates Watchtower R0 execution limits.",
        code:
          job.budgetCents !== 0
            ? "WATCHTOWER_NONZERO_BUDGET_LOCKED"
            : "WATCHTOWER_AUTHORITY_CEILING_EXCEEDED",
      },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const requestedStatus = String(body.status || "").toUpperCase();
  if (!FINAL_STATUSES.has(requestedStatus)) {
    return NextResponse.json({ error: "Invalid final run status." }, { status: 400 });
  }

  const estimatedCostCents = Math.max(0, Number(body.estimatedCostCents) || 0);
  const budgetExceeded = estimatedCostCents > job.budgetCents;
  const status = budgetExceeded ? "FAILED" : requestedStatus;
  const completedAt = new Date();

  const findings = Array.isArray(body.findings) ? body.findings : [];
  const evidenceRefs = Array.isArray(body.evidenceRefs) ? body.evidenceRefs : [];

  await db
    .update(watchRuns)
    .set({
      status,
      summary: String(body.summary || ""),
      findings,
      evidenceRefs,
      modelProvider: body.modelProvider ? String(body.modelProvider) : null,
      estimatedCostCents,
      errorMessage: budgetExceeded
        ? `Reported execution cost ${estimatedCostCents} exceeded job budget ${job.budgetCents}.`
        : body.errorMessage
          ? String(body.errorMessage)
          : null,
      completedAt,
    })
    .where(eq(watchRuns.id, run.id));

  const candidates = Array.isArray(body.candidates) ? (body.candidates as CandidateInput[]) : [];

  if (!budgetExceeded && (status === "PASS" || status === "NO_MATERIAL_CHANGE")) {
    for (const candidate of candidates.slice(0, 100)) {
      const title = String(candidate.title || "").trim();
      if (!title) continue;

      await db.insert(watchCandidates).values({
        jobId: job.id,
        runId: run.id,
        title: title.slice(0, 255),
        lane: String(candidate.lane || "general").slice(0, 60),
        sourceName: String(candidate.sourceName || "").slice(0, 255),
        sourceUrl: String(candidate.sourceUrl || "").slice(0, 1000),
        sourceCountry: candidate.sourceCountry
          ? String(candidate.sourceCountry).slice(0, 100)
          : null,
        truthState: String(candidate.truthState || "DISCOVERED").slice(0, 60),
        economics:
          candidate.economics && typeof candidate.economics === "object"
            ? (candidate.economics as Record<string, unknown>)
            : {},
        riskFlags: Array.isArray(candidate.riskFlags)
          ? candidate.riskFlags.map(String).slice(0, 50)
          : [],
        evidence: Array.isArray(candidate.evidence)
          ? (candidate.evidence as Record<string, unknown>[]).slice(0, 50)
          : [],
        recommendation: String(candidate.recommendation || "").slice(0, 5000),
        status: "NEW",
      });
    }
  }

  await db.insert(actionReceipts).values({
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
      candidateCount: budgetExceeded ? 0 : Math.min(candidates.length, 100),
    },
  });

  return NextResponse.json({
    accepted: true,
    runId: run.id,
    status,
    budgetExceeded,
  });
}
