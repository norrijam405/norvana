# Acre Era Intelligence + Delivery Control Tower R0

**Date:** 2026-10-04  
**Status:** stacked implementation lane  
**Base:** `feature/2026-10-04-acre-era-cinematic-renderer-r0`

## Purpose

Build the internal intelligence layer that supports Acre Era merchandising and fulfillment without exposing backend machinery to customers.

The system has four cooperating capabilities:

1. **Demand Intelligence** — estimate what customers are likely to buy.
2. **Darwin Economics** — determine whether an opportunity is profitable and operationally healthy enough to carry.
3. **Delivery / Transport Intelligence** — predict whether the chosen supplier + carrier + geography route can meet a truthful delivery promise.
4. **Producer Intake** — convert farm / producer conversations into structured, evidence-backed operational data.

## Customer boundary

Customer-facing pages must show useful outputs only, such as:

- price;
- stock state;
- expected delivery window;
- seller / checkout owner;
- fulfillment responsibility;
- returns / warranty;
- freshness of information when useful.

Do not expose Watchtower, Darwin, IgniAqua, agent/model names, internal scores, route fitness, governance state, or private economics.

## R0 safety

R0 is decision-support and simulation only.

It may:
- score;
- compare;
- estimate;
- recommend internally;
- preserve structured observations;
- identify missing evidence.

It may not:
- place supplier orders;
- create carrier shipments;
- contact producers;
- change prices;
- issue refunds;
- reship orders;
- activate products;
- deploy Production;
- run Production migrations;
- spend money.

## Economic doctrine

Optimize for sustainable customer value, not lowest unit cost.

A route must account for:

`sale revenue - product cost - inbound freight - outbound delivery - payment fees - marketplace fees - spoilage/return/fraud/warranty reserves - acquisition cost = contribution`

A lower wholesale cost does not automatically win if delivery unreliability, spoilage, support burden, or refunds destroy contribution.

## Delivery doctrine

Acre Era should not promise certainty it does not control.

Prefer evidence-based windows such as:

`Expected Oct. 8-10`

over unsupported statements such as:

`Arrives Tuesday`

Delivery intelligence learns by supplier, carrier, service, geography, handling time, transit time, loss/damage, and on-time performance.

## Local-food doctrine

Favor route density over one-order/one-driver economics.

Preferred progression:

1. customer pickup;
2. scheduled neighborhood routes;
3. community / retirement-facility bulk drops;
4. third-party same-day overflow;
5. dedicated Acre Era delivery only when density supports it.

Start with operationally simpler products before complex cold-chain categories.

## Integration

Existing Norvana capabilities remain canonical:

- Watchtower observations;
- customer demand / market requests;
- contribution economics;
- product route engine;
- supplier integrations;
- order / supplier-order records;
- Era Engine;
- customer-language boundary.

This lane extends those contracts rather than replacing them.


## Preview probe status — 2026-10-04

A one-shot Preview-only stock-video discovery probe may be deployed to exercise the configured Pixabay credential.

Constraints:
- Preview only.
- Discovery/read only.
- Secret value is never returned.
- No customer-facing route.
- No Production deploy or routing change.
- No media is auto-approved or attached to an Era.


One-shot Preview trigger armed after both repository and Vercel Preview gates were confirmed open.
