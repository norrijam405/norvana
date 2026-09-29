# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER ACTIVATION AFTER NW-R0-RECHAL-02

Date: 2026-09-28

You are being activated as a **separate Remediation Builder** for Norvana Watchtower R0.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R0_SUCCESSOR_HANDOFF_2026-09-27.md`

Then read, in order:

`docs/NORVANA_WATCHTOWER_R0_FRESH_CHALLENGER_FAIL_2026-09-28.md`

`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_PROOF_AFTER_NW-R0-CHAL-01_2026-09-28.md`

`docs/NORVANA_WATCHTOWER_R0_DIFFERENT_FRESH_RECHALLENGER_FAIL_AFTER_NW-R0-CHAL-01_2026-09-28.md`

`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_PROOF_AFTER_NW-R0-RECHAL-01_2026-09-28.md`

`docs/NORVANA_WATCHTOWER_R0_DIFFERENT_FRESH_RECHALLENGER_FAIL_AFTER_NW-R0-RECHAL-01_REMEDIATION_2026-09-28.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Different Fresh Re-Challenger that issued `NW-R0-RECHAL-02`.
You are not Independent Assurance.

## Exact failed candidate

`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

Parent candidate:

`7d96ab9c618ddf6f5f1bdf970e27f15f8c954d1e`

Builder CI lineage:
- `36493051666` — FAILURE at deterministic Watchtower regression assertion
- `36493145805` — SUCCESS on exact candidate `d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

Current branch head at activation:

`2fe75ed041de2be42ec695f760c5effc64b6dcbd`

The branch-head difference from the failed executable candidate is challenge documentation only. Preserve executable-candidate identity separately.

## Preserved lineage

Historical external harness PASS remains historical only:
- GitHub run `36455613388`
- job `109041083231`
- Watchtower run `15`
- status `NO_MATERIAL_CHANGE`
- candidate count `0`
- estimated cost `0`

Original Fresh Challenger finding:

`NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`

Prior Remediation Builder PASS:

`92c070503f8a7f8a06468f0aca87591bf73d340b`

Prior Different Fresh Re-Challenger finding:

`NW-R0-RECHAL-01 — MULTIPLE_ACTIVE_HARNESSES_ARE_NOT_REJECTED_AT_CLAIM_OR_FINALIZATION`

Current Remediation Builder PASS:

`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

Current Different Fresh Re-Challenger finding:

`NW-R0-RECHAL-02 — STALE_HARNESS_RETIREMENT_BYPASSES_GLOBAL_LOCK_AND_CAN_PERSIST_STALE_SAFETY_EVIDENCE`

Do not erase, rewrite, or relabel any prior PASS/FAIL state.

## What already survived Re-Challenge

Preserve the `NW-R0-RECHAL-01` multiplicity remediation.

The Different Fresh Re-Challenger independently confirmed that exact candidate `d64fb23...` materially establishes:

- harness claim acquires the common PostgreSQL transaction-level advisory lock;
- claim reads all active HARNESS_TEST rows across QUEUED/RUNNING;
- cardinality > 1 blocks all active harnesses;
- multiplicity blocking writes durable `WATCH_HARNESS_MULTIPLICITY_BLOCKED` receipts transactionally;
- exactly one active QUEUED harness is required before QUEUED -> RUNNING;
- duplicate claim against an already RUNNING harness fails closed;
- harness finalization acquires the same common advisory lock;
- finalization requires exactly one active RUNNING harness matching the requested run;
- multiplicity at finalization blocks all active harness proof state transactionally;
- claim and finalization revalidate current-runtime Control Proof + Worker Proof;
- claim and finalization re-read all real watchers and require PAUSED / R0 / $0;
- exact OBSERVE / $0 target remains enforced;
- harness result remains zero-cost / zero-candidate only;
- harness authentication remains Preview-only GitHub OIDC;
- harness mode retains no static-secret fallback;
- queue, watcher status/authority mutation, claim, and finalization retain the common lock domain;
- claim/completion receipts remain transactionally coupled with their state transitions.

Do not regress any of those properties.

## Defect to remediate

`NW-R0-RECHAL-02`

Affected application writer:

`src/app/api/watchtower/harness/retire-stale/route.ts`

The stale-retirement route currently:

1. validates environment locks;
2. reads all real watcher state outside the retirement transaction;
3. requires that pre-read to show every watcher PAUSED / R0 / $0;
4. reads active Watchtower runs outside the retirement transaction;
5. requires exactly one active run;
6. checks the pre-read run is an old-runtime QUEUED HARNESS_TEST;
7. only then opens a transaction;
8. updates the selected watch_run using only its id;
9. writes `WATCH_HARNESS_STALE_RUN_RETIRED`;
10. returns response claims including `realWatchersPaused: true`.

The route does **not** acquire the global Watchtower advisory lock used by harness queue, watcher safety mutation, harness claim, and harness finalization.

This allows mutable proof state to change after validation but before the retirement write.

### Required race to close

A valid application-level interleaving exists:

1. all real watchers are PAUSED / R0 / $0;
2. exactly one old-runtime QUEUED HARNESS_TEST exists;
3. stale retirement reads those facts;
4. watcher PATCH acquires the global lock;
5. watcher PATCH invalidates the active HARNESS_TEST, enables a real watcher, writes its invalidation receipt, and commits;
6. stale retirement resumes from its old snapshot;
7. its id-only update succeeds against the already-BLOCKED row;
8. it writes `WATCH_HARNESS_STALE_RUN_RETIRED`;
9. it can return `realWatchersPaused: true` although a real watcher is now ENABLED.

This is an evidence-integrity and temporal-proof defect.

The harness remains non-executable in this race; do not inflate the finding into a commerce-authority claim.

## Required remediation properties

Implement the narrowest coherent correction while preserving all prior safety properties.

At minimum:

1. **Common lock domain**
   - stale-harness retirement must acquire the same transaction-level advisory lock used by harness queue, watcher mutation, harness claim, and harness finalization;
   - lock acquisition must occur before any mutable Watchtower safety state used to justify retirement is accepted.

2. **Transactional revalidation**
   Inside the locked transaction, re-read and validate:
   - current runtime id remains available;
   - queue/executor/fulfillment/supplier/federation environment lock assumptions remain satisfied where transactionally representable;
   - every real watcher remains PAUSED;
   - every real watcher remains inside R0 authority;
   - every real watcher budget remains $0;
   - active executable-run cardinality remains exactly one;
   - the sole active run is the same selected run;
   - trigger is still `HARNESS_TEST`;
   - state is still `QUEUED`;
   - run runtime is still different from the current runtime.

3. **Fail-closed state transition**
   - retirement update must predicate on the current expected run state, not id alone;
   - if the row has changed state before the retirement transition, do not emit a successful retirement receipt;
   - if cardinality or watcher state changed, fail closed without producing stale success claims.

4. **Receipt integrity**
   - `WATCH_HARNESS_STALE_RUN_RETIRED` must be inserted only after the protected retirement transition succeeds;
   - receipt details must derive from the state proven inside the locked transaction;
   - API response safety claims must derive from the same proven transaction result.

5. **Concurrency**
   Demonstrate both serialization orders:
   - watcher mutation first -> stale retirement observes the new state and refuses/returns a non-success result without stale receipt;
   - retirement first -> retirement proof + receipt commit before watcher mutation proceeds.

6. **Regression tests**
   Add deterministic regression coverage for at least:
   - stale retirement route uses the same advisory lock constants;
   - lock acquisition precedes watcher/run invariant evaluation;
   - final update is guarded by expected active state;
   - watcher-mutation-first race cannot produce stale retirement success evidence;
   - retirement-first ordering remains coherent;
   - no `WATCH_HARNESS_STALE_RUN_RETIRED` receipt is emitted unless the guarded transition succeeds;
   - prior 20 Watchtower tests remain green;
   - prior `NW-R0-CHAL-01` and `NW-R0-RECHAL-01` regressions remain green.

7. **Alternate-writer sweep**
   - repeat the repository-wide application-writer review for HARNESS_TEST creation/mutation;
   - document every route that can create or mutate active HARNESS_TEST state;
   - confirm whether each such path either participates in the lock protocol or is provably non-conflicting.

## Builder proof

Produce deterministic Builder evidence bound to one exact remediation candidate.

Run the complete Recovery CI:
- deterministic install;
- runtime dependency audit;
- full high-severity dependency gate;
- current-tree secret regression check;
- Watchtower policy/adversarial tests;
- TypeScript;
- ESLint;
- production build.

If an intermediate candidate fails CI, preserve that exact failed candidate and failure before correcting it.

Produce a durable Builder proof document that includes:
- exact candidate SHA;
- parent SHA;
- exact files changed;
- CI run id and result;
- test count/result;
- preserved lineage;
- statement that no deployment or live Watchtower activation occurred.

Do not claim Re-Challenger PASS.
Do not claim Independent Assurance PASS.
Do not claim BANKED.

Do not deploy merely because Builder CI is green.

## Safety constraints

Do not enable real watchers.
Do not enable the normal executor.
Do not enable supplier connectors.
Do not enable fulfillment.
Do not enable publishing.
Do not enable IgniAqua federation.
Do not spend money.
Do not place orders.
Do not modify prices.
Do not activate suppliers.
Do not issue refunds.
Do not expose or rotate secrets.
Do not weaken Deployment Protection.

Preserve failures exactly.
