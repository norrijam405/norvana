# Acre Era Lifecycle Runtime Proof R0 — Fresh Re-Challenger FAIL After FRC-01 Remediation

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** new separate Fresh Re-Challenger  
**Result:** **FAIL**

## Exact challenged remediation candidate

- Commit: `571d24a00ff1fb1aa319b125bf793584c7f059a0`
- Parent: `718e73d23a0c3d691b7bd994cf6462ce32686255`
- Tree: `63209916cd87c3f88cbace8fc7d152d59cc2f016`

The application code challenged remained byte-identical to the frozen candidate:

- lifecycle service: `fbdea16a48e6637b400c049167764338f52dbe13`
- archive builder: `6fea9dc121c0c9a0ba706bb9f9673d99873d3f8b`
- schema: `a5aeab4ea17371d9f45bee71c8c31e6b5364b340`
- migration 0015: `e27abc3d37dc2297db9243f9356831deee89fb9c`

No remediation was performed by this Challenger.

## New preserved finding

**ID:** `AE-LRP-R0-FRC-02`  
**Title:** `CLOSURE_SNAPSHOT_ERA_ROW_MUTATION_NOT_COVERED_BY_REVISION_OR_UPDATED_AT_GUARD`

The FRC-01 remediation successfully added an Era-level `content_revision` serialization boundary for child rows and referenced product mutations. However, the immutable CLOSURE snapshot also contains mutable fields from the `eras` row itself, including `story`.

Migration `0015_era_closure_snapshot_consistency_r0.sql` does not advance `content_revision` for ordinary direct changes to snapshot-contributing `eras` fields, and `updated_at` is not database-maintained on every UPDATE. `closeEra` also does not lock the Era row before building the snapshot.

A direct Era-row mutation can therefore commit after snapshot construction but before closure completes while leaving both final CAS guards unchanged.

## Fresh PostgreSQL 17 reproduction

Fresh GitHub Actions execution:

- Workflow: `Acre Era Lifecycle Proof R0`
- Run: `37163093230`
- Job: `111320422171`
- PostgreSQL: `17.11 (Debian 17.11-1.pgdg13+2)`
- Synthetic data only
- Disposable database only

Reproducer:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-02_REPRO.mjs`

The reproducer held `era_archive_snapshots` with an `ACCESS EXCLUSIVE` lock so production `closeEra` completed its snapshot reads and blocked immediately before snapshot persistence/final Era CAS. While closure was blocked, a separate connection committed:

`UPDATE eras SET story='after-snapshot-before-close' ...`

Observed:

- closure snapshot persistence was demonstrably blocked;
- the Era-row mutation committed before close completed;
- `updated_at` remained `2026-10-03T23:50:00.000Z`;
- `content_revision` remained `0`;
- neither closure CAS guard changed;
- the Era nevertheless transitioned to `CLOSED`;
- persisted CLOSURE snapshot story: `before-snapshot`;
- live Era story at close completion: `after-snapshot-before-close`;
- snapshot digest: `c72016592b2503af19e41d1250f89b8ba0cfef3b06ede29ca34fd2b5388db421`;
- reproducer status: **REPRODUCED**.

This is a material closure-evidence consistency defect. The frozen candidate cannot be banked as Fresh Re-Challenger PASS.

## Prior guarantees preserved

The same fresh run also passed the protections that were already established:

- FRC-01 child-state revision/CAS concurrency proof: **PASS**;
- full shared application-path lifecycle proof: **PASS**;
- TypeScript: **PASS**;
- Era Engine regression: **PASS**;
- archive/alert/activation regression: **15/15 PASS**;
- Signal Bus regression: **12/12 PASS**.

Therefore FRC-02 does not discard valid prior evidence. It narrows the remaining gap to snapshot-contributing mutations of the Era row itself that can bypass both `updated_at` and `content_revision`.

## Safety boundary

The challenge used only synthetic data and disposable PostgreSQL 17.

No Production database, Production migration, Production deployment, Vercel Production routing, real Era activation, real product publication, customer data, customer communication, supplier/fulfillment action, order, or paid action occurred.

## Disposition

**Fresh Re-Challenger FAIL.**

Do not merge PR #15 and do not treat candidate `571d24a00ff1fb1aa319b125bf793584c7f059a0` as assured.

Proceed only through the separate Remediation Builder activation:

`docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_ACTIVATION_AFTER_FRC02_FAIL_2026-10-03.md`
