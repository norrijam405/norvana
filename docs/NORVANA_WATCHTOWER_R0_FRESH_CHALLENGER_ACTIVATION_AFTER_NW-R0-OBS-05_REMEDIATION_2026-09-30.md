# NORVANA WATCHTOWER R0 — FRESH CHALLENGER ACTIVATION AFTER NW-R0-OBS-05 REMEDIATION

Date: 2026-09-30

You are being activated as a **separate Fresh Challenger** for the Norvana Watchtower R0 real-observe proof remediation after the controlled live-proof failure NW-R0-OBS-05.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R0_CONTROLLED_REAL_OBSERVE_LIVE_PROOF_FAIL_NW-R0-OBS-05_2026-09-30.md`

Then read:

`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_ACTIVATION_AFTER_CONTROLLED_LIVE_PROOF_FAIL_NW-R0-OBS-05_2026-09-30.md`

and:

`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_PASS_AFTER_NW-R0-OBS-05_2026-09-30.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this candidate.

You are not the Remediation Builder.

You are not the Controlled Live-Proof Operator that issued NW-R0-OBS-05.

You are not any prior Fresh Challenger or Different Fresh Re-Challenger.

You are not Independent Assurance.

Do not repair defects in this role.

Do not deploy or rerun the real observation proof.

Do not self-certify closure.

## Exact immutable candidate under challenge

Commit:

`7e6b525d914b35eebfd207ed2cb3013ac09fd007`

Parent:

`dbe881e9de3db6afc108e9eee3dca8c624800ba6`

Tree:

`c2d4e94a401b80e9adad8c9db7a9a52c1cdf9378`

Required Recovery CI:

`36735040684 — SUCCESS`

Expected Watchtower tests:

`43 PASS / 0 FAIL`

## Preserved finding to challenge

`NW-R0-OBS-05 — OWNER_SESSION_SAME_ORIGIN_GUARD_REQUIRES_ORIGIN_ON_SAFE_GET_AND_BLOCKS_REQUIRED_JOB_SNAPSHOT`

The prior controlled live proof reached:
- current-runtime Control Proof PASS;
- current-runtime Worker Proof PASS;

and then failed closed on:

`GET /api/watchtower/jobs -> 403 NORVANA_SAME_ORIGIN_REQUIRED`

before any watcher mutation or proof queue.

## Challenge mission

Independently attack the exact remediation candidate.

At minimum prove or disprove:

1. Authenticated owner `GET /api/watchtower/jobs` now supports normal same-origin browser GET semantics when `Origin` is absent.
2. The safe-read path still requires authenticated recovery-admin identity.
3. An explicit mismatched `Origin` is rejected.
4. `Sec-Fetch-Site: cross-site` without a valid same-origin Origin/Referer is rejected.
5. A mismatched Referer is rejected.
6. Origin-less unsafe methods cannot use the read guard to bypass mutation protection.
7. `POST /api/watchtower/jobs` remains on the strict mutation guard.
8. `PATCH /api/watchtower/jobs/{id}` remains on the strict mutation guard.
9. No consequential route was accidentally moved to the read guard.
10. The read guard cannot be used to enable a watcher, queue a proof, change authority, or mutate any state.
11. The safe-read evaluator handles host casing, ports, malformed Origin/Referer, `Origin: null`, same-site-but-not-same-origin, and Fetch Metadata ambiguity safely.
12. The server-side admin-token path was not weakened.
13. Existing NW-R0-OBS-02 redirect hardening remains intact.
14. Existing NW-R0-OBS-03 source-controlled destination binding remains intact.
15. Existing NW-R0-OBS-04 no-OIDC preflight/confirmation hardening remains intact.
16. Current-runtime Control Proof / Worker Proof requirements remain intact.
17. Watcher cardinality, exact Local Producer Watch OBSERVE/$0 restriction, zero-cost/zero-candidate constraints, and dedicated OIDC claim checks remain intact.
18. ACT, spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, normal scheduler/executor, paid infrastructure, and IgniAqua federation remain locked.
19. `git.deploymentEnabled=false` remains restored.
20. No deployment exists for `7e6b525...`.
21. The failed controlled Preview `dpl_8wtsPCFXqAKt6XS3BkyFcNoFb5Ea` and its old main destination pin are not treated as proof of the remediation.

Do not accept the Builder report merely because CI is green.

You may add adversarial static/local tests if they do not repair the candidate.

## Disposition

If any material defect is found:

`FRESH_CHALLENGER_FAIL`

Preserve the exact finding durably in GitHub and do not repair it.

Only if the exact immutable candidate survives:

`FRESH_CHALLENGER_PASS`

PASS does not authorize deployment or execution. It permits progression only to a separate controlled live-proof operator that must create a new Preview and new exact main destination pin.
