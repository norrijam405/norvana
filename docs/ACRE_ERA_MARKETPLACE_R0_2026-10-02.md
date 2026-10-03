# Acre Era Marketplace R0

Date: 2026-10-02

Status: **customer-facing product/design candidate**

Internal repository codename remains `norvana` during controlled migration.

## Product thesis

Acre Era should not compete as an everything store. It should earn attention by explaining why an item is present, separating product truth from fulfillment truth, letting customers shape demand, and connecting local commerce with curated internet commerce.

Public brand:

`Acre Era`

Working promise:

`Common needs. Curious finds. Clear reasons.`

## Implemented in this R0 branch

### Earth + evolution design system

- cream / soil / leaf / moss / clay / ember / wheat palette;
- animated contour/seed background with reduced-motion support;
- Acre Era public navigation and metadata;
- distinct Market visual world without turning the whole company into a farm-themed store;
- farm-life media slot with a non-deceptive illustrated poster until real partner footage exists.

### Product Passport / "Why It's Here"

Product pages now have an Acre Era Passport presentation that separates:

- catalog/source state;
- purchase-verification signal;
- product rating;
- fulfillment/delivery rating;
- buying-experience rating;
- whether the item is still an early/new find.

The passport is descriptive, not a guarantee.

### Customer Voice

This branch is based on Customer Voice R0 and preserves:

- verified vs unverified reviews;
- separate product / fulfillment / buying-experience ratings;
- business-buyer signal;
- near-live review refresh;
- helpful / not-helpful reactions;
- neutral positive/negative publication path.

### Era Drops

The existing rotating-volume model is reframed customer-facing as **Era Drops**: recurring curated discovery collections rather than a static catalog.

### Bring It Here

Public customers can request:

- a product;
- farm/grower;
- maker/local business;
- category.

Requests are rate-limited and deduplicated into demand counts.

Authority remains:

`OBSERVE_RECOMMEND_ONLY`

A customer request does **not** publish a product, contact/activate a supplier, place an order, charge money, or execute fulfillment.

### Acre Era Market

A separate `/market` experience exists for grocery/farm/local commerce.

It:

- uses a warmer farm-oriented visual system;
- has a real-farm-video slot;
- cycles educational farm facts;
- shows only active catalog items from food/grocery/garden/wellness lanes;
- explicitly refuses to invent local-source claims;
- can surface community demand evidence.

## Next product lanes — planned, not claimed complete

### Split-source unified cart

Goal: one customer cart that can transparently explain which line items are:

- local pickup;
- local delivery;
- shipped supplier goods;
- POD / made-to-order goods.

The customer must see separate arrival expectations before checkout. Do not promise one delivery date when multiple fulfillment modes exist.

### Living partner storefronts

For qualified farms, makers, and local businesses:

- story and origin;
- public seller profile;
- seasonal/current availability;
- pickup and delivery truth;
- short real video;
- wholesale readiness;
- Customer Voice;
- provenance.

### Acre Era+

Do not launch a paid membership until there is measurable recurring value.

Candidate benefits:

- savings tied to actual basket economics;
- early Era Drop access;
- member local-delivery benefits where economical;
- member-only bundles;
- no debt promotion for essential groceries.

### B2B / wholesale

Future business accounts may support:

- restaurants;
- offices;
- schools;
- dealerships;
- independent retailers;
- other small businesses.

Needs separate price lists, tax/account controls, quantities, evidence, and fulfillment constraints.

### Seller services

Optional paid services may include:

- storefront presentation;
- photography/video support;
- analytics;
- promotion packages;
- inventory tooling.

Paid services must not silently buy misleading organic ranking.

### Private label

Acre Era-owned products should be created only after repeat-purchase and margin data demonstrate demand. Do not create private label from intuition alone.

## Design principles

1. Earthy, not rustic cosplay.
2. Growth/change should appear through interaction, not generic leaf logos.
3. Grocery gets a richer farm-life world while Goods remains modern general ecommerce.
4. Real producer footage replaces stock/placeholder media as partnerships qualify.
5. A tomato, candle, and phone case must all look intentionally selected.
6. No fake statistics or local claims.
7. Motion respects `prefers-reduced-motion`.
8. Customer-facing uncertainty must be explicit.

## Deployment prerequisites

This branch requires, before any preview proof that exercises public writes:

- Customer Voice migration `drizzle/0007_customer_voice_r0.sql`;
- Acre Era migration `drizzle/0008_acre_era_marketplace_r0.sql`;
- `NORVANA_CUSTOMER_VOICE_RATE_SECRET` configured as a strong deployment secret;
- existing supplier/order execution locks preserved.

No supplier ACT authority is added by this lane.
