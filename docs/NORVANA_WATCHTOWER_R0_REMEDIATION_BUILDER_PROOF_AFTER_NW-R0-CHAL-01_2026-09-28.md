# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER PROOF AFTER NW-R0-CHAL-01

Date: 2026-09-28

Role: separate Remediation Builder  
Repository: `norrijam405/norvana`  
PR: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Preserved failed lineage

Fresh Challenger finding:

`NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`

Historical external harness execution PASS remains preserved:
- GitHub run `36455613388`
- job `109041083231`
- Watchtower run `15`
- `NO_MATERIAL_CHANGE`
- candidate count `0`
- estimated cost `0`

The historical external PASS is not relabeled as Challenger-clean.

## Remediation candidates

First remediation candidate:

`2277a0a326ce04f60666a922d36314c7b22c34c4`

Recovery CI:

`36479883114`

Disposition:

`FAIL`

Reason:
TypeScript response-union collision in `runs/[id]/result/route.ts`. Policy/adversarial tests had already passed. Candidate was not deployed.

Corrected remediation candidate:

`92c070503f8a7f8a06468f0aca87591bf73d340b`

Recovery CI:

`36479978476`

Disposition:

`SUCCESS`

CI gates:
- deterministic install: PASS
- runtime dependency audit: PASS
- full dependency high-severity gate: PASS
- current-tree secret regression check: PASS
- Watchtower policy/adversarial tests: PASS
- TypeScript: PASS
- ESLint: PASS
- production Next.js build: PASS

## Remediation design

The repair serializes the complete mutable harness-safety boundary behind one PostgreSQL transaction-level advisory lock.

The same lock is used by:
- HARNESS_TEST queue creation;
- watcher status/authority mutation;
- HARNESS_TEST claim;
- HARNESS_TEST finalization.

This creates one serialization domain for the safety facts that must remain current.

### Queue

HARNESS_TEST queueing now:
- acquires the harness safety advisory lock;
- rechecks current-runtime Control Proof;
- rechecks current-runtime Worker Proof;
- requires an empty executable queue;
- requires every real watcher to be PAUSED;
- requires every real watcher to remain inside R0 authority;
- requires every real watcher budget to remain $0;
- requires exact OBSERVE / $0 target;
- writes the queue run and queue receipt inside the locked transaction.

### Watcher mutation

Safety-relevant watcher mutation now:
- acquires the same advisory lock;
- verifies ordinary enable prerequisites when enabling;
- finds any active QUEUED/RUNNING HARNESS_TEST;
- atomically marks active harness runs BLOCKED before the watcher mutation commits;
- inserts durable `WATCH_HARNESS_INVALIDATED_BY_WATCHER_MUTATION` receipts.

Therefore a real watcher safety-state change cannot silently coexist with a still-valid harness proof.

### Claim

HARNESS_TEST claim now:
- acquires the same advisory lock;
- rechecks exact current runtime;
- rechecks current-runtime Control + Worker proofs;
- re-reads every real watcher;
- requires all real watchers PAUSED / R0 / $0;
- requires exact target OBSERVE / $0;
- performs QUEUED -> RUNNING inside the same transaction;
- inserts the claim receipt inside that transaction.

If safety drift is observed, the queued HARNESS_TEST is BLOCKED with a durable safety-block receipt instead of being claimed.

### Finalization

HARNESS_TEST finalization now:
- acquires the same advisory lock;
- re-reads the exact current run;
- requires RUNNING state and current runtime;
- rechecks current-runtime Control + Worker proofs;
- re-reads every real watcher;
- requires all real watchers PAUSED / R0 / $0;
- requires exact target OBSERVE / $0;
- preserves zero-cost + zero-candidate enforcement;
- finalizes and inserts the completion receipt in one transaction.

If safety drift is observed, the RUNNING HARNESS_TEST is BLOCKED with a durable safety-block receipt and cannot return a false PASS.

## Concurrency property

The advisory lock gives deterministic serialization for watcher mutation vs queue/claim/finalization.

If watcher mutation serializes first:
- active harness is invalidated/BLOCKED;
- later claim/finalization cannot PASS it.

If claim serializes first:
- claim completes under the safe snapshot;
- subsequent watcher mutation finds the RUNNING harness and invalidates it;
- later finalization cannot PASS it.

If finalization serializes first:
- finalization proves the safety snapshot before completing;
- a later watcher mutation occurs only after the proof transaction is complete.

This closes the TOCTOU path identified by `NW-R0-CHAL-01`.

## Deterministic regression coverage

The Watchtower test suite now exercises:
- harness environment lock requirements;
- queue -> watcher status drift -> claim safety rejection model;
- claim -> watcher authority drift -> finalization safety rejection model;
- budget drift;
- exact OBSERVE / $0 target;
- presence of the common advisory lock in all four critical mutation/execution routes;
- watcher mutation path contains active HARNESS_TEST invalidation and durable invalidation receipt.

## Scope

Files changed relative to Builder activation head:
- `src/app/api/watchtower/harness/queue/route.ts`
- `src/app/api/watchtower/jobs/[id]/route.ts`
- `src/app/api/watchtower/runs/claim/route.ts`
- `src/app/api/watchtower/runs/[id]/result/route.ts`
- `src/lib/watchtower/policy.ts`
- `tests/watchtower-policy.test.ts`

No Vercel deployment gate was changed.
No Preview deployment was created.
No real watcher was enabled.
No external commerce authority was enabled.
No spend occurred.

## Builder disposition

**BUILDER PASS**

Bound only to exact remediation candidate:

`92c070503f8a7f8a06468f0aca87591bf73d340b`

This is not Fresh Re-Challenger PASS.
This is not Independent Assurance PASS.
This is not BANKED.
