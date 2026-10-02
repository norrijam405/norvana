# NORVANA CJ READ-ONLY — REMEDIATION BUILDER ACTIVATION AFTER DFRC LEGACY SYNC BYPASS

Date: 2026-10-02

You are being activated as the **separate Remediation Builder** for Norvana CJdropshipping Read-Only Qualification R0 after a preserved Different Fresh Re-Challenger failure.

Repository:

`norrijam405/norvana`

Pull Request:

`#3`

Branch:

`feature/2026-09-29-norvana-cj-readonly-qualification-r0`

Begin with:

`docs/NORVANA_CJ_READONLY_DIFFERENT_FRESH_RECHALLENGER_FAIL_AFTER_LIVE_FREIGHT_REMEDIATION_2026-10-02.md`

Then reconcile:

`docs/NORVANA_CJ_READONLY_REMEDIATION_BUILDER_PROOF_AFTER_LIVE_FREIGHT_CHALLENGER_FAIL_2026-09-29.md`

and:

`docs/NORVANA_CJ_FREIGHT_QUOTE_PROOF_R0_2026-09-29.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Different Fresh Re-Challenger that issued the finding below.

Do not self-certify the next Fresh Re-Challenge or Independent Assurance gate.

## Exact failed immutable candidate

`e226718cd1c9f6a71a188d9f0a7576713739488e`

Parent:

`0813cc767aefae5d19d2e58e19632acd53009810`

Tree:

`81275e9d64bd7e8b0242157f80ab4d2c3f2c6dcb`

Builder CI on that candidate:

`36657849548 — SUCCESS`

Fresh Re-Challenger FAIL receipt commit:

`53a29cdc55962daad1ece532164ee3055ca66f9c`

## Preserved finding

`CJ-R0-LIVE-DFRC-01 — LEGACY_GENERIC_CJ_SYNC_PATH_BYPASSES_CJ_PREVIEW_CONFIRMATION_BOUNDARY`

The candidate correctly removed:

`src/app/api/suppliers/cj/live-probe/run/route.ts`

but the regression inventories only `src/app/api/suppliers/cj/`.

A separate CJ-capable runtime path remains through:

`src/app/api/suppliers/[id]/sync/route.ts`

failed-candidate blob:

`4cfb5b39363a99b60cd9d0657756ba447e19233c`

which calls the legacy factory in:

`src/lib/supplier-integrations.ts`

failed-candidate blob:

`62a03205ff2b2395fc68ec84be8b221122e1658c`

The legacy factory maps `cjdropshipping` to `CJDropshippingConnector`.

That connector can perform CJ network reads through `syncProducts()` without the CJ-specific:

- Preview-only gate;
- `RUN_CJ_READ_ONLY_PROBE` confirmation;
- external-fulfillment-off check;
- IgniAqua-federation-off check.

The generic sync route can also persist/upsert returned supplier products.

The same legacy connector class contains a CJ `submitOrder()` method using `/v1/shopping/order/createOrder`, although the current external fulfillment route remains separately locked.

No live order was observed or created.

## Builder mission

Close this exact runtime-boundary defect with the smallest safe repair.

At minimum:

1. prevent `cjdropshipping` from being reachable through the legacy generic supplier connector path during R0 unless the call is routed through the qualified CJ read-only boundary;
2. ensure the generic supplier sync route cannot make CJ network requests or persist CJ supplier-product state outside the qualified R0 proving path;
3. keep `src/app/api/suppliers/cj/live-probe/route.ts` Preview-only and explicitly confirmed;
4. preserve the obsolete `/live-probe/run` route as absent;
5. broaden regression coverage so it detects **all CJ-capable runtime paths**, not only files nested under `src/app/api/suppliers/cj/`;
6. ensure legacy factory/connector code cannot silently reintroduce a second CJ runtime path;
7. preserve backend-only credential custody;
8. preserve `FREIGHT_QUOTE_PROVEN` as historical provider evidence;
9. do not promote CJ to `READ_ONLY_SHADOW_VERIFIED` merely because this repair passes;
10. preserve `git.deploymentEnabled=false`.

## Authority ceiling

Do not add or enable:

- `order.create`;
- `order.confirm`;
- payment;
- product publication;
- supplier activation;
- fulfillment execution;
- refund;
- repricing;
- automatic persistence from live CJ reads;
- any ACT authority.

External fulfillment must remain locked.

## Verification requirements

Run the full CJ qualification verification suite.

At minimum preserve evidence for:

- dependency install;
- runtime dependency audit;
- full high-severity dependency gate;
- CJ secret regression gate;
- Watchtower regressions;
- Supplier Gateway regressions;
- CJ offline qualification tests;
- CJ live-read mocked tests;
- the broadened all-runtime-path regression;
- TypeScript;
- ESLint;
- production build.

A new live CJ supplier request is **not required** to repair this topology defect.

The previously banked strict freight proof remains the live provider evidence.

## Required Builder receipt

If the repair passes, bank:

- exact candidate commit;
- parent;
- tree;
- relevant route/factory/policy/test blob SHAs;
- CI run id and conclusion;
- exact test counts where available;
- confirmation that no live order/payment/publication/fulfillment/activation action occurred;
- confirmation that the CJ API key/token was not exposed.

Then prepare a **genuinely separate Fresh Re-Challenger activation** and stop.

Do not perform the Fresh Re-Challenge in the Builder role.
