# NORVANA CJ READ-ONLY — REMEDIATION BUILDER PROOF AFTER LIVE FREIGHT CHALLENGER FAIL

Date: 2026-09-29

Role: Separate Remediation Builder

Repository: `norrijam405/norvana`
PR: `#3`
Branch: `feature/2026-09-29-norvana-cj-readonly-qualification-r0`

## Failed candidate preserved

Failed executable/UI candidate:
`228d17c2ebaa8b01361580a8a88b6c8e4fde7a0b`

Fresh Challenger finding:
`CJ-R0-LIVE-CHAL-01 — ALTERNATE_LIVE_PROBE_ROUTE_BYPASSES_EXPLICIT_CONFIRMATION_GUARD`

The failed lineage remains authoritative and is not rewritten.

## Remediation

Runtime route inventory at the failed head showed two CJ live-probe route surfaces:

- `src/app/api/suppliers/cj/live-probe/route.ts`
- `src/app/api/suppliers/cj/live-probe/run/route.ts`

The primary route already required all intended gates:

- `VERCEL_ENV === "preview"`
- external fulfillment disabled
- IgniAqua federation disabled
- explicit `confirm=RUN_CJ_READ_ONLY_PROBE`
- backend-only CJ API key binding

The obsolete alternate `/live-probe/run` route invoked `runCJLiveReadOnlyProbe` without the explicit confirmation guard.

Remediation performed:

1. Removed `src/app/api/suppliers/cj/live-probe/run/route.ts`.
2. Replaced the single-route regression with a route-tree regression that recursively inventories every `route.ts` under `src/app/api/suppliers/cj/`.
3. For every runtime route that references `runCJLiveReadOnlyProbe`, the regression requires:
   - Preview-only gating;
   - explicit `RUN_CJ_READ_ONLY_PROBE` confirmation;
   - external-fulfillment fail-closed guard;
   - federation fail-closed guard;
   - no order-create or product-publication surface.
4. The regression also requires the obsolete `/live-probe/run` route to remain absent.

No live CJ request was required or issued for this remediation.

## Exact remediation candidate

Executable remediation candidate:
`e226718cd1c9f6a71a188d9f0a7576713739488e`

Parent:
`0813cc767aefae5d19d2e58e19632acd53009810`

Candidate tree:
`81275e9d64bd7e8b0242157f80ab4d2c3f2c6dcb`

## Verification

Required full CJ qualification CI:
`36657849548 — SUCCESS`

Passed:

- dependency install
- runtime dependency audit
- full high-severity dependency gate
- CJ secret regression gate
- Watchtower regression tests
- Supplier Gateway regression tests
- CJ offline qualification tests
- CJ live-read mocked tests
- route-wide live-probe confirmation regression
- typecheck
- lint
- production build

An intermediate deletion-only commit also passed CI:
`0813cc767aefae5d19d2e58e19632acd53009810`
CI:
`36657785806 — SUCCESS`

## Preserved truth and authority

At the exact remediation candidate:

- CJ provider qualification remains `FREIGHT_QUOTE_PROVEN`.
- merchandising candidates remain `UNBOUND` / `NOT FOR SALE`.
- execution authority remains `LOCKED_R0`.
- no ACT authority is introduced.
- no order, payment, publication, fulfillment, refund, repricing, or supplier activation is introduced.
- no CJ API key or access token is exposed.
- previously banked branch deployment freeze `git.deploymentEnabled=false` is intentionally left untouched.

The earlier strict live freight proof remains valid provider-level evidence; this routing remediation neither repeats nor expands that live proof.

## Builder disposition

`REMEDIATION_BUILDER_PASS`

This Builder does not self-certify closure.

Next required role:
a **different Fresh Re-Challenger** using the separate activation prepared after this proof.
