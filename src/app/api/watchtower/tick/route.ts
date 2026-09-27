import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { ownerCredentialState } from "@/lib/admin-identity";
import { evaluateR0Job } from "@/lib/watchtower/policy";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";

function r0ExternalActionsDisabled() {
  return (
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED !== "true" &&
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED !== "true"
  );
}

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expected = process.env.NORVANA_WATCHTOWER_CRON_SECRET;
  const supplied = req.headers.get("x-norvana-watchtower-cron-secret");

  if (!expected || !supplied || !secureEqual(expected, supplied)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED !== "true") {
    return NextResponse.json({
      ok: true,
      queueEnabled: false,
      queued: 0,
      message: "Watchtower scheduler is configured but queueing is disabled.",
    });
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
        error: "Watchtower R0 queueing requires external commerce actions to remain disabled.",
        code: "WATCHTOWER_EXTERNAL_ACTIONS_MUST_BE_DISABLED",
      },
      { status: 409 }
    );
  }

  const ownerCredential = await ownerCredentialState();
  if (!ownerCredential.rotated) {
    return NextResponse.json(
      {
        error: "Permanent owner credential is required before Watchtower queueing.",
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
        error: "Safe control-plane proof is required before Watchtower queueing.",
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
        error: "Deterministic worker contract proof is required before Watchtower queueing.",
        code: "WATCHTOWER_WORKER_PROOF_REQUIRED",
      },
      { status: 409 }
    );
  }

  const now = new Date();
  const due = await db
    .select()
    .from(watchJobs)
    .where(
      and(
        eq(watchJobs.status, "ENABLED"),
        or(isNull(watchJobs.nextRunAt), lte(watchJobs.nextRunAt, now))
      )
    );

  const queued: number[] = [];
  const blocked: { jobId: number; reason: string }[] = [];

  for (const job of due) {
    const policy = evaluateR0Job(job.authority, job.budgetCents);
    if (!policy.ok) {
      await db.insert(actionReceipts).values({
        actionType: "WATCH_RUN_QUEUE_BLOCKED",
        authorityClass: job.authority,
        subjectType: "watch_job",
        subjectId: String(job.id),
        status: "BLOCKED",
        actor: "watchtower-scheduler",
        details: {
          jobSlug: job.slug,
          reason: policy.code,
          authority: job.authority,
          budgetCents: job.budgetCents,
        },
      });

      blocked.push({ jobId: job.id, reason: policy.code });
      continue;
    }
    const nextRunAt = new Date(now.getTime() + job.cadenceMinutes * 60_000);

    const run = await db.transaction(async (tx) => {
      const [claimedJob] = await tx
        .update(watchJobs)
        .set({
          lastRunAt: now,
          nextRunAt,
          updatedAt: now,
        })
        .where(
          and(
            eq(watchJobs.id, job.id),
            eq(watchJobs.status, "ENABLED"),
            eq(watchJobs.budgetCents, 0),
            or(
              eq(watchJobs.authority, "OBSERVE"),
              eq(watchJobs.authority, "RECOMMEND")
            ),
            or(isNull(watchJobs.nextRunAt), lte(watchJobs.nextRunAt, now))
          )
        )
        .returning();

      if (!claimedJob) return null;

      const [queuedRun] = await tx
        .insert(watchRuns)
        .values({
          jobId: claimedJob.id,
          status: "QUEUED",
          trigger: "SCHEDULE",
          runtimeId,
          summary: "Queued by Norvana Watchtower scheduler.",
        })
        .returning();

      await tx.insert(actionReceipts).values({
        actionType: "WATCH_RUN_QUEUED",
        authorityClass: claimedJob.authority,
        subjectType: "watch_run",
        subjectId: String(queuedRun.id),
        status: "QUEUED",
        actor: "watchtower-scheduler",
        details: {
          jobId: claimedJob.id,
          jobSlug: claimedJob.slug,
          cadenceMinutes: claimedJob.cadenceMinutes,
          budgetCents: claimedJob.budgetCents,
          runtimeId,
        },
      });

      return queuedRun;
    });

    if (run) queued.push(run.id);
  }

  return NextResponse.json({
    ok: true,
    queueEnabled: true,
    queued: queued.length,
    runIds: queued,
    blocked,
  });
}
