# NORVANA WATCHTOWER R1 — REMEDIATION BUILDER PASS AFTER NW-R1-FC-01

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`R1_REMEDIATION_BUILDER_PASS`

This Builder disposition applies only to remediation of:

`NW-R1-FC-01 — required five-watcher topology is not enforced fail-closed`

The Fresh Challenger FAIL remains preserved in:

`docs/NORVANA_WATCHTOWER_R1_FRESH_CHALLENGER_FAIL_2026-10-01.md`

Failure report commit:

`f3d73325598c11b49a196956b7c4d297da42e79c`

PR #1 failure receipt:

`5934454487`

No deployment, main copy, R1 activation, watcher enablement, or live R1 observation was performed in this Builder role.

## Exact immutable remediation candidate

Commit:

`b98706f0231d9ee038845b8381bbc494185a37df`

Parent:

`95b1f58be62da62c1708651aa90924d92e969210`

Tree:

`2e044d9687cbb53e864692a1031949031de9a636`

Recovery CI:

`36883896225 — SUCCESS`

Watchtower tests:

`59 PASS / 0 FAIL`

Also PASS:
- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- TypeScript typecheck;
- lint;
- production build.

## Exact remediation delta

Compared with the Remediation Builder activation head:

`8fad3175d1b09027d76adb8a7c686e36fb749f91`

the final candidate changes only:

- `src/lib/watchtower/policy.ts`
- `tests/watchtower-policy.test.ts`

No R1 workflow, queue route, OIDC gate, cadence logic, observe worker, claim/finalization route, scheduler, executor, commerce, supplier, fulfillment, payment, publication, repricing, refund, or federation implementation was changed.

## Exact topology invariant

The shared observe-proof snapshot evaluator now requires exactly these five canonical watcher identities:

- `free-supplier-watch`
- `global-resale-sourcing-watch`
- `local-producer-watch`
- `operating-cost-watch`
- `drop-opportunity-watch`

The evaluator now fails closed unless:

1. exactly five watcher rows are present;
2. no duplicate slug is present;
3. every row is one of the five canonical slugs;
4. every canonical slug is present exactly once;
5. exactly one watcher is ENABLED;
6. that enabled watcher is exactly `local-producer-watch`;
7. its authority is exactly `OBSERVE`;
8. its budget is exactly `0`;
9. all four canonical non-target watchers are PAUSED;
10. every watcher remains inside the R0 authority ceiling and zero-budget policy.

## New failure modes

The evaluator now explicitly rejects:

- wrong row count:
  `WATCHTOWER_OBSERVE_PROOF_TOPOLOGY_CARDINALITY_INVALID`
- duplicate canonical slug:
  `WATCHTOWER_OBSERVE_PROOF_TOPOLOGY_DUPLICATE_SLUG`
- unknown, substituted, or missing canonical identity:
  `WATCHTOWER_OBSERVE_PROOF_TOPOLOGY_MISMATCH`

## Adversarial regression coverage

The 59-test suite proves rejection of:

- target only;
- target plus only three canonical non-target rows;
- target plus an additional sixth watcher;
- target plus a substituted arbitrary paused watcher;
- duplicate canonical watcher identity;
- multiple enabled canonical watchers.

It also proves the exact intended five-watcher snapshot passes.

A separate test compares the required canonical slug set against the checked-in `WATCHTOWER_JOB_TEMPLATES`, so future default-template identity drift must break CI rather than silently weaken the invariant.

## Shared boundary effect

The remediation changes the shared:

`evaluateObserveProofWatcherSnapshot(jobs)`

invariant.

That same invariant is already reused at:
- R1 queue;
- observe-proof claim;
- observe-proof result finalization.

Therefore the exact topology is revalidated at all three execution boundaries.

## Preserved R1 controls

The candidate preserves:
- source-disabled R1 activation sentinel;
- exactly one daily cron;
- 20-hour server-side recurrence minimum;
- dedicated R1 OIDC queue identity;
- no-OIDC preflight;
- exact-SHA workflow checkout;
- source-pinned destination discipline;
- shared observe concurrency domain;
- current-runtime Control Proof requirement;
- current-runtime Worker Proof requirement;
- permanent owner credential requirement;
- empty executable queue requirement;
- common PostgreSQL advisory-lock domain;
- approved public-source set;
- manual per-hop redirect validation;
- zero candidate emission;
- zero estimated cost;
- normal queue OFF;
- normal executor OFF;
- fulfillment OFF;
- supplier connectors OFF;
- IgniAqua federation OFF;
- ACT locked.

## Deployment state

Recovery remains:

`git.deploymentEnabled=false`

No Vercel deployment exists for candidate:

`b98706f0231d9ee038845b8381bbc494185a37df`

The newest recovery Preview remains the historical R0 controlled proof Preview:

`dpl_AYcKaR2fP556xhAGtMmhvk5fgFJY`

from source:

`048b92f094d9ec5ea38f35ba984e32097d559847`

It is not claimed as R1 proof.

## Next gate

A genuinely different Fresh Re-Challenger must independently attack exact immutable candidate:

`b98706f0231d9ee038845b8381bbc494185a37df`

Do not deploy, copy to main, activate R1, enable a watcher, or execute live R1 observation before that challenge gate.
