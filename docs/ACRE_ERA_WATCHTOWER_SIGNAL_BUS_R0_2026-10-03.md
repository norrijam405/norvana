# Acre Era Watchtower Signal Bus R0

**Date:** 2026-10-03  
**Status:** backend implementation contract

## Purpose

Give Watchtower one durable, append-only evidence stream for changing commercial/customer facts.

The Signal Bus does not replace specialized tables such as product routes, Customer Voice, Era snapshots, or Watchtower candidate snapshots. It records **observations and state-change signals** that can be replayed into bounded projectors.

## Signal classes

R0 recognizes:

- PRICE_OBSERVATION
- STOCK_OBSERVATION
- ROUTE_BEST_CHANGED
- ROUTE_STATE_CHANGED
- ERA_STATE_CHANGED
- REQUEST_STATE_CHANGED
- QUALIFICATION_STATE_CHANGED
- PARTNER_STATE_CHANGED
- BRAND_STATE_CHANGED
- LOCAL_SEASONAL_AVAILABILITY
- AUTHORIZATION_OBSERVATION
- PROVENANCE_OBSERVATION
- RECALL_SAFETY_OBSERVATION
- SHIPPING_OBSERVATION
- WARRANTY_OBSERVATION
- RETURN_POLICY_OBSERVATION
- DEMAND_OBSERVATION
- CUSTOMER_VOICE_OBSERVATION

Subjects:

- PRODUCT
- ROUTE
- BRAND
- ERA
- REQUEST
- PROVIDER
- CATEGORY
- LOCAL_PARTNER

Truth states:

- OBSERVED
- VERIFIED
- CONFLICT

A conflict is data. It is not silently overwritten.

## Evidence and immutability

Every signal requires:

- stable source-provided `signalKey`;
- bounded signal/subject type;
- evidence reference;
- source kind;
- valid observation time;
- canonical payload digest.

`watchtower_signals` and `watchtower_signal_projections` are append-only at PostgreSQL level. UPDATE and DELETE are rejected by triggers.

Reusing a signal key with identical content is an idempotent replay.

Reusing the same key with different content fails as:

`WATCHTOWER_SIGNAL_KEY_COLLISION`

## Public vs private payload

A signal has two payload envelopes:

### publicPayload

Only explicit customer-safe keys are accepted, including price, stock state, public seller/brand, Era/request state, delivery range, warranty/return summary, authorization/provenance labels, recall status, demand counts, and Customer Voice aggregates.

Unknown public keys are rejected rather than silently copied.

### privatePayload

May hold bounded internal analytical fields, but recursively rejects key names associated with:

- passwords/secrets/tokens/API keys;
- cookies/sessions;
- customer email/phone/address;
- payment/card/Stripe payment identifiers;
- pseudonymous actor hashes.

Credentials and customer PII do not belong in Watchtower signals.

## Customer-alert projector

Only VERIFIED signals may become customer-alert intents.

R0 projection rules include:

- verified product price decrease -> PRICE_DROP;
- verified out/unknown -> in-stock -> BACK_IN_STOCK;
- verified brand activation -> BRAND_ADDED;
- verified Era activation -> ERA_OPENS;
- verified local availability -> LOCAL_SEASONAL;
- verified best-route change -> BETTER_ROUTE;
- verified request state change -> REQUEST_STATUS;
- verified qualification approval -> QUALIFICATION_COMPLETE;
- verified partner change -> PARTNER_CHANGE.

OBSERVED and CONFLICT signals remain useful internally but do not generate confident customer alerts.

The existing customer-alert layer performs watch matching, price-threshold filtering, payload filtering, and alert fingerprint deduplication.

Still no email/SMS/push is sent.

## Ingestion API

Authenticated admin/internal routes:

- `POST /api/admin/watchtower/signals` — append/idempotently replay a signal
- `GET /api/admin/watchtower/signals?limit=50` — recent evidence timeline for Watchtower/admin

Authority:

`OBSERVE_PROJECT_QUEUE_ONLY`

It may append evidence and queue eligible pending customer-alert events.

The read endpoint deliberately omits `privatePayload`; ordinary Watchtower inspection should use public-safe evidence metadata unless a future dedicated audit surface explicitly needs bounded internal payload.

It may not:

- send a notification;
- activate an Era;
- activate a supplier;
- publish a product;
- change a price;
- place an order;
- spend money.

## Why this matters

New data providers can feed one governed observation contract.

A future price collector, supplier stock adapter, recall monitor, Customer Voice aggregator, farm seasonality source, or authorization watcher should not each invent a new customer-alert pipeline.

They emit evidence-backed signals; bounded projectors decide what downstream system is allowed to learn from them.
