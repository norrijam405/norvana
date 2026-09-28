# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER PROOF AFTER NW-R0-RECHAL-01

Date: 2026-09-28

Role: separate Remediation Builder  
Repository: `norrijam405/norvana`  
PR: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Preserved lineage

Historical external harness PASS:
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

Different Fresh Re-Challenger finding:
`NW-R0-RECHAL-01 — MULTIPLE_ACTIVE_HARNESSES_ARE_NOT_REJECTED_AT_CLAIM_OR_FINALIZATION`

Do not relabel prior PASS/FAIL evidence.

## Remediation candidates

First candidate:
`7d96ab9c618ddf6f5f1bdf970e27f15f8c954d1e`

Recovery CI:
`36493051666 — FAILURE`

Failure class:
deterministic regression-test assertion selected the imported symbol occurrence rather than the execution-boundary call site. The production remediation code was not deployed. The failure is preserved.

Corrected candidate:
`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

Recovery CI:
`36493145805 — SUCCESS`

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

### Active-harness execution invariant

A new deterministic policy gate requires exactly one active HARNESS_TEST at the relevant execution boundary.

It validates:
- active HARNESS_TEST cardinality == 1;
- expected run identity matches;
- expected active state matches `QUEUED` at claim or `RUNNING` at finalization.

Failure codes include:
- `WATCHTOWER_HARNESS_ACTIVE_CARDINALITY_INVALID`
- `WATCHTOWER_HARNESS_ACTIVE_RUN_MISMATCH`
- `WATCHTOWER_HARNESS_ACTIVE_STATE_MISMATCH`

### Claim

Under the existing global Watchtower advisory lock, claim now:
- queries all active HARNESS_TEST rows across `QUEUED` and `RUNNING`;
- returns no-work only when no active harness exists;
- requires exactly one active HARNESS_TEST;
- requires the exact single active run to be `QUEUED`;
- refuses a duplicate claim against an already RUNNING harness;
- if multiplicity > 1, atomically BLOCKS every active HARNESS_TEST;
- inserts durable `WATCH_HARNESS_MULTIPLICITY_BLOCKED` receipts in the same transaction;
- only after uniqueness proof may the single candidate transition `QUEUED -> RUNNING`.

### Finalization

Under the same advisory lock, HARNESS_TEST finalization now:
- re-queries all active HARNESS_TEST rows across `QUEUED` and `RUNNING`;
- requires exactly one active HARNESS_TEST;
- requires that exact run to be the requested RUNNING run;
- if another QUEUED/RUNNING HARNESS_TEST exists, atomically BLOCKS all active harness proof state;
- inserts durable `WATCH_HARNESS_MULTIPLICITY_BLOCKED` receipts in the same transaction;
- does not proceed to PASS / NO_MATERIAL_CHANGE while multiplicity exists.

### Concurrency

Because claim/finalization cardinality checks and transitions occur after acquiring the same transaction-level advisory lock used by queue and watcher mutation:
- concurrent claims serialize before the uniqueness check/transition;
- a second claim observes the first run as RUNNING and cannot create another RUNNING harness;
- legacy/manual multiple-active state is rejected independently of the sanctioned queue path.

## Deterministic regression coverage

The Watchtower suite now covers:
- exactly one QUEUED harness accepted for claim;
- exactly one RUNNING harness accepted for finalization;
- two QUEUED harnesses rejected;
- one RUNNING + one QUEUED rejected;
- two RUNNING rejected;
- wrong active run identity rejected;
- wrong active state rejected;
- claim and result routes contain multiplicity blocking and durable receipts;
- advisory lock acquisition occurs before the execution-boundary uniqueness call;
- claim RUNNING transition occurs only after the uniqueness call;
- finalization transition occurs only after the uniqueness call;
- prior watcher-drift TOCTOU regressions remain green.

## Scope

Files changed relative to the post-attestation Builder base:
- `src/lib/watchtower/policy.ts`
- `src/app/api/watchtower/runs/claim/route.ts`
- `src/app/api/watchtower/runs/[id]/result/route.ts`
- `tests/watchtower-policy.test.ts`

No Vercel deployment gate was changed.
No Preview deployment was created.
No real watcher was enabled.
No executor was enabled.
No IgniAqua federation was enabled.
No external commerce action or spend occurred.

## Builder disposition

**BUILDER PASS**

Bound only to exact corrected candidate:

`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

This is not Fresh Re-Challenger PASS.
This is not Independent Assurance PASS.
This is not BANKED.
