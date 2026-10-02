# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 NEW DIFFERENT FRESH RE-CHALLENGER ACTIVATION AFTER NW-R2-W1-DFRC-01 SECOND REMEDIATION

Date: 2026-10-01

You are being activated as a **new separate Different Fresh Re-Challenger** for Norvana R2 Local Partner Network & Order Routing Wave 1 after the second Remediation Builder PASS.

Repository:

`norrijam405/norvana`

Pull Request:

`#5`

Branch:

`feature/2026-10-01-norvana-r2-local-partner-network`

Begin with:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_SECOND_REMEDIATION_BUILDER_PASS_AFTER_NW-R2-W1-DFRC-01_2026-10-01.md`

Then read:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_DIFFERENT_FRESH_RECHALLENGER_FAIL_2026-10-01.md`

Governing FAIL receipt commit:

`7ea5ca5c99376f5a5f8541857266e2fe5662b76b`

Then read the prior Fresh Challenger failure and governing R2 activation.

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this candidate.

You are not either Remediation Builder.

You are not either prior Challenger/Re-Challenger.

Do not repair defects in this role.

Do not self-certify Independent Assurance.

## Exact immutable candidate

Commit:

`b7d8d6b61b76b417c881d6ef7a2badd1f6ed4d09`

Parent:

`d36c2284287aad5dda2daa8d1869cb6743e972ef`

Tree:

`0df1a399e0433862c7bd82a4bfb429d7f089c5b0`

Builder verification:

`36938586771 — SUCCESS`

Expected tests:

`20 PASS / 0 FAIL`

## Preserved finding under remediation

`NW-R2-W1-DFRC-01 — VERIFIED price state with no numeric amount yields unknown cost while falsely reporting no human verification required`

## Re-challenge mission

Independently attack the exact immutable candidate.

At minimum verify adversarially that:

1. VERIFIED + null current price remains allocation `unitPriceCents=null`.
2. VERIFIED + null current price remains allocation `knownCostCents=null`.
3. VERIFIED + null sets allocation `verificationRequired=true`.
4. VERIFIED + null sets plan `hasUnknownCosts=true`.
5. VERIFIED + null sets plan `requiresHumanVerification=true`.
6. VERIFIED + null never becomes zero cost.
7. An explicit missing-current-price warning is emitted.
8. VERIFIED + numeric current price still produces known cost.
9. VERIFIED + numeric price can remain verification-complete only when other evidence gates are also complete/current.
10. VERIFIED + null does not receive price-trust credit equivalent to known VERIFIED numeric price.
11. VERIFIED + null cannot win same-partner duplicate selection over an otherwise equivalent known VERIFIED numeric price.
12. Mixed plans sum only authoritative known costs and still require human verification when any allocation cost is unknown.
13. UNKNOWN numeric price remains unknown cost.
14. STALE numeric price remains unknown cost.
15. CLAIMED numeric price remains unknown cost.
16. Non-VERIFIED numeric prices do not leak into authoritative price-based tie-breaking.
17. Existing stale availability and over-age evidence fail-closed behavior remain intact.
18. `RECOMMEND_ONLY` and `canExecute=false` remain intact.
19. No supplier activation/order/charge/fulfillment/contact/persistence/live-ingestion/deployment authority was introduced.
20. No R2 Vercel deployment exists.
21. Runtime dependency audit remains clean and the high-severity dependency gate passes.

Do not restrict yourself to Builder tests. Probe contradictions and neighboring boundary cases.

## Stop condition

If a material defect is found:

`R2_WAVE1_NEW_DIFFERENT_FRESH_RECHALLENGER_FAIL`

Preserve one clear finding with minimal reproducer and exact commit/tree, then stop. Do not repair it.

Only if the exact candidate survives:

`R2_WAVE1_NEW_DIFFERENT_FRESH_RECHALLENGER_PASS`

A PASS does not authorize persistence, live ingestion, deployment, merge, partner contact, supplier promotion, ordering, charging, fulfillment, or ACT.
