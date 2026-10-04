# Acre Era Lifecycle Runtime Proof R0 — Independent Assurance PASS After FRC-03 Fresh Re-Challenger PASS

**Date:** 2026-10-04  
**Repository:** `norrijam405/norvana`  
**Pull Request:** #15 — Acre Era Isolated Full Lifecycle Runtime Proof R0  
**Role:** new separate Independent Assurance  
**Result:** **PASS**

## Exact assured candidate

- commit: `bcd245f48b125a4f6f875edda15077dc699f80e0`
- parent: `d3a044e96be8d0397825a8ec3e781b20b3bf6814`
- tree: `05509a76a76975d57275a34c6554a9c948876c83`

The assurance execution branch changed only evidence harness/workflow material derived from the frozen candidate. The candidate application/database protection code was not remediated or modified during assurance.

## Governing Independent Assurance execution

- evidence execution head: `4e848853fd39e505119837b0e8c7f99a76875ccc`
- evidence-only draft PR: #20
- workflow run: `37193547983`
- job: `111410580520`
- PostgreSQL: `17.11 (Debian 17.11-1.pgdg13+2)`
- data: synthetic only
- database: disposable PostgreSQL 17 only
- conclusion: **SUCCESS**

Raw evidence:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_INDEPENDENT_ASSURANCE_PASS_RAW_EVIDENCE.json`

Independent execution harness:

`challenge/acre-era-lifecycle-r0/AE-LRP-R0-FRC-03_INDEPENDENT_ASSURANCE_EXECUTION.mjs`

Two earlier PR #20 runs were non-governing harness failures, not candidate failures: run `37193430041` used a string fixture for integer Watchtower importance; run `37193490259` hit an assurance-script local variable binding error after substantive probes. Both were corrected only in evidence harness code. The frozen candidate remained unchanged.

## Independent assurance findings

The frozen candidate independently prevented direct revision regression. Lowering to zero, restoring an older positive value, negative UPDATE, negative INSERT, and CASE/expression regression were rejected with SQLSTATE `23514`. No-op writes remained harmless and legitimate monotonic increases remained functional.

Independent trigger-order attacks could not neutralize snapshot-field revision advancement using ordinary UPDATE, UPDATE FROM/CTE, or MERGE. The same fresh governing job also re-executed the Fresh Re-Challenger bulk multi-row and same-statement matrix successfully.

Transaction behavior remained coherent: multiple revision-producing writes advanced monotonically; savepoint reset was rejected with `23514`; rollback restored row and revision together.

Independent child-state probes verified INSERT/UPDATE/DELETE revision advancement for sections, media assets, and Watchtower bindings. Membership mutation and referenced product mutation affecting two Eras advanced the appropriate Era revisions and could not be reset backward. The same governing job re-ran the complete FRC-03 child neutralization matrix.

The independently constructed closure race committed a snapshot-relevant Era mutation before closure completion, rejected the attempted revision reset, failed the first close with `ERA_CHANGED_BEFORE_CLOSURE`, persisted **zero** CLOSURE snapshots on the failed close, kept the Era ACTIVE, and on retry captured the committed mutation. No state with committed mutation + CLOSED Era + stale CLOSURE snapshot was observed.

## Preserved protections and regressions

The governing job passed:

- FRC-03 Fresh Re-Challenge;
- FRC-03 Remediation Builder matrix;
- genuine FRC-02 21-case Era-row closure proof;
- FRC-01 child-state closure proof;
- full shared DRAFT → ACTIVE → CLOSED → ARCHIVED application-path lifecycle proof;
- TypeScript;
- Era Engine **11/11**;
- archive/alert/activation **15/15**;
- Signal Bus **12/12**.

The shared lifecycle and archive regression evidence preserved CLOSURE snapshot immutability, archive refusal without valid CLOSURE evidence, historical archived product-state immutability, current media-rights revocation behavior, future-`startAt` rejection, readiness digest/CAS behavior, Watchtower ingestion/evaluation, replay/idempotence, collision rejection, and sensitive/private signal rejection.

## Disposition

**AE-LRP-R0-FRC-03 is independently assured CLOSED.**

Prior protections remain intact:

- `AE-LRP-R0-FRC-02`: intact;
- `AE-LRP-R0-FRC-01`: intact;
- `AE-LRP-R0-FC-01`: intact.

This Independent Assurance PASS does **not** authorize merge of PR #15 or any Production action. The preserved activation does not itself authorize a later merge/production step, so no merge, deployment, migration, routing change, real Era/product activation, customer communication, supplier/fulfillment action, order, spend, or paid infrastructure action was performed.
