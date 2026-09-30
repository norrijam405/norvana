# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER ACTIVATION AFTER NW-R0-OBS-06 REMEDIATION

Date: 2026-09-30

You are being activated as a **different Fresh Re-Challenger** for the Norvana Watchtower R0 real-observe proof lane after remediation of NW-R0-OBS-06.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_ACTIVATION_AFTER_FRESH_CHALLENGER_FAIL_NW-R0-OBS-06_2026-09-30.md`

Then read:

`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_PASS_AFTER_NW-R0-OBS-06_2026-09-30.md`

Also reconcile:
- Fresh Challenger FAIL report commit `56e2e8a750564c624f6d9a8db0580a853069d10e`;
- PR #1 failure receipt `5914937102`.

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this remediation candidate.

You are not the Remediation Builder.

You are not the Fresh Challenger that issued NW-R0-OBS-06.

You are not any prior Watchtower Challenger/Re-Challenger, controlled live-proof operator, or Independent Assurance role.

Do not repair defects in this role.

Do not deploy or rerun the real observation proof.

Do not self-certify closure.

## Exact immutable remediation candidate

Commit:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

Parent:

`a739df30377c56a03214b1c5a14127375f0a3baa`

Tree:

`827f8a25ecd8d8f0844e2385f244df26ac1d4415`

Required Recovery CI:

`36758702065 — SUCCESS`

Expected Watchtower tests:

`49 PASS / 0 FAIL`

## Preserved finding to re-challenge

`NW-R0-OBS-06 — SAME_ORIGIN_GUARDS_COMPARE_HOST_ONLY_AND_ACCEPT_CROSS_SCHEME_OR_MALFORMED_ORIGIN`

## Re-Challenge mission

Independently attack the exact remediation candidate.

At minimum prove or disprove:

1. Both read and mutation guards compare the complete expected web origin, not Host alone.
2. The expected origin is derived from the actual request origin.
3. Same-host cross-scheme Origin is rejected.
4. Origin values containing path/query/fragment/userinfo are rejected.
5. `Origin: null` is rejected.
6. Non-HTTP(S) Origin values are rejected.
7. Effective port equality is enforced.
8. Referer may contain a path but its full parsed origin must match.
9. Malformed Referer fails closed.
10. `Sec-Fetch-Site: same-origin` cannot override an attacker Referer.
11. Same-origin Referer cannot override `same-site` or `cross-site` Fetch Metadata.
12. Explicit valid Origin cannot override contradictory supplied provenance.
13. Origin-less safe GET/HEAD requires at least one accepted same-origin provenance signal.
14. Origin-less unsafe methods remain rejected.
15. Strict mutation guard still requires an explicit valid same-origin Origin.
16. Server-admin-token behavior remains unchanged.
17. GET /api/watchtower/jobs remains on the read guard only.
18. POST /api/watchtower/jobs and PATCH /api/watchtower/jobs/{id} remain on the strict mutation guard.
19. No consequential route was widened to the read guard.
20. NW-R0-OBS-02 redirect hardening remains intact.
21. NW-R0-OBS-03 source-controlled destination binding remains intact.
22. NW-R0-OBS-04 no-OIDC preflight remains intact.
23. NW-R0-OBS-05 safe-read route split remains intact.
24. Current-runtime proofs, watcher/run cardinality, zero-cost/zero-candidate controls, OIDC isolation, and all consequential-action locks remain intact.
25. `git.deploymentEnabled=false` remains restored.
26. No deployment exists for `44fe8b23...`.
27. The old failed Preview and old main destination pin are not treated as proof of this candidate.
28. Failed intermediate candidate `a739df3...` and CI `36758597695 — FAIL` remain preserved.

Do not accept the Builder report merely because CI is green.

You may perform adversarial static/local tests if they do not repair the candidate.

## Disposition

If any material defect is found:

`DIFFERENT_FRESH_RECHALLENGER_FAIL`

Preserve the exact finding durably in GitHub and do not repair it.

Only if the exact candidate survives:

`DIFFERENT_FRESH_RECHALLENGER_PASS`

PASS does not authorize deployment or execution. It permits progression only to a separate controlled live-proof operator that must create a new Preview and new exact main destination pin.
