# Acre Era Lifecycle Runtime Proof R0 — Fresh Re-Challenger Activation After FRC-03 Remediation

**Date:** 2026-10-04  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15  
**Role:** **new separate Fresh Re-Challenger**

You are being activated for preserved finding:

`AE-LRP-R0-FRC-03 — CONTENT_REVISION_DIRECT_RESET_NEUTRALIZES_CLOSURE_CAS`

Do not ask Norris to reconstruct history already preserved in GitHub.

## Challenge only this exact frozen remediation candidate

- commit: `bcd245f48b125a4f6f875edda15077dc699f80e0`
- parent: `d3a044e96be8d0397825a8ec3e781b20b3bf6814`
- tree: `05509a76a76975d57275a34c6554a9c948876c83`

Do not challenge a later evidence-receipt commit.

## Read first

1. `docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_PASS_AFTER_FRC03_2026-10-04.md`
2. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_REMEDIATION_BUILDER_RAW_EVIDENCE.json`
3. `drizzle/0017_era_content_revision_monotonicity_r0.sql`
4. `challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_REMEDIATION_BUILDER_PROOF.mjs`
5. preserved FRC-03 FAIL receipt and reproducer
6. migrations 0015 and 0016
7. `src/lib/era-engine/archive.ts`
8. `src/lib/era-engine/lifecycle-service.ts`
9. `src/db/schema.ts`
10. full shared lifecycle proof and relevant Era Engine/archive/Watchtower/alert tests.

## Builder claim to falsify

The Builder claims that direct SQL can no longer make committed snapshot-relevant state observationally equivalent to an older state by editing `eras.content_revision`.

The candidate adds database enforcement that:

- rejects negative revisions;
- rejects any `UPDATE` that would make `NEW.content_revision < OLD.content_revision`;
- preserves 0015 child-state revision bumps;
- preserves 0016 Era-row snapshot-field revision bumps;
- preserves final `updated_at + content_revision` closure CAS behavior.

Do not accept this claim without independent adversarial execution.

## Required fresh challenge

Use a fresh disposable PostgreSQL 17 database and synthetic data only.

Attempt to falsify monotonicity and closure truth using at least:

- exact FRC-03 story mutation + reset race;
- direct lowering;
- exact prior revision restore;
- older positive value;
- below-zero value and insert if schema permits;
- same-transaction reset;
- later committed reset;
- ordinary UPDATE;
- UPDATE ONLY;
- CTE / UPDATE FROM;
- PostgreSQL MERGE;
- multi-field mutation;
- sequential mutations;
- lifecycle/visibility/primary mutations;
- rollback and savepoints;
- concurrent direct revision writes;
- concurrent Era-row + child-row mutation;
- mutation immediately after snapshot construction;
- mutation immediately before final closure CAS;
- two or more concurrent `closeEra` calls;
- stale snapshot persistence after failed CAS;
- retry after committed mutation.

Re-challenge child-state neutralization after membership, section, media, Watchtower-binding, and referenced-product mutations, including INSERT/UPDATE/DELETE where applicable and one-product-to-multiple-Eras behavior.

## Preserve regression challenge

Re-run and attempt to falsify:

- FRC-02 no-reset Era-row protection;
- FRC-01 child-state closure protection;
- FC-01 shared production application path;
- future-`startAt` rejection;
- readiness digest/CAS;
- immutable CLOSURE UPDATE/DELETE rejection;
- archive refusal without valid CLOSURE evidence;
- archived historical product resolution;
- current media-rights revocation;
- Watchtower signal ingestion;
- alert evaluation;
- replay/idempotence;
- same-key/different-payload rejection;
- sensitive/private signal rejection;
- TypeScript;
- Era Engine;
- archive/alert/activation;
- Signal Bus.

## Role boundary

You are the Fresh Re-Challenger, not the Remediation Builder and not Independent Assurance.

If the exact candidate survives, bank a Fresh Re-Challenger PASS receipt and create a new separate Independent Assurance activation.

If any bypass is found, preserve a new finding and FAIL the candidate. Do not self-remediate in the same role.

## Hard safety boundary

Do not merge PR #15, deploy or migrate Production, change Production routing, activate a real Era, publish real products, use customer data, send customer communications, activate suppliers/fulfillment, place orders, spend money, enable paid infrastructure, or weaken evidence/authorization controls.

Use disposable PostgreSQL 17 and synthetic data only.
