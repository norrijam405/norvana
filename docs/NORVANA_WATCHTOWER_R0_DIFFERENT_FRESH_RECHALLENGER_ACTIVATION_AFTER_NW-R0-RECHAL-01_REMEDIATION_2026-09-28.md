# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER ACTIVATION AFTER NW-R0-RECHAL-01 REMEDIATION

Date: 2026-09-28

You are being activated as a **different Fresh Re-Challenger** for Norvana Watchtower R0.

Repository:
`norrijam405/norvana`

Pull Request:
`#1`

Branch:
`recovery/2026-09-26-norvana-modernization-r0`

Begin with:
`docs/NORVANA_WATCHTOWER_R0_SUCCESSOR_HANDOFF_2026-09-27.md`

Then read:
`docs/NORVANA_WATCHTOWER_R0_FRESH_CHALLENGER_FAIL_2026-09-28.md`
`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_PROOF_AFTER_NW-R0-CHAL-01_2026-09-28.md`
`docs/NORVANA_WATCHTOWER_R0_DIFFERENT_FRESH_RECHALLENGER_FAIL_AFTER_NW-R0-CHAL-01_2026-09-28.md`
`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_PROOF_AFTER_NW-R0-RECHAL-01_2026-09-28.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this remediation.
You are not the prior Fresh Challenger or prior Different Fresh Re-Challenger.
You are not Independent Assurance.
Do not repair defects in this role.

## Exact remediation candidate

`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

Parent candidate with preserved regression-test failure:
`7d96ab9c618ddf6f5f1bdf970e27f15f8c954d1e`

Builder CI:
- `36493051666` — FAILURE at deterministic regression assertion
- `36493145805` — SUCCESS

Original findings to preserve:
- `NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`
- `NW-R0-RECHAL-01 — MULTIPLE_ACTIVE_HARNESSES_ARE_NOT_REJECTED_AT_CLAIM_OR_FINALIZATION`

Historical external harness PASS remains preserved and is not proof of this remediation:
- run `36455613388`
- job `109041083231`
- Watchtower run `15`
- 0 candidates
- $0
- `NO_MATERIAL_CHANGE`

## Required independent attack

Independently verify at minimum:

1. **Multiplicity at claim**
   - two QUEUED HARNESS_TEST rows;
   - one QUEUED + one RUNNING;
   - two RUNNING;
   - one RUNNING and a second claim request;
   - legacy/manual anomalous rows not created by sanctioned queue.

2. **Multiplicity at finalization**
   - one RUNNING + one QUEUED;
   - two RUNNING;
   - requested run not equal to the sole active harness;
   - requested run no longer active.

3. **Atomic blocking**
   - all active harnesses become non-executable on multiplicity;
   - each blocked run receives durable multiplicity evidence;
   - no partial state where one active harness survives the failed multiplicity transaction.

4. **Concurrency**
   - two simultaneous claim attempts cannot yield two RUNNING HARNESS_TEST rows;
   - claim vs finalization ordering remains fail-closed;
   - watcher mutation / queue / claim / finalization continue to share the same lock domain.

5. **Regression preservation**
   - current-runtime proof checks;
   - all-watchers PAUSED/R0/$0 at claim and finalization;
   - OBSERVE/$0 target;
   - external queue/executor/federation/supplier/fulfillment locks;
   - Preview-only GitHub OIDC harness auth;
   - no static-secret fallback;
   - zero candidates;
   - zero cost;
   - transactional claim/completion receipts;
   - watcher-mutation invalidation.

6. **Alternate writers / bypass**
   - search every repository route or code path that can create or mutate HARNESS_TEST rows;
   - determine whether any alternate application writer bypasses the common advisory lock or cardinality protocol.

7. **Failure behavior**
   - multiplicity failure must not be mistaken for successful proof;
   - historical external PASS must remain historical;
   - Builder CI green must not become BANKED automatically.

## Constraints

Do not enable live real watchers.
Do not deploy merely to attack the source candidate.
Do not weaken Deployment Protection.
Do not rotate or expose secrets.
Do not enable IgniAqua federation.
Do not perform commerce actions.
Do not repair a defect in this role.

If a defect is found:
- issue a stable Re-Challenger finding ID;
- preserve exact evidence;
- STOP without repair.

If the remediation survives:
- issue a Different Fresh Re-Challenger PASS bound to exact candidate `d64fb23a0667dd764e45b0136a21dbab58c9ed1b`;
- state that live proving/deployment and Independent Assurance remain separate later gates.

Current branch head at activation:
`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`
