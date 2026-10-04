# Acre Era Lifecycle Runtime Proof R0 — Remediation Builder PASS After FRC-01

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** separate Remediation Builder  
**Result:** **REMEDIATION BUILDER PASS**

This is a Builder result only. It is **not** a Fresh Re-Challenger or Independent Assurance result, and it does not authorize merge or Production action.

## Preserved finding

`AE-LRP-R0-FRC-01 — CLOSURE_SNAPSHOT_TOCTOU_CHILD_MUTATION_NOT_COVERED_BY_ERA_CAS`

The failed candidate built the CLOSURE snapshot before the closure transaction and protected only `eras.updated_at`. A child mutation could therefore commit after snapshot construction but before the Era transition completed, leaving a stale snapshot accepted as authoritative closure evidence.

## Frozen remediation candidate

- Commit: `571d24a00ff1fb1aa319b125bf793584c7f059a0`
- Parent: `718e73d23a0c3d691b7bd994cf6462ce32686255`
- Tree: `63209916cd87c3f88cbace8fc7d152d59cc2f016`

Candidate code/evidence blobs:

- lifecycle service: `fbdea16a48e6637b400c049167764338f52dbe13`
- archive builder: `6fea9dc121c0c9a0ba706bb9f9673d99873d3f8b`
- schema: `a5aeab4ea17371d9f45bee71c8c31e6b5364b340`
- migration 0015: `e27abc3d37dc2297db9243f9356831deee89fb9c`
- concurrency proof harness: `3ebbc4446be8684d98036b0aae070fc678140bcd`

## How the TOCTOU window was closed

The remediation establishes a database-enforced Era content revision as the serialization boundary for closure evidence.

`drizzle/0015_era_closure_snapshot_consistency_r0.sql` adds `eras.content_revision` and PostgreSQL triggers that advance it for every normal INSERT/UPDATE/DELETE of snapshot-contributing Era memberships, sections, media, and Watchtower bindings. Product UPDATE/DELETE also advances every Era revision whose membership references that product.

`closeEra` now constructs the archive snapshot inside the same close transaction. Snapshot construction records and revalidates both `eras.updated_at` and `eras.content_revision`; the final ACTIVE → CLOSED transition also CASes both values.

This creates the required ordering:

- if a child mutation commits first, the Era revision advances and closure fails/retries closed; the transaction rolls back any tentative CLOSURE snapshot;
- if closure reaches its Era-row CAS first, a concurrent child trigger cannot commit its revision bump until closure completes, so that mutation is ordered after closure rather than silently preceding an already-stale snapshot.

No table-wide lock or artificial reproducer serialization was added.

## Disposable PostgreSQL proof

GitHub Actions:

- Workflow: `Acre Era Lifecycle Proof R0`
- Run: `37162032199`
- Job: `111317279690`
- PostgreSQL: 17
- Job result: **PASS**

The dedicated proof class was:

`DISPOSABLE_POSTGRESQL_CHILD_REVISION_CAS_CONCURRENCY`

It executed five synthetic concurrency cases against the frozen candidate:

1. product price update (the preserved 125 → 99 defect class);
2. Era product membership insert/phantom;
3. Era section update;
4. Era media update;
5. Watchtower binding update.

For every case:

- the child mutation committed before the first close completed;
- the Era content revision advanced from 4 to 5;
- the first close failed closed with `ERA_CHANGED_BEFORE_CLOSURE`;
- the Era remained ACTIVE;
- zero failed-close CLOSURE snapshots persisted;
- retry closed successfully and captured the committed mutation in the persisted snapshot.

The proof reported:

- stale accepted closure snapshots: **0**
- failed-close snapshots persisted: **0**
- product data covered: **true**
- membership phantom covered: **true**
- sections covered: **true**
- media covered: **true**
- Watchtower bindings covered: **true**
- committed mutation captured on retry: **true**

## Shared application-path and regression proof

The same exact candidate also passed the existing full lifecycle proof:

`ISOLATED_SYNTHETIC_FULL_LIFECYCLE_APPLICATION_PATH_POSTGRESQL_R1`

The shared production paths remained passing for readiness evaluation, activation, current-Era resolution, archive snapshot construction, close, archive, archived resolution, Watchtower signal ingestion, and customer alert evaluation.

The prior FC-01 future-`startAt` adversarial case remained closed. Archive refusal without a valid CLOSURE snapshot remained passing. PostgreSQL archive UPDATE/DELETE immutability remained enforced. Archived product history remained snapshot-backed. Current media-rights revocation continued to hide the current asset without mutating historical snapshot bytes. Signal collision, private-payload rejection, replay/idempotence, alert sanitization, and queue-only authority all remained passing.

Additional exact workflow results:

- TypeScript: **PASS**
- Era Engine regression: **PASS**
- archive/alert/activation regression: **15/15 PASS**
- Signal Bus regression: **12/12 PASS**

## Prior evidence preserved

FRC-01 invalidated only the missing concurrent-child transactional guarantee. It did not invalidate the prior FC-01 remediation or unrelated valid evidence.

Preserved prior evidence includes:

- original FC-01 remediation Builder run `37152908083`;
- earlier PostgreSQL evidence run `37148461532`;
- the FRC-01 failure evidence run `37154988141`, job `111296439748`;
- migration chain through `0014_watchtower_signal_bus_r0.sql`;
- the prior shared-path and future-start protections.

The readiness, resolver, Signal Bus, and alert-evaluator blobs are unchanged from the prior valid candidate.

## Safety boundary

Only the PR branch, GitHub Actions, disposable PostgreSQL 17, and synthetic data were used.

No Production database, Production migration, Production deployment, Vercel Production routing, real Era activation, real product publication, customer data, customer communication, supplier/fulfillment activation, order, or paid action occurred.

## Disposition

**Remediation Builder PASS.**

Freeze and challenge only candidate `571d24a00ff1fb1aa319b125bf793584c7f059a0` / tree `63209916cd87c3f88cbace8fc7d152d59cc2f016`.

Do **not** merge PR #15 based on Builder PASS alone. Proceed through the separate Fresh Re-Challenger activation:

`docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_FRESH_RECHALLENGER_ACTIVATION_AFTER_FRC01_REMEDIATION_2026-10-03.md`
