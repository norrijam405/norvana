# Norvana — CJdropshipping Read-Only Qualification R0

Date: 2026-09-29

## Purpose

Prepare Norvana's first real general-merchandise supplier integration without using a real CJ credential yet.

Current phase:

`PUBLIC CJ DOCS + LOCAL FIXTURES + NORMALIZATION TESTS`

No authenticated CJ request occurs in this phase.

## Public CJ API facts verified for this preparation

CJ API V2.0 is the current recommended API family.

Selected read/proving endpoints:

- product list V2: `/api2.0/v1/product/listV2`
- product detail: `/api2.0/v1/product/query`
- variant query: `/api2.0/v1/product/variant/query`
- stock by variant: `/api2.0/v1/product/stock/queryByVid`
- warehouse detail: `/api2.0/v1/warehouse/detail`
- freight calculation: `/api2.0/v1/logistic/freightCalculate`

The official API also exposes order, payment, store-write, and product-connection functions. Those are outside Norvana R0.

## Authentication custody

Current CJ documentation describes:

- an API Key created in the CJ account/API area;
- API Key exchanged for an access token;
- access token passed server-side as `CJ-Access-Token`;
- access token default lifetime of 180 days;
- refresh token default lifetime of 180 days;
- authentication rate limit documented as maximum 1 call/second;
- access tokens should be stored in the backend and not returned to the frontend.

Reserved backend-only secret names:

- `NORVANA_CJ_API_KEY`
- `NORVANA_CJ_ACCESS_TOKEN`
- `NORVANA_CJ_REFRESH_TOKEN`

No real values are created, stored, or requested by this mission.

## R0 boundary

Allowed:

```
catalog.search
product.read
variant.read
inventory.read
warehouse.read
shipping.quote
delivery.estimate
local order.simulate
```

Forbidden:

```
shopping/order/*
shopping/pay/*
store/product/saveProduct
product/conn/connection writes
supplier activation
Norvana publication
fulfillment
refund
repricing
money movement
```

## Local proving fixtures

Deterministic fake CJ-like responses cover:

- product;
- variants;
- stock;
- warehouse;
- freight quote;
- authentication error;
- rate-limit error.

All fixture IDs, URLs, prices, stock, and shipping values are test data only.

## Normalization behavior

Norvana:

- converts CJ USD values into integer cents;
- leaves missing price UNKNOWN/null;
- leaves missing stock UNKNOWN rather than assuming zero;
- treats explicit zero stock as OUT_OF_STOCK;
- parses logistics aging such as `5-9` into a bounded window;
- keeps warehouse unknown unless warehouse evidence exists;
- never fabricates a supplier SKU;
- refuses malformed product/freight data.

## Current truth state

`CJ_READONLY_OFFLINE_QUALIFICATION_PREP`

Not yet:

- account entitlement verified;
- API Key created;
- credential bound;
- authenticated CJ request proven;
- live catalog proven;
- live stock proven;
- live freight proven;
- READ_ONLY_SHADOW_VERIFIED.
