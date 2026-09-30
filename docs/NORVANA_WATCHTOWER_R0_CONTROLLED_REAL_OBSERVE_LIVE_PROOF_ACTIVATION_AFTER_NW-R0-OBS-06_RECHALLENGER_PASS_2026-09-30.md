# NORVANA WATCHTOWER R0 — CONTROLLED REAL OBSERVE LIVE-PROOF ACTIVATION AFTER NW-R0-OBS-06 RE-CHALLENGER PASS

Date: 2026-09-30

You are being activated as the **separate Controlled Live-Proof Operator** for the Norvana Watchtower R0 real-observe proof lane after independent remediation re-challenge PASS of NW-R0-OBS-06.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Recovery branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_DIFFERENT_FRESH_RECHALLENGER_PASS_AFTER_NW-R0-OBS-06_REMEDIATION_2026-09-30.md`

Then read:
- `docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_PASS_AFTER_NW-R0-OBS-06_2026-09-30.md`;
- `docs/NORVANA_WATCHTOWER_R0_FRESH_CHALLENGER_FAIL_AFTER_NW-R0-OBS-05_REMEDIATION_2026-09-30.md`;
- the preserved NW-R0-OBS-02 through NW-R0-OBS-06 lineage.

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Remediation Builder.

You are not the Different Fresh Re-Challenger.

You are not any prior controlled live-proof operator.

You are not Independent Assurance.

Do not repair defects in this role.

Do not self-certify Independent Assurance or BANKED closure.

## Exact challenged executable candidate

Commit:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

Tree:

`827f8a25ecd8d8f0844e2385f244df26ac1d4415`

Recovery CI:

`36758702065 — SUCCESS`

Static-verification job:

`110035415122 — SUCCESS`

Watchtower tests:

`49 PASS / 0 FAIL`

Different Fresh Re-Challenger disposition:

`DIFFERENT_FRESH_RECHALLENGER_PASS`

PASS report commit:

`90b3bccc3282be69a552cbf5391bd35086a599f4`

PR #1 PASS receipt:

`5920094702`

## Current freeze independently reconciled at activation

Recovery `vercel.json`:

`git.deploymentEnabled=false`

Main `vercel.json`:

`git.deploymentEnabled=false`

No Vercel deployment exists for:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

The newest recovery-branch Preview remains historical:

`dpl_8wtsPCFXqAKt6XS3BkyFcNoFb5Ea`

Source commit:

`56b856df55708dfd6a038d52337a510e9e8ecff3`

Historical Preview origin currently pinned on `main`:

`https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app`

That old Preview and old main destination pin are **not proof of the challenged candidate** and must not be reused for this mission.

The exact challenged recovery candidate itself remains intentionally fail-closed at:

`__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`

## Mission

Execute one new controlled real-observe proof against the post-NW-R0-OBS-06 candidate without widening R0 authority.

### Phase A — create exactly one new controlled Preview

1. Reconcile the recovery branch from exact challenged candidate `44fe8b23...` to current recovery head.
2. Confirm every descendant after `44fe8b23...` is documentation/receipt/handoff-only before opening the deployment gate. Stop if executable code changed.
3. Confirm recovery `vercel.json -> git.deploymentEnabled=false`.
4. Change only `vercel.json -> git.deploymentEnabled=true`.
5. Create exactly one new **Preview** deployment from that gate commit.
6. Require:
   - non-production Preview;
   - project `norvana`;
   - expected Vercel team;
   - region `iad1`;
   - exact recovery branch/source SHA;
   - deployment reaches `READY`.
7. Capture the exact new immutable Preview deployment id and HTTPS origin.
8. Immediately restore `git.deploymentEnabled=false`.
9. Require successful Recovery CI for gate/refreeze as applicable.
10. Reconcile Vercel and prove no second recovery deployment was created.

Do not alter Watchtower implementation code to create the Preview.

Do not reuse `dpl_8wtsPCFXqAKt6XS3BkyFcNoFb5Ea`.

### Phase B — replace the old main destination pin with the new exact Preview origin

The current main destination pin points to the old historical Preview and must be replaced.

Use the already challenged observe-proof workflow/client bytes from exact candidate `44fe8b23...` as the semantic baseline:

- `.github/workflows/watchtower-observe-proof.yml`
- `scripts/watchtower-observe-proof-confirmation.mjs`
- `scripts/watchtower-observe-proof-destination.mjs`
- `scripts/watchtower-observe-proof-fetch.mjs`
- `scripts/watchtower-observe-proof.mjs`

On `main`, preserve those challenged semantics exactly.

The only authorized destination change is:

old historical main pin:

`https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app`

-> exact newly created controlled Preview origin.

Before dispatch:

1. Compare all five main proof files against exact candidate `44fe8b23...`.
2. Prove the only intentional semantic difference is the destination sentinel/pin becoming the exact new Preview origin.
3. Confirm main `vercel.json -> git.deploymentEnabled=false`.
4. Confirm the main pin commit creates no site deployment.
5. Do not mint OIDC during the pin step.

Stop if any other workflow/client logic differs unexpectedly.

### Phase C — founder-authenticated current-runtime proof and one proof queue

The new exact Preview requires Norris's normal authenticated owner browser session.

Do not bypass owner authentication.

Do not request, expose, log, or persist passwords, cookies, session tokens, recovery material, or secrets.

From the authenticated **new exact Preview**:

1. `POST /api/watchtower/self-test`
   - must PASS on the current runtime;
   - all watchers must remain PAUSED;
   - normal queue/executor and consequential paths remain OFF.

2. `POST /api/watchtower/worker-self-test`
   - must PASS on the same runtime.

3. `GET /api/watchtower/jobs`
   - must succeed through the authenticated safe-read guard fixed by NW-R0-OBS-06;
   - resolve exact database id of `local-producer-watch`;
   - verify budget `0`;
   - verify current authority is R0-safe.

4. `PATCH /api/watchtower/jobs/{id}` with exactly:

`{"status":"ENABLED","authority":"OBSERVE"}`

5. Re-read jobs and prove:
   - exactly one watcher ENABLED;
   - it is `local-producer-watch`;
   - authority `OBSERVE`;
   - budget `0`;
   - all four other watchers PAUSED.

6. `POST /api/watchtower/observe-proof/queue`
   - require exactly one fresh `OBSERVE_PROOF`;
   - capture run id / receipt id / runtime id;
   - `estimatedCostCents` must be `0`.

Stop fail-closed on any unexpected response.

Do not weaken or bypass browser-origin checks if GET/PATCH fails.

### Phase D — dispatch exactly one new external proof from main

Dispatch exactly one new:

`Norvana Watchtower Real Observe Proof`

from the newly pinned `main` commit.

Confirmation must be exactly:

`RUN_LOCAL_PRODUCER_OBSERVE_PROOF`

Do not rerun an old workflow run.

Require:

- preflight PASS;
- preflight has no OIDC authority;
- exact confirmation validation PASS;
- exact new destination pin validation PASS;
- OIDC mint only after successful preflight;
- exact main SHA checkout;
- exact challenged redirect hardening;
- exactly one observe-proof claim;
- exactly two approved public-source retrieval attempts / validated redirect chains;
- exactly one result submission;
- final proof status PASS;
- `candidateCount=0`;
- `estimatedCostCents=0`;
- durable approved evidence references;
- auth mode `GITHUB_OIDC_OBSERVE_PROOF`.

Independently cross-check exact Preview runtime evidence for:

- one `POST /api/watchtower/observe-proof/claim` -> 200;
- one `POST /api/watchtower/observe-proof/{runId}/result` -> 200;
- no duplicate claim/result;
- no unexpected consequential route activity.

Do not blindly rerun on failure. Preserve the failure first.

### Phase E — return to safe default

Only after proof finalization:

`PATCH /api/watchtower/jobs/{localProducerId}`

with exactly:

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
- any real commerce mutation;
- reuse of the old Preview or old destination pin as proof.

## Final controlled-live disposition

Only if the full chain reconciles:

`REAL_OBSERVE_LIVE_PROOF_PASS`

Bank exact evidence durably and prepare a **separate post-proof Independent Assurance activation**.

Do not perform that Independent Assurance in this operator role.

If any material mismatch occurs:

`REAL_OBSERVE_LIVE_PROOF_FAIL`

Preserve it durably and stop.
