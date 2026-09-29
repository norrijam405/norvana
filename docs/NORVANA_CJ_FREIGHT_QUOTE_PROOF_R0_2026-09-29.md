# NORVANA CJ FREIGHT QUOTE PROOF R0

Date: 2026-09-29

Repository:
`norrijam405/norvana`

Branch:
`feature/2026-09-29-norvana-cj-readonly-qualification-r0`

## Proven outcome

CJdropshipping has crossed the provider-level milestone:

`FREIGHT_QUOTE_PROVEN`

This proof is read-only and grants no execution authority.

## Strict live proof semantics

The live probe is fail-closed.

It cannot PASS unless all of the following occur in one run:

1. CJ API key is present only in Vercel Preview.
2. CJ authentication returns an access token.
3. Product List V2 returns a live product.
4. Product Detail returns that product.
5. Variant Detail returns a variant.
6. Stock endpoint returns stock evidence.
7. Stock evidence includes an origin country.
8. CJ Freight Calculation is called with:
   - the live variant VID;
   - quantity 1;
   - the proven origin country;
   - destination country US.
9. CJ returns at least one freight quote.
10. The quote contains a normalizable shipping method and shipping price.
11. Norvana normalizes the quote.
12. The probe stops before order, publication, fulfillment, refund, repricing, activation, or payment.

The build exits nonzero for missing stock evidence, missing origin country, empty freight quotes, invalid freight price/method, provider failures, malformed responses, and auth failures.

## Controlled live deployment

Deployment gate commit:

`4464d9c41e90ca41357137a6ceacc0a842f4533f`

Vercel deployment:

`dpl_BdZCC3njGHn2V7orZfonRDdDiu5A`

Deployment result:

`READY`

Region:

`iad1`

Because the one-shot prebuild probe exits nonzero on any of the required freight-proof failures above, this READY result establishes that the strict live freight proof completed successfully.

## Immediate refreeze

Refreeze commit:

`cadafba447e4827d52c6b031f7b942602f2447ff`

Probe-hook removal:

`45a1c09052120545b1f4dc74e09baca6e2b67774`

One-shot marker removal:

`06b763dd5f2652c22aaeb06e154202bddf620699`

The branch returned to:

`git.deploymentEnabled = false`

## Supplier Lab truth update

Supplier Lab now distinguishes:

- provider-level CJ capability truth: authenticated catalog/product/variant/stock/origin/freight read proof;
- candidate-level truth: every merchandising candidate remains synthetic, UNBOUND and NOT FOR SALE.

Executable/UI verification candidate:

`228d17c2ebaa8b01361580a8a88b6c8e4fde7a0b`

CI:

`36646187640 — SUCCESS`

This CI passed:
- dependency gates;
- Watchtower regressions;
- Supplier Gateway tests;
- CJ offline qualification tests;
- CJ live-read mocked tests;
- TypeScript;
- ESLint;
- production build.

## Authority ceiling

Still forbidden:

- order.create;
- order.confirm;
- payment;
- product.publish;
- supplier.activate;
- fulfillment.execute;
- refund;
- price.change.

No API key or access token is committed to GitHub, returned to the browser, or persisted by the one-shot probe.

## Truth state

`CJ_FREIGHT_QUOTE_PROVEN`

Not:
- `READ_ONLY_SHADOW_VERIFIED`;
- `AWAITING_FOUNDER_ACT_AUTHORITY`;
- `FULFILLMENT_APPROVED`;
- any ACT authority.
