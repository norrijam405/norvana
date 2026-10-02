# NORVANA CJ READ-ONLY — DIFFERENT FRESH RE-CHALLENGER FAIL AFTER LIVE FREIGHT REMEDIATION

Date: 2026-10-02

Role: Different Fresh Re-Challenger

Repository: `norrijam405/norvana`  
Pull Request: `#3`  
Branch: `feature/2026-09-29-norvana-cj-readonly-qualification-r0`

## Exact immutable candidate challenged

Candidate:

`e226718cd1c9f6a71a188d9f0a7576713739488e`

Parent:

`0813cc767aefae5d19d2e58e19632acd53009810`

Tree:

`81275e9d64bd7e8b0242157f80ab4d2c3f2c6dcb`

Builder CI:

`36657849548 — SUCCESS`

Prior finding under re-challenge:

`CJ-R0-LIVE-CHAL-01 — ALTERNATE_LIVE_PROBE_ROUTE_BYPASSES_EXPLICIT_CONFIRMATION_GUARD`

No live CJ request was issued during this re-challenge.

## Preserved finding

`CJ-R0-LIVE-DFRC-01 — LEGACY_GENERIC_CJ_SYNC_PATH_BYPASSES_CJ_PREVIEW_CONFIRMATION_BOUNDARY`

Disposition:

`DIFFERENT_FRESH_RECHALLENGER_FAIL`

Severity:

Material runtime authorization / supplier-boundary defect.

## Evidence

The remediation correctly removed the obsolete runtime route:

`src/app/api/suppliers/cj/live-probe/run/route.ts`

At the exact candidate, the CJ-specific route inventory under:

`src/app/api/suppliers/cj/`

contains only:

`src/app/api/suppliers/cj/live-probe/route.ts`

Route blob:

`e78c05a93bd319dc55b45cafd9465972e4015604`

That route correctly requires:

- `VERCEL_ENV === "preview"`;
- external fulfillment off;
- IgniAqua federation off;
- `confirm=RUN_CJ_READ_ONLY_PROBE`;
- backend-only `NORVANA_CJ_API_KEY`.

However, the route-tree regression only inventories runtime routes inside `src/app/api/suppliers/cj/`. It does not cover the older provider-generic supplier runtime surface.

The exact same candidate also contains:

`src/app/api/suppliers/[id]/sync/route.ts`

Blob:

`4cfb5b39363a99b60cd9d0657756ba447e19233c`

That route:

1. requires the current recovery-admin boundary;
2. requires `NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true"`;
3. loads a supplier record and persisted supplier credentials;
4. calls `createSupplierConnector(supplier.platform, ...)`;
5. invokes `connector.syncProducts()`;
6. persists/upserts returned supplier products.

It does **not** require:

- Preview environment;
- `RUN_CJ_READ_ONLY_PROBE` confirmation;
- `NORVANA_EXTERNAL_FULFILLMENT_ENABLED === false`;
- `IGNIAQUA_FEDERATION_ENABLED === false`.

The exact candidate also contains the legacy connector implementation:

`src/lib/supplier-integrations.ts`

Blob:

`62a03205ff2b2395fc68ec84be8b221122e1658c`

That file:

- includes `"cjdropshipping"` in `SupplierPlatform`;
- maps `"cjdropshipping"` to `new CJDropshippingConnector(credentials)`;
- allows the generic sync route to perform CJ network calls through `CJDropshippingConnector.syncProducts()`;
- directly calls CJ's product-list surface from that legacy connector;
- contains a `submitOrder()` implementation targeting `/v1/shopping/order/createOrder`.

The current `/api/orders/[id]/fulfill` route remains separately fail-closed, so this finding does **not** claim that a live CJ order was submitted or that a public order-submit route is currently open.

The defect is that the candidate's claimed CJ confirmation topology is incomplete: a second CJ runtime integration path exists outside the directory scanned by the new route-tree regression, and that path can make supplier-network reads and persist supplier product state without the CJ-specific Preview + explicit-confirmation gates.

## Why this is material

The preserved remediation claims the explicit CJ live-read confirmation boundary is closed route-wide, but the regression's search scope is narrower than the actual CJ-capable runtime surface.

This leaves a provider-specific shadow path where:

- CJ requests can occur outside the controlled live-probe route;
- the CJ-specific explicit confirmation token is not required;
- the Preview-only rule is not enforced;
- supplier-product persistence can occur;
- the legacy connector still bundles ACT-capable methods in the same runtime object.

The generic route is protected by admin authentication and a supplier-connectors feature flag. Those controls reduce immediate exposure, but they are not equivalent to the CJ-specific proving boundary and they do not remove the regression blind spot.

Existing raw credential POST is disabled during recovery, but persisted supplier credentials can still be read by the generic sync route if present. Therefore the path is not structurally unreachable.

## Preserved truths

This finding does not invalidate the already banked provider-level live proof:

`FREIGHT_QUOTE_PROVEN`

The prior live freight proof remains evidence that the controlled CJ probe successfully completed catalog/product/variant/stock/origin/freight reads.

Also preserved:

- no live CJ request was made by this re-challenge;
- no order was created;
- no payment occurred;
- no product was published;
- no supplier was activated;
- no fulfillment was executed;
- no refund or repricing occurred;
- `git.deploymentEnabled=false` remains the banked freeze;
- current merchandising candidates remain not established as live sale inventory by this re-challenge.

## Required remediation direction

A separate Remediation Builder must close the legacy runtime path without broadening authority.

At minimum, remediation must ensure that CJ cannot be reached through the generic legacy connector path during R0 unless it is routed through the qualified CJ read-only boundary.

Acceptable closure may include removing CJ from the legacy generic connector factory, hard-blocking CJ in the generic sync route, or replacing the path with a provider-neutral read-only adapter that enforces the same qualification gates.

The repair must also add a regression that inventories **all CJ-capable runtime paths**, not only routes physically nested under `src/app/api/suppliers/cj/`.

The Builder must not enable CJ order creation, fulfillment, payment, publication, supplier activation, refund, repricing, or other ACT authority.

## Stop condition

Fresh Re-Challenger stops here after the first material finding.

No remediation is performed in this role.
