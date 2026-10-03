# Acre Era Lifecycle Runtime Proof R0 — Fresh Challenger FAIL

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** new separate Fresh Challenger  
**Result:** FAIL

## Exact challenged candidate

- Commit: `4e3e411594c7b02b5918364abeeac91b6350f49c`
- Parent: `16f4554af38805b8d9481dd1f1f3d390e07d1bfb`
- Tree: `d4e69a2ba22611bb2c2c837c5a337b5479b63569`
- Base candidate: `f2b78b95b2e4cec7e4e18f97e5d8faa5118dad98`
- Builder/runtime run: `37148461532`
- Builder/runtime job: `111277139743`

No remediation was performed in this Challenger role.

## Finding

**ID:** `AE-LRP-R0-FC-01`  
**Title:** `FULL_LIFECYCLE_PROOF_BYPASSES_PRODUCTION_ERA_AND_SIGNAL_APPLICATION_PATHS`

The frozen executable does not genuinely exercise the production full-lifecycle application semantics it claims to prove. It performs the decisive lifecycle and Signal Bus operations with hand-built SQL/object logic while bypassing the production readiness, activation, current resolver, archive builder/close/archive, signal-ingestion, alert-evaluator, and archived resolver paths.

This creates material false-positive PASS paths: the harness can pass even when production application behavior would reject or behave differently.

## Concrete falsification

The frozen executable blob `746a5320e266cd08095678d0dbd2b44b89fe9464`:

- hand-builds the readiness digest rather than calling `evaluateEraActivationReadiness`;
- activates by raw `UPDATE eras ... lifecycle_state='ACTIVE'` rather than the production activation path;
- labels `currentEraResolved: PASS` after a raw SQL predicate rather than calling `resolveCurrentPublicEra`;
- hand-builds the archive snapshot instead of calling `buildEraArchiveSnapshot`;
- closes and archives with raw SQL rather than the transactional production close/archive paths;
- inserts Watchtower signals and alert rows directly rather than calling `ingestWatchtowerSignal` / `evaluateAndQueueCustomerAlerts`;
- checks archived history by reading the snapshot JSON directly rather than exercising `resolvePublicEraBySlug` for CLOSED/ARCHIVED behavior.

The production source at the same frozen candidate requires materially stronger semantics:

- `src/app/api/admin/eras/[id]/activate/route.ts` blob `36ba474696faefc610adff4e0dee4c605dc04294` requires activation evidence, a matching current readiness digest, readiness `ready === true`, optimistic `updatedAt` concurrency, a transaction, `ERA_ACTIVATED` event, and `ERA_ACTIVATE` receipt.
- `src/lib/era-engine/resolver.ts` blob `b2e567d5a71cceb7b47f3bb165be321b1f257289` resolves the unique primary candidate through `resolvePublicEraBySlug` and `isPublicEra`, including schedule and section validation.
- `src/app/api/admin/eras/[id]/close/route.ts` blob `d74a1e45f738b27daccf35b894324c79c8c3e9b2` uses `buildEraArchiveSnapshot`, optimistic concurrency, one transaction, an `ERA_CLOSED` event, and `ERA_CLOSE` receipt.
- `src/app/api/admin/eras/[id]/archive/route.ts` blob `483e70cdbea8b201c3e011bfbfbc50c4cb3d4f35` requires a previously persisted CLOSURE snapshot and records `ERA_ARCHIVED` plus `ERA_ARCHIVE` receipt transactionally.
- `src/lib/watchtower/signal-bus.ts` blob `c7a6560fc381248a4bb51573461657fd7e9dd655` parses/canonicalizes the signal, detects same-key/different-payload collisions, projects, invokes the queue-only alert evaluator, and preserves projection idempotence.
- `src/lib/customer-intent/alert-evaluator.ts` blob `2088dd6b828d2d91a7df4fffec8ff5064c3713f8` sanitizes public alert payloads and matches all active watches before idempotent queue insertion.

## Minimal reproducer

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FC-01_REPRO.mjs`

The reproducer constructs an ACTIVE/PUBLIC/primary Era whose `startAt` remains in the future. The frozen proof's raw SQL current-primary predicate accepts it, while production `isPublicEra` / `resolveCurrentPublicEra` semantics reject it.

Observed output:

```json
{
  "findingId": "AE-LRP-R0-FC-01",
  "status": "REPRODUCED",
  "scenario": "ACTIVE/PUBLIC/primary Era whose startAt is still in the future",
  "frozenProofRawSqlPredicate": true,
  "productionResolverWouldAccept": false,
  "consequence": "The proof harness can report currentEraResolved PASS without exercising production resolver semantics."
}
```

That is sufficient to falsify the claimed current-primary application-runtime proof and establishes the broader substitution defect in the full-lifecycle harness.

## Builder run evidence reviewed

GitHub Actions run `37148461532`, job `111277139743`, did execute the exact frozen SHA and succeeded on PostgreSQL 17.

Preserved successful facts that remain valid:

- checkout fetched exact SHA `4e3e411594c7b02b5918364abeeac91b6350f49c`;
- PostgreSQL 17 disposable service started;
- migrations `0001` through `0014` applied successfully in lexical order;
- the frozen executable emitted PASS with:
  - readiness digest `366f2ce64e96e1418a8f4f8a10398aa44ba8cc2a58aa131b1f14d7692ec411e0`;
  - snapshot digest `a421986a3d559c521877d6a44c1eaebb914ce9d9edd2cb4bdbfb6c6cba5f9a74`;
  - alert fingerprint `df9d03a185ac8afcc1c7b8eaecf775e2479e47a88b7222bd5353144abc74e3c0`;
  - alert count `1`;
- PostgreSQL rejected UPDATE and DELETE of `era_archive_snapshots` with `era_archive_snapshots are immutable`;
- typecheck passed;
- `test:era-engine` passed 11/11;
- `test:archive-alert-activation` passed 14/14;
- `test:watchtower-signals` passed 12/12.

Those results demonstrate useful lower-level regressions and PostgreSQL enforcement. They do **not** repair the missing end-to-end exercise of production application paths.

## Additional adversarial review

The Challenger also checked:

- readiness digest shape against `src/lib/era-engine/readiness.ts`;
- archive snapshot shape against `src/lib/era-engine/archive.ts`;
- canonical digest implementation against `src/lib/evidence/canonical-json.ts`;
- VERIFIED price projection against `src/lib/watchtower/signal-projector.ts`;
- alert matching/fingerprint policy;
- duplicate insert behavior versus collision-sensitive Signal Bus behavior;
- archived resolver behavior after live product mutation;
- revoked-media policy;
- database snapshot immutability;
- migration ordering in the passing PostgreSQL 17 run;
- workflow authority boundary and absence of Production/Vercel/customer/supplier/fulfillment actions.

The hand-built readiness/archive object shapes presently appear aligned with the corresponding source shapes, and canonical digest logic matches. The FAIL is therefore not claiming a digest-algorithm mismatch. It is specifically the stronger and material fact that the lifecycle proof substitutes weaker hand-built execution for production application semantics.

## Safety result

No Production database, Vercel Production routing, real Era, real product publication, customer notification, supplier/fulfillment action, order, or paid service was used by this Challenger.

## Disposition

Candidate `4e3e411594c7b02b5918364abeeac91b6350f49c` must not be treated as Fresh-Challenged PASS evidence for the full lifecycle proof.

Proceed only through the separate Remediation Builder activation:

`docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_ACTIVATION_AFTER_FC01_FAIL_2026-10-03.md`
