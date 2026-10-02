# Norvana Supplier Account Binding Checklist — 2026-10-02

This checklist is the operator bridge from code-scaffolded supplier connectors to least-privilege read-only account proof.

**Never paste provider credentials into GitHub issues, commits, PR comments, chat-visible logs, or source files.**

## Global sequence for every provider

1. Create or use the Norvana-owned merchant account on the provider's free/no-fixed-cost tier where that entitlement is still current.
2. Enable only the provider's documented API/developer access.
3. Create the least-privilege credential available.
4. Store the credential only in the approved deployment secret manager/environment.
5. Record the account tier and API entitlement without recording the secret.
6. Prove authentication with a non-consequential request.
7. Prove one catalog/product read.
8. Prove inventory/variant read when supported.
9. Prove one shipping/freight quote when supported.
10. Preserve rate-limit/quota evidence.
11. Create only a local simulated order object.
12. STOP. Do not submit an external order.

## General merchandise

### CJdropshipping — QUALIFY

Code state: existing Norvana Supplier Gateway / qualification lane.

Account proof required:
- merchant/developer account ownership;
- current free API entitlement;
- current API point/quota terms;
- read-only product/SKU/stock/freight request receipts;
- product-scoped webhook behavior if used.

Do not enable order creation or payment endpoints during authentication proving.

### Banggood Dropship — QUALIFY

Code state: read-only scaffold present.

Account proof required:
- active dropship-program account;
- custom API entitlement;
- product/stock request;
- shipping/destination request;
- current commercial-program restrictions.

Do not inherit supplier return rules directly into customer-facing Norvana policy.

### EPROLO — QUALIFY

Code state: read-only scaffold present.

Account proof required:
- account ownership;
- API documentation/access granted to the account;
- exact authentication method supplied by EPROLO;
- catalog/product and shipping read proof.

Because supplied research says API access may be provided through an account representative, do not invent endpoints or credential formats before that documentation is received.

### HyperSKU — HOLD

Do not bind credentials yet.

Required closure evidence:
- official support for an arbitrary custom Norvana/Next.js storefront or another supported interface that does not force a paid intermediary;
- exact merchant API entitlement and authentication documentation.

Until then the registry exposes zero read capabilities.

### Modalyst — HOLD

Do not bind credentials yet.

Required closure evidence:
- direct retailer API/custom-store entitlement on the intended account/tier;
- confirmation that the 25-product free-plan ceiling and transaction-fee economics are acceptable for the chosen lane.

Until then the registry exposes zero read capabilities.

## Print-on-demand

### Gelato — QUALIFY

Code state: read-only scaffold present.

Account proof required:
- free account with API selling entitlement;
- sandbox/API authentication;
- catalog/product/cost read;
- shipping and delivery estimate;
- webhook proof where available.

### Prodigi — QUALIFY

Code state: read-only scaffold present.

Account proof required:
- Core/free account;
- Print API credential entitlement;
- product/cost read;
- shipping/delivery read;
- branding/packing-slip evidence where used.

### Printful — QUALIFY

Code state: read-only scaffold present.

Account proof required:
- free account;
- API credential;
- catalog/product read;
- shipping read;
- branding/packing-slip option read.

Keep optional warehousing outside the zero-inventory lane.

### Merchize — QUALIFY

Code state: added to first-wave read-only adapters on 2026-10-02.

Account proof required:
- Fulfillment Lite/free account;
- API access entitlement;
- authentication proof;
- catalog/product/variant read;
- actual SKU shipping quote;
- production/delivery estimate;
- return/defect policy evidence;
- branding option evidence.

Do not opt into a paid hosted storefront merely to use fulfillment.

### Printify — HOLD

Do not build a production dependency or bind a credential until the actual Norvana account proves custom API entitlement.

The free POD plan and the custom API entitlement are tracked as separate facts.

## Explicit exclusions

Do not open paid plans merely to satisfy the “free supplier” lane for:

- Spocket;
- AppScenic;
- Syncee;
- Zendrop;
- Supliful.

They remain recorded as exclusions unless future evidence materially changes their usable free-fulfillment terms.

## Operator handoff data to preserve after each account setup

For each provider, return only:

- provider name;
- account/tier name;
- API/developer access: enabled/denied/pending;
- credential created: yes/no (never the value);
- credential secret-manager location/name;
- documentation URL/title;
- any quota/limit shown in the account;
- whether sandbox/test mode exists;
- timestamp.

That is enough for the next connector-proving agent to continue without exposing credentials.
