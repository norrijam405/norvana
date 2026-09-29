# NORVANA CJ READ-ONLY LIVE PROVING R0 — BUILDER PROOF

Date: 2026-09-29

Repository:
`norrijam405/norvana`

Branch:
`feature/2026-09-29-norvana-cj-readonly-qualification-r0`

## Final live read result

`PASS`

Final controlled Preview deployment:

`dpl_EfUjDwjvi2aWchTorjetSvUndjXA`

Exact deployment gate commit:

`e50a68ca6d2479f1262cb4b9c04b1273e9d9cf7a`

Deployment state:

`READY`

Region:

`iad1`

The strict one-shot probe is fail-closed: the Preview build exits non-zero if authentication, catalog, product detail, variant, stock, stock-origin warehouse evidence, a required non-empty freight quote, or final normalization fails.

Because this exact deployment reached `READY`, the one-shot live sequence completed:

```
CJ AUTHENTICATION
-> PRODUCT LIST V2
-> PRODUCT DETAIL
-> VARIANT DETAIL
-> STOCK BY VARIANT
-> WAREHOUSE EVIDENCE FROM STOCK RESPONSE
-> FREIGHT QUOTE TO US
-> NORMALIZATION
-> STOP
```

No order creation.
No order confirmation.
No payment.
No product publication.
No supplier activation.
No fulfillment.
No refund.
No repricing.

## Credential handling

The CJ API key remained in Vercel Preview environment storage.

The probe:
- did not print the API key;
- did not return the API key to a client;
- did not print the access token;
- did not persist the access token;
- did not return the access token to a client.

## Important lineage

### Initial live authentication failure

Deployment:
`dpl_8xpRrtPVxURpKmo96Yy93Y7skvri`

Gate:
`4c7f218eb503c6e78efa47c914cfb5a37b6434e7`

Result:
`SUPPLIER_AUTH_INVALID`

Truth:
The then-bound CJ credential was rejected before catalog work.

### Account relink / authentication-only proof

Deployment:
`dpl_5uTQRovfroixeKkcZLmhqbhj288h`

Gate:
`9299f85db33602d65638a0faee8a116d5c861969`

State:
`READY`

Truth:
The relinked Norvana CJ credential successfully obtained a backend access token.

### Product List V2 parser correction

CJ's current Product List V2 shape was corrected from the older local assumption of:

`data.list[].pid/productSku`

to the current V2 shape:

`data.content[].productList[].id/sku`

Parser fix:
`5b3fbed46261aadf4b4aa7b547dcdf0ec40bd8c6`

Current-shape test:
`bc5189dd8a38849ed3d34ed63bc36b11676549fb`

CI:
`36640538710 — SUCCESS`

### Global warehouse list failure isolated

Diagnostic Preview:

`dpl_A8AkwdGJJkT88Gbx68FHqTwjyhw3`

Gate:

`e44c9a4c1ec082ee6c34e6cac04c50d36f1e3059`

Result:

`BUILD_UTILS_SPAWN_65`

The diagnostic exit map binds code 65 specifically to:
`/api2.0/v1/product/globalWarehouseList`

Authentication, catalog, product detail, variant detail, and stock had already passed before that step.

### Warehouse evidence simplification

CJ stock-by-variant returns warehouse area ID, warehouse name, and country code.

Norvana therefore removed the redundant global-warehouse dependency from the proving path and derives the warehouse evidence from the successful stock response.

Code:
`fc5ee5fd0577ddff1bfe6ba61ca950e363b4308d`

Test:
`423a39cb1a77761352b2d4bc9e4196ea1760c9a6`

CI:
`36641161242 — SUCCESS`

## Post-probe freeze

Refreeze:
`90ac1d50874cab235545f9fd6046f36c4b1ac4f3`

Probe hook disarmed:
`ac2549f768296b2417f3b2776dc58700845770f8`

One-shot marker removed:
`01a87ab38127b02acb056e4437c33a962dd7390e`

The branch returned to `git.deploymentEnabled=false`.

## Qualification truth

CJ has live evidence for:

- authentication / API entitlement;
- catalog read;
- product detail read;
- variant read;
- stock read;
- warehouse evidence through stock;
- freight quote.

Registry state:

`FREIGHT_QUOTE_PROVEN`

Not yet:

- WEBHOOK_PROVEN;
- READ_ONLY_SHADOW_VERIFIED;
- AWAITING_FOUNDER_ACT_AUTHORITY;
- FULFILLMENT_APPROVED.

Strict freight-proof hardening lineage:

- strict source gate requires stock evidence;
- strict source gate requires an origin country;
- strict source gate requires at least one normalized freight quote;
- strict Preview: `dpl_EfUjDwjvi2aWchTorjetSvUndjXA`;
- strict gate: `e50a68ca6d2479f1262cb4b9c04b1273e9d9cf7a`;
- state: `READY`.

No ACT authority is granted by this proof.
