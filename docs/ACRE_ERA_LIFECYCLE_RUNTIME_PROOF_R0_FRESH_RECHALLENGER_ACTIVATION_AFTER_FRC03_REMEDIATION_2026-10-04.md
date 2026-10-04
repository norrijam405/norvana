# Acre Era Lifecycle Runtime Proof R0 — Fresh Re-Challenger Activation After FRC-03 Remediation

**Date:** 2026-10-04  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15 — Acre Era Isolated Full Lifecycle Runtime Proof R0  
**Role:** **new separate Fresh Re-Challenger**

You are being activated after Remediation Builder PASS for:

`AE-LRP-R0-FRC-03 — CONTENT_REVISION_DIRECT_RESET_NEUTRALIZES_CLOSURE_CAS`

Do not ask Norris to reconstruct history already preserved in GitHub.

## Challenge only this exact frozen remediation candidate

- commit: `bcd245f48b125a4f6f875edda15077dc699f80e0`
- parent: `d3a044e96be8d0397825a8ec3e781b20b3bf6814`
- tree: `05509a76a76975d57275a34c6554a9c948876c83`

Do **not** substitute the later evidence/receipt branch head for the candidate.

Relevant frozen blobs:

- `drizzle/0017_era_content_revision_monotonicity_r0.sql` — `2e5f0b4a64ade1b33feecf27a474d796e9635382`
- FRC-03 Builder proof — `c664b2d425298ca03bfa249f2349be40b59020a0`
- lifecycle workflow — `e0fbb0526e437d02ad3d6da71b590cb9b0b2f1f1`
- genuine FRC-02 Builder regression proof — `3ec3c65ea2b2f481b89f42a9bdd5b7818c910311`

## Read first

1. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_PASS_AFTER_FRC03_2026-10-04.md`
2. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_REMEDIATION_BUILDER_RAW_EVIDENCE.json`
3. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_FRESH_RECHALLENGER_FAIL_AFTER_FRC02_REMEDIATION_2026-10-03.md`
4. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_FRESH_RECHALLENGER_RAW_EVIDENCE.json`
5. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_REPRO.mjs`
6. `drizzle/0015_era_closure_snapshot_consistency_r0.sql`
7. `drizzle/0016_era_row_closure_snapshot_consistency_r0.sql`
8. `drizzle/0017_era_content_revision_monotonicity_r0.sql`
9. `src/lib/era-engine/archive.ts`
10. `src/lib/era-engine/lifecycle-service.ts`
11. `src/db/schema.ts`
12. the full shared lifecycle proof plus relevant Era Engine, archive, Watchtower, alert, and Signal Bus tests.

Treat Builder evidence as claims to falsify.

## Builder claim under challenge

The Builder claims the database now enforces:

- `content_revision >= 0`;
- no UPDATE can reduce `content_revision`;
- no direct DML can restore a prior revision after a committed snapshot-relevant mutation;
- no-op revision UPDATEs remain harmless;
- monotonic increases remain compatible with FRC-01/FRC-02 triggers;
- stale closure still fails closed and persists zero CLOSURE snapshots.

The mechanism is a nonnegative CHECK plus a `BEFORE UPDATE OF content_revision` monotonicity trigger that rejects regression with SQLSTATE `23514`.

## Fresh challenge objective

Try to falsify monotonicity and closure truth using fresh disposable PostgreSQL 17 and synthetic data only.

At minimum challenge:

- exact FRC-03 story mutation + reset;
- direct lowering to zero and older positive values;
- negative update and negative insert;
- same-transaction mutation + reset;
- later committed mutation + reset;
- same-statement snapshot-field mutation plus explicit older `content_revision`;
- ordinary UPDATE;
- `UPDATE ONLY`;
- CTE / `UPDATE ... FROM`;
- PostgreSQL `MERGE`;
- CASE/expression assignment to revision;
- multi-field and sequential Era mutations;
- lifecycle / visibility / primary mutations;
- mutation omitting `updated_at`;
- no-op revision writes;
- rollback and savepoint semantics;
- concurrent monotonic revision writers;
- concurrent Era-row + child-row mutation;
- mutation immediately after snapshot construction;
- mutation immediately before final closure CAS;
- two or more concurrent `closeEra` calls;
- failed-close stale snapshot persistence;
- retry after committed mutation.

## Child-state neutralization challenge

Attempt revision restoration after each:

- membership INSERT / UPDATE / DELETE;
- section INSERT / UPDATE / DELETE;
- media INSERT / UPDATE / DELETE;
- Watchtower binding INSERT / UPDATE / DELETE;
- referenced product mutation affecting one Era;
- referenced product mutation affecting multiple Eras.

Do not accept a child-only revision bump as sufficient; explicitly attempt to neutralize it.

## Trigger-order and transaction challenge

Specifically test whether trigger ordering can be exploited by setting a snapshot field and `content_revision` in the same UPDATE statement.

Test multiple revision writes in one transaction and concurrent transactions attempting higher and lower values.

Ordinary DML is in scope. Do not redefine the threat model by granting new superuser/DDL bypass authority such as disabling triggers; if an existing application/database role already has such authority, preserve that as a separate governance finding.

## Archive invariants

Re-prove:

- failed closure persists zero stale CLOSURE snapshots;
- failed closure leaves the Era in the correct pre-close state;
- retry captures committed state;
- CLOSURE snapshot UPDATE remains rejected;
- CLOSURE snapshot DELETE remains rejected;
- archive refuses without valid CLOSURE evidence;
- archived historical product state remains immutable;
- media-rights revocation behavior remains correct.

## Required regression re-execution

Re-run and preserve:

- full shared application-path lifecycle proof;
- FRC-01 child-state concurrency proof;
- original FRC-02 Era-row race proof;
- exact FRC-03 revision-reset proof;
- future-`startAt` rejection;
- readiness digest/CAS;
- archived historical product resolution;
- current media-rights revocation;
- Watchtower signal ingestion;
- alert evaluation;
- replay/idempotence;
- same-key/different-payload collision rejection;
- sensitive/private signal rejection;
- TypeScript;
- Era Engine suite;
- archive/alert/activation suite;
- Signal Bus suite.

## Role boundary

You are the **Fresh Re-Challenger**, not the Remediation Builder and not Independent Assurance.

Do not modify the frozen candidate while challenging it.

### If the candidate survives

Bank a durable Fresh Re-Challenger PASS receipt with exact candidate commit/parent/tree and fresh PostgreSQL evidence, then create a **new separate Independent Assurance activation**.

### If you find a material bypass

Bank a durable Fresh Re-Challenger FAIL with a minimal reproducer and raw evidence. Do not remediate in the same role. Create a **new separate Remediation Builder activation**.

## Hard safety boundary

Do not merge PR #15, deploy or migrate Production, change Production routing, activate a real Era, publish real products, use customer data, send customer communications, activate suppliers/fulfillment, place orders, spend money, enable paid infrastructure, or weaken evidence/authorization controls.

Use disposable PostgreSQL and synthetic data only.
