# Acre Era Lifecycle Runtime Proof R0 — Remediation Builder PASS After FRC-02

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** separate Remediation Builder  
**Result:** **REMEDIATION BUILDER PASS**

This is a Builder result only. It is **not** a Fresh Re-Challenger or Independent Assurance result and does not authorize merge or Production action.

## Preserved finding

`AE-LRP-R0-FRC-02 — CLOSURE_SNAPSHOT_ERA_ROW_MUTATION_NOT_COVERED_BY_REVISION_OR_UPDATED_AT_GUARD`

The failed candidate could build a CLOSURE snapshot, allow a direct mutation of snapshot-relevant `eras` metadata such as `story` to commit before closure completed, and still accept the stale snapshot because neither `updated_at` nor `content_revision` necessarily changed.

## Frozen remediation candidate

Challenge only this exact candidate:

- commit: `29163ee7cdd31e732c3437b55bc63ed71fa8f294`
- parent: `dd888f81e90e93a6dc5c116e6a558e38e4156591`
- tree: `a4ad399e49bd1a37b8f834d47a6835632f8b2a87`

The parent relationship was independently reconciled as exactly one commit ahead of `dd888f81e90e93a6dc5c116e6a558e38e4156591`.

Relevant frozen blobs:

- migration 0015: `e27abc3d37dc2297db9243f9356831deee89fb9c`
- migration 0016: `174ce815b4c06f032cb4595d1ae190a2bf5aa0ff`
- FRC-02 Builder proof: `3ec3c65ea2b2f481b89f42a9bdd5b7818c910311`
- workflow: `2231c65a1886010d98c2f115931e43cd686a7d1b`
- archive/alert regression: `6e585d412ae7d2b23299956531c7ea2716dba4bc`
- schema: `a5aeab4ea17371d9f45bee71c8c31e6b5364b340`
- archive builder: `6fea9dc121c0c9a0ba706bb9f9673d99873d3f8b`
- lifecycle service: `fbdea16a48e6637b400c049167764338f52dbe13`
- raw Builder evidence: `26ce2c7d8a3025b20e9ab979574af21df7f05990`

Raw evidence:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-02_REMEDIATION_BUILDER_RAW_EVIDENCE.json`

## Remediation

A new PostgreSQL migration, `drizzle/0016_era_row_closure_snapshot_consistency_r0.sql`, installs:

- function `bump_era_content_revision_from_snapshot_fields()`;
- trigger `eras_bump_content_revision_on_snapshot_fields`.

The trigger executes before UPDATE of every `eras` column represented in the immutable closure snapshot other than `content_revision` itself. When any represented value actually changes, the database enforces:

`NEW.content_revision = GREATEST(NEW.content_revision, OLD.content_revision + 1)`

This closes the bypass where direct SQL omitted `updated_at`. The existing `closeEra` transaction still builds the snapshot transactionally and finalizes only when both the observed `updated_at` and `content_revision` CAS operands still match.

The exact serialized Era-row columns reconciled and covered are:

- `id`
- `slug`
- `name`
- `eyebrow`
- `story`
- `kind`
- `lifecycle_state`
- `visibility`
- `is_primary`
- `start_at`
- `end_at`
- `theme_tokens`
- `archive_policy`
- `content_revision`
- `created_at`
- `updated_at`

`watchtower_profile` is present on the live `eras` row but is not serialized into `ACRE_ERA_ARCHIVE_SNAPSHOT_R0`, so it is not a closure-snapshot contributor in this candidate.

`content_revision` is already an explicit final CAS operand; direct mutation of it therefore invalidates closure even without recursively firing the snapshot-field trigger.

## Governing disposable PostgreSQL proof

Exact-head GitHub Actions execution:

- workflow: `Acre Era Lifecycle Proof R0`
- run: `37164520239`
- job: `111324603342`
- run number: `54`
- checkout: exact PR head SHA, not synthetic merge commit
- PostgreSQL: `17.11 (Debian 17.11-1.pgdg13+2)`
- Node: `22.23.3`
- data: synthetic only
- database: disposable PostgreSQL 17 only

The dedicated proof class was:

`DISPOSABLE_POSTGRESQL_ERA_ROW_REVISION_CAS_CONCURRENCY`

It executed **21 adversarial cases** and returned **PASS**.

Covered cases include:

- exact FRC-02 `story` mutation after snapshot construction;
- `slug`;
- `name`;
- `eyebrow`;
- `kind`;
- `visibility`;
- `is_primary`;
- `start_at`;
- `end_at`;
- `theme_tokens`;
- `archive_policy`;
- `created_at`;
- `updated_at`;
- direct `content_revision` mutation;
- `lifecycle_state`;
- multiple Era fields in one UPDATE;
- multiple sequential Era changes;
- primary/visibility/lifecycle-related changes;
- direct primary-key/id movement;
- rollback of a trigger-fired mutation;
- concurrent Era-row plus child-row mutation;
- two concurrent closure attempts.

For the exact stale-snapshot class and representative field races:

- closure reached snapshot persistence;
- the direct mutation committed before the first close completed;
- the database guard advanced or changed a final CAS operand;
- the first close failed closed;
- the Era did not transition through a stale accepted snapshot;
- zero failed-close CLOSURE snapshots persisted;
- retry captured the committed mutation;
- application-path close continued to advance the Era revision.

The proof reported:

- exact FRC-02 story race closed: **true**
- direct SQL omitting `updated_at` covered: **true**
- all serialized mutable Era fields covered: **true**
- multi-field changes covered: **true**
- sequential changes covered: **true**
- concurrent Era + child changes covered: **true**
- rollback covered: **true**
- two concurrent close attempts covered: **true**
- failed-close snapshots persisted: **0**
- retry captures committed mutation: **true**

## FRC-01 protection preserved

The exact same candidate re-ran:

`DISPOSABLE_POSTGRESQL_CHILD_REVISION_CAS_CONCURRENCY`

Result: **PASS**

Preserved guarantees:

- stale accepted child-state closure snapshots: **0**
- failed-close CLOSURE snapshots persisted: **0**
- product data covered: **true**
- membership phantom covered: **true**
- sections covered: **true**
- media covered: **true**
- Watchtower bindings covered: **true**
- committed child mutation captured on retry: **true**

This preserves:

`AE-LRP-R0-FRC-01 — CLOSURE_SNAPSHOT_TOCTOU_CHILD_MUTATION_NOT_COVERED_BY_ERA_CAS`

including product mutation; membership INSERT/UPDATE/DELETE and phantom ordering; sections; media; Watchtower bindings; child revision CAS; transactional snapshot construction; retry semantics; and zero stale accepted child-state snapshots.

## FC-01 and shared production-path protections preserved

The exact same candidate passed:

`ISOLATED_SYNTHETIC_FULL_LIFECYCLE_APPLICATION_PATH_POSTGRESQL_R1`

Observed lifecycle:

`DRAFT -> ACTIVE -> CLOSED -> ARCHIVED`

Shared production paths remained PASS for:

- readiness evaluation;
- activation;
- current public resolver;
- archive snapshot construction;
- close;
- archive;
- archived public resolution;
- Watchtower signal ingestion;
- alert evaluation.

Adversarial protections remained PASS for:

- mismatched readiness digest rejection;
- stale readiness after mutation rejection;
- archive refusal without valid CLOSURE snapshot;
- same-key/different-payload signal collision rejection;
- sensitive/private signal rejection;
- alert payload sanitization;
- replay/idempotence;
- archived historical product resolution;
- current media-rights revocation behavior;
- future-`startAt` rejection;
- ambiguous primary database guard;
- queue-only authority with zero external notifications.

This preserves the original FC-01 remediation and does not replace or weaken it.

## Regression results

On the exact frozen candidate:

- TypeScript: **PASS**
- Era Engine: **11/11 PASS**
- archive/alert/activation: **15/15 PASS**
- Signal Bus: **12/12 PASS**

Archive snapshot UPDATE/DELETE immutability and archive refusal without a valid persisted CLOSURE snapshot remain covered by the shared runtime and regression suite.

## Non-governing setup run

Run `37164288089` failed before Builder execution because the branch still contained a preserved Fresh Re-Challenger step whose purpose was to require the old FRC-02 reproducer to reproduce. Once the defect was remediated, that Challenger-only step correctly stopped reproducing and therefore exited nonzero. The preserved reproducer and FAIL evidence were not altered; only the stale Challenger execution hook was removed from the Builder workflow.

That setup run is **not** the governing Builder result.

## Safety boundary

Only repository changes, GitHub Actions, synthetic data, and disposable PostgreSQL 17 were used.

No Production database, Production migration, Production deployment, Vercel Production routing, real Era activation, real product publication, customer data, customer communication, supplier/fulfillment activation, order, money spend, or paid infrastructure activation occurred.

## Disposition

**REMEDIATION BUILDER PASS.**

Do **not** merge PR #15 based on Builder PASS alone.

The next valid step is a **new separate Fresh Re-Challenger** against only:

`29163ee7cdd31e732c3437b55bc63ed71fa8f294`

tree:

`a4ad399e49bd1a37b8f834d47a6835632f8b2a87`

The Fresh Re-Challenger must treat the Builder receipt and raw evidence as claims to falsify, not as assurance.
