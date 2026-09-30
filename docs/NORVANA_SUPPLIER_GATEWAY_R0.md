# Norvana Supplier Gateway R0

**Status:** implementation candidate / non-deploying proving branch  
**Authority:** READ-ONLY / PROVING ONLY  
**Product truth owner:** Norvana  
**Federation:** IgniAqua may later provide bounded qualification/verification services; federation is not activated by this work.

## Purpose

Norvana should not wire the storefront directly to a collection of supplier-specific APIs.

Supplier-specific behavior belongs behind one provider-neutral boundary:

`Norvana storefront / Scout / Operations -> Supplier Gateway -> provider adapter`

This prevents supplier lock-in, keeps Norvana's customer experience independent from supplier platforms, and gives Watchtower one normalized evidence model for catalog, stock, freight, returns, branding, and delivery.

## R0 authority ceiling

Allowed capability family:

- catalog.search
- product.read
- variant.read
- inventory.read
- warehouse.read
- shipping.quote
- delivery.estimate
- returns.policy.read
- branding.options.read
- webhook.verify
- local/order-safe simulation

Explicitly locked:

- order.create
- order.cancel
- refund.request
- fulfillment.execute
- product.publish
- supplier.activate
- price.change

No supplier credential is created or stored by this mission.

No supplier account is connected.

No external supplier API call is made by the new adapter scaffolds.

## Qualification ladder

```
DISCOVERED
EVIDENCE_COLLECTED
TERMS_VERIFIED
API_ENTITLEMENT_VERIFIED
CATALOG_READ_PROVEN
STOCK_READ_PROVEN
FREIGHT_QUOTE_PROVEN
WEBHOOK_PROVEN
ORDER_SIMULATION_PROVEN
READ_ONLY_SHADOW_VERIFIED
AWAITING_FOUNDER_ACT_AUTHORITY
FULFILLMENT_APPROVED
```

The ladder is monotonic only with evidence. Discovery/research does not equal account-level API entitlement.

## Current source basis

The first registry is derived from the founder-supplied Norvana supplier-watch report dated through 2026-09-29.

That report is treated as received research evidence, not as this Builder independently verifying provider accounts or API entitlements.

Therefore the current candidate profiles remain at `EVIDENCE_COLLECTED` or lower.

## First-wave order

General merchandise:

1. CJdropshipping
2. Banggood
3. EPROLO

POD:

1. Gelato
2. Prodigi
3. Printful
4. Printify — HOLD until account-level custom API entitlement is verified

Excluded from the $0 fulfillment pool:

- Spocket
- AppScenic

Rejected/excluded candidates remain recorded so Watchtower does not repeatedly rediscover the same false-positive "free" supplier.

## Normalized evidence model

The Gateway should normalize:

- provider
- supplier product id / SKU
- Norvana product family
- item cost
- shipping cost
- known fees
- landed cost
- destination
- warehouse
- stock state / quantity
- production time
- delivery window
- return window
- buyer-remorse liability
- defect liability
- branding options
- tracking availability
- webhook availability
- API entitlement state
- supplier risk flags
- evidence timestamp

Unknown values remain unknown. Do not synthesize stock, freight, delivery, or costs.

## Persona split

Norvana Scout:
- discovery
- economics
- opportunity analysis
- supplier-change detection
- recommendation

Norvana Operations:
- stock reliability
- freight/delivery evidence
- return-policy normalization
- webhook health
- fulfillment exceptions

IgniAqua Institutional:
- authority verification
- provider qualification
- provenance
- cross-product boundaries
- kill switches
- independent assurance

Personality never creates authority.

## Legacy safety hardening

The legacy Norvana tree contained:
- a fulfillment route capable of calling supplier order APIs when enabled;
- supplier product import capable of creating an active catalog product;
- supplier creation/update fields capable of enabling auto fulfillment.

R0 hardens those paths to fail closed.

Existing connector code may remain for read-only catalog proving, but direct external action is not an R0 authority.

## Next founder-live gates

Stop before:
- credential creation or supplier account binding;
- new paid supplier features;
- external supplier API activation;
- real customer data;
- product publication;
- order submission;
- payment or money movement;
- supplier activation;
- refund/fulfillment execution.

Those require later explicit authority/proving.
