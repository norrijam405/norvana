# Acre Era Lifecycle Runtime Proof R0 — Remediation Builder Activation After FRC-01 FAIL

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** separate Remediation Builder

You are being activated to remediate preserved finding:

`AE-LRP-R0-FRC-01 — CLOSURE_SNAPSHOT_TOCTOU_CHILD_MUTATION_NOT_COVERED_BY_ERA_CAS`

Do not ask Norris to reconstruct history already preserved in GitHub.

## Required starting evidence

Read first:

1. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_FRESH_RECHALLENGER_FAIL_AFTER_FC01_REMEDIATION_2026-10-03.md`
2. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-01_RAW_EVIDENCE.json`
3. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-01_REPRO.mjs`
4. `src/lib/era-engine/lifecycle-service.ts`
5. `src/lib/era-engine/archive.ts`
6. relevant schema/migrations and lifecycle tests.

## Failed candidate

- Commit: `7f8241e2dac3f044d03fd4627526e77884ff1c90`
- Parent: `c123c154d98013b617167421c573249f14054c8e`
- Tree: `a538bc0d4a67a860cd52a88f8e106d2df74d55c0`

Fresh Re-Challenger runtime evidence:

- run: `37154988141`
- job: `111296439748`
- evidence branch: `evidence/2026-10-03-acre-era-lifecycle-fresh-rechallenge-fc02`

## Required remediation objective

Make closure snapshot construction and Era transition transactionally consistent against concurrent mutation of every child state that contributes to the closure snapshot.

The remediation must not merely add a test that serializes the current behavior. It must close the demonstrated TOCTOU window.

At minimum prove with disposable PostgreSQL:

- the preserved FRC-01 reproducer no longer yields a stale CLOSURE snapshot;
- concurrent mutation of product data used by the archive snapshot cannot commit before closure while escaping detection;
- equivalent protection exists for Era memberships, sections, media, and Watchtower bindings that contribute to the snapshot;
- the close transaction either captures the committed child mutation in the persisted CLOSURE snapshot or fails/retries closed;
- snapshot immutability remains intact;
- archive still requires a valid persisted CLOSURE snapshot;
- prior FC-01 future-start and application-path coverage remains passing;
- existing Era Engine, archive/alert/activation, Signal Bus, and typecheck regressions remain passing.

Prefer a transactionally coherent design over broad fragile child-table side effects unless governance requires otherwise.

## Independence and banking

You are the Remediation Builder, not the Fresh Re-Challenger.

If remediation passes:

1. freeze the exact remediation candidate commit/parent/tree;
2. preserve raw PostgreSQL evidence;
3. bank a Remediation Builder PASS receipt;
4. activate a new separate Fresh Re-Challenger for FRC-01.

Do not self-issue the Fresh Re-Challenger PASS.

## Hard safety boundary

Do not merge PR #15, deploy Production, migrate Production, change Vercel Production routing, activate a real Era, publish a real product, use customer data, send customer communications, activate suppliers/fulfillment, place orders, spend money, or weaken evidence/authorization controls.

Use disposable PostgreSQL and synthetic data only.
