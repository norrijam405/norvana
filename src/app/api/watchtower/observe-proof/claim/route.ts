import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { actionReceipts, watchJobs, watchRuns } from "@/db/schema";
import { ownerCredentialState } from "@/lib/admin-identity";
import {
  evaluateActiveObserveProofInvariant,
  evaluateObserveProofEnvironmentSnapshot,
  evaluateObserveProofWatcherSnapshot,
  WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_1,
  WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_2,
  WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG,
} from "@/lib/watchtower/policy";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";
import { requireWatchtowerObserveProofWorker } from "@/lib/watchtower/worker-auth";

const APPROVED_SOURCES = [
  {
    name: "Oklahoma Department of Agriculture, Food and Forestry — Market Development",
    url: "https://ag.ok.gov/divisions/market-development/",
    requiredAnyMarkers: ["Farmers Markets", "Made In Oklahoma"],
  },
  {
    name: "USDA Agricultural Marketing Service — Local Food Directories",
    url: "https://www.ams.usda.gov/services/local-regional/food-directories",
    requiredAnyMarkers: ["Local Food Directories", "farmers markets"],
  },
] as const;

function currentObserveProofEnvironment() {
  return evaluateObserveProofEnvironmentSnapshot({
    queueEnabled: process.env.NORVANA_WATCHTOWER_QUEUE_ENABLED === "true",
    executorEnabled: process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true",
    fulfillmentEnabled: process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true",
    supplierConnectorsEnabled: process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true",
    federationEnabled: process.env.IGNIAQUA_FEDERATION_ENABLED === "true",
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireWatchtowerObserveProofWorker(req);
  if (gate) return gate;

  const environment = currentObserveProofEnvironment();
  if (!environment.ok) {
    return NextResponse.json(
      { error: environment.reason, code: environment.code },
      { status: 409 }
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

  const owner = await ownerCredentialState();
  if (!owner.rotated) {
    return NextResponse.json(
      {
        error: "Permanent owner credential is required before observe proof.",
        code: "WATCHTOWER_OWNER_PASSWORD_ROTATION_REQUIRED",
      },
      { status: 409 }
    );
  }

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_1}, ${WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_2})`
    );

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
      return {
        error: "Current-runtime Control Proof and Worker Proof are required at observe-proof claim.",
        code: "WATCHTOWER_OBSERVE_PROOF_PREREQUISITES_STALE",
        status: 409,
      } as const;
    }

    const jobs = await tx.select().from(watchJobs).orderBy(asc(watchJobs.id));
    const watcherDecision = evaluateObserveProofWatcherSnapshot(jobs);
    if (!watcherDecision.ok) {
      return {
        error: watcherDecision.reason,
        code: watcherDecision.code,
        status: 409,
      } as const;
    }

    const target = jobs.find((job) => job.slug === WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG);
    if (!target) {
      return {
        error: "Local Producer Watch is missing.",
        code: "WATCHTOWER_OBSERVE_PROOF_TARGET_MISSING",
        status: 409,
      } as const;
    }

    const activeExecutable = await tx
      .select({ id: watchRuns.id, trigger: watchRuns.trigger, status: watchRuns.status })
      .from(watchRuns)
      .where(inArray(watchRuns.status, ["QUEUED", "RUNNING"]))
      .orderBy(asc(watchRuns.createdAt));

    const activeObserve = activeExecutable.filter(
      (run) => run.trigger === "OBSERVE_PROOF"
    );

    const invariant = evaluateActiveObserveProofInvariant({
      activeRuns: activeObserve,
      expectedStatus: "QUEUED",
    });
    if (!invariant.ok || activeExecutable.length !== 1) {
      return {
        error: invariant.ok
          ? "Observe-proof claim refuses concurrent executable runs."
          : invariant.reason,
        code: invariant.ok
          ? "WATCHTOWER_OBSERVE_PROOF_EXECUTABLE_MULTIPLICITY"
          : invariant.code,
        status: 409,
      } as const;
    }

    const runId = activeObserve[0].id;
    const [run] = await tx
      .select()
      .from(watchRuns)
      .where(eq(watchRuns.id, runId))
      .limit(1);

    if (!run || run.runtimeId !== runtimeId || run.jobId !== target.id) {
      return {
        error: "Queued observe proof is stale or bound to the wrong target.",
        code: "WATCHTOWER_OBSERVE_PROOF_RUN_BINDING_INVALID",
        status: 409,
      } as const;
    }

    const [claimed] = await tx
      .update(watchRuns)
      .set({
        status: "RUNNING",
        startedAt: new Date(),
        summary:
          "One-shot Local Producer Watch observe proof claimed by GitHub OIDC proof worker.",
      })
      .where(
        and(
          eq(watchRuns.id, run.id),
          eq(watchRuns.status, "QUEUED"),
          eq(watchRuns.trigger, "OBSERVE_PROOF"),
          eq(watchRuns.runtimeId, runtimeId)
        )
      )
      .returning();

    if (!claimed) {
      return {
        error: "Observe-proof run could not transition from QUEUED to RUNNING.",
        code: "WATCHTOWER_OBSERVE_PROOF_CLAIM_RACE",
        status: 409,
      } as const;
    }

    const [receipt] = await tx
      .insert(actionReceipts)
      .values({
        actionType: "WATCH_OBSERVE_PROOF_CLAIMED",
        authorityClass: "OBSERVE",
        subjectType: "watch_run",
        subjectId: String(claimed.id),
        status: "RUNNING",
        actor: "watchtower-observe-proof-worker",
        details: {
          runtimeId,
          jobId: target.id,
          jobSlug: target.slug,
          authMode: "GITHUB_OIDC_OBSERVE_PROOF",
          estimatedCostCents: 0,
        },
      })
      .returning();

    return { claimed, receipt, target, status: 200 } as const;
  });

  if ("error" in outcome) {
    return NextResponse.json(
      { error: outcome.error, code: outcome.code },
      { status: outcome.status }
    );
  }

  return NextResponse.json({
    workerMode: "observe-proof",
    run: {
      id: outcome.claimed.id,
      trigger: outcome.claimed.trigger,
      runtimeId: outcome.claimed.runtimeId,
      status: outcome.claimed.status,
    },
    job: {
      id: outcome.target.id,
      slug: outcome.target.slug,
      name: outcome.target.name,
      authority: outcome.target.authority,
      budgetCents: outcome.target.budgetCents,
      instructions: outcome.target.instructions,
      sourcePolicy: outcome.target.sourcePolicy,
    },
    hardLimits: {
      maySpendMoney: false,
      mayPublishProducts: false,
      mayPlaceOrders: false,
      mayChangePrices: false,
      mayActivateSuppliers: false,
      mayIssueRefunds: false,
      mayFulfillOrders: false,
      mayActivateFederation: false,
      mayEmitCandidates: false,
    },
    approvedSources: APPROVED_SOURCES,
    claimReceiptId: outcome.receipt.id,
  });
}
