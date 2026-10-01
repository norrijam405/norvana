# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 THIRD REMEDIATION BUILDER ACTIVATION AFTER NW-R2-W1-NDFRC-01

Date: 2026-10-01

You are being activated as the **separate third Remediation Builder** for Norvana R2 Local Partner Network & Order Routing Wave 1 after a preserved New Different Fresh Re-Challenger failure.

Repository:

`norrijam405/norvana`

Pull Request:

`#5`

Branch:

`feature/2026-10-01-norvana-r2-local-partner-network`

Begin with:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_NEW_DIFFERENT_FRESH_RECHALLENGER_FAIL_2026-10-01.md`

Governing FAIL receipt commit:

`d06b8431710a83c3a0c332dd9d9ccec669c4be43`

Then read:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_SECOND_REMEDIATION_BUILDER_PASS_AFTER_NW-R2-W1-DFRC-01_2026-10-01.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the challenger that issued `NW-R2-W1-NDFRC-01`.

Do not self-certify re-challenge or Independent Assurance.

## Exact failed second-remediation candidate

Commit:

`b7d8d6b61b76b417c881d6ef7a2badd1f6ed4d09`

Parent:

`d36c2284287aad5dda2daa8d1869cb6743e972ef`

Tree:

`0df1a399e0433862c7bd82a4bfb429d7f089c5b0`

Builder CI:

`36938586771 — SUCCESS`

## Preserved finding

`NW-R2-W1-NDFRC-01 — VERIFIED negative current price is promoted to authoritative known cost and verification-complete state`

The authoritative price boundary currently trusts any non-null numeric value when `priceState === VERIFIED`.

A negative value such as `unitPriceCents = -1` can therefore:
- receive price-trust credit;
- win price sorting;
- populate allocation unitPriceCents;
- create negative knownCostCents;
- reduce plan knownCostCents;
- suppress allocation verification;
- suppress plan-level human verification.

## Required remediation

Make the smallest coherent price-integrity correction.

At minimum:

1. Authoritative current price must require `priceState === VERIFIED`.
2. Authoritative `unitPriceCents` must be a finite, non-negative, safe integer cents amount.
3. Negative, NaN, Infinity, -Infinity, fractional-cents, and unsafe-integer values must not become authoritative known price.
4. Invalid numeric price evidence must remain excluded from known allocation cost and plan known cost.
5. Invalid numeric price evidence must force allocation `verificationRequired=true`.
6. Any allocated invalid/unknown price must force plan `hasUnknownCosts=true` and `requiresHumanVerification=true`.
7. Invalid numeric price evidence must receive no verified-price trust credit.
8. Invalid numeric price evidence must not win authoritative price tie-breaking.
9. Null price behavior from NW-R2-W1-DFRC-01 must remain intact.
10. UNKNOWN/STALE/CLAIMED numeric price behavior from NW-R2-W1-FC-01 must remain intact.
11. Zero cents may remain a valid authoritative amount if VERIFIED and otherwise valid.
12. Add adversarial tests for:
   - VERIFIED -1;
   - VERIFIED NaN;
   - VERIFIED Infinity;
   - VERIFIED fractional cents;
   - VERIFIED unsafe integer;
   - VERIFIED 0;
   - duplicate selection where invalid negative price competes with valid positive price;
   - mixed plan ensuring invalid price does not reduce known-cost totals.
13. Preserve RECOMMEND_ONLY and canExecute=false.
14. Do not add persistence, ingestion, deployment, supplier activation, ordering, charging, fulfillment, contact, credentials, or ACT.
15. Do not merge PR #5.

## Verification

Require:
- R2 partner-network tests;
- typecheck;
- R2 lint;
- production build;
- runtime dependency audit;
- high-severity dependency gate;
- new-secret regression gate.

Bank an immutable remediation candidate and prepare a separate new re-challenge activation.

Do not perform that re-challenge yourself.
