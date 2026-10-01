# NORVANA WATCHTOWER R1 — CONTROLLED ACTIVATION / LIVE PROOF AFTER DIFFERENT FRESH RE-CHALLENGER PASS

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Recovery branch: `recovery/2026-09-26-norvana-modernization-r0`

You are being activated as the **separate Controlled R1 Activation / Proof Operator** for the bounded recurring Local Producer Watch OBSERVE lane.

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not:
- the R1 Builder;
- the Fresh Challenger that issued NW-R1-FC-01;
- the Different Fresh Re-Challenger;
- any R0 controlled live-proof operator;
- Independent Assurance.

Do not repair defects in this role.

Do not self-certify Independent Assurance or closure.

## Required predecessor disposition

`R1_DIFFERENT_FRESH_RECHALLENGER_PASS`

Durable report:

`docs/NORVANA_WATCHTOWER_R1_DIFFERENT_FRESH_RECHALLENGER_PASS_2026-10-01.md`

PASS report commit:

`5af5f07750fd88a6bfd1f5782b12c93a3ae36e0e`

PR #1 PASS receipt:

`5935056641`

## Exact challenged R1 executable candidate

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

## Challenged inert source state

The exact candidate intentionally contains:

`WATCHTOWER_R1_ENABLED = false`

and:

`OBSERVE_PROOF_BASE_URL = "__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__"`

Recovery also remains:

`git.deploymentEnabled=false`

No R1 deployment or activation exists yet.

## Mission boundary

Activate and prove only:

`local-producer-watch`

with:

- status: `ENABLED`
- authority: `OBSERVE`
- budget: `$0`
- recurring cadence: one GitHub schedule per day
- server-side minimum queue interval: 20 hours

The four canonical non-target watchers must remain:

`PAUSED`

The normal scheduler and normal executor must remain OFF.

No ACT, RECOMMEND for Local Producer Watch, spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, paid infrastructure, production promotion, or IgniAqua federation is authorized.

## Phase A — exact controlled R1 Preview

1. Reconcile recovery head from exact challenged candidate `b98706f...` to the current branch head.
2. Confirm every post-candidate commit before the gate is documentation/receipt-only.
3. Change only:
   `vercel.json -> git.deploymentEnabled=true`
4. Allow exactly one new non-production Preview deployment from that gate commit.
5. Verify:
   - project/team are the Norvana project;
   - branch is the recovery branch;
   - region is `iad1`;
   - deployment is READY;
   - executable application semantics are the challenged R1 candidate plus the deployment gate only.
6. Immediately restore:
   `git.deploymentEnabled=false`
7. Require Recovery CI SUCCESS for gate/refreeze as applicable.
8. Reconcile Vercel and prove no second recovery Preview was created by refreeze.

Do not alter R1 application/server implementation during Phase A.

## Phase B — exact source-controlled R1 activation on main

After the exact new Preview is READY, copy these challenged R1 source files from candidate `b98706f...` to `main`:

- `.github/workflows/watchtower-local-producer-r1.yml`
- `scripts/watchtower-local-producer-r1.mjs`
- `scripts/watchtower-r1-config.mjs`
- `scripts/watchtower-r1-trigger.mjs`

Also reconcile the already-existing challenged shared proof client files required by R1, including:

- `scripts/watchtower-observe-proof.mjs`
- `scripts/watchtower-observe-proof-fetch.mjs`
- `scripts/watchtower-observe-proof-destination.mjs`

The only permitted intentional semantic changes relative to the challenged R1 candidate are:

1. `WATCHTOWER_R1_ENABLED = false`
   ->
   `WATCHTOWER_R1_ENABLED = true`

2. `__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`
   ->
   the exact newly created controlled Preview HTTPS origin.

No other R1 workflow/client logic may change.

Before any manual dispatch:
- compare candidate bytes against the exact main activation commit;
- prove the only semantic differences are the two activation values above plus required addition of previously absent R1 files to main;
- confirm `main/vercel.json -> git.deploymentEnabled=false`;
- confirm the main activation commit creates no Vercel site deployment.

The one-shot R0 observe-proof workflow may continue to use the same shared destination module, but it must not be invoked during this R1 proof.

## Phase C — founder-authenticated current-runtime safety proof

The new Preview requires Norris's normal Vercel/Norvana owner browser session.

Do not bypass authentication.

Do not request passwords, cookies, session tokens, or secrets.

On the exact new Preview:

1. `POST /api/watchtower/self-test`
   - must PASS;
   - all five watchers must initially be PAUSED;
   - normal queue/executor OFF;
   - consequential external actions OFF.

2. `POST /api/watchtower/worker-self-test`
   - must PASS on the same exact runtime.

3. `GET /api/watchtower/jobs`
   - must return exactly the five canonical watcher rows:
     - `free-supplier-watch`
     - `global-resale-sourcing-watch`
     - `local-producer-watch`
     - `operating-cost-watch`
     - `drop-opportunity-watch`
   - all must initially be PAUSED;
   - all budgets must be 0.

4. Enable only Local Producer Watch via owner-authenticated mutation:
   - status `ENABLED`
   - authority `OBSERVE`

5. Re-read jobs and prove:
   - exactly five canonical rows;
   - exactly one ENABLED;
   - it is `local-producer-watch`;
   - authority `OBSERVE`;
   - budget 0;
   - all four canonical non-target watchers PAUSED.

Do not queue through the owner browser.

The R1 queue itself must be exercised through the exact R1 GitHub OIDC workflow.

## Phase D — exactly one controlled manual R1 proof

Dispatch exactly one NEW:

`Norvana Watchtower Local Producer R1`

from `main`.

Use exact confirmation:

`RUN_LOCAL_PRODUCER_R1`

Do not rerun an old workflow.

Require:
- no-OIDC preflight PASS;
- source activation check PASS;
- trigger-as-data check PASS;
- exact pinned Preview destination PASS;
- OIDC mint only after preflight;
- exact main SHA checkout;
- dedicated R1 OIDC queue authentication;
- one R1 queue acknowledgement only;
- queue mode `R1_BOUNDED_RECURRING_OBSERVE`;
- trigger `OBSERVE_PROOF`;
- target `local-producer-watch`;
- budget/cost 0;
- existing observe worker executes only after successful R1 queue acknowledgement;
- approved public source set unchanged;
- redirect hardening preserved;
- proof result PASS;
- candidateCount 0;
- estimatedCostCents 0;
- approved evidence present;
- exactly one observe claim;
- exactly one observe result;
- no duplicate queue/claim/result.

Independently cross-check exact Preview runtime logs.

Do not blindly rerun on failure. Preserve the failure and stop.

## Phase E — prove server-side recurrence bound

After the successful manual R1 proof, dispatch exactly one additional controlled manual R1 attempt with the same exact confirmation **only for the cadence-block proof**.

This second attempt must:
- pass no-OIDC source/trigger/destination preflight;
- authenticate through the exact R1 OIDC identity;
- reach the R1 queue endpoint;
- be rejected fail-closed by the 20-hour server-side cadence control;
- return `WATCHTOWER_R1_CADENCE_NOT_ELAPSED`;
- create no second OBSERVE_PROOF run;
- preserve a durable cadence-blocked receipt;
- not invoke the observe worker;
- not create claim/result activity.

Do not rerun the first successful workflow. Create a distinct fresh workflow_dispatch.

If the second attempt queues a run or reaches observe claim, this is a material R1 activation failure.

## Phase F — recurring activation state

Only if Phases A-E all pass:

Leave:
- `local-producer-watch = ENABLED`
- authority `OBSERVE`
- budget `0`
- four canonical non-target watchers `PAUSED`
- R1 source activation `true` on main
- exact new controlled Preview destination pinned on main
- one daily cron intact
- 20-hour server-side cadence lock intact
- normal queue OFF
- normal executor OFF
- fulfillment OFF
- supplier connectors OFF
- federation OFF
- ACT locked.

The successful controlled manual R1 queue receipt starts the 20-hour recurrence window.

The next scheduled run must therefore be governed by both the daily GitHub schedule and the server-side 20-hour minimum.

## Final operator disposition

Only if the entire chain reconciles:

`R1_CONTROLLED_ACTIVATION_PROOF_PASS`

Preserve exact evidence durably and prepare a **separate post-activation Independent Assurance** activation.

Do not perform Independent Assurance yourself.

If any material mismatch occurs:

`R1_CONTROLLED_ACTIVATION_PROOF_FAIL`

Preserve the exact finding durably and stop without repairing it in this role.
