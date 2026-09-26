import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";

function secureEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

const SAFE_AUTHORITIES = new Set(["OBSERVE", "RECOMMEND"]);

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
    if (!SAFE_AUTHORITIES.has(job.authority)) {
      await db.insert(actionReceipts).values({
        actionType: "WATCH_RUN_QUEUE_BLOCKED",
        authorityClass: job.authority,
        subjectType: "watch_job",
        subjectId: String(job.id),
        status: "BLOCKED",
        actor: "watchtower-scheduler",
        details: {
          jobSlug: job.slug,
          reason: "AUTHORITY_CEILING_EXCEEDED",
          authority: job.authority,
        },
      });

      blocked.push({ jobId: job.id, reason: "AUTHORITY_CEILING_EXCEEDED" });
      continue;
    }

    if (job.budgetCents !== 0) {
      await db.insert(actionReceipts).values({
        actionType: "WATCH_RUN_QUEUE_BLOCKED",
        authorityClass: job.authority,
        subjectType: "watch_job",
        subjectId: String(job.id),
        status: "BLOCKED",
        actor: "watchtower-scheduler",
        details: {
          jobSlug: job.slug,
          reason: "NONZERO_R0_BUDGET",
          budgetCents: job.budgetCents,
        },
      });

      blocked.push({ jobId: job.id, reason: "NONZERO_R0_BUDGET" });
      continue;
    }
    const [run] = await db
      .insert(watchRuns)
      .values({
        jobId: job.id,
        status: "QUEUED",
        trigger: "SCHEDULE",
        summary: "Queued by Norvana Watchtower scheduler.",
      })
      .returning();

    const nextRunAt = new Date(now.getTime() + job.cadenceMinutes * 60_000);

    await db
      .update(watchJobs)
      .set({
        lastRunAt: now,
        nextRunAt,
        updatedAt: now,
      })
      .where(eq(watchJobs.id, job.id));

    await db.insert(actionReceipts).values({
      actionType: "WATCH_RUN_QUEUED",
      authorityClass: job.authority,
      subjectType: "watch_run",
      subjectId: String(run.id),
      status: "QUEUED",
      actor: "watchtower-scheduler",
      details: {
        jobId: job.id,
        jobSlug: job.slug,
        cadenceMinutes: job.cadenceMinutes,
        budgetCents: job.budgetCents,
      },
    });

    queued.push(run.id);
  }

  return NextResponse.json({
    ok: true,
    queueEnabled: true,
    queued: queued.length,
    runIds: queued,
    blocked,
  });
}
