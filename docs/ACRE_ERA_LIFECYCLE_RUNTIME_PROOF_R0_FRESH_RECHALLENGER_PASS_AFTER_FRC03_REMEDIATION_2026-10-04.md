# Acre Era Lifecycle Runtime Proof R0 — Fresh Re-Challenger PASS After FRC-03 Remediation

**Date:** 2026-10-04  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15 — Acre Era Isolated Full Lifecycle Runtime Proof R0  
**Role:** new separate Fresh Re-Challenger  
**Result:** **PASS**

## Exact challenged candidate

- commit: `bcd245f48b125a4f6f875edda15077dc699f80e0`
- parent: `d3a044e96be8d0397825a8ec3e781b20b3bf6814`
- tree: `05509a76a76975d57275a34c6554a9c948876c83`

The evidence-only execution head was derived from that exact commit and changed only the Fresh Re-Challenger harness and its workflow invocation. Candidate application/database protection code was not modified during challenge.

## Governing fresh execution

- run: `37186503225`
- job: `111389429374`
- temporary evidence PR: #19
- PostgreSQL: `17.11 (Debian 17.11-1.pgdg13+2)`
- result: **SUCCESS**
- data: synthetic only
- database: disposable PostgreSQL 17 only

Raw evidence:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_FRESH_RECHALLENGER_PASS_RAW_EVIDENCE.json`

## Independent falsification result

The candidate survived the independent Fresh Re-Challenger attacks.

Direct lowering to zero, an older positive revision, negative UPDATE, negative INSERT, and CASE/expression lowering were rejected with SQLSTATE `23514`. A no-op revision write remained unchanged.

Trigger-order attacks that supplied a snapshot-field mutation and an explicit old revision in the same statement did not neutralize the revision:

- ordinary UPDATE: `0 -> 1`;
- CTE / UPDATE FROM: `0 -> 1`;
- PostgreSQL MERGE: `0 -> 1`;
- bulk multi-row UPDATE: every affected row stored revision `1`.

Savepoint reset was rejected with `23514`; rollback restored row and revision together. Child section INSERT/UPDATE advanced revision and the attempted reset was rejected.

The exact snapshot-gated story race was re-executed. The story mutation committed, the reset was rejected, the first closure failed with `ERA_CHANGED_BEFORE_CLOSURE`, zero CLOSURE snapshots persisted, the Era remained pre-close, and retry captured the committed mutation.

No SQL form executed produced snapshot-relevant committed state with final stored revision equal to or below its pre-snapshot revision.

## Preserved regression and archive evidence

The same governing fresh job also passed:

- full FRC-03 remediation matrix, including the complete child-state neutralization matrix;
- genuine FRC-02 21-case Era-row race proof, including concurrent Era/child mutation and two concurrent closeEra calls;
- FRC-01 child-state concurrency proof;
- full shared DRAFT -> ACTIVE -> CLOSED -> ARCHIVED application-path lifecycle proof;
- future-startAt rejection, readiness digest/CAS, archive refusal without valid CLOSURE evidence, immutable CLOSURE UPDATE/DELETE rejection, archived historical product resolution, current media-rights revocation, Watchtower ingestion, alert evaluation, replay/idempotence, same-key/different-payload collision rejection, and sensitive/private signal rejection;
- TypeScript PASS;
- Era Engine **11/11 PASS**;
- archive/alert/activation **15/15 PASS**;
- Signal Bus **12/12 PASS**.

Failed closure persisted zero stale CLOSURE snapshots, and retry captured committed state.

## Disposition

**AE-LRP-R0-FRC-03 is CLOSED by Fresh Re-Challenger PASS.**

The prior protections remain intact:

- `AE-LRP-R0-FRC-02`: preserved;
- `AE-LRP-R0-FRC-01`: preserved;
- `AE-LRP-R0-FC-01`: preserved.

This PASS does **not** authorize merge of PR #15 or Production action.

The next valid role is a **new separate Independent Assurance** worker against the same frozen candidate.
