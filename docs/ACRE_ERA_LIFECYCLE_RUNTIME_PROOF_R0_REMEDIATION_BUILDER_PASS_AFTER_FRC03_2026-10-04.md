# Acre Era Lifecycle Runtime Proof R0 — Remediation Builder PASS After FRC-03

**Date:** 2026-10-04  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** separate Remediation Builder  
**Result:** **REMEDIATION BUILDER PASS**

This is a Builder result only. It is **not** a Fresh Re-Challenger or Independent Assurance result and does not authorize merge or Production action.

## Preserved finding

`AE-LRP-R0-FRC-03 — CONTENT_REVISION_DIRECT_RESET_NEUTRALIZES_CLOSURE_CAS`

The prior candidate allowed a snapshot-relevant mutation to advance `eras.content_revision`, followed by direct SQL restoring the earlier revision. Because `updated_at` could remain unchanged, the final closure CAS could accept a stale CLOSURE snapshot.

## Frozen remediation candidate

Challenge only this exact candidate:

- commit: `bcd245f48b125a4f6f875edda15077dc699f80e0`
- parent: `d3a044e96be8d0397825a8ec3e781b20b3bf6814`
- tree: `05509a76a76975d57275a34c6554a9c948876c83`

The candidate is descended from failed candidate `29163ee7cdd31e732c3437b55bc63ed71fa8f294` through the preserved FRC-03 evidence lineage.

## Database-boundary remediation

New migration:

`drizzle/0017_era_content_revision_monotonicity_r0.sql`

It installs two database-enforced invariants:

1. `eras_content_revision_nonnegative` rejects negative revisions.
2. `eras_enforce_content_revision_monotonic` fires `BEFORE UPDATE OF content_revision` and raises SQLSTATE `23514` if `NEW.content_revision < OLD.content_revision`.

Therefore direct SQL cannot lower the revision, restore a pre-snapshot revision, or cancel the revision effect of a committed Era-row or child-state mutation.

The existing 0015 child triggers and 0016 Era snapshot-field trigger continue to advance the same revision transactionally. `closeEra` still performs the final `updated_at + content_revision` CAS, so a committed mutation invalidates stale closure while rollback restores both data and revision.

## Governing disposable PostgreSQL proof

- workflow: `Acre Era Lifecycle Proof R0`
- run: `37180224365`
- job: `111371124874`
- run number: `63`
- exact checkout: `bcd245f48b125a4f6f875edda15077dc699f80e0`
- PostgreSQL: `17.11 (Debian 17.11-1.pgdg13+2)`
- Node: `22.23.3`
- data: synthetic only
- database: disposable PostgreSQL 17 only
- conclusion: **SUCCESS**

Dedicated FRC-03 proof class:

`DISPOSABLE_POSTGRESQL_MONOTONIC_NON_NEUTRALIZABLE_ERA_REVISION`

Executed coverage included:

- direct lowering to an older positive value;
- restoring exact earlier revision;
- negative update and negative insert;
- no-op revision update;
- exact story mutation + reset in the same transaction using savepoint containment;
- committed story mutation + reset attempt in a later transaction;
- ordinary UPDATE, UPDATE ONLY, CTE/UPDATE FROM, MERGE;
- multi-field Era mutation;
- sequential Era mutations;
- visibility/primary/lifecycle mutation;
- rollback and savepoint behavior;
- membership INSERT/UPDATE/DELETE + reset;
- section INSERT/UPDATE/DELETE + reset;
- media INSERT/UPDATE/DELETE + reset;
- Watchtower binding INSERT/UPDATE/DELETE + reset;
- referenced product mutation affecting one Era + reset;
- referenced product mutation affecting multiple Eras + reset.

Observed guarantees:

- every revision regression/reset attempt was rejected at the database boundary;
- stale closure attempts failed closed;
- failed closure persisted **zero** stale CLOSURE snapshots;
- retry captured committed mutation state.

Raw evidence:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_REMEDIATION_BUILDER_RAW_EVIDENCE.json`

## Previous fixes preserved

The governing run also re-executed the genuine preserved Builder proofs:

### FRC-02

`AE-LRP-R0-FRC-02 — CLOSURE_SNAPSHOT_ERA_ROW_MUTATION_NOT_COVERED_BY_REVISION_OR_UPDATED_AT_GUARD`

Result: **PASS**

Proof class:

`DISPOSABLE_POSTGRESQL_ERA_ROW_REVISION_CAS_CONCURRENCY`

Failed-close stale snapshots persisted: **0**.

### FRC-01

`AE-LRP-R0-FRC-01 — CLOSURE_SNAPSHOT_TOCTOU_CHILD_MUTATION_NOT_COVERED_BY_ERA_CAS`

Result: **PASS**

Proof class:

`DISPOSABLE_POSTGRESQL_CHILD_REVISION_CAS_CONCURRENCY`

Failed-close stale snapshots persisted: **0**.

### FC-01 / shared application path

Full shared lifecycle proof result: **PASS**

Proof class:

`ISOLATED_SYNTHETIC_FULL_LIFECYCLE_APPLICATION_PATH_POSTGRESQL_R1`

The DRAFT -> ACTIVE -> CLOSED -> ARCHIVED application path, readiness digest/CAS, future-start rejection, archive refusal without valid CLOSURE evidence, immutable CLOSURE UPDATE/DELETE protection, archived historical product resolution, current media-rights revocation, Watchtower ingestion, alert evaluation, replay/idempotence, same-key/different-payload collision rejection, and sensitive/private signal rejection remained covered.

## Regression suite

- TypeScript: **PASS**
- Era Engine: **11 / 11 PASS**
- archive/alert/activation: **15 / 15 PASS**
- Signal Bus: **12 / 12 PASS**

## Non-governing setup failure

Run `37180199846` / job `111371052328` is **not** governing evidence. The evidence branch had intentionally replaced the preserved FRC-02 Builder proof with a Fresh-Re-Challenger shim that reran `AE-LRP-R0-FRC-03_REPRO.mjs`. Once 0017 closed the defect, that old exploit correctly failed to reproduce and terminated the step.

Before the governing rerun, the exact preserved FRC-02 Builder proof blob `3ec3c65ea2b2f481b89f42a9bdd5b7818c910311` from candidate `29163ee7...` was restored. The governing run then passed FRC-03, FRC-02, FRC-01, full lifecycle, and all requested regressions.

## Safety boundary

Only repository changes, GitHub Actions, synthetic data, and disposable PostgreSQL 17 were used.

No Production database, Production migration, Production deployment, Vercel Production routing, real Era activation, real product publication, customer data, customer communication, supplier/fulfillment activation, order, money spend, paid infrastructure activation, or PR #15 merge occurred.

## Disposition

**REMEDIATION BUILDER PASS.**

Do **not** merge PR #15 based on this Builder result.

The next valid step is a **new separate Fresh Re-Challenger** against only:

`bcd245f48b125a4f6f875edda15077dc699f80e0`

tree:

`05509a76a76975d57275a34c6554a9c948876c83`

The Fresh Re-Challenger must treat this receipt and raw evidence as claims to falsify, not as assurance.
