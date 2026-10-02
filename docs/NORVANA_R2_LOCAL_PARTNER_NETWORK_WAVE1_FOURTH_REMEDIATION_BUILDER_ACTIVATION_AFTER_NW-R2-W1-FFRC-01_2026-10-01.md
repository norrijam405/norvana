# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 FOURTH REMEDIATION BUILDER ACTIVATION AFTER NW-R2-W1-FFRC-01

Date: 2026-10-01

You are being activated as the **separate fourth Remediation Builder** for Norvana R2 Local Partner Network & Order Routing Wave 1 after a preserved Further Fresh Re-Challenger failure.

Repository:

`norrijam405/norvana`

Pull Request:

`#5`

Branch:

`feature/2026-10-01-norvana-r2-local-partner-network`

Begin with:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_FURTHER_FRESH_RECHALLENGER_FAIL_2026-10-01.md`

Governing FAIL receipt commit:

`c950f660fbea36bcd050445a35ee0c70f72479b7`

Then read:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_THIRD_REMEDIATION_BUILDER_PASS_AFTER_NW-R2-W1-NDFRC-01_2026-10-01.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Fresh Re-Challenger that issued `NW-R2-W1-FFRC-01`.

Do not self-certify re-challenge or Independent Assurance.

## Exact failed candidate

Commit:

`5e2463bdec5c2f28d65b5ec0105b55b2e65336ef`

Parent:

`5cf5323c3b2d1b27564ecccbc34f03910de239ee`

Tree:

`3a1bac47ba433cdb89d288795759b99b6b30276f`

Builder CI:

`36940474974 — SUCCESS`

## Preserved finding

`NW-R2-W1-FFRC-01 — plan-level known-cost aggregation can emit unsafe authoritative cents without forcing verification`

The candidate validates individual authoritative unit prices and allocation known costs, but then aggregates known allocation costs with unchecked numeric addition.

Two individually valid safe-integer allocation costs can therefore produce a plan total outside the JavaScript safe-integer boundary while the plan still reports:
- numeric `knownCostCents`;
- `hasUnknownCosts=false`;
- `requiresHumanVerification=false`.

## Required remediation

Make the smallest coherent correction to the plan-level monetary truth boundary.

At minimum:

1. Plan-level known cost must be authoritative only while the aggregate remains a finite, non-negative, safe-integer cents amount.
2. If adding a known allocation cost would make the aggregate unsafe, plan-level `knownCostCents` must become unknown rather than publishing the unsafe number.
3. Do not clamp, round, wrap, or silently discard the overflow.
4. Represent an unrepresentable authoritative plan total explicitly; nullable `knownCostCents` is permitted and preferred.
5. Aggregate overflow must force `hasUnknownCosts=true`.
6. Aggregate overflow must force `requiresHumanVerification=true`.
7. Emit a clear plan-level warning that the known-cost aggregate exceeded the safe integer cents boundary.
8. Individual valid allocation known costs may remain visible.
9. Once plan aggregate becomes unknown, later allocations must not accidentally restore a numeric authoritative total.
10. Preserve zero, null, UNKNOWN/STALE/CLAIMED, negative/non-finite/fractional/unsafe unit-price protections from prior remediations.
11. Preserve invalid calculated-allocation-cost protections.
12. Add adversarial tests for:
   - MAX_SAFE_INTEGER + 1;
   - overflow followed by another valid allocation;
   - exact MAX_SAFE_INTEGER total remains valid;
   - mixed unknown allocation plus safe known allocations;
   - zero-cost allocations;
   - order-independent aggregate fail-closed behavior.
13. Preserve `RECOMMEND_ONLY` and `canExecute=false`.
14. Do not add persistence, ingestion, deployment, supplier activation, ordering, charging, fulfillment, partner contact, credentials, or ACT.
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

Bank an immutable candidate with exact commit/tree and prepare a separate Fresh Re-Challenger activation.

Do not perform that re-challenge yourself.
