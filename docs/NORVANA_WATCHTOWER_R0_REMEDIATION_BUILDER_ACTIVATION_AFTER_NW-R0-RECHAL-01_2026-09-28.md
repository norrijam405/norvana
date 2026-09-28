# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER ACTIVATION AFTER NW-R0-RECHAL-01

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

Then read:

`docs/NORVANA_WATCHTOWER_R0_FRESH_CHALLENGER_FAIL_2026-09-28.md`

`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_PROOF_AFTER_NW-R0-CHAL-01_2026-09-28.md`

`docs/NORVANA_WATCHTOWER_R0_DIFFERENT_FRESH_RECHALLENGER_FAIL_AFTER_NW-R0-CHAL-01_2026-09-28.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Different Fresh Re-Challenger that issued this failure.
You are not Independent Assurance.

## Preserved lineage

Historical external harness PASS:
- GitHub run `36455613388`
- job `109041083231`
- Watchtower run `15`
- status `NO_MATERIAL_CHANGE`
- candidate count `0`
- estimated cost `0`

Original Fresh Challenger finding:
`NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`

Remediation Builder candidate:
`92c070503f8a7f8a06468f0aca87591bf73d340b`

Builder CI:
`36479978476 — SUCCESS`

Different Fresh Re-Challenger finding:
`NW-R0-RECHAL-01 — MULTIPLE_ACTIVE_HARNESSES_ARE_NOT_REJECTED_AT_CLAIM_OR_FINALIZATION`

Current branch head at activation:
`0eba3449a88712b26a4a675c1293cd66e0714021`

Do not erase or relabel any prior PASS/FAIL state.

## What already survived Re-Challenge

Do not re-open the original TOCTOU finding without new evidence.

The Re-Challenger confirmed that the current remediation materially establishes:
- common PostgreSQL transaction-level advisory lock across harness queue, watcher safety mutation, harness claim, and harness finalization;
- watcher safety mutation atomically invalidates active HARNESS_TEST runs;
- claim revalidates current-runtime proofs and all real watchers PAUSED/R0/$0;
- finalization revalidates the same mutable safety state;
- claim transition + receipt remain atomic;
- finalization + completion receipt remain atomic;
- queue + queue receipt remain atomic;
- watcher mutation + harness invalidation receipt remain atomic;
- no conflicting advisory-lock/row-lock ordering was found in the four critical routes;
- GitHub OIDC exact identity binding remains present;
- harness mode remains Preview-only;
- harness mode has no static worker-secret fallback;
- zero-cost / zero-candidate harness result enforcement remains intact.

Preserve all of those properties.

## Defect to remediate

`NW-R0-RECHAL-01`

The queue route prevents a second sanctioned HARNESS_TEST from being queued under normal operation, but claim/finalization do not fail closed if legacy/corrupt/manual state already contains multiple active HARNESS_TEST rows.

Current claim behavior:
- selects oldest QUEUED HARNESS_TEST with `.limit(1)`;
- does not first prove there is exactly one active HARNESS_TEST across QUEUED/RUNNING.

Current finalization behavior:
- can finalize a RUNNING HARNESS_TEST while another QUEUED or RUNNING HARNESS_TEST remains active.

The advisory lock serializes those operations; it does not enforce uniqueness.

## Required remediation properties

Implement active-HARNESS_TEST cardinality as an execution-time invariant.

At minimum:

1. **Claim**
   - under the existing common advisory lock;
   - query active HARNESS_TEST rows where status is QUEUED or RUNNING;
   - require exactly one active HARNESS_TEST;
   - require that one active row is the exact QUEUED candidate being claimed;
   - if cardinality is 0, preserve existing no-work semantics;
   - if cardinality > 1, fail closed;
   - deterministically BLOCK the relevant active harness state(s) or otherwise transition to a non-executable review state;
   - insert durable safety-block receipt(s) atomically in the same transaction;
   - never permit two RUNNING HARNESS_TEST rows.

2. **Finalization**
   - under the same advisory lock;
   - re-query active HARNESS_TEST rows before RUNNING -> final;
   - require exactly one active HARNESS_TEST and require it to be the exact RUNNING run being finalized;
   - if any additional QUEUED/RUNNING HARNESS_TEST exists, fail closed;
   - block/invalidate deterministically with durable receipt in the same transaction;
   - do not return PASS / NO_MATERIAL_CHANGE while another active HARNESS_TEST remains executable.

3. **Concurrency**
   - prove two concurrent claims cannot create two RUNNING HARNESS_TEST rows;
   - preserve common lock coverage and ordering;
   - no lock downgrade or bypass.

4. **Legacy/corrupt state**
   - do not assume all active HARNESS_TEST state came through the repaired queue route;
   - execution boundaries must validate cardinality independently;
   - malformed legacy multiplicity must fail closed.

5. **Regression tests**
   Add deterministic coverage for at least:
   - two QUEUED HARNESS_TEST rows -> claim fails closed;
   - one RUNNING + one QUEUED HARNESS_TEST -> finalization fails closed;
   - two RUNNING HARNESS_TEST rows -> finalization fails closed;
   - concurrent claim attempts cannot yield two RUNNING harnesses;
   - exactly one QUEUED HARNESS_TEST retains successful claim path;
   - exactly one RUNNING HARNESS_TEST retains successful zero-effect finalization path;
   - prior watcher-drift TOCTOU regressions remain green.

6. **Preserve**
   - exact GitHub OIDC binding;
   - Preview-only harness auth;
   - no static-secret fallback in harness mode;
   - current-runtime binding;
   - current Control + Worker proof checks;
   - all-real-watchers PAUSED/R0/$0 checks;
   - exact OBSERVE/$0 target;
   - zero-cost / zero-candidate enforcement;
   - durable receipts;
   - all historical evidence and failures.

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

Do not claim Re-Challenger PASS.
Do not claim Independent Assurance PASS.
Do not claim BANKED.

Do not deploy merely because Builder CI is green.

If live proof later becomes required, stop at the explicit founder-live gate.

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
