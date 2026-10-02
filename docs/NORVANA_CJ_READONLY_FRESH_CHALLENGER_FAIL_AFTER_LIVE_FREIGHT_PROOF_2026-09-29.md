# NORVANA CJ READ-ONLY — FRESH CHALLENGER FAIL AFTER LIVE FREIGHT PROOF

Date: 2026-09-29

Role: **Fresh Challenger**

Repository: `norrijam405/norvana`  
PR: `#3`  
Branch: `feature/2026-09-29-norvana-cj-readonly-qualification-r0`

Exact executable/UI candidate challenged:

`228d17c2ebaa8b01361580a8a88b6c8e4fde7a0b`

Exact-candidate CI:

`36646187640 — SUCCESS`

Strict freight deployment challenged:

`dpl_BdZCC3njGHn2V7orZfonRDdDiu5A — READY`

Strict deployment source:

`4464d9c41e90ca41357137a6ceacc0a842f4533f`

## Disposition

`FRESH_CHALLENGER_FAIL`

Material finding:

`CJ-R0-LIVE-CHAL-01 — ALTERNATE_LIVE_PROBE_ROUTE_BYPASSES_EXPLICIT_CONFIRMATION_GUARD`

No remediation was performed in this role.

## Finding

The candidate contains two server routes capable of invoking the authenticated CJ live read probe.

The primary route:

`src/app/api/suppliers/cj/live-probe/route.ts`

requires:

`confirm=RUN_CJ_READ_ONLY_PROBE`

before calling `runCJLiveReadOnlyProbe(apiKey)`.

However, the alternate route:

`src/app/api/suppliers/cj/live-probe/run/route.ts`

calls `runCJLiveReadOnlyProbe(apiKey)` directly after only:
- Preview-environment check;
- external-fulfillment-off check;
- IgniAqua-federation-off check;
- CJ API-key-presence check.

It does **not** require the deliberate confirmation value used by the primary route.

Therefore a GET to the alternate route from a caller already able to reach the protected Preview can trigger live authenticated CJ reads without satisfying the application's explicit live-probe confirmation gate.

This does not establish order/payment/publication/fulfillment authority. It is nevertheless material to the controlled read-only proving boundary because:
- it provides an alternate execution path around the deliberate-confirmation invariant;
- it can repeat external provider calls and consume provider API budget/rate capacity;
- the existing test asserting that the live route requires deliberate confirmation inspects only the primary route and does not cover the alternate route;
- the strict one-shot build proof does not require this alternate runtime route.

No live call was issued by this Challenger to demonstrate the bypass; source evidence is sufficient and avoids consuming CJ API capacity.

## Required attack matrix

1. **Authentication cannot be skipped by the strict one-shot build — PASS.**  
   At the strict gate, `package.json` contains `prebuild = node --experimental-strip-types scripts/cj-live-probe-build-once.mjs`; the one-shot marker exists; `runCJLiveReadOnlyProbe` begins with API-key validation and access-token acquisition before catalog work. The Vercel deployment is bound to exact gate `4464d9c...` and reached READY.

2. **Empty catalog cannot PASS — PASS.**  
   Absence of a live product id throws `CJ_CATALOG_EMPTY`.

3. **Missing product/variant evidence cannot PASS — PASS.**  
   Product detail requires `pid`; product variants require a `vid`; variant detail requires a returned `vid`.

4. **Missing stock evidence cannot PASS — PASS.**  
   Empty stock data throws `CJ_STOCK_EVIDENCE_MISSING`.

5. **Missing origin country cannot PASS — PASS.**  
   The stock-derived origin must be present or `CJ_STOCK_ORIGIN_COUNTRY_MISSING` is thrown.

6. **Zero freight quotes cannot PASS — PASS.**  
   Empty normalized freight array throws `CJ_FREIGHT_QUOTES_EMPTY`.

7. **Malformed freight method/price fails closed — PASS.**  
   `normalizeCJFreightQuote` throws `CJ_FREIGHT_METHOD_MISSING` for missing method and `CJ_FREIGHT_PRICE_MISSING` for absent/invalid/negative price.

8. **Freight path is quote-only — PASS.**  
   Live client calls exact allowlisted freight endpoint `/api2.0/v1/logistic/freightCalculate` with quantity 1 and VID. Endpoint policy rejects non-allowlisted paths and explicitly blocks shopping/order/payment/store-write fragments.

9. **API key/access token not emitted in normal result — PASS.**  
   API key is sourced server-side. Access token remains local to the live client. Returned authentication state contains booleans and expiry only. Build output logs only summarized non-secret proof fields. CI secret-regression gate passed.

10. **No CJ consequential authority introduced — PASS for reviewed candidate.**  
    Registry remains `LOCKED_R0`; CJ adapter exposes read/simulation only; existing supplier order/publication/activation hard locks remain covered by Supplier Gateway tests.

11. **Provider proof is not represented as candidate SKU proof — PASS.**  
    Supplier Lab explicitly states provider-level CJ read/freight proof while merchandising cards remain synthetic/unbound.

12. **Every merchandising candidate remains NOT FOR SALE / UNBOUND — PASS.**  
    `SUPPLIER_LAB_CANDIDATES` fixes `availability: NOT_FOR_SALE`, `supplierBinding: UNBOUND`, and `truthState: SIMULATED_CANDIDATE`; exact-candidate CI exercises this invariant.

13. **Failed-authentication lineage preserved — PASS.**  
    The prior `SUPPLIER_AUTH_INVALID` Preview and subsequent relink/proving lineage remain documented; the successful freight proof does not erase the failure.

14. **Deployment refreeze reconciled — PASS.**  
    Strict gate `4464d9c...` changed only `vercel.json` from deployment disabled to enabled. Immediate refreeze `cadafba...` changed it back to disabled. Current PR head still has `git.deploymentEnabled=false`. Vercel metadata binds `dpl_BdZ...` to exact source `4464d9c...`, region `iad1`, READY.

## Additional deployment binding

The strict gate commit changes only `vercel.json` deployment enablement.

At that exact gate:
- one-shot marker `CJ_LIVE_PROBE_BUILD_ONCE` exists;
- `package.json` includes the `prebuild` live-probe hook;
- Vercel metadata reports exact Git source `4464d9c...`;
- deployment state is READY.

NPM lifecycle semantics run `prebuild` before `build` when `npm run build` is invoked. The repository's Vercel/Next.js build path uses the package build command; a nonzero one-shot probe exit therefore aborts the build.

## CI reconciliation

Exact candidate CI `36646187640` completed SUCCESS for:
- install;
- runtime dependency audit;
- high-severity dependency gate;
- CJ secret regression check;
- Watchtower regression tests;
- Supplier Gateway regression tests;
- CJ read-only qualification tests;
- CJ live-read mocked tests;
- TypeScript;
- ESLint;
- production build.

The CI suite does **not** negate `CJ-R0-LIVE-CHAL-01`: its deliberate-confirmation source test targets the primary route and does not inspect the alternate `/run` route.

## Scope boundary

No order was created.
No payment was made.
No product was published.
No supplier was activated.
No fulfillment was executed.
No refund or repricing occurred.
No live CJ request was executed by this Challenger.
No remediation was performed.

## Required next role

A **separate Remediation Builder** must remove or equivalently harden the alternate live-probe execution path and add regression coverage proving that every runtime path capable of invoking `runCJLiveReadOnlyProbe` is subject to the intended explicit execution gate.

After remediation:
1. run full CJ CI;
2. preserve this FAIL lineage;
3. activate a different Fresh Re-Challenger;
4. do not self-certify `READ_ONLY_SHADOW_VERIFIED`.
