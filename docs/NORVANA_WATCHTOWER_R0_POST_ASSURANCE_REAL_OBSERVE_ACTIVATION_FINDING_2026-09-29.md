# NORVANA WATCHTOWER R0 — POST-ASSURANCE REAL-OBSERVE ACTIVATION FINDING

Date: 2026-09-29

Repository: `norrijam405/norvana`
PR: `#1`
Branch: `recovery/2026-09-26-norvana-modernization-r0`

Independent Assurance remains:
`INDEPENDENT_ASSURANCE_PASS`

Exact assured candidate:
`d9b166e640791c0b939f40ccb46f2dff354b5270`

This finding is a **new post-assurance activation finding**. It does not relabel or invalidate the completed Independent Assurance disposition.

## Finding

`NW-R0-OBS-01 — REAL_OBSERVE_ACTIVATION_DEADLOCKS_ON_RUNTIME_BOUND_PROOFS_AND_DEPLOYMENT_TIME_QUEUE_EXECUTOR_FLAGS`

## Evidence

The current Watchtower safety model requires current-runtime Control Proof and Worker Proof before a watcher may be enabled and before scheduled execution is accepted.

Those proofs intentionally require:
- `NORVANA_WATCHTOWER_QUEUE_ENABLED != true`
- `NORVANA_WATCHTOWER_EXECUTOR_ENABLED != true`

The normal scheduler path requires:
- `NORVANA_WATCHTOWER_QUEUE_ENABLED=true`

The standard worker claim path requires:
- `NORVANA_WATCHTOWER_EXECUTOR_ENABLED=true`

Control/Worker proofs are bound to the current Watchtower runtime identity, which resolves from the current Vercel deployment/runtime.

Changing deployment-time queue/executor environment flags to true requires a new deployment/runtime. The previous proofs therefore do not apply to the new runtime.

Running new Control/Worker proofs on that new runtime is impossible because those proof routes reject queue/executor enabled state.

Therefore the currently banked production-safe state cannot transition to a real scheduled OBSERVE execution without either:
1. weakening the proof contract,
2. bypassing runtime proof binding, or
3. adding a separately bounded one-shot observation proof path.

## Safety disposition

Do **not**:
- turn the normal queue on merely to force a proof;
- turn the normal executor on merely to force a proof;
- reuse proofs from an older deployment/runtime;
- weaken current-runtime proof binding;
- treat the external HARNESS_TEST as a real OBSERVE execution;
- enable RECOMMEND or ACT authority for this gate.

## Narrow remediation direction

Build a separately bounded one-shot `OBSERVE_PROOF` path that:

- leaves normal queue OFF;
- leaves normal executor OFF;
- leaves external fulfillment OFF;
- leaves supplier connectors OFF;
- leaves IgniAqua federation OFF;
- requires current-runtime Control Proof + Worker Proof;
- permits exactly one approved OBSERVE watcher at $0;
- queues exactly one one-shot observation proof run;
- uses a separately authenticated external proof worker;
- allows real read-only source retrieval only;
- forbids candidates, spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, and federation;
- finalizes atomically with durable evidence/receipt;
- cannot claim or finalize normal SCHEDULE or HARNESS_TEST runs;
- remains manual and founder-gated for R0.

The initial target should be:
`local-producer-watch`

No remediation has been performed by this finding document.
