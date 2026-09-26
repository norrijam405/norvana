# Norvana Decision Ledger R0

**Purpose:** prevent founder-approved Norvana decisions from being lost, silently rewritten, or replaced by demo assumptions.

## Operating rule

Before material Norvana work, a successor worker must reconcile:

1. `README.md`
2. `docs/NORVANA_PRODUCT_CHARTER_R0.md`
3. `docs/NORVANA_EXPERIENCE_ARCHITECTURE_R0.md`
4. `docs/NORVANA_CLOSEST_TO_ZERO_OPERATIONS_R0.md` if present
5. this Decision Ledger
6. the active recovery PR and its preserved failures/verification state

When Norris and the active worker explicitly agree on a material product, sourcing, finance, authority, security, or operating decision, append it here with:

- date;
- decision ID;
- decision;
- status;
- rationale;
- supersedes / superseded-by when applicable;
- implementation/evidence references when available.

Do not silently change an ACCEPTED decision. If a later decision changes it, preserve the old decision and mark it SUPERSEDED.

## Status vocabulary

- PROPOSED
- ACCEPTED
- IMPLEMENTING
- VERIFIED
- SUPERSEDED
- REJECTED

## Accepted decisions

### NV-DEC-2026-09-26-001 — Preserve Norvana as its own product authority

**Status:** ACCEPTED / IMPLEMENTING

Norvana owns its catalog, customers, orders, payments, suppliers/producers, inventory, storefront, pricing and commercial decisions.

IgniAqua may provide bounded research, evidence, qualification, routing, continuity, experimentation and controlled execution services.

Shared service does not imply shared authority.

---

### NV-DEC-2026-09-26-002 — Preserve the rotating discovery concept

**Status:** ACCEPTED / IMPLEMENTING

Norvana's primary discovery storefront begins from the founder's original approximately two-week rotating niche/Drop concept.

Historical weekly or quarterly demo data must not silently redefine that intent.

Cadence may become configurable and evidence-informed later.

---

### NV-DEC-2026-09-26-003 — Three-lane commerce architecture

**Status:** ACCEPTED / IMPLEMENTING

Norvana evolves into:

- **Drops** — rotating curated discovery;
- **Local** — persistent seasonal local-farm/local-maker commerce;
- **World** — future qualified global commerce.

World remains feature-gated until sourcing, legal, customs, fulfillment and regulatory readiness are proven.

---

### NV-DEC-2026-09-26-004 — Preserve and strengthen the Archive

**Status:** ACCEPTED / IMPLEMENTING

Retired Drops remain browsable as editorial history instead of disappearing.

The Archive is a first-class Norvana experience.

---

### NV-DEC-2026-09-26-005 — Closest-to-$0 customer finance

**Status:** ACCEPTED / IMPLEMENTING

Norvana should help eligible customers minimize verified total financing cost rather than optimize for the smallest monthly payment or the provider paying Norvana the most.

Customer finance remains provider-neutral and must clearly disclose APR, fees, term, total of payments and total financing cost.

Norvana must not represent financing as free unless verified terms actually produce $0 financing cost.

Essential groceries should not default to debt promotion.

---

### NV-DEC-2026-09-26-006 — Closest-to-$0 operating doctrine

**Status:** ACCEPTED / IMPLEMENTING

Norvana should minimize fixed operating cost and capital tied up in inventory without sacrificing safety, customer experience, legal compliance, reliability or material product quality.

Prefer:

- free-to-sign-up providers;
- usable $0/month tiers;
- pay-per-order fulfillment;
- no/minimal minimum order quantity;
- supplier-direct fulfillment;
- no prepaid inventory where practical;
- free/low-cost infrastructure when it is operationally sound.

"Free" is not automatically cheapest. Compare true total operating cost, including product cost, shipping, transaction fees, returns, integration burden, storage, required inventory, defect rate and expected losses.

Paid services are justified when evidence shows they save more or materially reduce risk.

---

### NV-DEC-2026-09-26-007 — One unified customer cart

**Status:** ACCEPTED / PLANNED

Customers should be able to purchase across Norvana lanes with one cart.

Before payment, Norvana separates fulfillment groups such as:

- ships to you;
- local delivery;
- pickup;
- future international shipment.

Different timing, fees and cancellation rules must be disclosed before payment.

---

### NV-DEC-2026-09-26-008 — IgniAqua stays mostly backstage

**Status:** ACCEPTED / IMPLEMENTING

Retail customers primarily experience Norvana.

IgniAqua intelligence should surface as better sourcing, verified availability, evidence/trust, qualified connectors and safer operations rather than as internal agent/governance jargon throughout the storefront.

---

### NV-DEC-2026-09-26-009 — Evidence-backed social proof

**Status:** ACCEPTED / IMPLEMENTING

Demo customer counts, maker counts, countries shipped, ratings and reviews must not be represented as real production facts unless supported by Norvana records.

Production reviews should use verified-purchase provenance where practical.

---

### NV-DEC-2026-09-26-010 — Legal global/resale sourcing lane

**Status:** ACCEPTED / IMPLEMENTING

Norvana may source profitable products through multiple legal channels, including:

- qualified overseas manufacturers/wholesalers;
- authorized brand distributors;
- legitimate gray-market imports only when lawful for the specific mark/product;
- retailer/manufacturer overstock;
- official liquidation marketplaces;
- customer-return inventory with disclosed condition;
- thrift/secondhand marketplaces;
- estate/auction/closeout sources;
- local resale opportunities.

Norvana does **not** knowingly source or sell counterfeit goods, stolen goods, deceptive replicas, unauthorized trademark merchandise where import/resale is restricted, or goods whose provenance/authenticity cannot meet the applicable risk threshold.

Brand-name sourcing has a higher evidence threshold than generic/private-label sourcing.

---

### NV-DEC-2026-09-26-011 — Scout may research sourcing but not autonomously buy

**Status:** ACCEPTED / IMPLEMENTING

A Norvana/IgniAqua sourcing worker may:

- discover suppliers and lots;
- compare landed cost and resale value;
- gather authenticity/provenance evidence;
- evaluate seller/company risk;
- estimate fees, shipping, duties and expected margin;
- track price/availability changes;
- recommend test purchases.

It may not, without a separate explicit authority grant:

- commit funds;
- place wholesale/liquidation bids;
- import restricted goods;
- activate a supplier;
- publish a product;
- represent authenticity as verified without evidence.

---

### NV-DEC-2026-09-26-012 — Brand-name profitability must be calculated on landed cost

**Status:** ACCEPTED / PLANNED

For a candidate branded/resale product, Norvana should calculate:

`expected contribution = expected sale price - acquisition cost - inbound freight - duties/tariffs - marketplace/payment fees - fulfillment - expected returns/defects - authentication/inspection cost - allocated operating cost`

A cheap purchase price alone is not a profitable sourcing decision.

Condition, authenticity, demand velocity and return risk must be considered.

---

### NV-DEC-2026-09-26-013 — Norvana owns recurring operational watchers

**Status:** ACCEPTED / IMPLEMENTING

Norvana recurring monitoring should live in Norvana-owned backend state rather than depending on ChatGPT task limits.

Watchtower owns job definitions, cadence, run history, candidates, evidence, costs and receipts.

ChatGPT, IgniAqua, external models, search providers and connectors may be execution dependencies but are not the canonical home of Norvana's automation state.

---

### NV-DEC-2026-09-26-014 — Rebuild Admin as Watchtower Control Panel

**Status:** ACCEPTED / IMPLEMENTING

The historical Engine Room/browser-password admin is retired.

`/admin` is rebuilt as the Norvana Watchtower Control Panel for sourcing, operations, candidates, run history, evidence, authority and future internal controls.

Owner access uses server-side password verification and a signed HttpOnly session rather than a password literal shipped to the browser.

---

### NV-DEC-2026-09-26-015 — Watchtower R0 is Observe/Recommend only

**Status:** ACCEPTED / IMPLEMENTING

Watchtower R0 may autonomously observe public/authorized sources and create recommendations.

ACT authority is locked.

No Watchtower job may autonomously spend money, bid, publish products, activate suppliers/producers, change prices, place fulfillment orders, enroll financing, refund customers, or deploy production changes until a later founder-approved authority design is independently verified.


## Change discipline

Future workers must preserve this ledger as an append-only decision history. Corrections are allowed, but material earlier decisions should remain visible with an explicit SUPERSEDED marker rather than being erased.
