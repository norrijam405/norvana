# Norvana Closest-to-$0 Operating Doctrine R0

**Status:** founder-directed operating-cost doctrine  
**Scope:** supplier discovery, fulfillment, software, integrations and infrastructure  
**Relationship:** complements customer-facing Closest-to-$0 Finance; this document concerns Norvana's own operating cost.

## Objective

Norvana should minimize fixed operating cost while preserving reliability, security, customer experience and truthful fulfillment.

The default preference is:

**$0 fixed monthly cost → pay only when an order/revenue event occurs → upgrade only when the verified savings or added capability exceeds the recurring fee.**

"Free" never means "ignore total cost." A provider with $0/month but poor shipping, high product cost, high return loss, weak APIs or hidden per-order fees can be more expensive than a paid provider.

## Supplier / fulfillment target

Prefer services where:

1. account creation is free;
2. there is no required monthly subscription for usable selling/fulfillment;
3. Norvana does not have to pre-purchase inventory;
4. the supplier or production network fulfills after a customer order;
5. product + shipping + fees are knowable before Norvana publishes a price;
6. inventory/tracking can be synchronized safely;
7. API, webhook, data-feed or other connector access can be bounded;
8. no provider is allowed to become the single source of Norvana business truth.

## Total Operating Cost model

For each candidate, calculate at least:

- monthly/platform fee;
- setup fee;
- product/base cost;
- shipping;
- per-order fee;
- payment/transaction fee attributable to the provider;
- minimum order quantity;
- required prepaid inventory;
- storage/warehouse cost;
- returns/refunds exposure;
- branding/customization fee;
- API/integration cost;
- required ecommerce-platform cost;
- expected support/manual-labor cost;
- cash-flow lag between customer payment and supplier payment;
- expected cost of late/lost shipments;
- currency/FX/import cost where applicable.

A $0 subscription does not automatically win.

## Provider classes

### A — True zero-fixed-cost fulfillment candidate

Usable at $0/month for actual selling/fulfillment. Norvana pays product/shipping/transaction costs only when orders occur.

### B — Zero-fixed-cost with variable platform fee

No monthly fee, but transaction/commission or other variable fee applies.

### C — Free discovery only

Free plan allows browsing/research but paid tier is required to import, link products, automate or fulfill live orders.

### D — Trial only

Not a $0 operating option. Treat as paid after trial.

### E — Paid but potentially cheaper at scale

May be recommended only when evidence shows the paid fee reduces total cost or materially improves reliability enough to justify it.

## Initial verified candidate classes — 2026-09-26

These classifications are provisional evidence records and must be re-verified before connector activation.

- **CJdropshipping — Class A candidate.** Current official material lists a $0/month basic tier, free/unlimited listing and order monitoring, with product and shipping costs incurred on orders. Good candidate for general dropshipping.
- **DSers Basic — Class A/B candidate.** Current Basic plan is free with product/store/order limits and supports supplier workflows; confirm exact per-order and source-platform economics before activation.
- **Printful Free — Class A candidate.** $0/month, no setup fee or order minimum; product/printing/shipping charged when an order is placed. Strong print-on-demand candidate.
- **Printify Free — Class A candidate.** $0/month with no upfront inventory and a multi-provider print-on-demand network.
- **Gelato Free — Class A candidate.** Free account, no setup/minimum/monthly fee; pay product + shipping on order. Supports an API, making it especially relevant to Norvana's custom storefront.
- **Gooten — Class A candidate.** Free to use; charged when a customer purchases; global POD production network.
- **EPROLO — Class A candidate.** Advertises forever-free membership with product + delivery cost at order time and no stock purchase requirement.
- **Trendsi Free — Class A candidate for fashion.** $0/month, up to 500 listings, supplier fulfillment after sale; strongest native integrations currently emphasize Shopify/TikTok, so custom Norvana integration must be separately qualified.
- **Modalyst Hobby — Class B candidate.** $0/month with a 25-product limit; current help material describes a 5% transaction fee in its Hobby pricing. Supplier fulfills after Norvana pays item + shipping.
- **Syncee Free — Class C.** Current free tier is primarily product discovery; paid tier is required for live product import/automation.
- **Zendrop current new-user free tier — Class C.** $0 applies with zero linked products; live linked products move into paid usage tiers.
- **Spocket — Class D.** Current pricing centers on a short free trial followed by a paid Starter tier.

## Free Supplier Watch

A continuing Norvana watch should:

- search for new $0/month or pay-per-order supplier/fulfillment platforms;
- monitor existing candidates for pricing/terms changes;
- detect when a formerly free provider becomes browse-only or trial-only;
- detect new API/webhook/custom-store support;
- compare shipping geography and delivery time;
- compare total landed cost, not just signup price;
- flag platform lock-in;
- flag terms that allow unexpected automatic billing;
- flag minimum order or pre-purchase requirements;
- flag poor evidence, unclear returns or unverifiable fulfillment claims.

The watch should notify only on meaningful new candidates or material changes.

## IgniAqua role

IgniAqua Scout may research and normalize supplier evidence.

Connector Passport may qualify APIs/connectors.

Darwin may compare supplier economics and recommend changes.

None of those systems may autonomously:

- accept paid subscriptions;
- enter contracts;
- spend company funds;
- enable live fulfillment;
- provide supplier credentials;
- replace Norvana's canonical catalog/order truth.

Those actions require the applicable Norvana authority and approval path.

## Upgrade rule

Do not pay for a supplier platform merely because it has more features.

A paid upgrade should have an evidence case such as:

**expected monthly savings + avoided labor + avoided fulfillment loss + measurable revenue benefit > subscription cost + switching risk**

When this condition is not supported, remain on the lowest-cost qualified tier.

## Long-term target

Norvana should be able to route a product/order to the lowest-cost qualified fulfillment path that meets:

- product quality threshold;
- delivery SLA;
- margin floor;
- customer-location constraints;
- return/refund standard;
- evidence freshness;
- connector qualification;
- authority boundary.

The goal is not a single "best supplier." The goal is a provider-neutral fulfillment fabric that keeps Norvana's fixed costs as close to $0 as practical while preserving customer trust.
