# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 SIXTH REMEDIATION BUILDER ACTIVATION AFTER NW-R2-W1-QIFRC-01

Date: 2026-10-01

You are being activated as the **separate sixth Remediation Builder** for Norvana R2 Local Partner Network & Order Routing Wave 1 after a preserved Quantity-Integrity Fresh Re-Challenger failure.

Repository:

`norrijam405/norvana`

Pull Request:

`#5`

Branch:

`feature/2026-10-01-norvana-r2-local-partner-network`

Begin with:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_QUANTITY_INTEGRITY_FRESH_RECHALLENGER_FAIL_2026-10-01.md`

Governing FAIL receipt commit:

`46f6270de561e49673391e652d049ec9d3272770`

Then read:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_FIFTH_REMEDIATION_BUILDER_PASS_AFTER_NW-R2-W1-ACFRC-01_2026-10-01.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Fresh Re-Challenger that issued `NW-R2-W1-QIFRC-01`.

Do not self-certify re-challenge or Independent Assurance.

## Exact failed candidate

Commit:

`1160a28e308fa506b7533394aaf1e7f47648a6b3`

Parent:

`1f5140eb683da623c760e67240415194f5cdb2b5`

Tree:

`4fd36c6240e7ba555af3fd51e15ee6eec2cca84f`

Builder CI:

`36961546880 — SUCCESS`

## Preserved finding

`NW-R2-W1-QIFRC-01 — blank quantity unit is accepted as verified coverage and suppresses uncovered-demand truth`

Matching invalid unit strings can currently pass `offer.unit === line.unit`, allowing undefined measurement semantics to be treated as verified coverage.

## Required remediation

Make the smallest coherent unit-integrity correction.

At minimum:

1. Demand quantity unit must be a defined, non-blank string after normalization.
2. Offer quantity unit must be a defined, non-blank string after normalization.
3. Empty string and whitespace-only units must not establish compatibility.
4. Invalid demand unit creates no allocation and is represented explicitly as unrouteable.
5. Invalid offer unit cannot allocate valid demand.
6. Valid demand + invalid offer preserves the full finite uncovered remainder.
7. Unit comparison must occur only after both units pass validity checks.
8. Leading/trailing ordinary whitespace may be normalized before exact comparison.
9. Do not invent unit conversion or synonym equivalence.
10. Distinct normalized units remain incompatible.
11. Allocation output should use the normalized valid demand unit.
12. Invalid unit evidence must produce a clear alternate/uncovered reason.
13. Preserve finite-positive demand/availability quantity checks.
14. Preserve all prior monetary truth-state and aggregate-overflow remediations.
15. Add adversarial tests for:
   - demand unit `""`;
   - offer unit `""`;
   - demand/offer units both `""`;
   - whitespace-only units;
   - valid trimmed equivalents such as `" lb "` and `"lb"`;
   - distinct units such as `"lb"` vs `"kg"`;
   - valid demand + invalid offer leaves full uncovered remainder;
   - invalid demand creates no allocation;
   - invalid offer before/after valid offer cannot poison coverage.
16. Preserve `RECOMMEND_ONLY` and `canExecute=false`.
17. Do not add persistence, ingestion, deployment, supplier activation, ordering, charging, fulfillment, partner contact, credentials, or ACT.
18. Do not merge PR #5.

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
