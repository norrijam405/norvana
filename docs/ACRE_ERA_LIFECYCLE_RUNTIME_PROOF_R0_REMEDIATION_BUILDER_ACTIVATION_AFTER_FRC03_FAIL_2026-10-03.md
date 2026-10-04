# Acre Era Lifecycle Runtime Proof R0 — Remediation Builder Activation After FRC-03 FAIL

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15 — Acre Era Isolated Full Lifecycle Runtime Proof R0  
**Role:** **new separate Remediation Builder**

You are being activated for preserved finding:

`AE-LRP-R0-FRC-03 — CONTENT_REVISION_DIRECT_RESET_NEUTRALIZES_CLOSURE_CAS`

Do not ask Norris to reconstruct history already preserved in GitHub.

## Exact failed candidate

- Commit: `29163ee7cdd31e732c3437b55bc63ed71fa8f294`
- Parent: `dd888f81e90e93a6dc5c116e6a558e38e4156591`
- Tree: `a4ad399e49bd1a37b8f834d47a6835632f8b2a87`

Fresh Re-Challenger governing execution:

- run: `37171279225`
- job: `111344552365`
- PostgreSQL: `17.11 (Debian 17.11-1.pgdg13+2)`

## Read first

1. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_FRESH_RECHALLENGER_FAIL_AFTER_FRC02_REMEDIATION_2026-10-03.md`
2. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_FRESH_RECHALLENGER_RAW_EVIDENCE.json`
3. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_REPRO.mjs`
4. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_PASS_AFTER_FRC02_2026-10-03.md`
5. `drizzle/0015_era_closure_snapshot_consistency_r0.sql`
6. `drizzle/0016_era_row_closure_snapshot_consistency_r0.sql`
7. `src/lib/era-engine/archive.ts`
8. `src/lib/era-engine/lifecycle-service.ts`
9. `src/db/schema.ts`
10. the full shared lifecycle proof and relevant Era Engine/archive/Watchtower tests.

## Preserved defect

Migration 0016 bumps `eras.content_revision` when snapshot-contributing Era fields change, but direct SQL can subsequently restore the old revision because a `content_revision`-only UPDATE does not invoke that trigger.

Fresh execution proved:

- ordinary story mutation: revision `0 -> 1`;
- direct revision reset: `1 -> 0`;
- `updated_at` stayed at the pre-snapshot value;
- mutation committed before closure completed;
- closure succeeded;
- Era became `CLOSED`;
- persisted CLOSURE snapshot retained `before-story`;
- live Era retained `after-story`.

Equivalent stale acceptance was reproduced through CTE/UPDATE FROM, MERGE, multi-field Era mutation, and a child-section mutation followed by revision reset.

## Builder objective

Make the Era-level closure revision genuinely monotonic at the database boundary so direct SQL cannot lower, restore, or otherwise neutralize a revision that represents committed snapshot-relevant state.

Do not rely solely on application discipline or `updated_at`.

The remediation must preserve the existing FRC-01 child-state coverage, FRC-02 Era-row coverage, snapshot immutability, lifecycle semantics, and shared application paths.

## Required Builder proof

Use fresh disposable PostgreSQL 17 and synthetic data only.

At minimum prove fail-closed behavior for:

- exact FRC-03 story + revision-reset race;
- direct `content_revision` lowering;
- restoring the exact pre-snapshot revision;
- attempting the reset in the same transaction as the snapshot-field mutation;
- attempting the reset in a later committed transaction;
- Era-row mutation + reset using ordinary UPDATE, `UPDATE ONLY`, CTE/`UPDATE FROM`, and `MERGE`;
- multi-field Era mutation + reset;
- sequential Era mutations + reset;
- child membership INSERT/UPDATE/DELETE + reset;
- section INSERT/UPDATE/DELETE + reset;
- media INSERT/UPDATE/DELETE + reset;
- Watchtower binding INSERT/UPDATE/DELETE + reset;
- referenced product mutation affecting one Era and multiple Eras + reset attempts;
- attempts to lower revision below zero or to an older positive value where schema permits;
- no-op updates;
- rollback/savepoint behavior;
- mutation immediately after snapshot construction;
- mutation immediately before final closure CAS;
- two or more concurrent `closeEra` calls;
- stale-snapshot persistence after failed CAS;
- retry after committed mutation;
- archive refusal without valid CLOSURE evidence;
- immutable CLOSURE snapshot UPDATE/DELETE rejection.

Re-run and preserve:

- full shared application-path lifecycle proof;
- FRC-01 child-state concurrency proof;
- original FRC-02 Era-row race proof;
- future-`startAt` rejection;
- readiness digest/CAS;
- archived historical product resolution;
- current media-rights revocation behavior;
- Watchtower signal ingestion and alert evaluation;
- replay/idempotence;
- same-key/different-payload collision rejection;
- sensitive/private signal rejection;
- TypeScript;
- Era Engine suite;
- archive/alert/activation suite;
- Signal Bus suite.

## Role boundary

You are the Remediation Builder, not Fresh Re-Challenger and not Independent Assurance.

If you produce a Builder PASS, freeze the exact remediation commit/parent/tree, preserve raw PostgreSQL evidence, bank a Remediation Builder PASS receipt, and create a **new separate Fresh Re-Challenger activation for FRC-03**.

Do not self-certify Fresh Re-Challenger or Independent Assurance.

## Hard safety boundary

Do not merge PR #15, deploy or migrate Production, change Production routing, activate a real Era, publish real products, use customer data, send customer communications, activate suppliers/fulfillment, place orders, spend money, enable paid infrastructure, or weaken evidence/authorization controls.

Use disposable PostgreSQL and synthetic data only.
