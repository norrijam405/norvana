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


---

### NV-DEC-2026-09-26-016 — Closest-to-$0 scheduler and replaceable worker

**Status:** ACCEPTED / IMPLEMENTING

Norvana may use GitHub Actions as the initial low-fixed-cost scheduler while keeping schedule truth and run history in Norvana's database.

The execution worker is replaceable. IgniAqua, a Norvana worker, a low-cost model provider, or deterministic connector may claim jobs through the same bounded protocol.

Changing the execution provider must not move or erase Norvana's canonical job, evidence, cost, candidate, authority, or receipt state.


---

### NV-DEC-2026-09-26-017 — Bootstrap admin once, then persist owner identity

**Status:** ACCEPTED / IMPLEMENTING

Norvana must not depend permanently on a browser password literal or a long-lived plaintext admin password stored in deployment configuration.

A temporary server-side bootstrap credential may be used to establish the first owner login. After successful bootstrap, Norvana persists only the salted password hash in its own database.

The owner can rotate the password from the Watchtower account-security page. Once a database owner identity exists, the old bootstrap credential is no longer authoritative even if its environment variables have not yet been removed.

The session-signing secret remains server-side deployment configuration.


---

### NV-DEC-2026-09-26-018 — Admin recovery is separate, temporary, and fail-closed

**Status:** ACCEPTED / IMPLEMENTING

Norvana must provide an owner password-recovery path so a forgotten password does not require restoring an insecure historical browser credential.

Recovery uses a separate server-side recovery credential and is disabled by default. Enabling recovery does not grant ordinary Watchtower authority; it only permits resetting the owner password.

After a successful recovery, the recovery gate should be disabled again. The recovery credential must never be shipped in browser source.


---

### NV-DEC-2026-09-26-019 — Preview bootstrap secrets are generated locally, not shared in chat

**Status:** ACCEPTED / IMPLEMENTING

Norvana provides a browser-local setup helper for the recovery Preview.

The helper generates a temporary bootstrap password plus password hash, session secret, recovery secret, scheduler secret, and worker secret without sending those values to Norvana or an external API.

Founder setup values are copied directly into Vercel Preview environment variables and must not be committed to GitHub or pasted into chat.

The bootstrap password is temporary. After first login, the owner rotates to a private permanent password stored as a salted hash in Norvana's database.

---

### NV-DEC-2026-09-26-020 — Preview-first activation with explicit zero-authority defaults

**Status:** ACCEPTED / IMPLEMENTING

Watchtower activation occurs on Vercel Preview before production promotion.

Initial activation values must keep these authority-bearing switches disabled:

- Watchtower queue disabled;
- Watchtower executor disabled;
- external fulfillment disabled;
- supplier connectors disabled;
- IgniAqua federation disabled;
- password recovery disabled during normal operation.

Configuration presence is verified through a non-secret preflight endpoint that returns booleans and readiness state, never secret values.


---

### NV-DEC-2026-09-26-021 — Watcher enablement requires four independent R0 gates

**Status:** ACCEPTED / IMPLEMENTING

A Watchtower R0 job may not transition from PAUSED to ENABLED unless all of the following are true:

- the owner has replaced the temporary bootstrap-derived credential with a permanent password;
- a durable safe control-plane self-test has passed;
- the job authority is OBSERVE or RECOMMEND;
- the automation budget is exactly $0.

These checks are enforced server-side and are not merely UI guidance.

The scheduler and worker also independently re-check the R0 authority and budget policy before queueing/claiming/finalizing work.

---

### NV-DEC-2026-09-26-022 — Batch recovery changes during Vercel Hobby cooldowns

**Status:** ACCEPTED / IMPLEMENTING

Norvana does not upgrade to a paid Vercel plan merely to bypass a temporary Hobby build-rate cooldown.

During a cooldown, automatic Git deployments may be temporarily disabled on the recovery branch while GitHub CI continues validating code changes. Changes are batched into a single controlled Preview candidate rather than producing one deployment per small commit.

The temporary deployment freeze must be removed or explicitly overridden only when a specific CI-green Preview candidate is ready for deliberate deployment and verification.

This is an application of Norvana's Closest-to-$0 operating doctrine and must not be carried into production accidentally.

---

### NV-DEC-2026-09-27-023 — Preserve pre-tracking owner rotation truth

**Status:** ACCEPTED / IMPLEMENTING

Owner credential-state tracking was introduced after the founder had already completed the temporary-bootstrap to permanent-password rotation on the recovery Preview.

Therefore, existing `admin_users` rows that predate the `bootstrap_derived` column are migrated as durable/rotated credentials (`bootstrap_derived=false`).

Future owner rows created directly from the bootstrap credential are explicitly written as `bootstrap_derived=true`, and a successful owner password change explicitly sets the value to `false`.

This prevents a migration from falsely requiring the founder to repeat an already-completed credential rotation.

## Change discipline

Future workers must preserve this ledger as an append-only decision history. Corrections are allowed, but material earlier decisions should remain visible with an explicit SUPERSEDED marker rather than being erased.
