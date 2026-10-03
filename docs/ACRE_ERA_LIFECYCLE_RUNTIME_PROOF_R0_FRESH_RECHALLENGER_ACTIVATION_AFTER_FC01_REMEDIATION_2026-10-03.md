# Acre Era Lifecycle Runtime Proof R0 — Fresh Re-Challenger Activation After FC-01 Remediation

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15 — Acre Era Isolated Full Lifecycle Runtime Proof R0  
**Role:** new separate Fresh Re-Challenger  
**Preserved finding:** `AE-LRP-R0-FC-01 — FULL_LIFECYCLE_PROOF_BYPASSES_PRODUCTION_ERA_AND_SIGNAL_APPLICATION_PATHS`

Begin with this activation and read every required receipt/evidence file below before executing.

Do **not** ask Norris to reconstruct history already preserved in GitHub.

## Challenge only this exact frozen remediation candidate

Commit:

`7f8241e2dac3f044d03fd4627526e77884ff1c90`

Parent:

`c123c154d98013b617167421c573249f14054c8e`

Tree:

`a538bc0d4a67a860cd52a88f8e106d2df74d55c0`

Do not challenge a later documentation/evidence commit or a moving branch head as a substitute for this candidate.

## Required starting evidence

Read:

1. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_PASS_AFTER_FC01_2026-10-03.md`
2. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FC-01_REMEDIATION_BUILDER_RAW_EVIDENCE.json`
3. Fresh Challenger FAIL receipt from the preserved evidence branch:
   `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_FRESH_CHALLENGER_FAIL_2026-10-03.md`
4. reproducer:
   `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FC-01_REPRO.mjs`
5. raw Fresh Challenger evidence:
   `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FC-01_RAW_EVIDENCE.json`
6. remediated proof:
   `scripts/verify-acre-era-lifecycle-r0.mjs`
7. workflow:
   `.github/workflows/acre-era-lifecycle-proof-r0.yml`
8. `src/lib/era-engine/lifecycle-service.ts`
9. `src/lib/era-engine/readiness.ts`
10. `src/lib/era-engine/archive.ts`
11. `src/lib/era-engine/resolver.ts`
12. `src/lib/watchtower/signal-bus.ts`
13. `src/lib/customer-intent/alert-evaluator.ts`
14. the three Era lifecycle admin routes and relevant regression tests.

## Builder evidence to independently verify

Successful disposable-PostgreSQL Builder run:

`37152908083`

Job:

`111290271433`

Claimed proof class:

`ISOLATED_SYNTHETIC_FULL_LIFECYCLE_APPLICATION_PATH_POSTGRESQL_R1`

The Builder reports that the remediated proof now directly exercises:

- production Era readiness and readiness digest construction;
- shared production activation/CAS/evidence receipt semantics used by the activation route;
- `resolveCurrentPublicEra`;
- production archive snapshot construction;
- shared production close/archive transaction semantics used by their routes;
- archived public resolution;
- `ingestWatchtowerSignal`;
- `evaluateAndQueueCustomerAlerts`;
- verified-signal projection, collision handling, and replay/idempotence.

The Builder also reports passing:

- TypeScript typecheck;
- Era Engine 11/11;
- Archive / alert / activation 14/14;
- Signal Bus 12/12.

The previously valid evidence from run `37148461532` remains preserved and must not be discarded merely because FC-01 required a higher-level harness remediation.

## Required Fresh Re-Challenge surface

Independently challenge whether the candidate can still falsely PASS while diverging from the application behavior it claims to prove.

At minimum test:

- whether the proof truly imports/executes the same production readiness, resolver, archive, Signal Bus, alert-evaluator, and shared lifecycle transaction implementations used by the application;
- whether the admin activation/close/archive routes actually delegate to the shared lifecycle service;
- readiness digest mismatch and mutation/CAS behavior;
- exact FC-01 future-`startAt` class: `ACTIVE + PUBLIC + primary` must not be accepted as current before its start time;
- current Era ambiguity handling;
- closure snapshot construction/persistence and database immutability;
- archive refusal without a persisted CLOSURE snapshot;
- archived public resolution after live product mutation;
- current media-rights revocation against immutable historical snapshots;
- Signal Bus same-key/different-payload collision handling;
- sensitive private-payload rejection;
- verified-signal projection and replay/idempotence;
- alert sanitization, matching, fingerprint deduplication, and queue-only/no-external-delivery authority;
- any remaining proof-only substitute semantics that could diverge from production and create a material false-positive PASS.

Do not accept source-text matching alone as proof of runtime behavior where a disposable PostgreSQL runtime test is possible.

## Independence rules

You are the **Fresh Re-Challenger**, not the Remediation Builder.

Do not silently repair the frozen candidate.

If you find a material defect:

1. preserve the exact finding with a new stable identifier;
2. preserve a minimal reproducer or concrete raw evidence;
3. bank a FAIL receipt tied to the frozen commit/tree;
4. activate a **separate Remediation Builder**.

If no material defect is found:

1. preserve exact runtime evidence;
2. bank a Fresh Re-Challenger PASS tied to the frozen commit/tree;
3. explicitly state which FC-01 adversarial cases were independently challenged;
4. do not merge PR #15 unless a later governing step explicitly authorizes it.

## Hard boundary

Do not:

- merge PR #15;
- deploy Production;
- migrate Production;
- change Vercel Production routing;
- activate a real Era;
- publish a real product;
- use customer data;
- send notifications;
- activate suppliers or fulfillment;
- place orders;
- spend money;
- weaken evidence, safety, or authority controls.

Use disposable PostgreSQL and synthetic data only.
