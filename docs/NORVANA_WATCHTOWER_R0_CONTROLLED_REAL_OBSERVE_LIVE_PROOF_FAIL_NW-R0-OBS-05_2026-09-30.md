# NORVANA WATCHTOWER R0 — CONTROLLED REAL OBSERVE LIVE-PROOF FAIL

Date: 2026-09-30

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Recovery branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`REAL_OBSERVE_LIVE_PROOF_FAIL`

This report is produced by the separate Controlled Live-Proof Operator.

The operator did not repair the defect, did not dispatch the external observe-proof workflow, did not self-certify Independent Assurance, and did not declare BANKED closure.

## Exact challenged executable candidate

Commit:

`42f77893569a179f298250f6e74d9c544bde9fe7`

Tree:

`90438e3ba9610040ff6243c2a58bdf5f475ca5d2`

Recovery CI:

`36677962104 — SUCCESS`

Different Fresh Re-Challenger disposition:

`DIFFERENT_FRESH_RECHALLENGER_PASS`

PASS report commit:

`e83811deb40b62aaeaf5481ea6378a21d007e604`

## Controlled Preview

Exactly one new controlled recovery Preview was created:

Deployment:

`dpl_8wtsPCFXqAKt6XS3BkyFcNoFb5Ea`

Origin:

`https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app`

Source gate commit:

`56b856df55708dfd6a038d52337a510e9e8ecff3`

Region:

`iad1`

Target:

Preview / non-production

State:

`READY`

The deployment was immediately refrozen in:

`2225141add35b575630000ec84affffc357ff1ce`

Recovery `vercel.json` returned to:

`git.deploymentEnabled=false`

No second recovery deployment was created by the refreeze.

## Main proof-client pin

The already-challenged observe-proof workflow/client was copied to `main`.

Main pin head:

`36ef0976ccf8fb914c8e956c288c64bc90c4ffaf`

The following files are byte-identical to the exact challenged candidate:

- `.github/workflows/watchtower-observe-proof.yml`
- `scripts/watchtower-observe-proof-confirmation.mjs`
- `scripts/watchtower-observe-proof-fetch.mjs`
- `scripts/watchtower-observe-proof.mjs`

The destination helper differs only by replacing the UNPINNED sentinel with:

`https://norvana-fduc8vqo5-norrijam405-2107s-projects.vercel.app`

Main remained deployment-disabled and the pin commits created no site deployment.

## Founder current-runtime attempt

The founder authenticated normally on the exact controlled Preview and ran the preserved fail-closed owner helper.

Exact observed browser failure:

`STOPPED FAIL-CLOSED: Watchtower job read failed: 403 {"error":"Same-origin browser request required.","code":"NORVANA_SAME_ORIGIN_REQUIRED"}`

Vercel runtime logs independently show:

- `POST /api/watchtower/self-test -> 200`
- `POST /api/watchtower/worker-self-test -> 200`
- `GET /api/watchtower/jobs -> 403`

No `PATCH /api/watchtower/jobs/{id}` occurred.

No `POST /api/watchtower/observe-proof/queue` occurred.

Therefore no watcher was enabled and no OBSERVE_PROOF was queued.

## New material live-proof finding

`NW-R0-OBS-05 — OWNER_SESSION_SAME_ORIGIN_GUARD_REQUIRES_ORIGIN_ON_SAFE_GET_AND_BLOCKS_REQUIRED_JOB_SNAPSHOT`

The exact challenged candidate implements `GET /api/watchtower/jobs` through:

`requireCurrentRecoveryAdmin(req)`

For an authenticated owner session, that function invokes:

`requireBrowserSameOrigin(req)`

The same-origin helper requires both:

- request `Origin`;
- request host.

If `Origin` is absent, it returns:

`403 NORVANA_SAME_ORIGIN_REQUIRED`

The founder was authenticated on the exact controlled Preview origin, but the normal browser same-origin `fetch("/api/watchtower/jobs")` GET did not provide an `Origin` header accepted by the server guard.

This blocks the required pre-mutation job snapshot that must prove:

- all watchers are PAUSED;
- exact `local-producer-watch` exists;
- exact budget is 0;
- current R0 authority is safe.

The operator did not bypass this guard and did not substitute a secret/header-based server credential.

## Safety state

The failure occurred before any authorized watcher mutation.

Confirmed from runtime request sequence:

- Control Proof reached the current runtime;
- Worker Proof reached the same current runtime;
- job-state read failed closed;
- no watcher enable request occurred;
- no OBSERVE_PROOF queue request occurred;
- no external proof workflow was dispatched;
- no OIDC observe-proof execution occurred;
- no spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, normal scheduler, normal executor, paid infrastructure, or IgniAqua federation was enabled.

## Final disposition

`REAL_OBSERVE_LIVE_PROOF_FAIL`

Do not rerun the owner helper against this exact executable candidate.

A separate Remediation Builder must address NW-R0-OBS-05 without weakening owner authentication or the consequential-mutation same-origin boundary, then produce a new immutable candidate for fresh challenge before another controlled live proof.
