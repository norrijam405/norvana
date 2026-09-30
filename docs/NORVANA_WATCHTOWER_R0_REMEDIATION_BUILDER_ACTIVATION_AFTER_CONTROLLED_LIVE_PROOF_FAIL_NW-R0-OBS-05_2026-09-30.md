# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER ACTIVATION AFTER CONTROLLED LIVE-PROOF FAIL NW-R0-OBS-05

Date: 2026-09-30

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R0_CONTROLLED_REAL_OBSERVE_LIVE_PROOF_FAIL_NW-R0-OBS-05_2026-09-30.md`

Then re-read the preserved NW-R0-OBS-01 through NW-R0-OBS-04 lineage and the exact challenged candidate:

`42f77893569a179f298250f6e74d9c544bde9fe7`

You are a separate Remediation Builder.

You are not the Controlled Live-Proof Operator that issued NW-R0-OBS-05.

You are not any prior Fresh Challenger or Different Fresh Re-Challenger.

You are not Independent Assurance.

Do not self-certify closure.

## Finding to remediate

`NW-R0-OBS-05 — OWNER_SESSION_SAME_ORIGIN_GUARD_REQUIRES_ORIGIN_ON_SAFE_GET_AND_BLOCKS_REQUIRED_JOB_SNAPSHOT`

The controlled live proof reached current-runtime Control Proof and Worker Proof successfully, then failed closed on:

`GET /api/watchtower/jobs -> 403 NORVANA_SAME_ORIGIN_REQUIRED`

The founder was authenticated normally on the exact controlled Preview.

The owner-session guard routes authenticated requests through `requireBrowserSameOrigin(req)`, which requires an `Origin` header even for the safe GET used to obtain the required pre-mutation job snapshot.

Do not bypass authentication.

Do not introduce browser tokens, cookies, session export, or secret-bearing workarounds.

Do not weaken same-origin protection for consequential browser mutations.

## Required remediation properties

Build the narrowest executable fix that permits an authenticated same-origin owner browser to read the required safe Watchtower job snapshot while preserving fail-closed protection for consequential mutations.

At minimum, prove:

- authenticated owner `GET /api/watchtower/jobs` works from the exact same-origin Preview browser;
- cross-origin read/mutation attempts remain rejected where required;
- consequential mutations retain same-origin protection;
- current-runtime Control Proof and Worker Proof remain required;
- normal queue remains OFF;
- normal executor remains OFF;
- exactly one target watcher may later be enabled only as `OBSERVE`;
- target budget remains exactly 0;
- all other watchers remain PAUSED;
- no ACT, spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, paid infrastructure, or IgniAqua federation authority is widened;
- existing NW-R0-OBS-02, NW-R0-OBS-03, and NW-R0-OBS-04 hardening remains intact.

Add adversarial tests for the actual browser-header semantics that caused the live failure.

## Deployment prohibition

Do not deploy or rerun the real observe proof in the Builder role.

Produce a new immutable remediation candidate, successful Recovery CI, and a durable Builder PASS/FAIL report.

A genuinely different Fresh Re-Challenger must challenge the new candidate before another controlled live-proof attempt.
