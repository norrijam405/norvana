import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateR0Job,
  evaluateRunFinalizationState,
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
