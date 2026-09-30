# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER ACTIVATION AFTER NW-R0-OBS-04 REMEDIATION

Date: 2026-09-30

You are being activated as a **different Fresh Re-Challenger** for the post-assurance Norvana Watchtower R0 real-observe proof lane.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_REMEDIATION_BUILDER_ACTIVATION_AFTER_DIFFERENT_FRESH_RECHALLENGER_FAIL_NW-R0-OBS-04_2026-09-30.md`

Then read:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_REMEDIATION_BUILDER_PASS_AFTER_NW-R0-OBS-04_2026-09-30.md`

Also reconcile:
- prior failure report commit `4a259a44631197b8e34179327d1738ee275feac1`;
- PR #1 receipt/comment `5905000694`.

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this remediation candidate.

You are not the Remediation Builder.

You are not the Different Fresh Re-Challenger that issued `NW-R0-OBS-04`.

You are not any prior Watchtower Challenger/Re-Challenger, controlled live-proof operator, or Independent Assurance role.

Do not repair defects in this role.

Do not deploy or execute the real observation proof.

Do not self-certify closure.

## Exact immutable remediation candidate

Commit:

`42f77893569a179f298250f6e74d9c544bde9fe7`

Parent:

`f4be6bb26a1cb49fbfdf566c459c423221a6ed90`

Tree:

`90438e3ba9610040ff6243c2a58bdf5f475ca5d2`

Required Recovery CI:

`36677962104 — SUCCESS`

Expected Watchtower tests:

`38 PASS / 0 FAIL`

## Preserved finding to re-challenge

`NW-R0-OBS-04 — OBSERVE_PROOF_CONFIRMATION_INPUT_SHELL_INJECTION_CAN_MINT_OIDC_BEFORE_DESTINATION_VALIDATION`

## Re-Challenge mission

Independently attack the exact remediation candidate, especially:

1. No direct workflow_dispatch confirmation interpolation remains in shell source.
2. Malicious confirmation strings remain inert data.
3. The preflight job truly lacks `id-token: write`.
4. The OIDC-capable job cannot start unless preflight succeeds.
5. Destination validation happens in the no-OIDC preflight before any OIDC-capable job begins.
6. Both jobs use exact `github.sha`, not mutable branch-head checkout.
7. The OIDC-capable job contains no untrusted workflow_dispatch input execution path.
8. Failed/skipped preflight cannot lead to OIDC mint.
9. NW-R0-OBS-03 source-controlled destination binding remains intact.
10. NW-R0-OBS-02 per-hop redirect hardening remains intact.
11. Current-runtime proof binding, watcher/run cardinality, zero-cost/zero-candidate controls, and dedicated OIDC claim checks remain intact.
12. ACT, spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, normal scheduler/executor, and IgniAqua federation remain locked.
13. `git.deploymentEnabled=false` remains restored.
14. No deployment or real observation proof was performed.
15. Failed candidate `f4be6bb...` and CI `36677880578 — FAIL` remain preserved.

Do not accept the Builder report merely because CI is green.

You may perform adversarial static/local tests that do not repair the candidate.

## Disposition

If any material defect is found:

`DIFFERENT_FRESH_RECHALLENGER_FAIL`

Preserve the exact finding durably in GitHub and do not repair it.

Only if the candidate survives:

`DIFFERENT_FRESH_RECHALLENGER_PASS`

PASS does not authorize deployment or execution. It permits progression only to a separate controlled live-proof gate.
