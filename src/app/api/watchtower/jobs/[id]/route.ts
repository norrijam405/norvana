import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { ownerCredentialState } from "@/lib/admin-identity";
import { readJsonObjectLimited } from "@/lib/request-body";
import {
  evaluateWatcherEnable,
  isR0Authority,
  WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1,
  WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2,
} from "@/lib/watchtower/policy";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";

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

  const requestedStatus =
    body.status === undefined ? undefined : String(body.status).toUpperCase();
  if (requestedStatus !== undefined && !SAFE_STATUS.has(requestedStatus)) {
    return NextResponse.json({ error: "Invalid Watchtower status." }, { status: 400 });
  }

  const requestedAuthority =
    body.authority === undefined ? undefined : String(body.authority).toUpperCase();
  if (requestedAuthority !== undefined && !isR0Authority(requestedAuthority)) {
    return NextResponse.json({ error: "ACT authority is locked in R0." }, { status: 400 });
  }

  const runtimeId = requestedStatus === "ENABLED" ? currentWatchtowerRuntimeId() : null;
  if (requestedStatus === "ENABLED" && !runtimeId) {
    return NextResponse.json(
      {
        error: "Watchtower runtime identity is unavailable.",
        code: "WATCHTOWER_RUNTIME_ID_REQUIRED",
      },
      { status: 503 }
    );
  }

  const ownerCredential =
    requestedStatus === "ENABLED" ? await ownerCredentialState() : null;

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1}, ${WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2})`
    );

    const [current] = await tx
      .select()
      .from(watchJobs)
      .where(eq(watchJobs.id, jobId))
      .limit(1);

    if (!current) {
      return { error: "Watchtower job not found.", status: 404 } as const;
    }

    if (requestedStatus === "ENABLED") {
      const [proof] = await tx
        .select({ id: watchRuns.id })
        .from(watchRuns)
        .where(
          and(
            eq(watchRuns.trigger, "CONTROL_TEST"),
            eq(watchRuns.status, "PASS"),
            eq(watchRuns.runtimeId, runtimeId!)
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
            eq(watchRuns.runtimeId, runtimeId!)
          )
        )
        .orderBy(desc(watchRuns.completedAt))
        .limit(1);

      if (!proof) {
        return {
          error: "Run the Watchtower safe self-test before enabling a watcher.",
          code: "WATCHTOWER_CONTROL_SELF_TEST_REQUIRED",
          status: 409,
        } as const;
      }

      const decision = evaluateWatcherEnable({
        ownerCredentialRotated: Boolean(ownerCredential?.rotated),
        controlSelfTestPassed: Boolean(proof),
        workerContractProofPassed: Boolean(workerProof),
        authority: requestedAuthority ?? current.authority,
        budgetCents: current.budgetCents,
      });

      if (!decision.ok) {
        return {
          error: decision.reason,
          code: decision.code,
          status: 409,
        } as const;
      }
    }

    const safetyRelevantMutation =
      requestedStatus !== undefined || requestedAuthority !== undefined;

    if (safetyRelevantMutation) {
      const activeHarnesses = await tx
        .select()
        .from(watchRuns)
        .where(
          and(
            eq(watchRuns.trigger, "HARNESS_TEST"),
            inArray(watchRuns.status, ["QUEUED", "RUNNING"])
          )
        );

      for (const harness of activeHarnesses) {
        const [blocked] = await tx
          .update(watchRuns)
          .set({
            status: "BLOCKED",
            errorMessage:
              "HARNESS_TEST invalidated atomically because a real watcher safety state was mutated.",
            summary:
              "Harness proof invalidated before completion because watcher status or authority changed.",
            completedAt: new Date(),
          })
          .where(
            and(
              eq(watchRuns.id, harness.id),
              inArray(watchRuns.status, ["QUEUED", "RUNNING"])
            )
          )
          .returning();

        if (blocked) {
          await tx.insert(actionReceipts).values({
            actionType: "WATCH_HARNESS_INVALIDATED_BY_WATCHER_MUTATION",
            authorityClass: "OBSERVE",
            subjectType: "watch_run",
            subjectId: String(blocked.id),
            status: "BLOCKED",
            actor: "watchtower-owner-job-mutation",
            details: {
              mutatedJobId: current.id,
              requestedStatus: requestedStatus ?? null,
              requestedAuthority: requestedAuthority ?? null,
              priorJobStatus: current.status,
              priorJobAuthority: current.authority,
              priorHarnessStatus: harness.status,
              reason: "HARNESS_SAFETY_STATE_MUTATION",
              estimatedCostCents: 0,
              safetyLock: "WATCHTOWER_HARNESS_GLOBAL",
            },
          });
        }
      }
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (requestedStatus !== undefined) {
      if (requestedStatus === "ENABLED") updates.nextRunAt = new Date();
      updates.status = requestedStatus;
    }

    if (requestedAuthority !== undefined) {
      updates.authority = requestedAuthority;
    }

    if (body.cadenceMinutes !== undefined) {
      updates.cadenceMinutes = Math.max(60, Number(body.cadenceMinutes) || 1440);
    }

    if (body.instructions !== undefined) {
      updates.instructions = String(body.instructions).slice(0, 20_000);
    }

    const [job] = await tx
      .update(watchJobs)
      .set(updates)
      .where(eq(watchJobs.id, jobId))
      .returning();

    if (!job) {
      return { error: "Watchtower job not found.", status: 404 } as const;
    }

    return { job, status: 200 } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json(
      { error: outcome.error, ...("code" in outcome ? { code: outcome.code } : {}) },
      { status: outcome.status }
    );
  }

  return NextResponse.json(outcome.job);
}
