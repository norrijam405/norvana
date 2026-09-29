# NORVANA CJ LIVE READ PROBE — CONNECTION PASS

Date: 2026-09-29

Repository:
`norrijam405/norvana`

Branch:
`feature/2026-09-29-norvana-cj-readonly-qualification-r0`

## Context

An earlier real CJ probe failed closed at authentication with:

`SUPPLIER_AUTH_INVALID`

Norris then relinked the CJ API store / renamed the original store relationship and requested a retry.

## Authentication-only proof

A one-shot Vercel Preview build was configured to:

1. read `NORVANA_CJ_API_KEY` from Vercel Preview only;
2. call only CJ's access-token endpoint;
3. require an access token;
4. print no token and persist no token;
5. fail the build on any authentication failure.

Deployment:

`dpl_5uTQRovfroixeKkcZLmhqbhj288h`

Gate commit:

`9299f85db33602d65638a0faee8a116d5c861969`

Result:

`READY`

Therefore the current Vercel Preview CJ credential was accepted by CJ and an access token was obtained.

## Current Product List V2 parser correction

CJ's current Product List V2 response uses:

`data.content[].productList[]`

with product identifiers such as:

- `id`
- `nameEn`
- `sku`

The live client was corrected from the older `data.list[] / pid / productSku` assumption.

Corrected parser commits:

- `5b3fbed46261aadf4b4aa7b547dcdf0ec40bd8c6`
- `bc5189dd8a38849ed3d34ed63bc36b11676549fb`

CI after correction:

`36640538710 — SUCCESS`

## Diagnostic full live-read proof

A subsequent one-shot build probe was configured so any live-read failure would exit nonzero.

The probe sequence was:

```
CJ AUTH
-> PRODUCT LIST V2
-> PRODUCT DETAIL
-> VARIANT DETAIL
-> STOCK READ
-> GLOBAL WAREHOUSE READ
-> FREIGHT QUOTE WHEN A STOCK ORIGIN COUNTRY IS AVAILABLE
-> NORMALIZE
-> STOP
```

Diagnostic gate commit:

`0ebb57d1195bbdf5d6e3cee862ce69b5f4ed79c9`

Vercel deployment:

`dpl_7KcipTKfPJnyULANkLmFpqpF8evw`

Result:

`READY`

The build could only reach READY if the live probe returned PASS.

This proves:
- current CJ credential authentication succeeds;
- a live Product List V2 response was accepted;
- one live product detail was accepted;
- one live variant detail was accepted;
- the stock endpoint completed;
- the global warehouse endpoint completed;
- normalization completed;
- no exception/fail-closed guard fired.

Freight nuance:
- the probe executes the freight calculator only when a stock-origin country is available;
- Vercel's connector did not expose the one-shot build log containing the redacted `freightQuoteCount`;
- therefore this proof does **not** independently assert that a nonzero live freight quote was returned.

## Safety

The live probe contains no:
- order create;
- order confirm;
- payment;
- product publish;
- supplier activation;
- fulfillment execute;
- refund;
- price change.

No API key or access token was returned to the browser.
No token was persisted by the probe.

The branch was refrozen after each deliberate Preview gate.

Final diagnostic refreeze lineage:
- `dfceeccfffdaf0e8e4e393c56118c163acbdf404`
- `e0a2a9c3467c315aea8a5a8a78c9c67853394901`
- `ce314e071f4a8112c85022b647b19f94f4c0bf0e`

## Truth state

`CJ_LIVE_READ_CONNECTION_PASS`

Also established:
- `CJ_AUTHENTICATED`
- `CJ_LIVE_CATALOG_READ_PROVEN`
- `CJ_LIVE_PRODUCT_DETAIL_READ_PROVEN`
- `CJ_LIVE_VARIANT_READ_PROVEN`
- `CJ_LIVE_STOCK_ENDPOINT_PROVEN`
- `CJ_LIVE_WAREHOUSE_ENDPOINT_PROVEN`

Not yet independently asserted:
- `CJ_NONZERO_FREIGHT_QUOTE_PROVEN`
- `READ_ONLY_SHADOW_VERIFIED`
- any ACT authority.
