# Acre Era Lifecycle Runtime Proof R0 — Remediation Builder PASS After FRC-03

**Date:** 2026-10-04  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15 — Acre Era Isolated Full Lifecycle Runtime Proof R0  
**Role:** separate Remediation Builder  
**Result:** **REMEDIATION BUILDER PASS**

This is a Builder result only. It is **not** a Fresh Re-Challenger or Independent Assurance result and does not authorize merge or Production action.

## Preserved finding

`AE-LRP-R0-FRC-03 — CONTENT_REVISION_DIRECT_RESET_NEUTRALIZES_CLOSURE_CAS`

The failed candidate allowed a snapshot-relevant mutation to advance `eras.content_revision`, then allowed direct SQL to lower that revision back to the pre-snapshot value. Because `updated_at` could remain unchanged, the final closure CAS could accept a stale CLOSURE snapshot.

## Exact failed candidate

- commit: `29163ee7cdd31e732c3437b55bc63ed71fa8f294`
- parent: `dd888f81e90e93a6dc5c116e6a558e38e4156591`
- tree: `a4ad399e49bd1a37b8f834d47a6835632f8b2a87`

Governing Fresh Re-Challenger FAIL:

- workflow run: `37171279225`
- job: `111344552365`
- PostgreSQL: `17.11 (Debian 17.11-1.pgdg13+2)`

## Frozen remediation candidate

Challenge only this exact candidate:

- commit: `bcd245f48b125a4f6f875edda15077dc699f80e0`
- parent: `d3a044e96be8d0397825a8ec3e781b20b3bf6814`
- tree: `05509a76a76975d57275a34c6554a9c948876c83`

Relevant frozen blobs:

- migration 0017: `2e5f0b4a64ade1b33feecf27a474d796e9635382`
- FRC-03 Builder proof: `c664b2d425298ca03bfa249f2349be40b59020a0`
- lifecycle workflow: `e0fbb0526e437d02ad3d6da71b590cb9b0b2f1f1`
- restored genuine FRC-02 Builder proof: `3ec3c65ea2b2f481b89f42a9bdd5b7818c910311`

Raw Builder evidence:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_REMEDIATION_BUILDER_RAW_EVIDENCE.json`

## Database-boundary remediation

Migration `drizzle/0017_era_content_revision_monotonicity_r0.sql` adds two protections.

First, `eras_content_revision_nonnegative` rejects negative revisions, including direct inserts.

Second, the `eras_enforce_content_revision_monotonic` trigger executes `BEFORE UPDATE OF content_revision`. Its function `enforce_era_content_revision_monotonic()` raises SQLSTATE `23514` whenever:

`NEW.content_revision < OLD.content_revision`

This is intentionally narrow:

- direct SQL may not lower or restore an older revision;
- no-op revision updates remain legal;
- monotonic increases remain legal;
- the existing FRC-01 child-state bump function can still increment revision;
- the existing FRC-02 snapshot-field trigger can still advance revision;
- closure semantics and the final `updated_at + content_revision` CAS remain unchanged.

Therefore a committed snapshot-relevant mutation cannot be made observationally equivalent to an earlier revision by directly editing the counter.

## Governing disposable PostgreSQL 17 proof

Exact candidate execution:

- workflow: `Acre Era Lifecycle Proof R0`
- run: `37180224365`
- run number: `63`
- job: `111371124874`
- conclusion: **SUCCESS**
- PostgreSQL image: `postgres:17`
- PostgreSQL runtime: `17.11 (Debian 17.11-1.pgdg13+2)`
- data: synthetic only
- database: disposable PostgreSQL 17 only
- temporary execution PR: #18, closed unmerged after proof

Dedicated proof class:

`DISPOSABLE_POSTGRESQL_MONOTONIC_NON_NEUTRALIZABLE_ERA_REVISION`

Result: **PASS**

Runtime-proven FRC-03 cases included:

- direct revision lowering to an older positive value: rejected, SQLSTATE `23514`;
- restoring the exact earlier revision: rejected, SQLSTATE `23514`;
- below-zero UPDATE: rejected, SQLSTATE `23514`;
- negative INSERT: rejected, SQLSTATE `23514`;
- no-op revision UPDATE: accepted without changing revision;
- exact story mutation + same-transaction reset: reset rejected; stale close failed closed;
- story mutation + later-transaction reset: reset rejected; stale close failed closed;
- CTE / `UPDATE ... FROM` mutation + reset: rejected; stale close failed closed;
- PostgreSQL `MERGE` mutation + reset: rejected; stale close failed closed;
- multi-field Era mutation + reset: rejected; stale close failed closed;
- sequential Era mutations + reset: rejected; stale close failed closed;
- lifecycle / visibility / primary mutation + reset: rejected; stale close failed closed;
- rollback semantics: row and revision restored together;
- savepoint reset attempt: rejected while the committed mutation remained valid.

For every closure race above:

- the first close failed with `ERA_CHANGED_BEFORE_CLOSURE`;
- failed-close CLOSURE snapshots persisted: **0**;
- the Era remained in the correct pre-close state;
- retry closed successfully and captured the committed mutation.

## Child-state revision neutralization closed

The same fresh job attacked direct revision reset after every required child-state mutation class:

- membership INSERT / UPDATE / DELETE;
- section INSERT / UPDATE / DELETE;
- media INSERT / UPDATE / DELETE;
- Watchtower binding INSERT / UPDATE / DELETE;
- referenced product mutation affecting one Era;
- referenced product mutation affecting multiple Eras.

Every child mutation advanced the Era revision. Every attempt to restore the earlier revision was rejected at the database boundary.

## FRC-02 protection preserved

The remediation candidate restored and executed the genuine FRC-02 Builder proof rather than the prior evidence-branch FRC-03 reproducer shim.

Proof class:

`DISPOSABLE_POSTGRESQL_ERA_ROW_REVISION_CAS_CONCURRENCY`

Result: **PASS**

The full **21-case** FRC-02 matrix passed, including:

- exact original `story` race;
- all serialized mutable Era fields;
- direct SQL omitting `updated_at`;
- multi-field and sequential changes;
- lifecycle / visibility / primary changes;
- direct content revision increase;
- rollback;
- concurrent Era-row + child-row mutation;
- two concurrent `closeEra` calls.

Observed:

- failed-close CLOSURE snapshots persisted: **0**;
- committed mutations captured on retry: **true**;
- concurrent Era + child protection: **true**;
- two-concurrent-close protection: **true**.

Thus `AE-LRP-R0-FRC-02` remains closed.

## FRC-01 protection preserved

Proof class:

`DISPOSABLE_POSTGRESQL_CHILD_REVISION_CAS_CONCURRENCY`

Result: **PASS**

The ordinary child concurrency proof retained:

- stale accepted closure snapshots: **0**;
- failed-close snapshots persisted: **0**;
- product data protection;
- membership phantom protection;
- section protection;
- media protection;
- Watchtower binding protection;
- committed child mutation capture on retry.

Thus `AE-LRP-R0-FRC-01` remains closed.

## FC-01 shared production-path protection preserved

The exact candidate passed:

`ISOLATED_SYNTHETIC_FULL_LIFECYCLE_APPLICATION_PATH_POSTGRESQL_R1`

Observed lifecycle:

`DRAFT -> ACTIVE -> CLOSED -> ARCHIVED`

Fresh digests:

- readiness: `a5a6f5f393b62ca0782eae345aa59903128bf2584938a57fa0394556ea1b4f43`
- CLOSURE snapshot: `c7c555d998d6d6b2dbca3c182cabb9da43952877bee97a6fc335a88e98178f54`

Shared application paths remained PASS for readiness, activation, current resolution, archive snapshot construction, close, archive, archived resolution, Watchtower signal ingestion, and alert evaluation.

Adversarial protections remained PASS for:

- future-`startAt` rejection;
- readiness digest/CAS;
- archive refusal without CLOSURE evidence;
- immutable CLOSURE snapshot UPDATE/DELETE rejection;
- archived historical product resolution;
- current media-rights revocation behavior;
- replay/idempotence;
- same-key/different-payload collision rejection;
- sensitive/private signal rejection;
- queue-only alert authority.

Thus `AE-LRP-R0-FC-01` remains preserved.

## Regression results

Same governing job:

- TypeScript: **PASS**
- Era Engine: **11/11 PASS**
- archive/alert/activation: **15/15 PASS**
- Signal Bus: **12/12 PASS**

## Non-governing legacy FRC-02 reproducer workflow

PR #18 also triggered `Acre Era Fresh Re-Challenge FRC-02`, run `37180224371`, which concluded failure at its old reproducer step.

That workflow is **not** the governing Builder result. It is designed to require the old FRC-02 race to reproduce; the remediated candidate correctly prevents that old defect. The governing lifecycle job separately executed the genuine FRC-02 PASS proof.

## Safety boundary

No Production database, Production migration, Production deployment, Production routing, real Era activation, real product publication, customer data, customer communication, supplier/fulfillment action, order, paid infrastructure activation, money spend, or PR #15 merge occurred.

Temporary PR #18 was closed **unmerged**.

## Disposition

**REMEDIATION BUILDER PASS.**

Do **not** merge PR #15 based on this Builder result alone.

The next valid step is a **new separate Fresh Re-Challenger** against only the frozen remediation candidate:

`bcd245f48b125a4f6f875edda15077dc699f80e0`

tree:

`05509a76a76975d57275a34c6554a9c948876c83`

The Fresh Re-Challenger must treat this receipt and raw evidence as claims to falsify, not as assurance.
