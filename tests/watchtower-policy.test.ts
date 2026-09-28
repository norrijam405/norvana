import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateR0Job,
  evaluateRunFinalizationState,
  evaluateStaleHarnessRetirement,
  evaluateHarnessEnvironmentSnapshot,
  evaluateHarnessResultEffects,
  evaluateHarnessTargetJob,
  evaluateHarnessWatcherSnapshot,
  evaluateGitHubHarnessClaims,
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
