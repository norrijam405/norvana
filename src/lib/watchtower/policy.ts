export const R0_SAFE_AUTHORITIES = ["OBSERVE", "RECOMMEND"] as const;

export type R0Authority = (typeof R0_SAFE_AUTHORITIES)[number];

export type R0GateDecision =
  | { ok: true }
  | { ok: false; code: string; reason: string };

export function isR0Authority(authority: string): authority is R0Authority {
  return R0_SAFE_AUTHORITIES.includes(authority as R0Authority);
}

export function evaluateR0Job(
  authority: string,
  budgetCents: number
): R0GateDecision {
  if (!isR0Authority(authority)) {
    return {
      ok: false,
      code: "WATCHTOWER_AUTHORITY_CEILING_EXCEEDED",
      reason: "Watcher authority exceeds the R0 ceiling.",
    };
  }

  if (budgetCents !== 0) {
    return {
      ok: false,
      code: "WATCHTOWER_NONZERO_BUDGET_LOCKED",
      reason: "R0 watchers must retain a $0 automation budget.",
    };
  }

  return { ok: true };
}

export function evaluateWorkerModeExecutorState(
  mode: string,
  executorEnabled: boolean
): R0GateDecision {
  if (mode === "standard") {
    if (!executorEnabled) {
      return {
        ok: false,
        code: "WATCHTOWER_EXECUTOR_DISABLED",
        reason: "Watchtower execution is disabled.",
      };
    }
    return { ok: true };
  }

  if (mode === "harness") {
    if (executorEnabled) {
      return {
        ok: false,
        code: "WATCHTOWER_HARNESS_REQUIRES_EXECUTOR_DISABLED",
        reason: "Harness worker mode requires the normal executor to remain disabled.",
      };
    }
    return { ok: true };
  }

  return {
    ok: false,
    code: "WATCHTOWER_INVALID_WORKER_MODE",
    reason: "Invalid worker mode.",
  };
}

export function evaluateWatcherEnable(input: {
  ownerCredentialRotated: boolean;
  controlSelfTestPassed: boolean;
  workerContractProofPassed: boolean;
  authority: string;
  budgetCents: number;
}): R0GateDecision {
  if (!input.ownerCredentialRotated) {
    return {
      ok: false,
      code: "WATCHTOWER_OWNER_PASSWORD_ROTATION_REQUIRED",
      reason: "Change the temporary owner password before enabling a watcher.",
    };
  }

  if (!input.controlSelfTestPassed) {
    return {
      ok: false,
      code: "WATCHTOWER_CONTROL_SELF_TEST_REQUIRED",
      reason: "Run the Watchtower safe self-test before enabling a watcher.",
    };
  }

  if (!input.workerContractProofPassed) {
    return {
      ok: false,
      code: "WATCHTOWER_WORKER_PROOF_REQUIRED",
      reason: "Run the deterministic worker contract proof before enabling a watcher.",
    };
  }

  return evaluateR0Job(input.authority, input.budgetCents);
}

export function evaluateRunFinalizationState(
  currentStatus: string
): R0GateDecision {
  if (currentStatus !== "RUNNING") {
    return {
      ok: false,
      code: "WATCH_RUN_INVALID_STATE",
      reason: "Watch run is not in RUNNING state.",
    };
  }

  return { ok: true };
}


export function evaluateStaleHarnessRetirement(input: {
  trigger: string;
  status: string;
  runRuntimeId: string | null;
  currentRuntimeId: string;
}): R0GateDecision {
  if (input.trigger !== "HARNESS_TEST") {
    return {
      ok: false,
      code: "WATCHTOWER_STALE_RETIREMENT_HARNESS_ONLY",
      reason: "Only a stale HARNESS_TEST may be retired by this recovery path.",
    };
  }

  if (input.status !== "QUEUED") {
    return {
      ok: false,
      code: "WATCHTOWER_STALE_RETIREMENT_QUEUED_ONLY",
      reason: "Only a queued stale harness run may be retired by this recovery path.",
    };
  }

  const runRuntimeId = input.runRuntimeId?.trim();
  const currentRuntimeId = input.currentRuntimeId.trim();

  if (!runRuntimeId || !currentRuntimeId || runRuntimeId === currentRuntimeId) {
    return {
      ok: false,
      code: "WATCHTOWER_STALE_RETIREMENT_REQUIRES_OLD_RUNTIME",
      reason: "Harness retirement requires a run bound to a different runtime.",
    };
  }

  return { ok: true };
}

export function evaluateHarnessResultEffects(input: {
  trigger: string;
  estimatedCostCents: number;
  candidateCount: number;
}): R0GateDecision {
  if (input.trigger !== "HARNESS_TEST") return { ok: true };

  if (input.estimatedCostCents !== 0 || input.candidateCount !== 0) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_RESULT_MUST_BE_ZERO_EFFECT",
      reason: "HARNESS_TEST results must report zero spend and emit zero candidates.",
    };
  }

  return { ok: true };
}


export function evaluateGitHubHarnessClaims(claims: Record<string, unknown>): R0GateDecision {
  const audience = Array.isArray(claims.aud)
    ? claims.aud.map((value) => String(value))
    : [String(claims.aud || "")];

  if (String(claims.iss || "") !== "https://token.actions.githubusercontent.com") {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_OIDC_ISSUER_MISMATCH",
      reason: "Harness OIDC issuer is not GitHub Actions.",
    };
  }

  if (!audience.includes("https://github.com/norrijam405")) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_OIDC_AUDIENCE_MISMATCH",
      reason: "Harness OIDC audience does not match the Norvana GitHub owner.",
    };
  }

  if (String(claims.repository || "") !== "norrijam405/norvana") {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_OIDC_REPOSITORY_MISMATCH",
      reason: "Harness OIDC repository does not match Norvana.",
    };
  }

  if (String(claims.ref || "") !== "refs/heads/main") {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_OIDC_REF_MISMATCH",
      reason: "Harness OIDC ref must be the main branch.",
    };
  }

  if (String(claims.event_name || "") !== "workflow_dispatch") {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_OIDC_EVENT_MISMATCH",
      reason: "Harness OIDC event must be workflow_dispatch.",
    };
  }

  if (
    String(claims.workflow_ref || "") !==
    "norrijam405/norvana/.github/workflows/watchtower-worker-harness.yml@refs/heads/main"
  ) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_OIDC_WORKFLOW_MISMATCH",
      reason: "Harness OIDC workflow identity does not match the approved workflow.",
    };
  }

  if (String(claims.runner_environment || "") !== "github-hosted") {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_OIDC_RUNNER_MISMATCH",
      reason: "Harness OIDC token must originate from a GitHub-hosted runner.",
    };
  }

  return { ok: true };
}


export const WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1 = 20_260_928;
export const WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2 = 1_705;

export function evaluateHarnessEnvironmentSnapshot(input: {
  queueEnabled: boolean;
  executorEnabled: boolean;
  fulfillmentEnabled: boolean;
  supplierConnectorsEnabled: boolean;
  federationEnabled: boolean;
}): R0GateDecision {
  if (
    input.queueEnabled ||
    input.executorEnabled ||
    input.fulfillmentEnabled ||
    input.supplierConnectorsEnabled ||
    input.federationEnabled
  ) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_ENVIRONMENT_NOT_LOCKED",
      reason:
        "Harness execution requires queue, executor, fulfillment, supplier connectors, and federation to remain disabled.",
    };
  }

  return { ok: true };
}

export function evaluateHarnessWatcherSnapshot(
  jobs: Array<{ status: string; authority: string; budgetCents: number }>
): R0GateDecision {
  if (!jobs.length) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_WATCHERS_MISSING",
      reason: "Harness execution requires initialized real watchers.",
    };
  }

  const nonPaused = jobs.find((job) => job.status !== "PAUSED");
  if (nonPaused) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_REAL_WATCHER_NOT_PAUSED",
      reason: "Every real watcher must remain PAUSED for harness execution.",
    };
  }

  for (const job of jobs) {
    const decision = evaluateR0Job(job.authority, job.budgetCents);
    if (!decision.ok) {
      return {
        ok: false,
        code: "WATCHTOWER_HARNESS_REAL_WATCHER_POLICY_DRIFT",
        reason: "Every real watcher must remain inside R0 authority and zero-budget policy.",
      };
    }
  }

  return { ok: true };
}

export function evaluateHarnessTargetJob(
  authority: string,
  budgetCents: number
): R0GateDecision {
  if (authority !== "OBSERVE") {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_REQUIRES_OBSERVE",
      reason: "Harness execution requires an OBSERVE target job.",
    };
  }

  if (budgetCents !== 0) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_REQUIRES_ZERO_BUDGET",
      reason: "Harness execution requires a zero-dollar target job.",
    };
  }

  return { ok: true };
}


export function evaluateActiveHarnessInvariant(input: {
  activeRuns: Array<{ id: number; status: string }>;
  expectedRunId?: number;
  expectedStatus?: "QUEUED" | "RUNNING";
}): R0GateDecision {
  if (input.activeRuns.length !== 1) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_ACTIVE_CARDINALITY_INVALID",
      reason: "Harness execution requires exactly one active HARNESS_TEST.",
    };
  }

  const [active] = input.activeRuns;

  if (input.expectedRunId !== undefined && active.id !== input.expectedRunId) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_ACTIVE_RUN_MISMATCH",
      reason: "The active HARNESS_TEST does not match the requested run.",
    };
  }

  if (input.expectedStatus !== undefined && active.status !== input.expectedStatus) {
    return {
      ok: false,
      code: "WATCHTOWER_HARNESS_ACTIVE_STATE_MISMATCH",
      reason: `The active HARNESS_TEST must be ${input.expectedStatus} at this execution boundary.`,
    };
  }

  return { ok: true };
}


export const WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_1 =
  WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1;
export const WATCHTOWER_OBSERVE_PROOF_ADVISORY_LOCK_KEY_2 =
  WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2;

export const WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG = "local-producer-watch";

export const WATCHTOWER_OBSERVE_PROOF_MANUAL_WORKFLOW_REF =
  "norrijam405/norvana/.github/workflows/watchtower-observe-proof.yml@refs/heads/main";

export const WATCHTOWER_R1_WORKFLOW_REF =
  "norrijam405/norvana/.github/workflows/watchtower-local-producer-r1.yml@refs/heads/main";

export const WATCHTOWER_R1_MIN_INTERVAL_MS = 20 * 60 * 60 * 1000;
export const WATCHTOWER_R1_QUEUE_RECEIPT_ACTION = "WATCH_R1_OBSERVE_QUEUED";

export function evaluateR1QueueCadence(input: {
  lastQueuedAt: Date | null;
  now: Date;
}): R0GateDecision {
  if (!input.lastQueuedAt) return { ok: true };

  const elapsedMs = input.now.getTime() - input.lastQueuedAt.getTime();
  if (
    !Number.isFinite(elapsedMs) ||
    elapsedMs < WATCHTOWER_R1_MIN_INTERVAL_MS
  ) {
    return {
      ok: false,
      code: "WATCHTOWER_R1_CADENCE_NOT_ELAPSED",
      reason:
        "R1 recurring observe requires at least 20 hours between queue operations.",
    };
  }

  return { ok: true };
}

export function evaluateGitHubObserveProofClaims(
  claims: Record<string, unknown>
): R0GateDecision {
  const audience = Array.isArray(claims.aud)
    ? claims.aud.map((value) => String(value))
    : [String(claims.aud || "")];

  if (String(claims.iss || "") !== "https://token.actions.githubusercontent.com") {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_ISSUER_MISMATCH",
      reason: "Observe-proof OIDC issuer is not GitHub Actions.",
    };
  }

  if (!audience.includes("https://github.com/norrijam405")) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_AUDIENCE_MISMATCH",
      reason: "Observe-proof OIDC audience does not match the Norvana GitHub owner.",
    };
  }

  if (String(claims.repository || "") !== "norrijam405/norvana") {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_REPOSITORY_MISMATCH",
      reason: "Observe-proof OIDC repository does not match Norvana.",
    };
  }

  if (String(claims.ref || "") !== "refs/heads/main") {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_REF_MISMATCH",
      reason: "Observe-proof OIDC ref must be the main branch.",
    };
  }

  const eventName = String(claims.event_name || "");
  const workflowRef = String(claims.workflow_ref || "");

  if (
    workflowRef !== WATCHTOWER_OBSERVE_PROOF_MANUAL_WORKFLOW_REF &&
    workflowRef !== WATCHTOWER_R1_WORKFLOW_REF
  ) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_WORKFLOW_MISMATCH",
      reason: "Observe-proof OIDC workflow identity does not match an approved workflow.",
    };
  }

  if (
    workflowRef === WATCHTOWER_OBSERVE_PROOF_MANUAL_WORKFLOW_REF &&
    eventName !== "workflow_dispatch"
  ) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_EVENT_MISMATCH",
      reason: "The one-shot observe-proof workflow requires workflow_dispatch.",
    };
  }

  if (
    workflowRef === WATCHTOWER_R1_WORKFLOW_REF &&
    eventName !== "schedule" &&
    eventName !== "workflow_dispatch"
  ) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_EVENT_MISMATCH",
      reason: "The R1 observe workflow permits schedule or controlled workflow_dispatch only.",
    };
  }

  if (String(claims.runner_environment || "") !== "github-hosted") {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_OIDC_RUNNER_MISMATCH",
      reason: "Observe-proof OIDC token must originate from a GitHub-hosted runner.",
    };
  }

  return { ok: true };
}

export function evaluateGitHubR1QueueClaims(
  claims: Record<string, unknown>
): R0GateDecision {
  const base = evaluateGitHubObserveProofClaims(claims);
  if (!base.ok) return base;

  if (String(claims.workflow_ref || "") !== WATCHTOWER_R1_WORKFLOW_REF) {
    return {
      ok: false,
      code: "WATCHTOWER_R1_OIDC_WORKFLOW_MISMATCH",
      reason: "R1 queue OIDC identity must come from the exact R1 workflow.",
    };
  }

  const eventName = String(claims.event_name || "");
  if (eventName !== "schedule" && eventName !== "workflow_dispatch") {
    return {
      ok: false,
      code: "WATCHTOWER_R1_OIDC_EVENT_MISMATCH",
      reason: "R1 queue OIDC event must be schedule or controlled workflow_dispatch.",
    };
  }

  return { ok: true };
}

export function evaluateObserveProofEnvironmentSnapshot(input: {
  queueEnabled: boolean;
  executorEnabled: boolean;
  fulfillmentEnabled: boolean;
  supplierConnectorsEnabled: boolean;
  federationEnabled: boolean;
}): R0GateDecision {
  if (
    input.queueEnabled ||
    input.executorEnabled ||
    input.fulfillmentEnabled ||
    input.supplierConnectorsEnabled ||
    input.federationEnabled
  ) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_ENVIRONMENT_NOT_LOCKED",
      reason:
        "Observe proof requires normal queue, executor, fulfillment, supplier connectors, and federation to remain disabled.",
    };
  }

  return { ok: true };
}

export function evaluateObserveProofTargetJob(input: {
  slug: string;
  status: string;
  authority: string;
  budgetCents: number;
}): R0GateDecision {
  if (input.slug !== WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_TARGET_NOT_ALLOWED",
      reason: "R0 real-observe proof is restricted to Local Producer Watch.",
    };
  }

  if (input.status !== "ENABLED") {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_TARGET_NOT_ENABLED",
      reason: "The Local Producer Watch must be the one enabled watcher for observe proof.",
    };
  }

  if (input.authority !== "OBSERVE") {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_REQUIRES_OBSERVE",
      reason: "Real-observe proof requires OBSERVE authority.",
    };
  }

  if (input.budgetCents !== 0) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_REQUIRES_ZERO_BUDGET",
      reason: "Real-observe proof requires a zero-dollar target job.",
    };
  }

  return { ok: true };
}

export function evaluateObserveProofWatcherSnapshot(
  jobs: Array<{
    slug: string;
    status: string;
    authority: string;
    budgetCents: number;
  }>
): R0GateDecision {
  if (!jobs.length) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_WATCHERS_MISSING",
      reason: "Observe proof requires initialized Watchtower jobs.",
    };
  }

  const enabled = jobs.filter((job) => job.status === "ENABLED");
  if (enabled.length !== 1) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_ENABLED_CARDINALITY_INVALID",
      reason: "Observe proof requires exactly one enabled real watcher.",
    };
  }

  const targetDecision = evaluateObserveProofTargetJob(enabled[0]);
  if (!targetDecision.ok) return targetDecision;

  for (const job of jobs) {
    const decision = evaluateR0Job(job.authority, job.budgetCents);
    if (!decision.ok) {
      return {
        ok: false,
        code: "WATCHTOWER_OBSERVE_PROOF_WATCHER_POLICY_DRIFT",
        reason: "Every Watchtower job must remain inside R0 authority and zero-budget policy.",
      };
    }

    if (job.slug !== WATCHTOWER_OBSERVE_PROOF_TARGET_SLUG && job.status !== "PAUSED") {
      return {
        ok: false,
        code: "WATCHTOWER_OBSERVE_PROOF_OTHER_WATCHER_NOT_PAUSED",
        reason: "All non-target watchers must remain PAUSED during observe proof.",
      };
    }
  }

  return { ok: true };
}

export function evaluateActiveObserveProofInvariant(input: {
  activeRuns: Array<{ id: number; status: string }>;
  expectedRunId?: number;
  expectedStatus?: "QUEUED" | "RUNNING";
}): R0GateDecision {
  if (input.activeRuns.length !== 1) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_ACTIVE_CARDINALITY_INVALID",
      reason: "Observe proof requires exactly one active OBSERVE_PROOF run.",
    };
  }

  const [active] = input.activeRuns;

  if (input.expectedRunId !== undefined && active.id !== input.expectedRunId) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_ACTIVE_RUN_MISMATCH",
      reason: "The active OBSERVE_PROOF does not match the requested run.",
    };
  }

  if (input.expectedStatus !== undefined && active.status !== input.expectedStatus) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_ACTIVE_STATE_MISMATCH",
      reason: `The active OBSERVE_PROOF must be ${input.expectedStatus} at this execution boundary.`,
    };
  }

  return { ok: true };
}

export function evaluateObserveProofResultEffects(input: {
  estimatedCostCents: number;
  candidateCount: number;
}): R0GateDecision {
  if (input.estimatedCostCents !== 0) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_NONZERO_COST",
      reason: "Real-observe proof must report zero spend.",
    };
  }

  if (input.candidateCount !== 0) {
    return {
      ok: false,
      code: "WATCHTOWER_OBSERVE_PROOF_CANDIDATES_FORBIDDEN",
      reason: "Real-observe proof may record observations, not recommendation candidates.",
    };
  }

  return { ok: true };
}
