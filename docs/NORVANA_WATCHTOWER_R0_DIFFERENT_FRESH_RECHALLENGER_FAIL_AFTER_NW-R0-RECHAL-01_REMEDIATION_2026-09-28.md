# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER FAIL AFTER NW-R0-RECHAL-01 REMEDIATION

Date: 2026-09-28

Role: Different Fresh Re-Challenger  
Repository: `norrijam405/norvana`  
PR: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

This Re-Challenger did not build the remediation, did not act as the prior Fresh Challenger or prior Different Fresh Re-Challenger, did not act as Independent Assurance, and performed no repair.

## Disposition

**FAIL**

Stable finding:

`NW-R0-RECHAL-02 — STALE_HARNESS_RETIREMENT_BYPASSES_GLOBAL_LOCK_AND_CAN_PERSIST_STALE_SAFETY_EVIDENCE`

## Exact candidate evaluated

Corrected remediation candidate:

`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

Parent candidate with preserved deterministic regression-test failure:

`7d96ab9c618ddf6f5f1bdf970e27f15f8c954d1e`

Builder CI:
- `36493051666` — FAILURE at Watchtower policy regression assertion
- `36493145805` — SUCCESS

The successful CI run is exactly bound to `d64fb23a0667dd764e45b0136a21dbab58c9ed1b` and shows:
- Watchtower policy tests: 20 PASS / 0 FAIL
- TypeScript: PASS
- ESLint: PASS
- production build: PASS
- dependency/security gates: PASS
- current-tree secret regression gate: PASS

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

Prior remediation Builder PASS:

`92c070503f8a7f8a06468f0aca87591bf73d340b`

Prior Different Fresh Re-Challenger finding:

`NW-R0-RECHAL-01 — MULTIPLE_ACTIVE_HARNESSES_ARE_NOT_REJECTED_AT_CLAIM_OR_FINALIZATION`

Current remediation Builder PASS:

`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

Do not relabel any prior PASS/FAIL evidence.

## What survived independent attack

The `NW-R0-RECHAL-01` remediation materially closes the active-harness multiplicity defect at claim and finalization.

At the exact candidate:

- harness claim acquires the Watchtower advisory lock before reading active `HARNESS_TEST` rows;
- claim reads active `QUEUED` + `RUNNING` harness rows;
- more than one active harness causes every active harness to be changed to `BLOCKED`;
- every harness blocked by multiplicity receives a durable `WATCH_HARNESS_MULTIPLICITY_BLOCKED` receipt inside the same transaction;
- exactly one active harness must be the expected `QUEUED` run before `QUEUED -> RUNNING`;
- a second claim against an already `RUNNING` harness fails closed;
- harness finalization acquires the same advisory lock before its execution-boundary cardinality check;
- finalization blocks every active harness when multiplicity is observed;
- the requested run must be the sole active `RUNNING` harness before finalization;
- claim and finalization re-check current-runtime Control Proof + Worker Proof;
- claim and finalization re-read the full watcher snapshot and require every real watcher to remain PAUSED / R0 / $0;
- the harness target remains exact OBSERVE / $0;
- Preview-only GitHub OIDC harness authentication remains present;
- no static worker-secret fallback exists for harness mode;
- zero-cost / zero-candidate result enforcement remains present;
- claim transition + claim receipt and completion transition + completion receipt remain transactionally coupled;
- queue creation and watcher status/authority mutation still share the same advisory lock domain as claim/finalization.

The repaired claim/finalization multiplicity path therefore survives the required two-QUEUED, RUNNING+QUEUED, two-RUNNING, wrong-run, wrong-state, duplicate-claim, and lock-ordering source attacks.

## Fresh finding

The activation explicitly requires an alternate-writer / bypass review of every repository path that can create or mutate `HARNESS_TEST` rows.

That review found one application writer outside the common lock domain:

`src/app/api/watchtower/harness/retire-stale/route.ts`

The route:
1. reads all real watcher state before opening the retirement transaction;
2. requires that stale pre-read to show every watcher PAUSED / R0 / $0;
3. reads active Watchtower runs before opening the retirement transaction;
4. requires exactly one active run and evaluates it as an old-runtime `QUEUED HARNESS_TEST`;
5. later starts a database transaction;
6. updates the selected run by id;
7. writes a durable `WATCH_HARNESS_STALE_RUN_RETIRED` receipt;
8. returns response fields including `realWatchersPaused: true`.

It does **not** acquire:

`pg_advisory_xact_lock(WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1, WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2)`

and the final update is not conditioned on the run still being `QUEUED`, still being `HARNESS_TEST`, still belonging to the stale runtime, or the watcher snapshot still being PAUSED / R0 / $0.

Exact source evidence in the candidate:
- `src/app/api/watchtower/harness/retire-stale/route.ts`
  - watcher snapshot is read before the transaction;
  - active runs are read before the transaction;
  - transaction later performs `.update(watchRuns)`;
  - update predicate is only the previously selected run id;
  - no common advisory lock is acquired.
- `src/app/api/watchtower/jobs/[id]/route.ts`
  - watcher status/authority mutation does acquire the common advisory lock;
  - it blocks active `HARNESS_TEST` rows and writes `WATCH_HARNESS_INVALIDATED_BY_WATCHER_MUTATION` before committing the watcher mutation.

## Deterministic race

A valid application-level interleaving exists without manual SQL corruption:

1. State begins with all real watchers PAUSED / R0 / $0 and exactly one old-runtime `QUEUED HARNESS_TEST`.
2. Owner calls stale-harness retirement.
3. `retire-stale` reads the watcher snapshot as safe and reads the old-runtime queued harness as its candidate.
4. Before `retire-stale` opens its write transaction, an owner watcher PATCH runs.
5. The watcher PATCH acquires the global Watchtower advisory lock.
6. The watcher PATCH satisfies ordinary enable prerequisites, blocks the active harness, writes `WATCH_HARNESS_INVALIDATED_BY_WATCHER_MUTATION`, enables the real watcher, and commits.
7. `retire-stale` then continues from its stale pre-read.
8. Because its update predicate is only the run id, it updates the already-BLOCKED run to BLOCKED again.
9. It writes `WATCH_HARNESS_STALE_RUN_RETIRED` using stale pre-read facts such as the candidate's prior `QUEUED` status.
10. It returns `realWatchersPaused: true` even though the watcher mutation has already committed an ENABLED watcher.

The harness remains non-executable, so this finding does not claim commerce authority, spend, publishing, fulfillment, supplier activation, repricing, refunds, or a second active harness.

The defect is **evidence integrity and lock-domain correctness**: a durable Watchtower recovery receipt and API acknowledgement can assert safety facts that were no longer true when the retirement write occurred.

This is the same class of temporal proof problem the Watchtower challenge program is designed to reject:

`SAFE_AT_PRECHECK != SAFE_AT_WRITE`

## Why green CI did not catch it

The exact candidate's 20-test suite includes a static test named:

`critical routes share the same transaction-level harness safety lock`

but that test enumerates only:
- harness queue;
- watcher mutation;
- harness claim;
- harness finalization.

It does not include `harness/retire-stale`.

The suite also tests stale-retirement policy inputs as a pure function, but it does not test stale-retirement concurrency against watcher mutation or verify that retirement preconditions and the retirement receipt are bound to one lock-protected transaction.

Therefore CI `36493145805` is valid green evidence for what it tests, but it does not cover this alternate-writer race.

## Required remediation acceptance criteria

A later Remediation Builder should preserve the existing multiplicity repair and close this alternate-writer temporal gap.

At minimum:

- stale-harness retirement must participate in the same Watchtower advisory lock domain before evaluating mutable Watchtower safety state;
- the watcher PAUSED / R0 / $0 snapshot, active-run cardinality check, stale-runtime qualification, run state transition, and retirement receipt must be bound coherently to the protected transaction;
- the final update must fail closed if the selected run changed trigger, runtime, or active state before retirement;
- a concurrent watcher mutation must serialize either entirely before or entirely after retirement;
- the retirement receipt must reflect the state actually proven at the retirement boundary, not a stale pre-transaction snapshot;
- regression coverage must include the race:
  - stale-retirement precheck vs watcher enable/mutation;
  - watcher mutation first -> retirement re-evaluates current state and does not emit stale claims;
  - retirement first -> watcher mutation occurs only after retirement proof/receipt commits;
- preserve `NW-R0-CHAL-01`, `NW-R0-RECHAL-01`, the failed parent CI `36493051666`, successful Builder CI `36493145805`, and historical external harness PASS exactly as historical lineage.

## Boundary

No remediation was performed.

No deployment was created.
No real watcher was enabled.
No executor was enabled.
No IgniAqua federation was enabled.
No external commerce action was enabled.
No spend occurred.
No secret was exposed or rotated.

Truth state:

`EXTERNAL_HARNESS_PASS + FRESH_CHALLENGER_FAIL(NW-R0-CHAL-01) + REMEDIATION_BUILDER_PASS(92c070503...) + DIFFERENT_FRESH_RECHALLENGER_FAIL(NW-R0-RECHAL-01) + REMEDIATION_BUILDER_PASS(d64fb23...) + DIFFERENT_FRESH_RECHALLENGER_FAIL(NW-R0-RECHAL-02)`

Not Independent Assurance.
Not BANKED.
