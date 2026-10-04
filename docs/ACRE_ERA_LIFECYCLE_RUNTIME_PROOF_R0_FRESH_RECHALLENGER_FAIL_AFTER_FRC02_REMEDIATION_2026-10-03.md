# Acre Era Lifecycle Runtime Proof R0 — Fresh Re-Challenger FAIL After FRC-02 Remediation

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15 — Acre Era Isolated Full Lifecycle Runtime Proof R0  
**Role:** new separate Fresh Re-Challenger  
**Result:** **FAIL**

## Exact challenged frozen candidate

- Commit: `29163ee7cdd31e732c3437b55bc63ed71fa8f294`
- Parent: `dd888f81e90e93a6dc5c116e6a558e38e4156591`
- Tree: `a4ad399e49bd1a37b8f834d47a6835632f8b2a87`

Relevant frozen blobs:

- migration 0015: `e27abc3d37dc2297db9243f9356831deee89fb9c`
- migration 0016: `174ce815b4c06f032cb4595d1ae190a2bf5aa0ff`
- schema: `a5aeab4ea17371d9f45bee71c8c31e6b5364b340`
- archive builder: `6fea9dc121c0c9a0ba706bb9f9673d99873d3f8b`
- lifecycle service: `fbdea16a48e6637b400c049167764338f52dbe13`

No remediation was performed by this Fresh Re-Challenger.

## New preserved finding

**ID:** `AE-LRP-R0-FRC-03`  
**Title:** `CONTENT_REVISION_DIRECT_RESET_NEUTRALIZES_CLOSURE_CAS`

Migration 0016 successfully makes an ordinary snapshot-field UPDATE advance `eras.content_revision`. However, `content_revision` itself is intentionally excluded from the trigger's `UPDATE OF` list.

That allows a direct SQL transaction to:

1. commit a snapshot-relevant mutation, causing the trigger to advance the revision;
2. issue a second `content_revision`-only UPDATE restoring the pre-snapshot revision;
3. preserve the old `updated_at`;
4. commit before `closeEra` completes;
5. let the final closure CAS see the original `updated_at` and `content_revision`;
6. transition the Era to `CLOSED` while persisting a stale pre-mutation CLOSURE snapshot.

This disproves the Builder claim that the Era content revision is database-enforced as monotonic against direct SQL manipulation.

## Fresh PostgreSQL 17 execution

Governing fresh execution:

- workflow: `Acre Era Lifecycle Proof R0`
- run: `37171279225`
- run number: `61`
- job: `111344552365`
- evidence-only execution head: `abc4ac957de8c3617f26609f9eb7eb6b3d29656c`
- PostgreSQL: `17.11 (Debian 17.11-1.pgdg13+2)`
- Node: `22.23.3`
- data: synthetic only
- database: disposable PostgreSQL 17 only

Temporary execution PR #17 was used only to trigger the disposable database workflow. It was closed unmerged after execution.

Reproducer:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_REPRO.mjs`

Raw evidence:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_FRESH_RECHALLENGER_RAW_EVIDENCE.json`

## Decisive runtime observations

The no-reset control behaved correctly: the story mutation advanced the revision, closure rejected with `ERA_CHANGED_BEFORE_CLOSURE`, and zero CLOSURE snapshots persisted.

The revision-neutralization attacks then reproduced stale accepted closure state across multiple ordinary PostgreSQL forms:

- `UPDATE ONLY` story mutation + direct revision reset;
- CTE / `UPDATE ... FROM` name mutation + reset;
- PostgreSQL `MERGE WHEN MATCHED THEN UPDATE` of `theme_tokens` + reset;
- multi-field `archive_policy` / eyebrow / kind / start_at UPDATE + reset;
- child section UPDATE + direct Era revision reset.

For the story case:

- revision before snapshot-field mutation: `0`;
- revision after mutation trigger: `1`;
- revision after direct reset: `0`;
- `updated_at` remained unchanged;
- mutation committed before close completed;
- Era reached `CLOSED`;
- one CLOSURE snapshot persisted;
- snapshot story: `before-story`;
- live story: `after-story`;
- stale accepted: **true**.

The child-section case likewise changed revision `1 -> 2 -> 1`, then closed with snapshot headline `before` while live headline was `after`.

This matches the material FAIL state exactly: a mutation committed before close completed, the Era reached `CLOSED`, and the persisted CLOSURE snapshot retained stale pre-mutation state.

## What remains valid

The same fresh PostgreSQL 17 job re-ran the ordinary FRC-01 child-write proof. Product update, membership insert, section update, media update, and Watchtower binding update all failed stale closure closed and captured committed state on retry.

That evidence is narrower than the previous blanket guarantee: **ordinary FRC-01 child revision/CAS behavior remains valid, but FRC-03 proves that direct manipulation of `eras.content_revision` can neutralize that child-write guard as well.**

The original FRC-02 no-reset story race is also closed by migration 0016. A dedicated fresh run, `37171279219` / job `111344552518`, reached `ERA_CHANGED_BEFORE_CLOSURE` when attempting the old FRC-02 reproducer.

FC-01/shared application-path protections remain intact. The same governing job passed the full synthetic DRAFT -> ACTIVE -> CLOSED -> ARCHIVED lifecycle, readiness digest/CAS checks, future-start rejection, archive refusal without CLOSURE evidence, CLOSURE UPDATE/DELETE immutability, archived historical product resolution, current media-rights revocation, Watchtower ingestion, alert evaluation, replay/idempotence, same-key/different-payload collision rejection, and sensitive/private signal rejection.

Regression results from the same governing job:

- TypeScript: **PASS**
- Era Engine: **11/11 PASS**
- archive/alert/activation: **15/15 PASS**
- Signal Bus: **12/12 PASS**

## Safety boundary

Synthetic data and disposable PostgreSQL 17 only.

No Production database, Production migration, Production deployment, Vercel Production routing, real Era activation, real product publication, customer data, customer communication, supplier/fulfillment action, order, money spend, paid infrastructure activation, or PR #15 merge occurred.

## Disposition

**Fresh Re-Challenger FAIL.**

Do not advance candidate `29163ee7cdd31e732c3437b55bc63ed71fa8f294` to Independent Assurance and do not merge PR #15.

Proceed only through the new separate Remediation Builder activation:

`docs/ACRE_ERA_LIFECYCLE_RUNTIME_PROOF_R0_REMEDIATION_BUILDER_ACTIVATION_AFTER_FRC03_FAIL_2026-10-03.md`
