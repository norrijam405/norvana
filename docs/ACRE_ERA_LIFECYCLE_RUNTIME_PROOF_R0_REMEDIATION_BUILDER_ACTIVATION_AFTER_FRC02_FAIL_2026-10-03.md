# Acre Era Lifecycle Runtime Proof R0 — Remediation Builder Activation After FRC-02 FAIL

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** **separate Remediation Builder**

You are being activated to remediate the preserved finding:

`AE-LRP-R0-FRC-02 — CLOSURE_SNAPSHOT_ERA_ROW_MUTATION_NOT_COVERED_BY_REVISION_OR_UPDATED_AT_GUARD`

Do not ask Norris to reconstruct project history already preserved in GitHub.

## Exact failed candidate

- Commit: `571d24a00ff1fb1aa319b125bf793584c7f059a0`
- Parent: `718e73d23a0c3d691b7bd994cf6462ce32686255`
- Tree: `63209916cd87c3f88cbace8fc7d152d59cc2f016`

## Read first

1. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_FRESH_RECHALLENGER_FAIL_AFTER_FRC01_REMEDIATION_2026-10-03.md`
2. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-02_RAW_EVIDENCE.json`
3. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-02_REPRO.mjs`
4. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_PASS_AFTER_FRC01_2026-10-03.md`
5. `drizzle/0015_era_closure_snapshot_consistency_r0.sql`
6. `src/db/schema.ts`
7. `src/lib/era-engine/lifecycle-service.ts`
8. `src/lib/era-engine/archive.ts`
9. the relevant lifecycle, archive, resolver, Watchtower Signal Bus, alert-evaluator tests and migrations.

## Preserved defect

The CLOSURE snapshot contains mutable fields from the `eras` row. The failed candidate serializes child-row and referenced-product mutations through `eras.content_revision`, but ordinary direct SQL can change snapshot-contributing Era metadata without changing `updated_at` or `content_revision`.

The Fresh Re-Challenger proved that an Era `story` mutation committed after snapshot construction and before close completion, yet the final close CAS accepted the stale snapshot and transitioned the Era to CLOSED.

Fresh evidence:

- run: `37163093230`
- job: `111320422171`
- PostgreSQL: `17.11`
- stale snapshot story: `before-snapshot`
- live story at close completion: `after-snapshot-before-close`
- both `updated_at` and `content_revision` unchanged
- status: `REPRODUCED`

## Required remediation invariant

Closure must serialize **all snapshot-contributing state**, including the Era row itself.

For every ordinary database write route capable of changing a field represented in the CLOSURE snapshot, if that mutation commits before closure completes then closure must either:

- capture the committed mutation in the authoritative snapshot; or
- detect/order against the mutation and fail/retry closed.

It must be impossible for closure to accept a snapshot that is stale relative to a snapshot-contributing Era-row mutation committed before close completion.

A row-level lock held before snapshot construction is one possible design, but it is not mandated. Any remediation must be database-enforced, evidence-backed, and compatible with the existing child-revision guarantees.

## Required Builder proof

Use a fresh disposable PostgreSQL 17 database and synthetic data only.

At minimum prove:

- the exact FRC-02 `eras.story` race is closed;
- representative direct Era-row mutations for every snapshot-contributing mutable Era field are serialized or detected;
- the prior FRC-01 product-price 125 → 99 race remains closed;
- membership insert/update/delete and phantom-row cases remain closed;
- section insert/update/delete remains closed;
- media insert/update/delete remains closed;
- Watchtower binding insert/update/delete remains closed;
- multi-Era product mutation remains safe and avoids inconsistent lock ordering;
- failed closure attempts persist zero authoritative CLOSURE snapshots;
- retries capture already-committed changes where retry is the intended behavior.

Also re-run and preserve:

- full shared application-path lifecycle proof;
- PostgreSQL archive snapshot UPDATE/DELETE immutability;
- archive refusal without a valid CLOSURE snapshot;
- archived historical product resolution;
- current media-rights revocation behavior;
- original FC-01 future-`startAt` adversarial case;
- readiness digest/CAS behavior;
- Watchtower signal ingestion and alert evaluation;
- replay/idempotence and same-key/different-payload collision rejection;
- sensitive/private signal rejection;
- TypeScript;
- Era Engine regressions;
- archive/alert/activation regressions;
- Signal Bus regressions.

## Builder disposition

If remediation passes, freeze the exact candidate commit, parent, tree, relevant blobs, commands, PostgreSQL version, run/job IDs, and raw outputs.

Then create a **new separate Fresh Re-Challenger activation** for that frozen candidate. Builder PASS alone does not authorize merge.

If another material defect is found while building, preserve it explicitly rather than silently weakening the proof.

## Safety boundary

Do not merge PR #15, deploy Production, migrate Production, change Vercel Production routing, activate a real Era, publish a real product, use customer data, send notifications, activate suppliers/fulfillment, place orders, spend money, or weaken evidence/authorization controls.

Use disposable PostgreSQL and synthetic data only.
