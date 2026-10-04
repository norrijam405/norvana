# Acre Era Lifecycle Runtime Proof R0 — Fresh Re-Challenger Activation After FRC-01 Remediation

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** **new separate Fresh Re-Challenger**

You are being activated after Remediation Builder PASS for:

`AE-LRP-R0-FRC-01 — CLOSURE_SNAPSHOT_TOCTOU_CHILD_MUTATION_NOT_COVERED_BY_ERA_CAS`

You are the Fresh Re-Challenger, not the Remediation Builder. Do not modify the candidate unless a new failure is first preserved and a separate remediation lane is activated. Do not issue assurance for any candidate other than the exact frozen candidate below.

Do not ask Norris to reconstruct history already preserved in GitHub.

## Challenge only this frozen remediation candidate

- Commit: `571d24a00ff1fb1aa319b125bf793584c7f059a0`
- Parent: `718e73d23a0c3d691b7bd994cf6462ce32686255`
- Tree: `63209916cd87c3f88cbace8fc7d152d59cc2f016`

Do **not** challenge the later documentation/evidence banking commit as though it were the remediation candidate.

## Read first

1. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_PASS_AFTER_FRC01_2026-10-03.md`
2. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-01_REMEDIATION_BUILDER_RAW_EVIDENCE.json`
3. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_FRESH_RECHALLENGER_FAIL_AFTER_FC01_REMEDIATION_2026-10-03.md`
4. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-01_RAW_EVIDENCE.json`
5. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-01_REPRO.mjs`
6. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-01_REMEDIATION_BUILDER_PROOF.mjs`
7. `drizzle/0015_era_closure_snapshot_consistency_r0.sql`
8. `src/db/schema.ts`
9. `src/lib/era-engine/lifecycle-service.ts`
10. `src/lib/era-engine/archive.ts`
11. the relevant lifecycle, archive, resolver, Watchtower Signal Bus, alert-evaluator tests and migrations.

## Builder claim to challenge

The remediation uses a database-enforced monotonic `eras.content_revision` as the common serialization boundary for every child state included in the closure snapshot.

Normal child DML advances the owning Era revision through PostgreSQL triggers. Product UPDATE/DELETE advances each Era whose membership references the product. `closeEra` builds the snapshot inside the same closure transaction, revalidates `updated_at` and `content_revision`, and CASes both on the ACTIVE → CLOSED transition.

The Builder claims that a child mutation that commits before closure must either be captured by a retry or force the current close to fail closed, and that a mutation cannot commit before closure while escaping the snapshot.

## Required independent challenge

Use a **fresh disposable PostgreSQL 17 database** and **synthetic data only**.

At minimum independently attempt:

- the exact preserved FRC-01 product-price race (snapshot price 125 versus concurrent committed live price 99);
- direct SQL product mutation affecting an Era membership;
- concurrent Era product membership insertion, including the phantom-row class;
- concurrent Era product membership update/delete where meaningful;
- concurrent Era section insertion/update/delete;
- concurrent Era media insertion/update/delete;
- concurrent Watchtower binding insertion/update/delete;
- mutations timed before snapshot construction, during child reads, and while closure is attempting its final Era CAS;
- any ordinary-DML route that could change snapshot-contributing state without advancing the Era content revision;
- multi-Era product membership behavior, including whether product mutation advances all affected Era revisions without deadlock-prone inconsistent ordering.

The result must establish that no child mutation can commit before closure completion and leave a silently stale accepted CLOSURE snapshot.

A valid outcome may be either:

- closure captures the already-committed child mutation; or
- closure detects the revision/race and fails or retries closed.

It is not valid for closure to accept a snapshot that is stale relative to a child mutation committed before closure completes.

## Preserve and re-check prior guarantees

Also independently confirm that the remediation did not regress:

- PostgreSQL archive snapshot UPDATE/DELETE immutability;
- archive refusal without a valid persisted CLOSURE snapshot;
- archived historical product resolution;
- current media-rights revocation behavior;
- the original FC-01 future-`startAt` adversarial case;
- shared production/application lifecycle paths;
- readiness digest/CAS behavior;
- Watchtower signal ingestion and alert evaluation;
- replay/idempotence and same-key/different-payload collision rejection;
- sensitive/private signal rejection;
- TypeScript;
- Era Engine regressions;
- archive/alert/activation regressions;
- Signal Bus regressions.

## Independence rule

Do not treat Builder run `37162032199` / job `111317279690` as your independent proof. It is context only.

Produce fresh execution evidence from your own run and preserve the exact candidate commit, parent, tree, PostgreSQL version, commands/cases, raw outputs, run/job identifiers, and any new finding.

If the candidate passes, bank a **Fresh Re-Challenger PASS** receipt for this exact candidate only.

If a material defect is found, bank a **Fresh Re-Challenger FAIL** with a new preserved finding and stop. Do not remediate it in the challenger role.

## Safety boundary

Do not merge PR #15, deploy Production, migrate Production, change Vercel Production routing, activate a real Era, publish a real product, use customer data, send notifications, activate suppliers/fulfillment, place orders, spend money, or weaken evidence/authorization controls.

Use disposable PostgreSQL and synthetic data only.
