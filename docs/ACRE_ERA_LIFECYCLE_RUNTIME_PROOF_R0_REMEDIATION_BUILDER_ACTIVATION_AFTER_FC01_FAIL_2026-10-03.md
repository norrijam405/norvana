# Acre Era Lifecycle Runtime Proof R0 — Remediation Builder Activation After FC01 Fresh Challenger FAIL

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** separate Remediation Builder

Begin with:

`docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_FRESH_CHALLENGER_FAIL_2026-10-03.md`

Then read:

- `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FC-01_REPRO.mjs`
- `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FC-01_RAW_EVIDENCE.json`
- `scripts/verify-acre-era-lifecycle-r0.mjs`
- `src/lib/era-engine/readiness.ts`
- `src/lib/era-engine/archive.ts`
- `src/lib/era-engine/resolver.ts`
- `src/app/api/admin/eras/[id]/activate/route.ts`
- `src/app/api/admin/eras/[id]/close/route.ts`
- `src/app/api/admin/eras/[id]/archive/route.ts`
- `src/lib/watchtower/signal-bus.ts`
- `src/lib/customer-intent/alert-evaluator.ts`

Do not ask Norris to reconstruct history already preserved in GitHub.

## Preserved finding

`AE-LRP-R0-FC-01 — FULL_LIFECYCLE_PROOF_BYPASSES_PRODUCTION_ERA_AND_SIGNAL_APPLICATION_PATHS`

## Exact failed candidate

- Commit: `4e3e411594c7b02b5918364abeeac91b6350f49c`
- Parent: `16f4554af38805b8d9481dd1f1f3d390e07d1bfb`
- Tree: `d4e69a2ba22611bb2c2c837c5a337b5479b63569`
- Base candidate: `f2b78b95b2e4cec7e4e18f97e5d8faa5118dad98`
- Builder/runtime run: `37148461532`
- Job: `111277139743`

## Remediation objective

Repair the proof harness so a PASS genuinely exercises the production application semantics, not weaker hand-built substitutes.

At minimum, the remediated proof must cover the actual semantics represented by:

1. `evaluateEraActivationReadiness`, including `ready`, blockers, and the exact readiness digest;
2. the activation path's evidence requirement, digest match, optimistic concurrency, transactional Era event, and action receipt;
3. `resolveCurrentPublicEra`, including schedule/public visibility and ambiguous-primary failure behavior;
4. `buildEraArchiveSnapshot` and the production close semantics, including immutable snapshot plus transactional closure event/receipt;
5. archive precondition requiring a persisted CLOSURE snapshot and transactional archive event/receipt;
6. `ingestWatchtowerSignal` including parser/canonical digest behavior, same-key/different-payload collision rejection, projection persistence, and idempotent replay;
7. `evaluateAndQueueCustomerAlerts` including payload sanitization, matching, queue-only authority, and fingerprint dedupe;
8. `resolvePublicEraBySlug` for CLOSED/ARCHIVED state after live product mutation and after current media revocation.

A service-layer extraction is acceptable if needed to make these semantics directly executable without HTTP/auth coupling, but do not weaken or duplicate the production rules in the proof script.

## Required negative/adversarial coverage

Include at least:

- future-start ACTIVE/PUBLIC/primary Era: raw-primary shape must **not** count as current-public before `startAt`;
- stale or mismatched readiness digest activation rejection;
- Era mutation between readiness and activation rejection;
- archive without a CLOSURE snapshot rejection;
- same Watchtower `signalKey` with a different payload digest rejection;
- disallowed/private alert payload keys not reaching queued public payload;
- duplicate/replay remains singular/idempotent;
- archived resolver returns historical product state after live product mutation;
- revoked current media disappears from archived public resolution while immutable historical snapshot bytes remain unchanged.

## Preserve valid prior evidence

Do not discard these already-valid results:

- exact frozen SHA checkout in run `37148461532`;
- PostgreSQL 17 migration chain `0001` through `0014` PASS;
- database-enforced archive UPDATE/DELETE rejection PASS;
- typecheck PASS;
- Era Engine regression 11/11 PASS;
- archive/alert/activation regression 14/14 PASS;
- Watchtower Signal Bus regression 12/12 PASS.

## Safety boundary

Do not merge PR #15, deploy Production, change Vercel Production routing, run Production migrations, touch customer data, activate a real Era, publish real products, send notifications, activate suppliers/fulfillment, place orders, or incur paid infrastructure.

After Builder PASS, freeze the exact remediation candidate and activate a **new separate Fresh Re-Challenger**. Do not self-challenge.
