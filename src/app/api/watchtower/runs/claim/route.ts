import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireWatchtowerWorker } from "@/lib/watchtower/worker-auth";

export async function POST(req: NextRequest) {
  const gate = requireWatchtowerWorker(req);
  if (gate) return gate;

  if (process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Watchtower execution is disabled.", code: "WATCHTOWER_EXECUTOR_DISABLED" },
      { status: 503 }
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

  const [run] = await db
    .update(watchRuns)
    .set({ status: "RUNNING", startedAt: new Date() })
    .where(and(eq(watchRuns.id, candidate.id), eq(watchRuns.status, "QUEUED")))
    .returning();

  if (!run) {
    return NextResponse.json({ retry: true }, { status: 409 });
  }

  const [job] = await db.select().from(watchJobs).where(eq(watchJobs.id, run.jobId)).limit(1);

  if (!job) {
    await db
      .update(watchRuns)
      .set({
        status: "FAILED",
        errorMessage: "Watch job no longer exists.",
        completedAt: new Date(),
      })
      .where(eq(watchRuns.id, run.id));

    return NextResponse.json({ error: "Watch job not found." }, { status: 409 });
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
