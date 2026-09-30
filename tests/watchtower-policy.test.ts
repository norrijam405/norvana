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
  evaluateObserveProofEnvironmentSnapshot,
  evaluateObserveProofTargetJob,
  evaluateObserveProofWatcherSnapshot,
  evaluateActiveObserveProofInvariant,
  evaluateObserveProofResultEffects,
  evaluateWatcherEnable,
  evaluateWorkerModeExecutorState,
  isR0Authority,
} from "../src/lib/watchtower/policy.ts";

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

  const checkout = workflow.indexOf("Checkout exact repository state");
  const setup = workflow.indexOf("Set up Node");
  const destinationGate = workflow.indexOf(
    "Verify explicit gate and source-pinned Preview destination"
  );
  const destinationCommand = workflow.indexOf(
    "node scripts/watchtower-observe-proof-destination.mjs"
  );
  const mint = workflow.indexOf("Mint GitHub OIDC token for exact controlled Preview");
  const execute = workflow.indexOf("Run one-shot Local Producer Watch observe proof");

  assert.ok(checkout >= 0);
  assert.ok(setup > checkout);
  assert.ok(destinationGate > setup);
  assert.ok(destinationCommand > destinationGate);
  assert.ok(mint > destinationCommand);
  assert.ok(execute > mint);

  assert.doesNotMatch(workflow, /\$\{\{\s*vars\./);
  assert.doesNotMatch(workflow, /NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL/);
  assert.doesNotMatch(worker, /process\.env\.NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL/);
  assert.match(worker, /requirePinnedObserveProofBaseUrl\(\)/);
});
