# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER PROOF AFTER NW-R0-RECHAL-02

Date: 2026-09-29

Role: separate Remediation Builder  
Repository: `norrijam405/norvana`  
PR: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Preserved lineage

Historical external harness PASS remains historical evidence only:
- GitHub run `36455613388`
- job `109041083231`
- Watchtower run `15`
- `NO_MATERIAL_CHANGE`
- candidate count `0`
- estimated cost `0`

Original Fresh Challenger finding:
`NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`

Prior Remediation Builder PASS:
`92c070503f8a7f8a06468f0aca87591bf73d340b`

Prior Different Fresh Re-Challenger finding:
`NW-R0-RECHAL-01 — MULTIPLE_ACTIVE_HARNESSES_ARE_NOT_REJECTED_AT_CLAIM_OR_FINALIZATION`

Prior Remediation Builder PASS:
`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

Current Different Fresh Re-Challenger finding:
`NW-R0-RECHAL-02 — STALE_HARNESS_RETIREMENT_BYPASSES_GLOBAL_LOCK_AND_CAN_PERSIST_STALE_SAFETY_EVIDENCE`

No prior PASS/FAIL state is relabeled.

## Remediation candidates

First candidate:
`f482e4504ba98412a24a5a7b7c92eac94fc6dc02`

Recovery CI:
`36567544257 — FAILURE`

Failure class:
The new source-order regression test matched the imported `evaluateStaleHarnessRetirement` symbol instead of the execution-boundary call site. The implementation was not deployed.

Corrected candidate:
`d9b166e640791c0b939f40ccb46f2dff354b5270`

Recovery CI:
`36567655635 — SUCCESS`

CI gates:
- deterministic install: PASS
- runtime dependency audit: PASS
- full dependency high-severity gate: PASS
- current-tree secret regression gate: PASS
- Watchtower policy/adversarial tests: **23 PASS / 0 FAIL**
- TypeScript: PASS
- ESLint: PASS
- production Next.js build: PASS

## Remediation design

Affected route:
`src/app/api/watchtower/harness/retire-stale/route.ts`

The stale-retirement flow now participates in the same PostgreSQL transaction-level advisory lock used by:
- harness queue;
- watcher status/authority mutation;
- harness claim;
- harness finalization.

The lock is acquired before mutable Watchtower safety state is accepted.

Inside the locked transaction, retirement now re-reads and validates:
- current environment lockdown;
- all real watchers;
- every real watcher remains PAUSED;
- every real watcher remains inside R0 authority;
- every real watcher budget remains $0;
- executable-run cardinality;
- the sole active candidate;
- trigger remains `HARNESS_TEST`;
- state remains `QUEUED`;
- run runtime remains different from the current runtime.

The retirement write is now guarded by:
- exact run id;
- trigger `HARNESS_TEST`;
- status `QUEUED`;
- exact stale runtime id.

If the row has changed before the protected transition, the route returns:
`WATCHTOWER_STALE_RETIREMENT_STATE_CHANGED`

and does not write a successful retirement receipt.

`WATCH_HARNESS_STALE_RUN_RETIRED` is inserted only after the guarded transition succeeds.

Receipt and API safety fields are derived from the state proven inside the locked transaction, including:
- `realWatcherStatus: PAUSED`;
- protected watcher count;
- exact stale runtime;
- exact current runtime;
- original trigger `HARNESS_TEST`;
- original state `QUEUED`;
- global safety-lock identity.

## Concurrency property

Watcher mutation and stale retirement now share the same serialization domain.

If watcher mutation acquires the lock first:
- it may invalidate the active HARNESS_TEST and mutate watcher state;
- retirement later re-reads current state;
- retirement cannot rely on the old snapshot and cannot emit stale success evidence.

If stale retirement acquires the lock first:
- it proves watcher/run safety state;
- performs the guarded retirement transition;
- writes the retirement receipt;
- commits;
- only then can watcher mutation enter its protected section.

Thus:

`SAFE_AT_PRECHECK == SAFE_AT_PROTECTED_RETIREMENT_WRITE`

for the mutable Watchtower facts represented by the locked transaction.

## Alternate-writer sweep

Repository-wide application writer review at exact candidate `d9b166e...` found:

Active HARNESS_TEST creation/mutation paths:
1. `src/app/api/watchtower/harness/queue/route.ts`
   - creates HARNESS_TEST
   - common advisory lock: YES
2. `src/app/api/watchtower/harness/retire-stale/route.ts`
   - mutates stale HARNESS_TEST
   - common advisory lock: YES
3. `src/app/api/watchtower/jobs/[id]/route.ts`
   - invalidates active HARNESS_TEST during safety mutation
   - common advisory lock: YES
4. `src/app/api/watchtower/runs/claim/route.ts`
   - mutates HARNESS_TEST QUEUED -> RUNNING / safety BLOCKED
   - common advisory lock: YES
5. `src/app/api/watchtower/runs/[id]/result/route.ts`
   - mutates HARNESS_TEST RUNNING -> final / safety BLOCKED
   - common advisory lock: YES

Other `watchRuns` writers:
- `self-test/route.ts` creates only `CONTROL_TEST`;
- `worker-self-test/route.ts` creates/transitions only `WORKER_TEST`;
- `tick/route.ts` creates only `SCHEDULE`.

No alternate application route was found that creates or mutates an active HARNESS_TEST outside the common advisory-lock protocol.

## Regression coverage

The 23-test suite now includes:
- prior R0 authority/budget checks;
- worker mode separation;
- control/worker proof prerequisites;
- stale-retirement scope;
- zero-effect HARNESS_TEST results;
- GitHub OIDC identity binding;
- environment lockdown;
- watcher-state drift rejection;
- OBSERVE/$0 target;
- common lock coverage across queue, retirement, watcher mutation, claim, finalization;
- watcher mutation invalidation;
- active-harness uniqueness;
- multiplicity rejection at claim/finalization;
- claim/finalization lock ordering;
- stale-retirement lock ordering;
- stale-retirement guarded transition;
- receipt-after-transition ordering;
- retirement/watcher mutation shared serialization domain.

## Scope

Files changed in the corrected remediation:
- `src/app/api/watchtower/harness/retire-stale/route.ts`
- `tests/watchtower-policy.test.ts`

No deployment was created.
No real watcher was enabled.
No normal executor was enabled.
No supplier/fulfillment/publishing path was enabled.
No IgniAqua federation was enabled.
No commerce action or spend occurred.
No secret was exposed or rotated.

## Builder disposition

**BUILDER PASS**

Bound only to exact remediation candidate:

`d9b166e640791c0b939f40ccb46f2dff354b5270`

This is not Different Fresh Re-Challenger PASS.
This is not Independent Assurance PASS.
This is not BANKED.
