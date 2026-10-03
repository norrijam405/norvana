# Acre Era Lifecycle Runtime Proof R0 — Fresh Re-Challenger FAIL After FC-01 Remediation

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** new separate Fresh Re-Challenger  
**Result:** **FAIL**

## Exact challenged remediation candidate

- Commit: `7f8241e2dac3f044d03fd4627526e77884ff1c90`
- Parent: `c123c154d98013b617167421c573249f14054c8e`
- Tree: `a538bc0d4a67a860cd52a88f8e106d2df74d55c0`

No remediation was performed by this Challenger.

## New finding

**ID:** `AE-LRP-R0-FRC-01`  
**Title:** `CLOSURE_SNAPSHOT_TOCTOU_CHILD_MUTATION_NOT_COVERED_BY_ERA_CAS`

The remediated proof correctly exercises the shared production lifecycle service, but the production `closeEra` implementation has a transaction-boundary defect.

`buildEraArchiveSnapshot(eraId)` is executed **before** the closure transaction. The later CAS validates only `eras.updated_at`. Child rows included in the snapshot—products, Era memberships, sections, media, and Watchtower bindings—can change without necessarily changing `eras.updated_at`.

A concurrent child mutation can therefore commit after the snapshot was built but before the Era close completes, while the close still succeeds and persists the stale snapshot.

## Executable PostgreSQL reproduction

Evidence branch:

`evidence/2026-10-03-acre-era-lifecycle-fresh-rechallenge-fc02`

Reproducer:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-01_REPRO.mjs`

Successful disposable PostgreSQL 17 run:

- GitHub Actions run: `37154988141`
- Job: `111296439748`
- Harness commit: `112a9c79bb9b28427e9d88a4371b1736cf3d97e4`

Observed:

- `closeEra` reached and blocked at its Era UPDATE;
- while blocked, a synthetic product price mutation committed from `125` to `99`;
- the Era then completed transition to `CLOSED`;
- persisted CLOSURE snapshot product price: **125**;
- live product price at closure commit: **99**;
- reproducer status: **REPRODUCED**.

This is a concrete TOCTOU failure of closure evidence consistency.

## FC-01 status

The exact original FC-01 application-path substitution class was independently checked and was **not** reproduced after remediation:

- the R1 harness imports and executes shared readiness/lifecycle/resolver/archive/Signal Bus/alert paths;
- the future-`startAt` ACTIVE/PUBLIC/primary adversarial row is rejected by `resolveCurrentPublicEra`;
- admin activate/close/archive routes delegate to the shared lifecycle service.

However, the exact remediation candidate **cannot be banked as Fresh Re-Challenger PASS** because FRC-01 is material.

## Evidence that remains valid

The following prior evidence remains valid and is not discarded:

- Builder run `37152908083`, job `111290271433`, including the R1 application-path execution;
- prior PostgreSQL evidence run `37148461532`;
- migration chain through `0014_watchtower_signal_bus_r0.sql`;
- PostgreSQL archive UPDATE/DELETE immutability;
- readiness digest mismatch rejection;
- stale readiness after direct Era-row mutation rejection;
- archive refusal without a CLOSURE snapshot;
- future-start current-Era rejection;
- Signal Bus same-key/different-payload collision rejection;
- private/sensitive signal rejection;
- verified projection and replay/idempotence;
- alert sanitization, fingerprint deduplication, and queue-only authority;
- TypeScript and reported regression suites.

What is **not** established is transactional closure-snapshot consistency under concurrent child-row mutation.

## Safety boundary

The challenge used disposable PostgreSQL and synthetic data only.

No Production database, Production migration, Vercel Production routing, real Era activation, real product publication, customer data, customer communication, supplier/fulfillment action, order, or paid service was used.

## Disposition

Do not merge PR #15 and do not treat candidate `7f8241e2dac3f044d03fd4627526e77884ff1c90` as Fresh Re-Challenged PASS.

Proceed only through the separate Remediation Builder activation:

`docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_ACTIVATION_AFTER_FRC01_FAIL_2026-10-03.md`
