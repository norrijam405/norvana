# Norvana Supplier Gateway R0 — Successor Handoff

Date: 2026-09-29

## Mission

Build a provider-neutral, read-only supplier qualification layer while Watchtower closure proceeds independently.

## Base

Branch:
`feature/2026-09-29-norvana-supplier-gateway-r0`

Base commit:
`e96b00a7e9a8cf35a235483a52cce27775b2c187`

The branch inherits `vercel.json` with Git auto-deployment disabled.

## Source basis

Founder-supplied Norvana supplier-watch research dated through 2026-09-29.

Do not treat inherited source research as account-level API entitlement proof.

## R0 invariant

`SUPPLIER_DISCOVERY/READ_PROVING != SUPPLIER_ACT_AUTHORITY`

Locked:
- ordering
- fulfillment
- supplier activation
- publication
- price change
- cancellation
- refund

## Implemented foundation

- provider-neutral supplier types;
- normalized product, variant, shipping and return-policy envelopes;
- explicit qualification ladder;
- source-preserving supplier registry;
- general-merchandise order: CJ -> Banggood -> EPROLO;
- POD order: Gelato -> Prodigi -> Printful -> Printify HOLD;
- Spocket/AppScenic rejection preservation;
- read-only unbound adapter scaffolds;
- landed-cost normalizer;
- R0 capability policy;
- deterministic Supplier Gateway tests;
- separate Supplier Gateway CI;
- legacy external fulfillment hard lock;
- legacy supplier product publication hard lock;
- supplier creation defaults inactive / no auto-fulfillment;
- supplier PATCH rejects activation / auto-fulfillment.

## Next work that does NOT need founder permission

After CI is green:
- Challenger-style static attack of Supplier Gateway R0;
- refine provider-neutral schemas;
- add synthetic CJ/Banggood/EPROLO fixtures;
- add local simulated quote/order objects;
- build read-only admin views against registry data without credentials;
- add persona-ready Scout/Operations result envelopes;
- preserve rejection/evidence lineage.

## Founder-live gates

Stop before:
- creating/binding supplier credentials;
- connecting a real supplier account;
- using real customer data;
- enabling supplier network calls;
- publishing products;
- submitting/canceling orders;
- fulfillment;
- refunds;
- supplier activation;
- money movement;
- paid supplier features.

## Truth state

Until CI and independent challenge:

`SUPPLIER_GATEWAY_R0_IMPLEMENTED_UNVERIFIED`

No deployment.
No credentials.
No supplier account connection.
No ACT authority.
