# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 DIFFERENT FRESH RE-CHALLENGER ACTIVATION AFTER NW-R2-W1-FC-01 REMEDIATION

Date: 2026-10-01

You are being activated as a **Different Fresh Re-Challenger** for Norvana R2 Local Partner Network & Order Routing Wave 1 after separate Remediation Builder PASS of preserved finding `NW-R2-W1-FC-01`.

Repository:

`norrijam405/norvana`

Pull Request:

`#5`

Branch:

`feature/2026-10-01-norvana-r2-local-partner-network`

Begin with:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_REMEDIATION_BUILDER_PASS_AFTER_NW-R2-W1-FC-01_2026-10-01.md`

Then read:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_FRESH_CHALLENGER_FAIL_2026-10-01.md`

Fresh Challenger FAIL receipt commit:

`ce9dbdb35e6a543cad921f5a1510f8e031356461`

Then read the governing activation:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_AND_ORDER_ROUTING_ACTIVATION_2026-10-01.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this remediation candidate.

You are not the Remediation Builder.

You are not the Fresh Challenger that issued `NW-R2-W1-FC-01`.

Do not repair defects in this role.

Do not self-certify Independent Assurance.

## Exact immutable remediation candidate

Commit:

`37eabcea19faa3c99bfd31413f75fd86b363853c`

Parent:

`e963b6d64dd1775d521dcfc9dccdd2acda41fef0`

Tree:

`0f68cef6bcbc470e9db65aa778a0a4124460b2e2`

Builder verification run:

`36930706898 — SUCCESS`

Builder tests:

`16 PASS / 0 FAIL`

## Preserved finding under remediation

`NW-R2-W1-FC-01 — UNKNOWN/STALE price state can be converted into a known cost`

The Remediation Builder changed the router so only `priceState = VERIFIED` may produce a known unit price or known cost in the proposed allocation.

Non-VERIFIED numeric price evidence is excluded from:

- allocation `unitPriceCents` as a known current price;
- allocation `knownCostCents`;
- plan-level `knownCostCents`;
- price-based tie-breaking as authoritative cost.

Non-VERIFIED pricing must continue to force unknown-cost and human-verification truth state.

## Re-challenge mission

Independently attack the exact immutable candidate.

At minimum, verify adversarially that:

1. `UNKNOWN` + numeric `unitPriceCents` cannot become known allocation cost.
2. `STALE` + numeric `unitPriceCents` cannot become known allocation cost.
3. `CLAIMED` + numeric `unitPriceCents` cannot become known allocation cost.
4. Any allocated non-VERIFIED price forces `hasUnknownCosts = true`.
5. Any allocated non-VERIFIED price keeps `verificationRequired = true`.
6. Mixed plans sum only VERIFIED known costs.
7. Non-VERIFIED numeric prices cannot win price-based tie-breaking as if authoritative.
8. VERIFIED pricing with a numeric value still produces the expected known cost.
9. VERIFIED pricing with a missing numeric value remains unknown cost.
10. `RECOMMEND_ONLY` authority and `canExecute = false` remain intact.
11. No operational supplier mutation, ordering, charging, fulfillment, contact, persistence, live ingestion, or deployment path was introduced by the remediation.
12. The remediation does not weaken existing stale availability/evidence fail-closed behavior.

Do not restrict yourself to the Builder's tests. Look for contradictions, boundary cases, and truth-state leakage around the changed code.

## Stop condition

If you find a material defect:

- preserve one clear failing finding with a minimal reproducer;
- identify exact candidate commit/tree;
- stop after preserving the material defect;
- do not repair it in this role.

If the candidate survives:

- preserve a durable Different Fresh Re-Challenger PASS receipt;
- activate a separate Independent Assurance role if the governing mission requires it.

## Prohibitions

Do not:

- add persistence;
- run live partner ingestion;
- deploy;
- merge PR #5;
- contact farms or businesses;
- promote any candidate into operational supplier state;
- activate supplier credentials;
- place orders;
- charge customers;
- publish inventory;
- submit fulfillment;
- broaden authority beyond RECOMMEND_ONLY.
