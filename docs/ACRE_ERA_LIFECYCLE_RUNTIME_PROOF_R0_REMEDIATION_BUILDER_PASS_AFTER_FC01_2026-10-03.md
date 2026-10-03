# Acre Era Lifecycle Runtime Proof R0 — Remediation Builder PASS After FC-01

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15 — Acre Era Isolated Full Lifecycle Runtime Proof R0  
**Finding remediated:** `AE-LRP-R0-FC-01 — FULL_LIFECYCLE_PROOF_BYPASSES_PRODUCTION_ERA_AND_SIGNAL_APPLICATION_PATHS`

## Disposition

**REMEDIATION BUILDER: PASS**

The preserved FC-01 defect is remediated for the exact frozen candidate below. The full-lifecycle proof no longer treats hand-built direct-SQL behavior as proof of Norvana's application semantics where production paths exist.

This receipt does **not** authorize merge, Production deployment, Production migration, Production routing changes, real Era activation, real product publication, customer notification, supplier/fulfillment activation, orders, or spend.

## Exact frozen remediation candidate

Commit:

`7f8241e2dac3f044d03fd4627526e77884ff1c90`

Parent:

`c123c154d98013b617167421c573249f14054c8e`

Tree:

`a538bc0d4a67a860cd52a88f8e106d2df74d55c0`

The evidence and activation commits after this candidate are documentation/evidence banking only. A Fresh Re-Challenger must challenge the exact commit/tree above, not a later moving branch head.

## Disposable PostgreSQL execution

GitHub Actions run:

`37152908083`

Job:

`111290271433`

Runtime:

- PostgreSQL 17
- isolated synthetic data only
- no Production database
- no customer data
- no external delivery
- no real commerce or supplier authority

Result:

`ISOLATED_SYNTHETIC_FULL_LIFECYCLE_APPLICATION_PATH_POSTGRESQL_R1 — PASS`

Observed readiness digest:

`46ef1a7d4cbd9970e3a4ff8031b9db4e013155167bb479d3c55e874e561128d0`

Observed closure snapshot digest:

`f740ac805704475597e90559ccf9f5ace84d1e54dd31d17b666da0496e495e28`

Raw execution evidence:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FC-01_REMEDIATION_BUILDER_RAW_EVIDENCE.json`

## Canonical production paths now exercised

The proof directly executes the application implementations used by Norvana for:

- `evaluateEraActivationReadiness`, including blockers, warnings, and canonical readiness digest construction;
- shared production `activateEra` semantics used by the admin activation route, including evidence requirement, expected readiness digest, re-read/concurrency checks, transactional state change, `ERA_ACTIVATED` event, and `ERA_ACTIVATE` action receipt;
- `resolveCurrentPublicEra`, including current-time public scheduling semantics;
- `buildEraArchiveSnapshot`;
- shared production `closeEra` semantics used by the admin close route, including immutable closure-snapshot persistence, optimistic concurrency, lifecycle transition, event, and receipt;
- shared production `archiveEra` semantics used by the admin archive route, including the mandatory persisted CLOSURE snapshot and transactional archive event/receipt;
- archived `resolvePublicEraBySlug` behavior after live product mutation and current media-rights revocation;
- `ingestWatchtowerSignal`, including production parsing, canonical payload digest, key collision behavior, projection persistence, and replay/idempotence;
- `evaluateAndQueueCustomerAlerts`, including sanitization, matching, stable fingerprinting, deduplication, and queue-only authority.

The three Era admin routes now delegate to `src/lib/era-engine/lifecycle-service.ts`, so the proof and HTTP routes consume the same lifecycle transaction semantics rather than parallel copies.

## FC-01 adversarial coverage

The remediated proof passed all required adversarial cases:

- mismatched readiness digest rejected;
- Era mutation after readiness makes the stale digest unusable;
- archive rejected before a closure snapshot exists;
- same `signalKey` with a different payload rejected as a collision;
- sensitive/disallowed private signal payload rejected;
- alert payload sanitization strips non-public keys;
- repeated verified-signal ingestion remains idempotent and singular;
- archived product presentation remains historical after live product mutation;
- current media revocation hides revoked media from archived public resolution without mutating the immutable historical snapshot;
- exact FC-01 class — `ACTIVE + PUBLIC + primary` with a future `startAt` — is rejected by `resolveCurrentPublicEra` as `ACTIVE_PRIMARY_ERA_NOT_PUBLIC_NOW`;
- ambiguous-primary persistence is database-guarded in the exercised schema.

That future-`startAt` case is the decisive regression for the Fresh Challenger's demonstrated false positive: the old raw-SQL predicate would recognize the row shape, but the remediated proof only passes when the production resolver rejects it at the current proof time.

## Regression evidence

The successful remediation run also preserved and re-proved:

- migration chain through `0014_watchtower_signal_bus_r0.sql`: PASS;
- PostgreSQL archive UPDATE immutability: PASS;
- PostgreSQL archive DELETE immutability: PASS;
- TypeScript typecheck: PASS;
- Era Engine regression: **11/11 PASS**;
- Archive / alert / activation regression: **14/14 PASS**;
- Signal Bus regression: **12/12 PASS**.

The earlier valid evidence from GitHub Actions run `37148461532` remains banked. This remediation does not discard or rewrite that prior PostgreSQL 17 migration/immutability/regression evidence.

## Exact candidate blobs of interest

- lifecycle service: `3b8ce35527b8eb918b733f2495932c29e6f8f1bb`
- readiness: `44d15ba48be3dabe409b7409a6662741292af13b`
- archive builder: `62063116b88bc9b2bfc7cb3388fa438ef9f524fb`
- resolver: `b2e567d5a71cceb7b47f3bb165be321b1f257289`
- Signal Bus: `c7a6560fc381248a4bb51573461657fd7e9dd655`
- alert evaluator: `2088dd6b828d2d91a7df4fffec8ff5064c3713f8`
- lifecycle proof: `6cc468c5daeb9531efcb751b49f1c440491f60bf`
- workflow: `fa90c67e1aee360c94e282a94e927d6bd1310de7`
- archive/activation regression: `9cf030709a3fbc6c4de9b6b6f9022d53540de383`

## Authority boundary observed

Observed during the passing proof:

- Production touched: **false**
- customer data used: **false**
- notifications sent: **0**
- external delivery authority: `QUEUE_ONLY_NO_EXTERNAL_DELIVERY`
- real Era activated: **false**
- real product published: **false**
- suppliers/fulfillment activated: **false**
- orders placed: **false**
- money spent: **false**

## Next required lane

Do not merge PR #15 on this Builder receipt alone.

Activate a **new separate Fresh Re-Challenger** and challenge only:

`7f8241e2dac3f044d03fd4627526e77884ff1c90`

tree:

`a538bc0d4a67a860cd52a88f8e106d2df74d55c0`

The Fresh Re-Challenger must independently test whether FC-01 or another material false-positive application-path gap remains. It must not silently repair the frozen candidate.
