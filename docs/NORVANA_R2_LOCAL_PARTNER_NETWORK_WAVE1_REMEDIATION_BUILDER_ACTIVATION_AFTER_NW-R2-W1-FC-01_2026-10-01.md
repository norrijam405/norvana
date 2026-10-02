# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 REMEDIATION BUILDER ACTIVATION AFTER NW-R2-W1-FC-01

Date: 2026-10-01

You are being activated as the **separate Remediation Builder** for Norvana R2 Local Partner Network & Order Routing Wave 1 after a preserved Fresh Challenger failure.

Repository:

`norrijam405/norvana`

Pull Request:

`#5`

Branch:

`feature/2026-10-01-norvana-r2-local-partner-network`

Begin with:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_FRESH_CHALLENGER_FAIL_2026-10-01.md`

Fresh Challenger FAIL receipt commit:

`ce9dbdb35e6a543cad921f5a1510f8e031356461`

Then read:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_BUILDER_PASS_2026-10-01.md`

and:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_AND_ORDER_ROUTING_ACTIVATION_2026-10-01.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Fresh Challenger that issued `NW-R2-W1-FC-01`.

Do not self-certify re-challenge or Independent Assurance.

## Exact failed candidate

Commit:

`6c439deaf794721cbe7adfe04e1340a8bbf54a8e`

Parent:

`b20192dca613711b012056b76fac5157353a2a5d`

Tree:

`17c025957e42dcad9919ca52fb970919fb5b874c`

Required historical Builder CI:

`36921048979 — SUCCESS`

## Preserved material finding

`NW-R2-W1-FC-01 — UNKNOWN/STALE price state can be converted into a known cost`

The current router can treat a numeric `unitPriceCents` as known cost even when authoritative `priceState` is `UNKNOWN` or `STALE`.

This can incorrectly produce:

- numeric allocation `knownCostCents`;
- numeric plan-level `knownCostCents`;
- `hasUnknownCosts = false`;

even though the price truth-state says UNKNOWN/STALE.

The repair must preserve the truth-state contract: a numeric value does not become a known current cost unless the governing price state permits it.

## Remediation mission

Make the smallest coherent correction that closes `NW-R2-W1-FC-01` without broadening authority.

At minimum:

1. Treat `priceState = UNKNOWN` as unknown cost even if `unitPriceCents` is numeric.
2. Treat `priceState = STALE` as unknown cost even if `unitPriceCents` is numeric.
3. Do not add UNKNOWN/STALE numeric amounts into plan-level `knownCostCents`.
4. Ensure `hasUnknownCosts = true` whenever any allocated offer lacks a VERIFIED governing price truth-state.
5. Preserve the raw numeric amount only if explicitly labeled as non-authoritative evidence/reference; do not expose it through `knownCostCents`.
6. Keep `verificationRequired = true` for non-VERIFIED pricing.
7. Add adversarial tests for:
   - UNKNOWN priceState + numeric unitPriceCents;
   - STALE priceState + numeric unitPriceCents;
   - mixed plan with one VERIFIED known-cost allocation and one UNKNOWN/STALE numeric-price allocation;
   - plan-level knownCostCents summing only VERIFIED known costs.
8. Preserve RECOMMEND_ONLY authority.
9. Do not alter supplier activation/order/charge/fulfillment authority.
10. Do not add persistence or live ingestion.
11. Do not deploy.
12. Do not merge PR #5.

## Verification gate

Before Builder PASS, run and preserve:

- R2 partner-network tests;
- typecheck;
- R2 lint;
- production build;
- runtime dependency audit;
- high-severity dependency gate;
- new-secret regression gate.

The remediation candidate must be immutable and identified by exact commit/tree.

## Completion

If remediation verification passes, preserve a durable Builder PASS receipt and create a **Different Fresh Re-Challenger activation** for a separate agent.

Do not perform the re-challenge yourself.
