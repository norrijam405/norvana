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
