import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateR0Job,
  evaluateRunFinalizationState,
  evaluateStaleHarnessRetirement,
  evaluateActiveHarnessInvariant,
  evaluateHarnessEnvironmentSnapshot,
  evaluateHarnessResultEffects,
  evaluateHarnessTargetJob,
  evaluateHarnessWatcherSnapshot,
  evaluateGitHubHarnessClaims,
  evaluateGitHubObserveProofClaims,
  evaluateGitHubR1QueueClaims,
  evaluateR1QueueCadence,
  WATCHTOWER_R1_MIN_INTERVAL_MS,
  WATCHTOWER_R1_WORKFLOW_REF,
  WATCHTOWER_REQUIRED_JOB_SLUGS,
  evaluateObserveProofEnvironmentSnapshot,
  evaluateObserveProofTargetJob,
  evaluateObserveProofWatcherSnapshot,
  evaluateActiveObserveProofInvariant,
  evaluateObserveProofResultEffects,
  evaluateWatcherEnable,
  evaluateWorkerModeExecutorState,
  isR0Authority,
} from "../src/lib/watchtower/policy.ts";
import {
  evaluateAuthenticatedBrowserMutationOrigin,
  evaluateAuthenticatedBrowserReadOrigin,
} from "../src/lib/browser-origin.ts";
import { WATCHTOWER_JOB_TEMPLATES } from "../src/lib/watchtower/default-jobs.ts";

test("R0 accepts only OBSERVE and RECOMMEND authority", () => {
  assert.equal(isR0Authority("OBSERVE"), true);
  assert.equal(isR0Authority("RECOMMEND"), true);
  assert.equal(isR0Authority("ACT"), false);
  assert.equal(isR0Authority(""), false);
});

test("R0 rejects any nonzero automation budget", () => {
  assert.deepEqual(evaluateR0Job("OBSERVE", 0), { ok: true });
  assert.equal(evaluateR0Job("OBSERVE", 1).ok, false);
  assert.equal(evaluateR0Job("RECOMMEND", 500).ok, false);
});

test("worker mode keeps the real executor locked during harness proof", () => {
  assert.deepEqual(evaluateWorkerModeExecutorState("standard", true), { ok: true });

  const standardOff = evaluateWorkerModeExecutorState("standard", false);
  assert.equal(standardOff.ok, false);
  if (!standardOff.ok) assert.equal(standardOff.code, "WATCHTOWER_EXECUTOR_DISABLED");

  assert.deepEqual(evaluateWorkerModeExecutorState("harness", false), { ok: true });

  const harnessOn = evaluateWorkerModeExecutorState("harness", true);
  assert.equal(harnessOn.ok, false);
  if (!harnessOn.ok) {
    assert.equal(harnessOn.code, "WATCHTOWER_HARNESS_REQUIRES_EXECUTOR_DISABLED");
  }

  const invalid = evaluateWorkerModeExecutorState("other", false);
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.code, "WATCHTOWER_INVALID_WORKER_MODE");
});

test("watcher enable requires permanent owner credential", () => {
  const result = evaluateWatcherEnable({
    ownerCredentialRotated: false,
    controlSelfTestPassed: true,
    workerContractProofPassed: true,
    authority: "OBSERVE",
    budgetCents: 0,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "WATCHTOWER_OWNER_PASSWORD_ROTATION_REQUIRED");
  }
});

test("watcher enable requires successful control self-test", () => {
  const result = evaluateWatcherEnable({
    ownerCredentialRotated: true,
    controlSelfTestPassed: false,
    workerContractProofPassed: true,
    authority: "OBSERVE",
    budgetCents: 0,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "WATCHTOWER_CONTROL_SELF_TEST_REQUIRED");
  }
});

test("watcher enable requires deterministic worker proof", () => {
  const result = evaluateWatcherEnable({
    ownerCredentialRotated: true,
    controlSelfTestPassed: true,
    workerContractProofPassed: false,
    authority: "OBSERVE",
    budgetCents: 0,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "WATCHTOWER_WORKER_PROOF_REQUIRED");
  }
});

test("watcher enable rejects ACT and paid budgets even after prerequisites", () => {
  const act = evaluateWatcherEnable({
    ownerCredentialRotated: true,
    controlSelfTestPassed: true,
    workerContractProofPassed: true,
    authority: "ACT",
    budgetCents: 0,
  });
  assert.equal(act.ok, false);

  const paid = evaluateWatcherEnable({
    ownerCredentialRotated: true,
    controlSelfTestPassed: true,
    workerContractProofPassed: true,
    authority: "RECOMMEND",
    budgetCents: 1,
  });
  assert.equal(paid.ok, false);
});

test("watcher enable passes only when all R0 gates pass", () => {
  assert.deepEqual(
    evaluateWatcherEnable({
      ownerCredentialRotated: true,
      controlSelfTestPassed: true,
      workerContractProofPassed: true,
      authority: "RECOMMEND",
      budgetCents: 0,
    }),
    { ok: true }
  );
});

test("run finalization only accepts RUNNING state", () => {
  assert.deepEqual(evaluateRunFinalizationState("RUNNING"), { ok: true });
  for (const state of ["QUEUED", "PASS", "FAILED", "BLOCKED", "NO_MATERIAL_CHANGE"]) {
    const result = evaluateRunFinalizationState(state);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "WATCH_RUN_INVALID_STATE");
  }
});


test("stale harness retirement is narrowly scoped", () => {
  assert.deepEqual(
    evaluateStaleHarnessRetirement({
      trigger: "HARNESS_TEST",
      status: "QUEUED",
      runRuntimeId: "old-runtime",
      currentRuntimeId: "new-runtime",
    }),
    { ok: true }
  );

  for (const input of [
    { trigger: "SCHEDULE", status: "QUEUED", runRuntimeId: "old-runtime", currentRuntimeId: "new-runtime" },
    { trigger: "HARNESS_TEST", status: "RUNNING", runRuntimeId: "old-runtime", currentRuntimeId: "new-runtime" },
    { trigger: "HARNESS_TEST", status: "QUEUED", runRuntimeId: "same-runtime", currentRuntimeId: "same-runtime" },
  ]) {
    assert.equal(evaluateStaleHarnessRetirement(input).ok, false);
  }
});

test("HARNESS_TEST results are zero-effect only", () => {
  assert.deepEqual(
    evaluateHarnessResultEffects({
      trigger: "HARNESS_TEST",
      estimatedCostCents: 0,
      candidateCount: 0,
    }),
    { ok: true }
  );

  assert.equal(
    evaluateHarnessResultEffects({
      trigger: "HARNESS_TEST",
      estimatedCostCents: 1,
      candidateCount: 0,
    }).ok,
    false
  );

  assert.equal(
    evaluateHarnessResultEffects({
      trigger: "HARNESS_TEST",
      estimatedCostCents: 0,
      candidateCount: 1,
    }).ok,
    false
  );

  assert.deepEqual(
    evaluateHarnessResultEffects({
      trigger: "SCHEDULE",
      estimatedCostCents: 0,
      candidateCount: 1,
    }),
    { ok: true }
  );
});


test("GitHub harness claims are bound to the approved repo workflow and branch", () => {
  const valid = {
    iss: "https://token.actions.githubusercontent.com",
    aud: "https://github.com/norrijam405",
    repository: "norrijam405/norvana",
    ref: "refs/heads/main",
    event_name: "workflow_dispatch",
    workflow_ref:
      "norrijam405/norvana/.github/workflows/watchtower-worker-harness.yml@refs/heads/main",
    runner_environment: "github-hosted",
  };

  assert.deepEqual(evaluateGitHubHarnessClaims(valid), { ok: true });

  for (const [key, value] of [
    ["iss", "https://example.invalid"],
    ["aud", "https://github.com/other"],
    ["repository", "norrijam405/other"],
    ["ref", "refs/heads/other"],
    ["event_name", "push"],
    ["workflow_ref", "norrijam405/norvana/.github/workflows/other.yml@refs/heads/main"],
    ["runner_environment", "self-hosted"],
  ] as const) {
    assert.equal(evaluateGitHubHarnessClaims({ ...valid, [key]: value }).ok, false);
  }
});


test("harness environment requires every external execution path locked", () => {
  const safe = {
    queueEnabled: false,
    executorEnabled: false,
    fulfillmentEnabled: false,
    supplierConnectorsEnabled: false,
    federationEnabled: false,
  };
  assert.deepEqual(evaluateHarnessEnvironmentSnapshot(safe), { ok: true });

  for (const key of Object.keys(safe) as Array<keyof typeof safe>) {
    const result = evaluateHarnessEnvironmentSnapshot({ ...safe, [key]: true });
    assert.equal(result.ok, false);
  }
});

test("harness safety snapshot fails closed after watcher drift", () => {
  const safeJobs = [
    { status: "PAUSED", authority: "OBSERVE", budgetCents: 0 },
    { status: "PAUSED", authority: "RECOMMEND", budgetCents: 0 },
  ];

  assert.deepEqual(evaluateHarnessWatcherSnapshot(safeJobs), { ok: true });

  const queueThenEnable = safeJobs.map((job, index) =>
    index === 0 ? { ...job, status: "ENABLED" } : job
  );
  const claimDecision = evaluateHarnessWatcherSnapshot(queueThenEnable);
  assert.equal(claimDecision.ok, false);
  if (!claimDecision.ok) {
    assert.equal(claimDecision.code, "WATCHTOWER_HARNESS_REAL_WATCHER_NOT_PAUSED");
  }

  const claimThenAuthorityDrift = safeJobs.map((job, index) =>
    index === 0 ? { ...job, authority: "ACT" } : job
  );
  const resultDecision = evaluateHarnessWatcherSnapshot(claimThenAuthorityDrift);
  assert.equal(resultDecision.ok, false);
  if (!resultDecision.ok) {
    assert.equal(resultDecision.code, "WATCHTOWER_HARNESS_REAL_WATCHER_POLICY_DRIFT");
  }

  const budgetDrift = safeJobs.map((job, index) =>
    index === 0 ? { ...job, budgetCents: 1 } : job
  );
  assert.equal(evaluateHarnessWatcherSnapshot(budgetDrift).ok, false);
});

test("harness target remains exact OBSERVE and zero budget", () => {
  assert.deepEqual(evaluateHarnessTargetJob("OBSERVE", 0), { ok: true });

  const recommend = evaluateHarnessTargetJob("RECOMMEND", 0);
  assert.equal(recommend.ok, false);
  if (!recommend.ok) assert.equal(recommend.code, "WATCHTOWER_HARNESS_REQUIRES_OBSERVE");

  const paid = evaluateHarnessTargetJob("OBSERVE", 1);
  assert.equal(paid.ok, false);
  if (!paid.ok) assert.equal(paid.code, "WATCHTOWER_HARNESS_REQUIRES_ZERO_BUDGET");
});

test("critical routes share the same transaction-level harness safety lock", async () => {
  const { readFile } = await import("node:fs/promises");
  const routes = [
    "../src/app/api/watchtower/harness/queue/route.ts",
    "../src/app/api/watchtower/harness/retire-stale/route.ts",
    "../src/app/api/watchtower/jobs/[id]/route.ts",
    "../src/app/api/watchtower/runs/claim/route.ts",
    "../src/app/api/watchtower/runs/[id]/result/route.ts",
  ];

  for (const route of routes) {
    const source = await readFile(new URL(route, import.meta.url), "utf8");
    assert.match(source, /pg_advisory_xact_lock/);
    assert.match(source, /WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1/);
    assert.match(source, /WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2/);
  }
});

test("watcher safety mutations atomically invalidate active harness runs", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../src/app/api/watchtower/jobs/[id]/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /HARNESS_TEST/);
  assert.match(source, /WATCH_HARNESS_INVALIDATED_BY_WATCHER_MUTATION/);
  assert.match(source, /inArray\(watchRuns\.status, \["QUEUED", "RUNNING"\]\)/);
});


test("active harness execution invariant requires exactly one expected run", () => {
  assert.deepEqual(
    evaluateActiveHarnessInvariant({
      activeRuns: [{ id: 15, status: "QUEUED" }],
      expectedRunId: 15,
      expectedStatus: "QUEUED",
    }),
    { ok: true }
  );

  assert.deepEqual(
    evaluateActiveHarnessInvariant({
      activeRuns: [{ id: 15, status: "RUNNING" }],
      expectedRunId: 15,
      expectedStatus: "RUNNING",
    }),
    { ok: true }
  );

  for (const activeRuns of [
    [
      { id: 15, status: "QUEUED" },
      { id: 16, status: "QUEUED" },
    ],
    [
      { id: 15, status: "RUNNING" },
      { id: 16, status: "QUEUED" },
    ],
    [
      { id: 15, status: "RUNNING" },
      { id: 16, status: "RUNNING" },
    ],
  ]) {
    const result = evaluateActiveHarnessInvariant({
      activeRuns,
      expectedRunId: 15,
      expectedStatus: activeRuns[0].status as "QUEUED" | "RUNNING",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "WATCHTOWER_HARNESS_ACTIVE_CARDINALITY_INVALID");
    }
  }

  const wrongRun = evaluateActiveHarnessInvariant({
    activeRuns: [{ id: 16, status: "RUNNING" }],
    expectedRunId: 15,
    expectedStatus: "RUNNING",
  });
  assert.equal(wrongRun.ok, false);
  if (!wrongRun.ok) {
    assert.equal(wrongRun.code, "WATCHTOWER_HARNESS_ACTIVE_RUN_MISMATCH");
  }

  const wrongState = evaluateActiveHarnessInvariant({
    activeRuns: [{ id: 15, status: "RUNNING" }],
    expectedRunId: 15,
    expectedStatus: "QUEUED",
  });
  assert.equal(wrongState.ok, false);
  if (!wrongState.ok) {
    assert.equal(wrongState.code, "WATCHTOWER_HARNESS_ACTIVE_STATE_MISMATCH");
  }
});

test("claim and finalization fail closed on active harness multiplicity", async () => {
  const { readFile } = await import("node:fs/promises");
  const claimSource = await readFile(
    new URL("../src/app/api/watchtower/runs/claim/route.ts", import.meta.url),
    "utf8"
  );
  const resultSource = await readFile(
    new URL("../src/app/api/watchtower/runs/[id]/result/route.ts", import.meta.url),
    "utf8"
  );

  for (const source of [claimSource, resultSource]) {
    assert.match(source, /evaluateActiveHarnessInvariant/);
    assert.match(source, /WATCHTOWER_HARNESS_ACTIVE_CARDINALITY_INVALID/);
    assert.match(source, /WATCH_HARNESS_MULTIPLICITY_BLOCKED/);
    assert.match(source, /inArray\(watchRuns\.status, \["QUEUED", "RUNNING"\]\)/);
  }
});

test("concurrent harness claim/finalization ordering preserves uniqueness checks", async () => {
  const { readFile } = await import("node:fs/promises");
  const claimSource = await readFile(
    new URL("../src/app/api/watchtower/runs/claim/route.ts", import.meta.url),
    "utf8"
  );
  const resultSource = await readFile(
    new URL("../src/app/api/watchtower/runs/[id]/result/route.ts", import.meta.url),
    "utf8"
  );

  const claimLock = claimSource.indexOf("pg_advisory_xact_lock");
  const claimInvariant = claimSource.indexOf("const activeInvariant = evaluateActiveHarnessInvariant");
  const claimTransition = claimSource.indexOf('set({ status: "RUNNING"');

  assert.ok(claimLock >= 0);
  assert.ok(claimInvariant > claimLock);
  assert.ok(claimTransition > claimInvariant);

  const resultLock = resultSource.indexOf("pg_advisory_xact_lock");
  const resultInvariant = resultSource.indexOf("const activeInvariant = evaluateActiveHarnessInvariant");
  const resultTransition = resultSource.indexOf(".set({\n        status,");

  assert.ok(resultLock >= 0);
  assert.ok(resultInvariant > resultLock);
  assert.ok(resultTransition > resultInvariant);
});


test("stale harness retirement binds safety proof and write under the common lock", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../src/app/api/watchtower/harness/retire-stale/route.ts", import.meta.url),
    "utf8"
  );

  const lock = source.indexOf("pg_advisory_xact_lock");
  const watcherRead = source.indexOf("const jobs = await tx.select().from(watchJobs)");
  const activeRead = source.indexOf("const activeRuns = await tx");
  const staleDecision = source.indexOf("const decision = evaluateStaleHarnessRetirement");
  const guardedTransition = source.indexOf('eq(watchRuns.status, "QUEUED")');
  const receiptInsert = source.indexOf('actionType: "WATCH_HARNESS_STALE_RUN_RETIRED"');

  assert.ok(lock >= 0);
  assert.ok(watcherRead > lock);
  assert.ok(activeRead > watcherRead);
  assert.ok(staleDecision > activeRead);
  assert.ok(guardedTransition > staleDecision);
  assert.ok(receiptInsert > guardedTransition);

  assert.match(source, /eq\(watchRuns\.trigger, "HARNESS_TEST"\)/);
  assert.match(source, /eq\(watchRuns\.status, "QUEUED"\)/);
  assert.match(source, /eq\(watchRuns\.runtimeId, staleRuntimeId\)/);
  assert.match(source, /WATCHTOWER_STALE_RETIREMENT_STATE_CHANGED/);
});

test("stale retirement receipt derives from the protected watcher/run snapshot", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../src/app/api/watchtower/harness/retire-stale/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /realWatcherStatus: "PAUSED"/);
  assert.match(source, /realWatcherCount: jobs\.length/);
  assert.match(source, /originalTrigger: "HARNESS_TEST"/);
  assert.match(source, /originalStatus: "QUEUED"/);
  assert.match(source, /safetyLock: "WATCHTOWER_HARNESS_GLOBAL"/);

  const noRun = source.indexOf('if (!run) {');
  const receipt = source.indexOf('actionType: "WATCH_HARNESS_STALE_RUN_RETIRED"');
  assert.ok(noRun >= 0);
  assert.ok(receipt > noRun);
});

test("retirement and watcher mutation share one serialization domain", async () => {
  const { readFile } = await import("node:fs/promises");
  const retirement = await readFile(
    new URL("../src/app/api/watchtower/harness/retire-stale/route.ts", import.meta.url),
    "utf8"
  );
  const mutation = await readFile(
    new URL("../src/app/api/watchtower/jobs/[id]/route.ts", import.meta.url),
    "utf8"
  );

  for (const source of [retirement, mutation]) {
    assert.match(source, /WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1/);
    assert.match(source, /WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2/);
    assert.match(source, /pg_advisory_xact_lock/);
  }

  const retirementLock = retirement.indexOf("pg_advisory_xact_lock");
  const retirementWatcherRead = retirement.indexOf("const jobs = await tx.select().from(watchJobs)");
  const mutationLock = mutation.indexOf("pg_advisory_xact_lock");
  const mutationCurrentRead = mutation.indexOf("const [current] = await tx");

  assert.ok(retirementWatcherRead > retirementLock);
  assert.ok(mutationCurrentRead > mutationLock);
});


test("observe proof GitHub OIDC claims are pinned to the dedicated manual workflow", () => {
  const valid = {
    iss: "https://token.actions.githubusercontent.com",
    aud: "https://github.com/norrijam405",
    repository: "norrijam405/norvana",
    ref: "refs/heads/main",
    event_name: "workflow_dispatch",
    workflow_ref:
      "norrijam405/norvana/.github/workflows/watchtower-observe-proof.yml@refs/heads/main",
    runner_environment: "github-hosted",
  };

  assert.deepEqual(evaluateGitHubObserveProofClaims(valid), { ok: true });

  const wrongWorkflow = evaluateGitHubObserveProofClaims({
    ...valid,
    workflow_ref:
      "norrijam405/norvana/.github/workflows/watchtower-worker-harness.yml@refs/heads/main",
  });
  assert.equal(wrongWorkflow.ok, false);

  const wrongRef = evaluateGitHubObserveProofClaims({
    ...valid,
    ref: "refs/heads/recovery/2026-09-26-norvana-modernization-r0",
  });
  assert.equal(wrongRef.ok, false);
});

test("observe proof environment keeps all normal and consequential execution disabled", () => {
  assert.deepEqual(
    evaluateObserveProofEnvironmentSnapshot({
      queueEnabled: false,
      executorEnabled: false,
      fulfillmentEnabled: false,
      supplierConnectorsEnabled: false,
      federationEnabled: false,
    }),
    { ok: true }
  );

  for (const key of [
    "queueEnabled",
    "executorEnabled",
    "fulfillmentEnabled",
    "supplierConnectorsEnabled",
    "federationEnabled",
  ] as const) {
    const input = {
      queueEnabled: false,
      executorEnabled: false,
      fulfillmentEnabled: false,
      supplierConnectorsEnabled: false,
      federationEnabled: false,
      [key]: true,
    };
    assert.equal(evaluateObserveProofEnvironmentSnapshot(input).ok, false);
  }
});

test("observe proof permits exactly one enabled Local Producer Watch at OBSERVE and $0", () => {
  const jobs = [
    {
      slug: "free-supplier-watch",
      status: "PAUSED",
      authority: "RECOMMEND",
      budgetCents: 0,
    },
    {
      slug: "global-resale-sourcing-watch",
      status: "PAUSED",
      authority: "RECOMMEND",
      budgetCents: 0,
    },
    {
      slug: "local-producer-watch",
      status: "ENABLED",
      authority: "OBSERVE",
      budgetCents: 0,
    },
    {
      slug: "operating-cost-watch",
      status: "PAUSED",
      authority: "RECOMMEND",
      budgetCents: 0,
    },
    {
      slug: "drop-opportunity-watch",
      status: "PAUSED",
      authority: "RECOMMEND",
      budgetCents: 0,
    },
  ];

  assert.deepEqual(evaluateObserveProofWatcherSnapshot(jobs), { ok: true });
  assert.deepEqual(
    evaluateObserveProofTargetJob(jobs[2]),
    { ok: true }
  );

  assert.equal(
    evaluateObserveProofWatcherSnapshot(
      jobs.map((job) =>
        job.slug === "free-supplier-watch" ? { ...job, status: "ENABLED" } : job
      )
    ).ok,
    false
  );

  assert.equal(
    evaluateObserveProofWatcherSnapshot(
      jobs.map((job) =>
        job.slug === "local-producer-watch" ? { ...job, authority: "RECOMMEND" } : job
      )
    ).ok,
    false
  );

  assert.equal(
    evaluateObserveProofWatcherSnapshot(
      jobs.map((job) =>
        job.slug === "local-producer-watch" ? { ...job, budgetCents: 1 } : job
      )
    ).ok,
    false
  );
});

test("observe proof requires exactly one active proof run and zero effect", () => {
  assert.deepEqual(
    evaluateActiveObserveProofInvariant({
      activeRuns: [{ id: 21, status: "QUEUED" }],
      expectedRunId: 21,
      expectedStatus: "QUEUED",
    }),
    { ok: true }
  );

  assert.equal(
    evaluateActiveObserveProofInvariant({
      activeRuns: [
        { id: 21, status: "QUEUED" },
        { id: 22, status: "QUEUED" },
      ],
    }).ok,
    false
  );

  assert.deepEqual(
    evaluateObserveProofResultEffects({
      estimatedCostCents: 0,
      candidateCount: 0,
    }),
    { ok: true }
  );
  assert.equal(
    evaluateObserveProofResultEffects({
      estimatedCostCents: 1,
      candidateCount: 0,
    }).ok,
    false
  );
  assert.equal(
    evaluateObserveProofResultEffects({
      estimatedCostCents: 0,
      candidateCount: 1,
    }).ok,
    false
  );
});

test("observe-proof routes and worker remain isolated from normal schedule and harness execution", async () => {
  const { readFile } = await import("node:fs/promises");
  const root = new URL("../", import.meta.url);

  const [queueRoute, claimRoute, resultRoute, worker, fetchHelper, destination, workflow] = await Promise.all([
    readFile(new URL("src/app/api/watchtower/observe-proof/queue/route.ts", root), "utf8"),
    readFile(new URL("src/app/api/watchtower/observe-proof/claim/route.ts", root), "utf8"),
    readFile(new URL("src/app/api/watchtower/observe-proof/[id]/result/route.ts", root), "utf8"),
    readFile(new URL("scripts/watchtower-observe-proof.mjs", root), "utf8"),
    readFile(new URL("scripts/watchtower-observe-proof-fetch.mjs", root), "utf8"),
    readFile(new URL("scripts/watchtower-observe-proof-destination.mjs", root), "utf8"),
    readFile(new URL(".github/workflows/watchtower-observe-proof.yml", root), "utf8"),
  ]);

  assert.match(queueRoute, /OBSERVE_PROOF/);
  assert.match(queueRoute, /WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG/);
  assert.match(queueRoute, /CONTROL_TEST/);
  assert.match(queueRoute, /WORKER_TEST/);

  assert.match(claimRoute, /requireWatchtowerObserveProofWorker/);
  assert.match(claimRoute, /OBSERVE_PROOF/);
  assert.doesNotMatch(claimRoute, /NORVANA_WATCHTOWER_WORKER_SECRET/);

  assert.match(resultRoute, /evaluateObserveProofResultEffects/);
  assert.match(resultRoute, /candidateCount:\s*candidates\.length/);
  assert.match(resultRoute, /WATCH_OBSERVE_PROOF_COMPLETED/);

  assert.match(worker, /ag\.ok\.gov\/divisions\/market-development/);
  assert.match(worker, /ams\.usda\.gov\/services\/local-regional\/food-directories/);
  assert.match(worker, /fetchApprovedObserveProofHtml/);
  assert.doesNotMatch(worker, /redirect:\s*"follow"/);
  assert.match(fetchHelper, /redirect:\s*"manual"/);
  assert.match(fetchHelper, /assertApprovedObserveProofUrl\(nextUrl\)/);
  assert.match(worker, /candidates:\s*\[\]/);
  assert.match(worker, /estimatedCostCents:\s*0/);
  assert.match(worker, /requirePinnedObserveProofBaseUrl/);
  assert.doesNotMatch(worker, /NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL/);
  assert.doesNotMatch(worker, /NORVANA_WATCHTOWER_OBSERVE_PROOF_ENABLED/);

  assert.match(destination, /__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__/);
  assert.match(destination, /norrijam405-2107s-projects\\.vercel\\.app/);

  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /RUN_LOCAL_PRODUCER_OBSERVE_PROOF/);
  assert.doesNotMatch(workflow, /\$\{\{\s*vars\./);
  assert.doesNotMatch(workflow, /NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL/);
});


test("observe-proof redirect handling rejects an unapproved intermediate hop before requesting it", async () => {
  const helperUrl = new URL(
    "../scripts/watchtower-observe-proof-fetch.mjs",
    import.meta.url
  ).href;
  const helper = await import(helperUrl);

  const calls: string[] = [];
  const fetchImpl = async (url: string) => {
    calls.push(url);

    if (url === "https://ag.ok.gov/start") {
      return new Response(null, {
        status: 302,
        headers: { location: "https://unapproved.example/bounce" },
      });
    }

    if (url === "https://unapproved.example/bounce") {
      return new Response(null, {
        status: 302,
        headers: { location: "https://ag.ok.gov/final" },
      });
    }

    return new Response("<html>unexpected</html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  };

  await assert.rejects(
    () =>
      helper.fetchApprovedObserveProofHtml("https://ag.ok.gov/start", {
        fetchImpl,
        maxRedirects: 5,
      }),
    /host is not approved/
  );

  assert.deepEqual(calls, ["https://ag.ok.gov/start"]);
});

test("observe-proof redirect handling allows only fully approved HTTPS hops", async () => {
  const helperUrl = new URL(
    "../scripts/watchtower-observe-proof-fetch.mjs",
    import.meta.url
  ).href;
  const helper = await import(helperUrl);

  const calls: string[] = [];
  const fetchImpl = async (url: string) => {
    calls.push(url);

    if (url === "https://ag.ok.gov/start") {
      return new Response(null, {
        status: 302,
        headers: { location: "/next" },
      });
    }

    if (url === "https://ag.ok.gov/next") {
      return new Response(null, {
        status: 307,
        headers: {
          location: "https://www.ams.usda.gov/services/local-regional/food-directories",
        },
      });
    }

    return new Response("<html>Local Food Directories</html>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  };

  const result = await helper.fetchApprovedObserveProofHtml(
    "https://ag.ok.gov/start",
    {
      fetchImpl,
      maxRedirects: 5,
    }
  );

  assert.deepEqual(calls, [
    "https://ag.ok.gov/start",
    "https://ag.ok.gov/next",
    "https://www.ams.usda.gov/services/local-regional/food-directories",
  ]);
  assert.equal(result.redirectCount, 2);
  assert.equal(
    result.resolvedUrl.toString(),
    "https://www.ams.usda.gov/services/local-regional/food-directories"
  );
});

test("observe-proof redirect handling fails closed when the redirect cap is exceeded", async () => {
  const helperUrl = new URL(
    "../scripts/watchtower-observe-proof-fetch.mjs",
    import.meta.url
  ).href;
  const helper = await import(helperUrl);

  const calls: string[] = [];
  const fetchImpl = async (url: string) => {
    calls.push(url);

    if (url === "https://ag.ok.gov/start") {
      return new Response(null, {
        status: 302,
        headers: { location: "/one" },
      });
    }

    return new Response(null, {
      status: 302,
      headers: { location: "/two" },
    });
  };

  await assert.rejects(
    () =>
      helper.fetchApprovedObserveProofHtml("https://ag.ok.gov/start", {
        fetchImpl,
        maxRedirects: 1,
      }),
    /exceeded the redirect limit/
  );

  assert.deepEqual(calls, [
    "https://ag.ok.gov/start",
    "https://ag.ok.gov/one",
  ]);
});


test("observe-proof destination is source-controlled and fails closed while unpinned", async () => {
  const helperUrl = new URL(
    "../scripts/watchtower-observe-proof-destination.mjs",
    import.meta.url
  ).href;
  const helper = await import(helperUrl);

  assert.equal(
    helper.OBSERVE_PROOF_BASE_URL,
    "__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__"
  );

  assert.throws(
    () => helper.requirePinnedObserveProofBaseUrl(),
    /not pinned/
  );
});

test("observe-proof destination validator rejects attacker and malformed origins", async () => {
  const helperUrl = new URL(
    "../scripts/watchtower-observe-proof-destination.mjs",
    import.meta.url
  ).href;
  const helper = await import(helperUrl);

  for (const value of [
    "https://attacker.example",
    "https://norvana-abc123-norrijam405-2107s-projects.vercel.app.attacker.example",
    "http://norvana-abc123-norrijam405-2107s-projects.vercel.app",
    "https://user:pass@norvana-abc123-norrijam405-2107s-projects.vercel.app",
    "https://norvana-abc123-norrijam405-2107s-projects.vercel.app:8443",
    "https://norvana-abc123-norrijam405-2107s-projects.vercel.app/admin",
    "https://norvana-abc123-norrijam405-2107s-projects.vercel.app/?x=1",
    "https://norvana-abc123-norrijam405-2107s-projects.vercel.app/#x",
  ]) {
    assert.throws(() => helper.requirePinnedObserveProofBaseUrl(value));
  }
});

test("observe-proof destination validator accepts an exact Norvana Preview origin", async () => {
  const helperUrl = new URL(
    "../scripts/watchtower-observe-proof-destination.mjs",
    import.meta.url
  ).href;
  const helper = await import(helperUrl);

  assert.equal(
    helper.requirePinnedObserveProofBaseUrl(
      "https://norvana-bg60h5b0c-norrijam405-2107s-projects.vercel.app"
    ),
    "https://norvana-bg60h5b0c-norrijam405-2107s-projects.vercel.app"
  );
});

test("observe-proof workflow validates checked-in destination before minting OIDC", async () => {
  const { readFile } = await import("node:fs/promises");
  const workflow = await readFile(
    new URL("../.github/workflows/watchtower-observe-proof.yml", import.meta.url),
    "utf8"
  );
  const worker = await readFile(
    new URL("../scripts/watchtower-observe-proof.mjs", import.meta.url),
    "utf8"
  );

  const checkout = workflow.indexOf(
    "Checkout exact workflow commit without OIDC authority"
  );
  const setup = workflow.indexOf("Set up Node without OIDC authority");
  const confirmationGate = workflow.indexOf("Verify exact confirmation as data");
  const destinationGate = workflow.indexOf(
    "Verify source-pinned Preview destination"
  );
  const destinationCommand = workflow.indexOf(
    "node scripts/watchtower-observe-proof-destination.mjs"
  );
  const proofJob = workflow.indexOf("  local-producer-observe-proof:");
  const mint = workflow.indexOf(
    "Mint GitHub OIDC token after successful no-OIDC preflight"
  );
  const execute = workflow.indexOf("Run one-shot Local Producer Watch observe proof");

  assert.ok(checkout >= 0);
  assert.ok(setup > checkout);
  assert.ok(confirmationGate > setup);
  assert.ok(destinationGate > confirmationGate);
  assert.ok(destinationCommand > destinationGate);
  assert.ok(proofJob > destinationCommand);
  assert.ok(mint > proofJob);
  assert.ok(execute > mint);

  assert.doesNotMatch(workflow, /\$\{\{\s*vars\./);
  assert.doesNotMatch(workflow, /NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL/);
  assert.doesNotMatch(worker, /process\.env\.NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL/);
  assert.match(worker, /requirePinnedObserveProofBaseUrl\(\)/);
});


test("observe-proof confirmation validator treats workflow input strictly as data", async () => {
  const helperUrl = new URL(
    "../scripts/watchtower-observe-proof-confirmation.mjs",
    import.meta.url
  ).href;
  const helper = await import(helperUrl);

  assert.equal(
    helper.requireObserveProofConfirmation("RUN_LOCAL_PRODUCER_OBSERVE_PROOF"),
    "RUN_LOCAL_PRODUCER_OBSERVE_PROOF"
  );

  for (const value of [
    'RUN_LOCAL_PRODUCER_OBSERVE_PROOF" ; printf "PRE_VALIDATION_CODE_EXECUTED\\n" ; #',
    "RUN_LOCAL_PRODUCER_OBSERVE_PROOF$(id)",
    "RUN_LOCAL_PRODUCER_OBSERVE_PROOF`id`",
    "RUN_LOCAL_PRODUCER_OBSERVE_PROOF\nwhoami",
    "",
  ]) {
    assert.throws(() => helper.requireObserveProofConfirmation(value));
  }
});

test("observe-proof OIDC authority is structurally separated behind no-OIDC preflight", async () => {
  const { readFile } = await import("node:fs/promises");
  const workflow = await readFile(
    new URL("../.github/workflows/watchtower-observe-proof.yml", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(
    workflow,
    /test\s+["']?\$\{\{\s*inputs\.confirmation\s*\}\}/
  );

  assert.match(
    workflow,
    /NORVANA_WATCHTOWER_OBSERVE_PROOF_CONFIRMATION:\s*\$\{\{\s*inputs\.confirmation\s*\}\}/
  );
  assert.match(
    workflow,
    /run:\s*node scripts\/watchtower-observe-proof-confirmation\.mjs/
  );

  const preflightStart = workflow.indexOf("  preflight:");
  const proofStart = workflow.indexOf("  local-producer-observe-proof:");
  assert.ok(preflightStart >= 0);
  assert.ok(proofStart > preflightStart);

  const preflightBlock = workflow.slice(preflightStart, proofStart);
  const proofBlock = workflow.slice(proofStart);

  assert.match(preflightBlock, /permissions:\s*\n\s+contents:\s*read/);
  assert.doesNotMatch(preflightBlock, /id-token:\s*write/);
  assert.match(preflightBlock, /ref:\s*\$\{\{\s*github\.sha\s*\}\}/);
  assert.match(
    preflightBlock,
    /node scripts\/watchtower-observe-proof-destination\.mjs/
  );

  assert.match(proofBlock, /needs:\s*preflight/);
  assert.match(proofBlock, /id-token:\s*write/);
  assert.match(proofBlock, /ref:\s*\$\{\{\s*github\.sha\s*\}\}/);

  const needs = proofBlock.indexOf("needs: preflight");
  const mint = proofBlock.indexOf(
    "Mint GitHub OIDC token after successful no-OIDC preflight"
  );
  assert.ok(needs >= 0);
  assert.ok(mint > needs);
});

test("observe-proof workflow has no direct confirmation expression in shell source", async () => {
  const { readFile } = await import("node:fs/promises");
  const workflow = await readFile(
    new URL("../.github/workflows/watchtower-observe-proof.yml", import.meta.url),
    "utf8"
  );

  const runLines = workflow
    .split("\n")
    .filter((line) => line.trimStart().startsWith("run:"));

  for (const line of runLines) {
    assert.doesNotMatch(line, /inputs\.confirmation/);
  }

  assert.doesNotMatch(
    workflow,
    /run:\s*\|[\s\S]*?\$\{\{\s*inputs\.confirmation\s*\}\}/
  );
});


test("authenticated owner safe GET accepts normal same-origin browser fetch metadata without Origin", () => {
  assert.deepEqual(
    evaluateAuthenticatedBrowserReadOrigin({
      method: "GET",
      origin: null,
      requestOrigin: "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app",
      referer:
        "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app/admin",
      secFetchSite: "same-origin",
    }),
    { ok: true }
  );
});

test("authenticated owner safe GET may fall back to an exact same-origin Referer when Origin is absent", () => {
  assert.deepEqual(
    evaluateAuthenticatedBrowserReadOrigin({
      method: "GET",
      origin: null,
      requestOrigin: "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app",
      referer:
        "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app/admin",
      secFetchSite: null,
    }),
    { ok: true }
  );
});

test("authenticated owner safe-read origin policy rejects cross-site and cross-origin requests", () => {
  const crossSite = evaluateAuthenticatedBrowserReadOrigin({
    method: "GET",
    origin: null,
    requestOrigin: "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app",
    referer: "https://attacker.example/",
    secFetchSite: "cross-site",
  });
  assert.equal(crossSite.ok, false);
  if (!crossSite.ok) {
    assert.equal(crossSite.code, "NORVANA_CROSS_ORIGIN_REJECTED");
  }

  const explicitCrossOrigin = evaluateAuthenticatedBrowserReadOrigin({
    method: "GET",
    origin: "https://attacker.example",
    requestOrigin: "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app",
    referer:
      "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app/admin",
    secFetchSite: "same-origin",
  });
  assert.equal(explicitCrossOrigin.ok, false);
  if (!explicitCrossOrigin.ok) {
    assert.equal(explicitCrossOrigin.code, "NORVANA_CROSS_ORIGIN_REJECTED");
  }
});

test("origin-less browser mutation remains rejected even with same-origin fetch metadata", () => {
  const decision = evaluateAuthenticatedBrowserReadOrigin({
    method: "POST",
    origin: null,
    requestOrigin: "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app",
    referer:
      "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app/admin",
    secFetchSite: "same-origin",
  });

  assert.equal(decision.ok, false);
  if (!decision.ok) {
    assert.equal(decision.code, "NORVANA_SAFE_READ_METHOD_REQUIRED");
  }
});

test("Watchtower jobs safe GET uses the read guard while POST and PATCH keep strict mutation guard", async () => {
  const { readFile } = await import("node:fs/promises");
  const root = new URL("../", import.meta.url);

  const [collectionRoute, mutationRoute, adminGuard] = await Promise.all([
    readFile(new URL("src/app/api/watchtower/jobs/route.ts", root), "utf8"),
    readFile(new URL("src/app/api/watchtower/jobs/[id]/route.ts", root), "utf8"),
    readFile(new URL("src/lib/admin-guard.ts", root), "utf8"),
  ]);

  const getStart = collectionRoute.indexOf("export async function GET");
  const postStart = collectionRoute.indexOf("export async function POST");
  assert.ok(getStart >= 0);
  assert.ok(postStart > getStart);

  const getBlock = collectionRoute.slice(getStart, postStart);
  const postBlock = collectionRoute.slice(postStart);

  assert.match(getBlock, /requireCurrentRecoveryAdminRead\(req\)/);
  assert.doesNotMatch(getBlock, /requireCurrentRecoveryAdmin\(req\)/);
  assert.match(postBlock, /requireCurrentRecoveryAdmin\(req\)/);
  assert.match(mutationRoute, /requireCurrentRecoveryAdmin\(req\)/);
  assert.doesNotMatch(mutationRoute, /requireCurrentRecoveryAdminRead\(req\)/);

  assert.match(
    adminGuard,
    /export async function requireCurrentRecoveryAdminRead/
  );
  assert.match(
    adminGuard,
    /return requireBrowserSameOriginRead\(req\)/
  );
  assert.match(
    adminGuard,
    /return requireBrowserSameOrigin\(req\)/
  );
});


test("full origin semantics reject same-host cross-scheme and non-serialized Origin values", () => {
  const requestOrigin =
    "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app";

  for (const origin of [
    "http://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app",
    "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app/admin",
    "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app?x=1",
    "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app#x",
    "https://user:pass@norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app",
    "null",
  ]) {
    const read = evaluateAuthenticatedBrowserReadOrigin({
      method: "GET",
      origin,
      requestOrigin,
      referer: null,
      secFetchSite: "same-origin",
    });
    assert.equal(read.ok, false);

    const mutation = evaluateAuthenticatedBrowserMutationOrigin({
      origin,
      requestOrigin,
      referer: null,
      secFetchSite: "same-origin",
    });
    assert.equal(mutation.ok, false);
  }
});

test("strict mutation origin uses full scheme-host-port equality", () => {
  const httpsOrigin =
    "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app";
  const httpOrigin =
    "http://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app";

  assert.deepEqual(
    evaluateAuthenticatedBrowserMutationOrigin({
      origin: httpsOrigin,
      requestOrigin: httpsOrigin,
      referer: httpsOrigin + "/admin",
      secFetchSite: "same-origin",
    }),
    { ok: true }
  );

  assert.equal(
    evaluateAuthenticatedBrowserMutationOrigin({
      origin: httpOrigin,
      requestOrigin: httpsOrigin,
      referer: httpsOrigin + "/admin",
      secFetchSite: "same-origin",
    }).ok,
    false
  );

  assert.deepEqual(
    evaluateAuthenticatedBrowserMutationOrigin({
      origin: "https://example.test:8443",
      requestOrigin: "https://example.test:8443",
      referer: "https://example.test:8443/admin",
      secFetchSite: "same-origin",
    }),
    { ok: true }
  );

  assert.equal(
    evaluateAuthenticatedBrowserMutationOrigin({
      origin: "https://example.test",
      requestOrigin: "https://example.test:8443",
      referer: null,
      secFetchSite: "same-origin",
    }).ok,
    false
  );
});

test("contradictory Fetch Metadata and Referer fail closed", () => {
  const requestOrigin =
    "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app";

  const attackerReferer = evaluateAuthenticatedBrowserReadOrigin({
    method: "GET",
    origin: null,
    requestOrigin,
    referer: "https://attacker.example/path",
    secFetchSite: "same-origin",
  });
  assert.equal(attackerReferer.ok, false);
  if (!attackerReferer.ok) {
    assert.equal(attackerReferer.code, "NORVANA_CROSS_ORIGIN_REJECTED");
  }

  const contradictoryFetchSite = evaluateAuthenticatedBrowserReadOrigin({
    method: "GET",
    origin: null,
    requestOrigin,
    referer: requestOrigin + "/admin",
    secFetchSite: "same-site",
  });
  assert.equal(contradictoryFetchSite.ok, false);
  if (!contradictoryFetchSite.ok) {
    assert.equal(contradictoryFetchSite.code, "NORVANA_CROSS_ORIGIN_REJECTED");
  }

  const mutationContradiction = evaluateAuthenticatedBrowserMutationOrigin({
    origin: requestOrigin,
    requestOrigin,
    referer: "https://attacker.example/",
    secFetchSite: "same-origin",
  });
  assert.equal(mutationContradiction.ok, false);
});

test("safe-read origin policy rejects malformed Referer and same-site different-origin provenance", () => {
  const requestOrigin =
    "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app";

  const malformed = evaluateAuthenticatedBrowserReadOrigin({
    method: "GET",
    origin: null,
    requestOrigin,
    referer: "not a URL",
    secFetchSite: null,
  });
  assert.equal(malformed.ok, false);
  if (!malformed.ok) {
    assert.equal(malformed.code, "NORVANA_INVALID_REFERER");
  }

  const sameSiteDifferentOrigin = evaluateAuthenticatedBrowserReadOrigin({
    method: "GET",
    origin: null,
    requestOrigin,
    referer: "https://other-norrijam405-2107s-projects.vercel.app/admin",
    secFetchSite: "same-site",
  });
  assert.equal(sameSiteDifferentOrigin.ok, false);
});

test("origin-less safe read requires at least one same-origin provenance signal", () => {
  const requestOrigin =
    "https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app";

  const noSignals = evaluateAuthenticatedBrowserReadOrigin({
    method: "GET",
    origin: null,
    requestOrigin,
    referer: null,
    secFetchSite: null,
  });
  assert.equal(noSignals.ok, false);

  assert.deepEqual(
    evaluateAuthenticatedBrowserReadOrigin({
      method: "GET",
      origin: null,
      requestOrigin,
      referer: null,
      secFetchSite: "same-origin",
    }),
    { ok: true }
  );

  assert.deepEqual(
    evaluateAuthenticatedBrowserReadOrigin({
      method: "HEAD",
      origin: null,
      requestOrigin,
      referer: requestOrigin + "/admin",
      secFetchSite: null,
    }),
    { ok: true }
  );
});

test("admin guard derives the expected full origin from NextRequest and uses shared strict semantics", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../src/lib/admin-guard.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /evaluateAuthenticatedBrowserMutationOrigin/);
  assert.match(source, /evaluateAuthenticatedBrowserReadOrigin/);
  assert.match(source, /requestOrigin:\s*req\.nextUrl\.origin/);
  assert.doesNotMatch(source, /originUrl\.host\s*!==\s*host/);
});


test("R1 observe OIDC identity accepts only the exact scheduled workflow/event pairs", () => {
  const common = {
    iss: "https://token.actions.githubusercontent.com",
    aud: "https://github.com/norrijam405",
    repository: "norrijam405/norvana",
    ref: "refs/heads/main",
    runner_environment: "github-hosted",
  };

  const manual = {
    ...common,
    event_name: "workflow_dispatch",
    workflow_ref:
      "norrijam405/norvana/.github/workflows/watchtower-observe-proof.yml@refs/heads/main",
  };
  assert.deepEqual(evaluateGitHubObserveProofClaims(manual), { ok: true });

  const recurringSchedule = {
    ...common,
    event_name: "schedule",
    workflow_ref: WATCHTOWER_R1_WORKFLOW_REF,
  };
  assert.deepEqual(
    evaluateGitHubObserveProofClaims(recurringSchedule),
    { ok: true }
  );

  const recurringManual = {
    ...common,
    event_name: "workflow_dispatch",
    workflow_ref: WATCHTOWER_R1_WORKFLOW_REF,
  };
  assert.deepEqual(
    evaluateGitHubObserveProofClaims(recurringManual),
    { ok: true }
  );

  assert.equal(
    evaluateGitHubObserveProofClaims({
      ...manual,
      event_name: "schedule",
    }).ok,
    false
  );

  assert.equal(
    evaluateGitHubObserveProofClaims({
      ...recurringSchedule,
      event_name: "pull_request",
    }).ok,
    false
  );

  assert.equal(
    evaluateGitHubObserveProofClaims({
      ...recurringSchedule,
      workflow_ref:
        "norrijam405/norvana/.github/workflows/watchtower-scheduler.yml@refs/heads/main",
    }).ok,
    false
  );
});

test("R1 cadence gate enforces a server-side 20-hour minimum interval", () => {
  const now = new Date("2026-10-01T14:17:00.000Z");

  assert.deepEqual(
    evaluateR1QueueCadence({ lastQueuedAt: null, now }),
    { ok: true }
  );

  assert.deepEqual(
    evaluateR1QueueCadence({
      lastQueuedAt: new Date(now.getTime() - WATCHTOWER_R1_MIN_INTERVAL_MS),
      now,
    }),
    { ok: true }
  );

  const tooSoon = evaluateR1QueueCadence({
    lastQueuedAt: new Date(now.getTime() - WATCHTOWER_R1_MIN_INTERVAL_MS + 1),
    now,
  });
  assert.equal(tooSoon.ok, false);
  if (!tooSoon.ok) {
    assert.equal(tooSoon.code, "WATCHTOWER_R1_CADENCE_NOT_ELAPSED");
  }

  assert.equal(
    evaluateR1QueueCadence({
      lastQueuedAt: new Date(now.getTime() + 60_000),
      now,
    }).ok,
    false
  );
});

test("R1 source configuration is disabled by default and manual confirmation is inert data", async () => {
  const configUrl = new URL(
    "../scripts/watchtower-r1-config.mjs",
    import.meta.url
  ).href;
  const triggerUrl = new URL(
    "../scripts/watchtower-r1-trigger.mjs",
    import.meta.url
  ).href;

  const config = await import(configUrl);
  const trigger = await import(triggerUrl);

  assert.equal(config.WATCHTOWER_R1_ENABLED, false);
  assert.throws(() => config.requireWatchtowerR1Enabled(), /source-disabled/);

  assert.equal(
    trigger.requireWatchtowerR1Trigger({
      eventName: "schedule",
      confirmation: "",
    }),
    "schedule"
  );

  assert.equal(
    trigger.requireWatchtowerR1Trigger({
      eventName: "workflow_dispatch",
      confirmation: "RUN_LOCAL_PRODUCER_R1",
    }),
    "workflow_dispatch"
  );

  for (const confirmation of [
    "",
    "RUN_LOCAL_PRODUCER_R1 extra",
    'RUN_LOCAL_PRODUCER_R1"; id; #',
    "RUN_LOCAL_PRODUCER_R1$(id)",
  ]) {
    assert.throws(() =>
      trigger.requireWatchtowerR1Trigger({
        eventName: "workflow_dispatch",
        confirmation,
      })
    );
  }
});

test("R1 workflow is daily, shares observe concurrency, and gates OIDC behind no-OIDC preflight", async () => {
  const { readFile } = await import("node:fs/promises");
  const root = new URL("../", import.meta.url);
  const [workflow, manualWorkflow] = await Promise.all([
    readFile(
      new URL(".github/workflows/watchtower-local-producer-r1.yml", root),
      "utf8"
    ),
    readFile(
      new URL(".github/workflows/watchtower-observe-proof.yml", root),
      "utf8"
    ),
  ]);

  assert.match(workflow, /cron:\s*"17 14 \* \* \*"/);
  assert.equal((workflow.match(/cron:/g) || []).length, 1);
  assert.match(
    workflow,
    /group:\s*norvana-watchtower-real-observe-proof/
  );
  assert.match(
    manualWorkflow,
    /group:\s*norvana-watchtower-real-observe-proof/
  );

  const preflightStart = workflow.indexOf("  preflight:");
  const proofStart = workflow.indexOf("  local-producer-r1:");
  assert.ok(preflightStart >= 0);
  assert.ok(proofStart > preflightStart);

  const preflight = workflow.slice(preflightStart, proofStart);
  const proof = workflow.slice(proofStart);

  assert.match(preflight, /permissions:\s*\n\s+contents:\s*read/);
  assert.doesNotMatch(preflight, /id-token:\s*write/);
  assert.match(preflight, /node scripts\/watchtower-r1-config\.mjs/);
  assert.match(preflight, /node scripts\/watchtower-r1-trigger\.mjs/);
  assert.match(
    preflight,
    /node scripts\/watchtower-observe-proof-destination\.mjs/
  );

  assert.match(proof, /needs:\s*preflight/);
  assert.match(proof, /id-token:\s*write/);
  assert.match(proof, /ref:\s*\$\{\{\s*github\.sha\s*\}\}/);
  assert.match(proof, /node scripts\/watchtower-local-producer-r1\.mjs/);

  assert.doesNotMatch(
    workflow,
    /run:\s*\|[\s\S]*?\$\{\{\s*inputs\.confirmation\s*\}\}/
  );
  assert.doesNotMatch(workflow, /\$\{\{\s*vars\./);
});

test("R1 queue endpoint reuses the assured observe-proof safety domain and never enables the generic scheduler", async () => {
  const { readFile } = await import("node:fs/promises");
  const root = new URL("../", import.meta.url);

  const [route, client, genericScheduler] = await Promise.all([
    readFile(
      new URL("src/app/api/watchtower/observe-r1/queue/route.ts", root),
      "utf8"
    ),
    readFile(
      new URL("scripts/watchtower-local-producer-r1.mjs", root),
      "utf8"
    ),
    readFile(
      new URL(".github/workflows/watchtower-scheduler.yml", root),
      "utf8"
    ),
  ]);

  assert.match(route, /requireWatchtowerR1Worker\(req\)/);
  assert.match(route, /evaluateObserveProofEnvironmentSnapshot/);
  assert.match(route, /WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_1/);
  assert.match(route, /WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_2/);
  assert.match(route, /CONTROL_TEST/);
  assert.match(route, /WORKER_TEST/);
  assert.match(route, /evaluateObserveProofWatcherSnapshot/);
  assert.match(route, /WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG/);
  assert.match(route, /evaluateR1QueueCadence/);
  assert.match(route, /WATCHTOWER_R1_QUEUE_RECEIPT_ACTION/);
  assert.match(route, /trigger:\s*"OBSERVE_PROOF"/);
  assert.match(route, /normalQueueEnabled:\s*false/);
  assert.match(route, /normalExecutorEnabled:\s*false/);

  const queueIndex = client.indexOf("/api/watchtower/observe-r1/queue");
  const workerIndex = client.indexOf('import("./watchtower-observe-proof.mjs")');
  assert.ok(queueIndex >= 0);
  assert.ok(workerIndex > queueIndex);
  assert.match(client, /R1_BOUNDED_RECURRING_OBSERVE/);
  assert.match(client, /estimatedCostCents !== 0/);

  assert.match(genericScheduler, /Norvana Watchtower Scheduler/);
  assert.doesNotMatch(client, /\/api\/watchtower\/tick/);
  assert.doesNotMatch(client, /NORVANA_WATCHTOWER_QUEUE_ENABLED/);
  assert.doesNotMatch(client, /NORVANA_WATCHTOWER_EXECUTOR_ENABLED/);
});


test("R1 queue authentication rejects the one-shot manual proof workflow identity", () => {
  const common = {
    iss: "https://token.actions.githubusercontent.com",
    aud: "https://github.com/norrijam405",
    repository: "norrijam405/norvana",
    ref: "refs/heads/main",
    runner_environment: "github-hosted",
  };

  assert.deepEqual(
    evaluateGitHubR1QueueClaims({
      ...common,
      event_name: "schedule",
      workflow_ref: WATCHTOWER_R1_WORKFLOW_REF,
    }),
    { ok: true }
  );

  assert.deepEqual(
    evaluateGitHubR1QueueClaims({
      ...common,
      event_name: "workflow_dispatch",
      workflow_ref: WATCHTOWER_R1_WORKFLOW_REF,
    }),
    { ok: true }
  );

  const manualProof = evaluateGitHubR1QueueClaims({
    ...common,
    event_name: "workflow_dispatch",
    workflow_ref:
      "norrijam405/norvana/.github/workflows/watchtower-observe-proof.yml@refs/heads/main",
  });

  assert.equal(manualProof.ok, false);
  if (!manualProof.ok) {
    assert.equal(manualProof.code, "WATCHTOWER_R1_OIDC_WORKFLOW_MISMATCH");
  }
});

test("R1 OIDC-capable job does not consume workflow_dispatch confirmation data", async () => {
  const { readFile } = await import("node:fs/promises");
  const workflow = await readFile(
    new URL("../.github/workflows/watchtower-local-producer-r1.yml", import.meta.url),
    "utf8"
  );

  const proofStart = workflow.indexOf("  local-producer-r1:");
  assert.ok(proofStart >= 0);
  const proof = workflow.slice(proofStart);

  assert.doesNotMatch(proof, /inputs\.confirmation/);
  assert.doesNotMatch(proof, /NORVANA_WATCHTOWER_R1_CONFIRMATION/);
});


test("observe-proof canonical topology matches the five default Watchtower templates", () => {
  const expected = [...WATCHTOWER_REQUIRED_JOB_SLUGS].sort();
  const actual = WATCHTOWER_JOB_TEMPLATES.map((job) => job.slug).sort();

  assert.equal(actual.length, 5);
  assert.deepEqual(actual, expected);
});

test("observe-proof watcher snapshot requires the exact five canonical watcher rows", () => {
  const target = {
    slug: "local-producer-watch",
    status: "ENABLED",
    authority: "OBSERVE",
    budgetCents: 0,
  };

  const freeSupplier = {
    slug: "free-supplier-watch",
    status: "PAUSED",
    authority: "RECOMMEND",
    budgetCents: 0,
  };

  const globalResale = {
    slug: "global-resale-sourcing-watch",
    status: "PAUSED",
    authority: "RECOMMEND",
    budgetCents: 0,
  };

  const operatingCost = {
    slug: "operating-cost-watch",
    status: "PAUSED",
    authority: "OBSERVE",
    budgetCents: 0,
  };

  const dropOpportunity = {
    slug: "drop-opportunity-watch",
    status: "PAUSED",
    authority: "RECOMMEND",
    budgetCents: 0,
  };

  const intended = [
    freeSupplier,
    globalResale,
    target,
    operatingCost,
    dropOpportunity,
  ];

  assert.deepEqual(evaluateObserveProofWatcherSnapshot(intended), { ok: true });

  const targetOnly = evaluateObserveProofWatcherSnapshot([target]);
  assert.equal(targetOnly.ok, false);
  if (!targetOnly.ok) {
    assert.equal(
      targetOnly.code,
      "WATCHTOWER_OBSERVE_PROOF_TOPOLOGY_CARDINALITY_INVALID"
    );
  }

  const missingOne = evaluateObserveProofWatcherSnapshot([
    freeSupplier,
    globalResale,
    target,
    operatingCost,
  ]);
  assert.equal(missingOne.ok, false);
  if (!missingOne.ok) {
    assert.equal(
      missingOne.code,
      "WATCHTOWER_OBSERVE_PROOF_TOPOLOGY_CARDINALITY_INVALID"
    );
  }

  const extraRow = evaluateObserveProofWatcherSnapshot([
    ...intended,
    {
      slug: "unexpected-paused-watch",
      status: "PAUSED",
      authority: "OBSERVE",
      budgetCents: 0,
    },
  ]);
  assert.equal(extraRow.ok, false);
  if (!extraRow.ok) {
    assert.equal(
      extraRow.code,
      "WATCHTOWER_OBSERVE_PROOF_TOPOLOGY_CARDINALITY_INVALID"
    );
  }

  const substituted = evaluateObserveProofWatcherSnapshot([
    freeSupplier,
    globalResale,
    target,
    operatingCost,
    {
      slug: "replacement-paused-watch",
      status: "PAUSED",
      authority: "RECOMMEND",
      budgetCents: 0,
    },
  ]);
  assert.equal(substituted.ok, false);
  if (!substituted.ok) {
    assert.equal(
      substituted.code,
      "WATCHTOWER_OBSERVE_PROOF_TOPOLOGY_MISMATCH"
    );
  }

  const duplicate = evaluateObserveProofWatcherSnapshot([
    freeSupplier,
    globalResale,
    target,
    operatingCost,
    { ...operatingCost },
  ]);
  assert.equal(duplicate.ok, false);
  if (!duplicate.ok) {
    assert.equal(
      duplicate.code,
      "WATCHTOWER_OBSERVE_PROOF_TOPOLOGY_DUPLICATE_SLUG"
    );
  }
});

test("observe-proof exact topology still rejects non-paused canonical non-target watchers", () => {
  const result = evaluateObserveProofWatcherSnapshot([
    {
      slug: "free-supplier-watch",
      status: "PAUSED",
      authority: "RECOMMEND",
      budgetCents: 0,
    },
    {
      slug: "global-resale-sourcing-watch",
      status: "ENABLED",
      authority: "RECOMMEND",
      budgetCents: 0,
    },
    {
      slug: "local-producer-watch",
      status: "ENABLED",
      authority: "OBSERVE",
      budgetCents: 0,
    },
    {
      slug: "operating-cost-watch",
      status: "PAUSED",
      authority: "OBSERVE",
      budgetCents: 0,
    },
    {
      slug: "drop-opportunity-watch",
      status: "PAUSED",
      authority: "RECOMMEND",
      budgetCents: 0,
    },
  ]);

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(
      result.code,
      "WATCHTOWER_OBSERVE_PROOF_ENABLED_CARDINALITY_INVALID"
    );
  }
});
