# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 SECOND REMEDIATION BUILDER ACTIVATION AFTER NW-R2-W1-DFRC-01

Date: 2026-10-01

You are being activated as the **separate second Remediation Builder** for Norvana R2 Local Partner Network & Order Routing Wave 1 after a preserved Different Fresh Re-Challenger failure.

Repository:

`norrijam405/norvana`

Pull Request:

`#5`

Branch:

`feature/2026-10-01-norvana-r2-local-partner-network`

Begin with:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_DIFFERENT_FRESH_RECHALLENGER_FAIL_2026-10-01.md`

Governing Different Fresh Re-Challenger FAIL receipt commit:

`7ea5ca5c99376f5a5f8541857266e2fe5662b76b`

Then read:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_REMEDIATION_BUILDER_PASS_AFTER_NW-R2-W1-FC-01_2026-10-01.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Different Fresh Re-Challenger that issued `NW-R2-W1-DFRC-01`.

You are not the prior Fresh Challenger that issued `NW-R2-W1-FC-01`.

Do not self-certify re-challenge or Independent Assurance.

## Exact failed remediation candidate

Commit:

`37eabcea19faa3c99bfd31413f75fd86b363853c`

Parent:

`e963b6d64dd1775d521dcfc9dccdd2acda41fef0`

Tree:

`0f68cef6bcbc470e9db65aa778a0a4124460b2e2`

Builder verification:

`36930706898 — SUCCESS`

## Preserved finding

`NW-R2-W1-DFRC-01 — VERIFIED price state with no numeric amount yields unknown cost while falsely reporting no human verification required`

The candidate correctly leaves cost unknown for:

`priceState = VERIFIED`

with:

`unitPriceCents = null`

but can simultaneously emit:

- allocation `knownCostCents = null`;
- plan `hasUnknownCosts = true`;
- allocation `verificationRequired = false`;
- plan `requiresHumanVerification = false`.

That contradiction must fail closed.

## Required remediation

Make the smallest coherent correction.

At minimum:

1. Any allocated offer with no authoritative numeric current price must set allocation `verificationRequired = true`.
2. Any plan containing such an allocation must set `requiresHumanVerification = true`.
3. `priceState = VERIFIED` with `unitPriceCents = null` must remain unknown cost.
4. Do not convert null price into zero.
5. Keep allocation `unitPriceCents = null` and `knownCostCents = null`.
6. Keep plan `hasUnknownCosts = true`.
7. Preserve the existing remediation for UNKNOWN/STALE/CLAIMED numeric prices.
8. Add a specific warning for a VERIFIED price state that lacks a numeric current amount.
9. Do not award price-trust/ranking credit for a VERIFIED price state that has no authoritative numeric amount.
10. Add adversarial tests for:
   - VERIFIED + null price;
   - VERIFIED + numeric price;
   - mixed plan with a known-cost allocation and a VERIFIED/null-price allocation;
   - human-verification propagation at allocation and plan level;
   - tie/ranking behavior that does not treat VERIFIED/null as equivalent to a known verified price.
11. Preserve `RECOMMEND_ONLY` and `canExecute=false`.
12. Do not add persistence or ingestion.
13. Do not deploy or merge PR #5.
14. Do not contact partners or promote suppliers.
15. Do not add ordering, charging, inventory publication, fulfillment submission, credentials, or ACT authority.

## Verification

Before Builder PASS, require:
- R2 partner-network tests;
- typecheck;
- R2 lint;
- production build;
- runtime dependency audit;
- high-severity dependency gate;
- new-secret regression gate.

Bank an immutable candidate with exact commit/tree and prepare a separate new Different Fresh Re-Challenger activation.

Do not perform that re-challenge yourself.
