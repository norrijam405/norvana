# Acre Era Lifecycle Runtime Proof R0 — Fresh Re-Challenger Activation After FRC-02 Remediation

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** **new separate Fresh Re-Challenger**

You are being activated after Remediation Builder PASS for:

`AE-LRP-R0-FRC-02 — CLOSURE_SNAPSHOT_ERA_ROW_MUTATION_NOT_COVERED_BY_REVISION_OR_UPDATED_AT_GUARD`

Do not ask Norris to reconstruct project history already preserved in GitHub.

## Challenge only this exact frozen remediation candidate

- commit: `29163ee7cdd31e732c3437b55bc63ed71fa8f294`
- parent: `dd888f81e90e93a6dc5c116e6a558e38e4156591`
- tree: `a4ad399e49bd1a37b8f834d47a6835632f8b2a87`

Do not challenge a later banking/documentation commit as though it were the remediation candidate.

## Read first

1. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_FRESH_RECHALLENGER_FAIL_AFTER_FRC01_REMEDIATION_2026-10-03.md`
2. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-02_RAW_EVIDENCE.json`
3. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-02_REPRO.mjs`
4. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_PASS_AFTER_FRC02_2026-10-03.md`
5. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-02_REMEDIATION_BUILDER_RAW_EVIDENCE.json`
6. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-02_REMEDIATION_BUILDER_PROOF.mjs`
7. `drizzle/0015_era_closure_snapshot_consistency_r0.sql`
8. `drizzle/0016_era_row_closure_snapshot_consistency_r0.sql`
9. `src/db/schema.ts`
10. `src/lib/era-engine/archive.ts`
11. `src/lib/era-engine/lifecycle-service.ts`
12. the relevant lifecycle, resolver, archive, Watchtower Signal Bus, alert-evaluator tests and migrations.

## Builder claim to falsify

The Builder claims that migration 0016 database-enforces a monotonic Era content revision for every mutable `eras` value serialized in the immutable CLOSURE snapshot, including direct SQL that omits `updated_at`.

The exact serialized Era-row set claimed covered is:

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

`watchtower_profile` is claimed not to contribute because the current archive builder does not serialize it.

The Builder further claims that FRC-01 child-state serialization and the original FC-01 production/shared lifecycle protections remain intact.

## Required fresh challenge

Use a **fresh disposable PostgreSQL 17 database** and synthetic data only.

Do not simply rerun the Builder's exact cases. Attempt to falsify the claim independently.

At minimum challenge:

- the exact original FRC-02 `story` race after snapshot construction;
- direct SQL mutation of every snapshot-contributing Era field;
- UPDATE statements that intentionally omit `updated_at`;
- updates that explicitly try to preserve, lower, or manipulate `content_revision`;
- multi-field UPDATEs;
- multiple sequential UPDATEs;
- lifecycle/visibility/primary combinations;
- JSON formatting/value changes in `theme_tokens` and `archive_policy`;
- primary-key/id mutation behavior;
- rollback/savepoint behavior;
- concurrent Era-row and child-row changes;
- concurrent product mutation across multiple Eras;
- membership INSERT/UPDATE/DELETE and phantom cases;
- section INSERT/UPDATE/DELETE;
- media INSERT/UPDATE/DELETE;
- Watchtower binding INSERT/UPDATE/DELETE;
- two or more concurrent closure attempts;
- mutation immediately after snapshot construction;
- mutation immediately before final closure CAS;
- attempts to create a stale persisted CLOSURE snapshot despite final CAS failure;
- retry semantics after committed mutation;
- archive immutability and archive refusal without valid CLOSURE evidence.

Probe trigger/CAS edge cases not used by the Builder, including unusual but ordinary SQL forms where PostgreSQL permits them.

## Required regression re-execution

Re-run and preserve:

- full shared application-path lifecycle proof;
- original FRC-01 child-state concurrency proof;
- future-`startAt` rejection;
- readiness digest/CAS behavior;
- archive snapshot UPDATE/DELETE immutability;
- archive refusal without a valid CLOSURE snapshot;
- archived historical product resolution;
- current media-rights revocation behavior;
- Watchtower signal ingestion and alert evaluation;
- replay/idempotence;
- same-key/different-payload collision rejection;
- sensitive/private signal rejection;
- TypeScript;
- Era Engine regression;
- archive/alert/activation regression;
- Signal Bus regression.

## Challenger role

You are the **Fresh Re-Challenger**, not the Builder and not Independent Assurance.

Do not modify the frozen candidate to make the challenge pass.

If a material defect is found:

1. preserve a new finding ID and title;
2. preserve the exact reproducer;
3. preserve raw PostgreSQL evidence;
4. bank a Fresh Re-Challenger FAIL receipt;
5. create a separate Remediation Builder activation;
6. stop before Independent Assurance.

If the frozen candidate survives:

1. freeze the exact challenged commit/tree and relevant blobs;
2. preserve fresh raw PostgreSQL evidence and all cases actually executed;
3. bank a Fresh Re-Challenger PASS receipt;
4. create a **new separate Independent Assurance activation**;
5. do not merge PR #15 based on Fresh Re-Challenger PASS alone.

## Governing Builder evidence

The Builder's governing run was:

- run: `37164520239`
- job: `111324603342`
- PostgreSQL: `17.11`
- Builder FRC-02 cases: 21
- result: **PASS**

Treat this only as a claim to challenge.

## Safety boundary

Do not merge PR #15, deploy Production, migrate Production, change Vercel Production routing, activate a real Era, publish a real product, use customer data, send customer communications, activate suppliers/fulfillment, place orders, spend money, enable paid infrastructure, or weaken authorization/evidence controls.

Use disposable PostgreSQL and synthetic data only.
