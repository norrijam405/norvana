# Acre Era Customer Intent + Route Engine R0

**Date:** 2026-10-03  
**Status:** backend-first implementation contract

## Purpose

Make Acre Era useful before a customer is ready to buy and make multi-source commerce transparent.

This lane provides the backend skeleton for:

- product/brand/Era/request watchlists;
- price, stock, Era, request, qualification, route, and partner-change alerts;
- public Bring It Here lifecycle;
- multiple legitimate purchase routes for the same product;
- customer-facing route comparison that does not secretly rank by Acre Era commission;
- private contribution economics for merchandising eligibility.

## Customer intent

R0 supports pseudonymous browser watchlists.

The browser receives an opaque random cookie. The database stores only an HMAC hash of that value.

No email, phone number, or push token is required by R0.

Supported watch targets:

- PRODUCT
- BRAND
- ERA
- REQUEST

Supported alert intentions:

- PRICE_DROP
- BACK_IN_STOCK
- BRAND_ADDED
- ERA_OPENS
- LOCAL_SEASONAL
- BETTER_ROUTE
- REQUEST_STATUS
- QUALIFICATION_COMPLETE
- PARTNER_CHANGE

Alert events are durable queue records only. This lane does not send email/SMS/push.

## Bring It Here lifecycle

Public request states:

`REQUESTED -> GAINING_SUPPORT -> RESEARCHING -> SOURCE_FOUND -> QUALIFYING -> APPROVED -> ENTERING_ERA`

Side states:

- ON_HOLD
- DECLINED
- RETIRED

Transitions are explicit and append an event.

Material transitions require an evidence reference.

Customer demand never publishes products or contacts suppliers by itself.

## Product routes

A product may have multiple routes:

- Acre Era direct
- authorized distribution
- brand direct
- affiliate/referral
- local partner
- authenticated resale
- other qualified future route

Public route fields may include:

- seller
- route type
- condition
- customer price
- shipping
- estimated tax where known
- delivery range
- warranty
- returns
- authorization/provenance state
- freshness

Private fields include:

- contribution dollars
- contribution margin
- internal source economics

## Fair route recommendation

Acre Era may decline to offer commercially unsustainable routes.

But once a route is customer-visible, the customer comparison/recommendation must not rank routes by private contribution or affiliate commission.

A route may be marked dominant only when it is no worse than alternatives on:

- total customer price;
- trust/provenance;
- maximum delivery time;

and better on at least one of those dimensions among comparable currency/condition routes.

If there is no dominant route, show the tradeoffs instead of inventing a winner.

## Authority

This lane may collect preferences, preserve observations, compare public-safe route facts, and queue future alerts.

It does not:

- place an order;
- change a price;
- activate a supplier;
- send marketing messages;
- enroll in affiliate programs;
- publish a qualifying route;
- spend money.
