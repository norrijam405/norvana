# NORVANA WATCHTOWER R1 — DIFFERENT FRESH RE-CHALLENGER ACTIVATION AFTER NW-R1-FC-01 REMEDIATION

Date: 2026-10-01

You are being activated as a **different Fresh Re-Challenger** for the Norvana Watchtower R1 bounded recurring Local Producer observe lane after remediation of NW-R1-FC-01.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R1_REMEDIATION_BUILDER_ACTIVATION_AFTER_FRESH_CHALLENGER_FAIL_NW-R1-FC-01_2026-10-01.md`

Then read:

`docs/NORVANA_WATCHTOWER_R1_REMEDIATION_BUILDER_PASS_AFTER_NW-R1-FC-01_2026-10-01.md`

Also reconcile:
- Fresh Challenger FAIL report commit `f3d73325598c11b49a196956b7c4d297da42e79c`;
- PR #1 failure receipt `5934454487`.

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this remediation candidate.

You are not the Remediation Builder.

You are not the Fresh Challenger that issued NW-R1-FC-01.

You are not any prior R0/R1 Challenger/Re-Challenger, Controlled Live-Proof Operator, or Independent Assurance role.

Do not repair defects in this role.

Do not deploy, copy to main, activate R1, enable a watcher, or execute a live R1 observation.

Do not self-certify closure.

## Exact immutable remediation candidate

Commit:

`b98706f0231d9ee038845b8381bbc494185a37df`

Parent:

`95b1f58be62da62c1708651aa90924d92e969210`

Tree:

`2e044d9687cbb53e864692a1031949031de9a636`

Required Recovery CI:

`36883896225 — SUCCESS`

Expected Watchtower tests:

`59 PASS / 0 FAIL`

## Preserved finding to re-challenge

`NW-R1-FC-01 — required five-watcher topology is not enforced fail-closed`

## Re-Challenge mission

Independently attack the exact remediation candidate.

At minimum prove or disprove:

1. The shared watcher snapshot requires exactly five rows.
2. The exact canonical slugs are:
   - `free-supplier-watch`
   - `global-resale-sourcing-watch`
   - `local-producer-watch`
   - `operating-cost-watch`
   - `drop-opportunity-watch`
3. Every canonical slug must appear exactly once.
4. Missing canonical rows fail closed.
5. Duplicate canonical rows fail closed.
6. Unknown or substituted paused rows fail closed.
7. Additional sixth rows fail closed.
8. Target-only snapshots fail closed.
9. The exact intended five-row snapshot passes.
10. Exactly one watcher must be ENABLED.
11. The enabled watcher must be exactly `local-producer-watch`.
12. Its authority must be exactly `OBSERVE`.
13. Its budget must be exactly `0`.
14. All four canonical non-target watchers must be PAUSED.
15. Every canonical watcher remains inside the R0 authority ceiling and zero-budget policy.
16. The required canonical slug set remains aligned with the checked-in default job templates.
17. R1 queue uses the hardened shared evaluator.
18. Observe claim uses the hardened shared evaluator.
19. Observe result finalization uses the hardened shared evaluator.
20. Source-disabled R1 behavior remains intact.
21. Exactly one daily cron remains intact.
22. 20-hour server-side cadence enforcement remains intact.
23. R1-specific OIDC queue authorization remains intact.
24. The old one-shot workflow cannot authorize R1 queue creation.
25. No-OIDC preflight remains intact.
26. Exact-SHA checkout remains intact.
27. Normal queue/executor remain OFF.
28. Approved public-source set and redirect hardening remain intact.
29. Zero candidates / zero cost remain server-enforced.
30. ACT, spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, paid infrastructure, production promotion, and federation remain locked.
31. `git.deploymentEnabled=false` remains restored.
32. No deployment exists for `b98706f...`.
33. R0 final Independent Assurance PASS remains preserved and unmodified.
34. The original R1 Fresh Challenger FAIL and finding NW-R1-FC-01 remain preserved.

Do not accept the Builder report merely because CI is green.

You may add adversarial static/local tests if they do not repair the candidate.

## Disposition

If any material defect is found:

`R1_DIFFERENT_FRESH_RECHALLENGER_FAIL`

Preserve the exact finding durably in GitHub and stop. Do not repair it.

Only if the exact candidate survives:

`R1_DIFFERENT_FRESH_RECHALLENGER_PASS`

PASS does not authorize deployment or R1 activation. It permits progression only to a separate controlled R1 activation/proof gate.
