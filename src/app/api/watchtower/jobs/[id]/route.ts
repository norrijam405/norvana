import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { watchJobs, watchRuns } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { ownerCredentialState } from "@/lib/admin-identity";
import { readJsonObjectLimited } from "@/lib/request-body";
import { evaluateWatcherEnable, isR0Authority } from "@/lib/watchtower/policy";

const SAFE_STATUS = new Set(["PAUSED", "ENABLED"]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  const { id } = await params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  const parsed = await readJsonObjectLimited(req, 32_768);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status }
    );
  }

  const body = parsed.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase();
    if (!SAFE_STATUS.has(status)) {
      return NextResponse.json({ error: "Invalid Watchtower status." }, { status: 400 });
    }

    if (status === "ENABLED") {
      const ownerCredential = await ownerCredentialState();

      const [proof] = await db
        .select({ id: watchRuns.id })
        .from(watchRuns)
        .where(and(eq(watchRuns.trigger, "CONTROL_TEST"), eq(watchRuns.status, "PASS")))
        .orderBy(desc(watchRuns.completedAt))
        .limit(1);

      const [workerProof] = await db
        .select({ id: watchRuns.id })
        .from(watchRuns)
        .where(and(eq(watchRuns.trigger, "WORKER_TEST"), eq(watchRuns.status, "PASS")))
        .orderBy(desc(watchRuns.completedAt))
        .limit(1);

      if (!proof) {
        return NextResponse.json(
          {
            error: "Run the Watchtower safe self-test before enabling a watcher.",
            code: "WATCHTOWER_CONTROL_SELF_TEST_REQUIRED",
          },
          { status: 409 }
        );
      }

      const [current] = await db
        .select()
        .from(watchJobs)
        .where(eq(watchJobs.id, jobId))
        .limit(1);

      if (!current) {
        return NextResponse.json({ error: "Watchtower job not found." }, { status: 404 });
      }

      const decision = evaluateWatcherEnable({
        ownerCredentialRotated: ownerCredential.rotated,
        controlSelfTestPassed: Boolean(proof),
        workerContractProofPassed: Boolean(workerProof),
        authority: current.authority,
        budgetCents: current.budgetCents,
      });

      if (!decision.ok) {
        return NextResponse.json(
          { error: decision.reason, code: decision.code },
          { status: 409 }
        );
      }

      updates.nextRunAt = new Date();
    }

    updates.status = status;
  }

  if (body.authority !== undefined) {
    const authority = String(body.authority).toUpperCase();
    if (!isR0Authority(authority)) {
      return NextResponse.json(
        { error: "ACT authority is locked in R0." },
        { status: 400 }
      );
    }
    updates.authority = authority;
  }

  if (body.cadenceMinutes !== undefined) {
    updates.cadenceMinutes = Math.max(60, Number(body.cadenceMinutes) || 1440);
  }

  if (body.instructions !== undefined) {
    updates.instructions = String(body.instructions).slice(0, 20_000);
  }

  const [job] = await db
    .update(watchJobs)
    .set(updates)
    .where(eq(watchJobs.id, jobId))
    .returning();

  if (!job) {
    return NextResponse.json({ error: "Watchtower job not found." }, { status: 404 });
  }

  return NextResponse.json(job);
}
