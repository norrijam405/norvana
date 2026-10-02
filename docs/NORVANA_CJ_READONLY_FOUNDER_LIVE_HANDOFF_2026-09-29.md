# Norvana CJ Read-Only Qualification — Founder Live Handoff

Date: 2026-09-29

## Already completed without Norris

- CJ public API V2 read endpoints identified.
- explicit read-only endpoint allowlist defined.
- order/payment/store-write endpoints excluded.
- CJ provider DTOs and normalization created.
- fake product/variant/stock/warehouse/freight responses created.
- auth/rate-limit failure fixtures created.
- offline CJ adapter created.
- no network code added.
- no CJ credential created or stored.
- no order/create/cancel/refund/fulfillment method added.

## The next unavoidable human step

Inside the CJdropshipping account:

1. Sign in to CJdropshipping.
2. Open **Apps**.
3. Confirm/install the **API** app.
4. Open the CJ **API** page.
5. Create an API Key entry for Norvana.
6. Keep the key private.

**Do not paste the API key into ChatGPT, GitHub, Slack, screenshots, or source code.**

After the approved secret-store destination is ready, enter the key directly there.

## First real proving sequence after secure binding

```
GET ACCESS TOKEN
CATALOG QUERY
PRODUCT DETAIL
VARIANT QUERY
STOCK READ
WAREHOUSE READ
FREIGHT QUOTE
NORMALIZE
LOCAL ORDER SIMULATION
STOP
```

No order submission.

## Stop boundary

No real login action, API-key creation, credential binding, authenticated CJ request, product publication, ordering, or spending is performed by this offline preparation.
