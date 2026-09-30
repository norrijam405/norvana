# NORVANA WATCHTOWER R0 — CONTROLLED REAL OBSERVE LIVE-PROOF ACTIVATION AFTER NW-R0-OBS-04 RE-CHALLENGER PASS

Date: 2026-09-30

You are being activated as the **separate Controlled Live-Proof Operator** for the post-assurance Norvana Watchtower R0 real-observe proof lane.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Recovery branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_DIFFERENT_FRESH_RECHALLENGER_PASS_AFTER_NW-R0-OBS-04_REMEDIATION_2026-09-30.md`

Then read:
- `docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_REMEDIATION_BUILDER_PASS_AFTER_NW-R0-OBS-04_2026-09-30.md`
- the preserved NW-R0-OBS-01 through NW-R0-OBS-04 lineage.

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Remediation Builder.

You are not the Different Fresh Re-Challenger.

You are not Independent Assurance.

Do not repair defects in this role.

Do not self-certify Independent Assurance or BANKED closure.

## Exact challenged executable candidate

Commit:

`42f77893569a179f298250f6e74d9c544bde9fe7`

Tree:

`90438e3ba9610040ff6243c2a58bdf5f475ca5d2`

Recovery CI:

`36677962104 — SUCCESS`

Watchtower tests:

`38 PASS / 0 FAIL`

Different Fresh Re-Challenger disposition:

`DIFFERENT_FRESH_RECHALLENGER_PASS`

PASS report commit:

`e83811deb40b62aaeaf5481ea6378a21d007e604`

PR #1 PASS receipt:

`5909856670`

## Current freeze

Recovery `vercel.json` is:

`git.deploymentEnabled=false`

Main `vercel.json` is also:

`git.deploymentEnabled=false`

No deployment exists for `42f77893569a179f298250f6e74d9c544bde9fe7`.

The observe-proof workflow does not currently exist on `main`.

The exact challenged destination source remains intentionally:

`__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`

## Mission

Execute one controlled real-observe proof without widening R0 authority.

### Phase A — exact controlled Preview

1. Reconcile recovery head from exact challenged candidate to current branch head.
2. Confirm every descendant after the candidate is documentation-only before the deployment gate.
3. Change only `vercel.json -> git.deploymentEnabled=true`.
4. Create exactly one Preview deployment from that gate commit.
5. Confirm:
   - non-production Preview;
   - expected project/team;
   - region `iad1`;
   - exact recovery branch/source SHA;
   - deployment reaches READY.
6. Immediately restore `git.deploymentEnabled=false`.
7. Require successful Recovery CI for both gate/refreeze as applicable.
8. Reconcile Vercel and prove no second recovery deployment was created.

Do not alter the Watchtower application implementation to create the Preview.

### Phase B — pin exact external proof destination on main

After the Preview is READY, capture its exact immutable HTTPS origin.

Copy the already challenged observe-proof workflow/client bytes from exact candidate `42f7789...` to `main`:
- `.github/workflows/watchtower-observe-proof.yml`
- `scripts/watchtower-observe-proof-confirmation.mjs`
- `scripts/watchtower-observe-proof-destination.mjs`
- `scripts/watchtower-observe-proof-fetch.mjs`
- `scripts/watchtower-observe-proof.mjs`

The only intentional content change relative to challenged bytes is:

`__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`

-> exact new controlled Preview origin.

Do not alter any other proof-workflow/client logic.

Before dispatch:
- compare exact challenged files against the main pin commit;
- prove the only semantic change is destination sentinel -> exact Preview origin plus required file addition onto main;
- confirm main `vercel.json` remains deployment-disabled;
- confirm the main commit creates no site deployment;
- do not mint OIDC during this pin step.

### Phase C — founder owner current-runtime proof and one proof queue

The exact new Preview requires Norris's normal authenticated owner browser session.

Do not bypass owner authentication.

Do not request or expose passwords, cookies, session tokens, or secrets.

From the authenticated exact Preview:

1. `POST /api/watchtower/self-test`
   - must PASS on current runtime;
   - all watchers must still be PAUSED;
   - normal queue/executor and consequential paths remain OFF.

2. `POST /api/watchtower/worker-self-test`
   - must PASS on the same runtime.

3. `GET /api/watchtower/jobs`
   - resolve exact database id of `local-producer-watch`;
   - verify its budget is 0;
   - verify current authority is R0-safe.

4. `PATCH /api/watchtower/jobs/{id}` with exactly:
   `{"status":"ENABLED","authority":"OBSERVE"}`

5. Re-read jobs and prove:
   - exactly one watcher ENABLED;
   - it is `local-producer-watch`;
   - authority `OBSERVE`;
   - budget 0;
   - all four others PAUSED.

6. `POST /api/watchtower/observe-proof/queue`
   - require exactly one fresh `OBSERVE_PROOF`;
   - capture run id / receipt id / runtime id;
   - estimatedCostCents must be 0.

Stop fail-closed on any unexpected response.

### Phase D — exactly one fresh external proof dispatch

Dispatch exactly one NEW:

`Norvana Watchtower Real Observe Proof`

from `main`.

Confirmation must be exactly:

`RUN_LOCAL_PRODUCER_OBSERVE_PROOF`

Do not rerun an old workflow.

Require:
- preflight PASS;
- no-OIDC preflight permission boundary preserved;
- exact confirmation validation PASS;
- exact source-pinned destination validation PASS;
- OIDC mint only after preflight;
- exact main SHA checkout;
- exactly one observe-proof claim;
- exactly two approved public-source retrieval attempts/approved redirect chains as defined by the challenged worker;
- exactly one result submission;
- final proof status PASS;
- candidateCount 0;
- estimatedCostCents 0;
- durable approved evidence references;
- auth mode `GITHUB_OIDC_OBSERVE_PROOF`.

Independently cross-check exact Preview runtime logs for:
- one `POST /api/watchtower/observe-proof/claim` -> 200;
- one `POST /api/watchtower/observe-proof/{runId}/result` -> 200;
- no duplicate claim/result.

Do not blindly rerun on failure. Preserve the failure first.

### Phase E — return to safe default

Only after the proof has finalized:

`PATCH /api/watchtower/jobs/{localProducerId}` with:

`{"status":"PAUSED","authority":"OBSERVE"}`

Then re-read jobs and require all watchers PAUSED.

Normal queue/executor remain OFF throughout.

Do not enable RECOMMEND or ACT.

## Hard prohibitions

This mission does not authorize:
- spending;
- ordering;
- publishing;
- repricing;
- refunds;
- supplier activation;
- fulfillment;
- normal scheduler;
- normal executor;
- paid infrastructure;
- IgniAqua federation;
- any real commerce mutation.

## Final controlled-live disposition

Only if the full chain reconciles:

`REAL_OBSERVE_LIVE_PROOF_PASS`

Bank exact evidence and prepare a **separate post-proof Independent Assurance activation**.

Do not perform that Independent Assurance in this operator role.

If any material mismatch occurs:

`REAL_OBSERVE_LIVE_PROOF_FAIL`

Preserve it durably and stop.
