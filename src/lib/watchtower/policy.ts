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

export function evaluateWatcherEnable(input: {
  ownerCredentialRotated: boolean;
  controlSelfTestPassed: boolean;
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
