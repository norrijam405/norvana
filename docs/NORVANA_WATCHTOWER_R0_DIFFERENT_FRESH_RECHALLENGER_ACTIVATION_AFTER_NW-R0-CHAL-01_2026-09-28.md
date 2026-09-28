# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER ACTIVATION AFTER NW-R0-CHAL-01 REMEDIATION

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

and:

`docs/NORVANA_WATCHTOWER_R0_REMEDIATION_BUILDER_PROOF_AFTER_NW-R0-CHAL-01_2026-09-28.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this remediation.
You are not the original Fresh Challenger.
You are not Independent Assurance.
Do not repair defects in this role.

## Exact remediation candidate

`92c070503f8a7f8a06468f0aca87591bf73d340b`

Parent remediation candidate that failed CI typing:

`2277a0a326ce04f60666a922d36314c7b22c34c4`

Builder CI:
- failed candidate run `36479883114`: FAILURE at TypeScript
- corrected candidate run `36479978476`: SUCCESS

Original Challenger finding:

`NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`

Historical external harness PASS remains:
- run `36455613388`
- job `109041083231`
- Watchtower run `15`
- `NO_MATERIAL_CHANGE`
- 0 candidates
- $0

Do not treat that historical execution as proof that this remediation is correct.

## Required independent attack

Independently test the remediation for:

1. **Queue-time race**
   - watcher mutation concurrent with HARNESS_TEST queue;
   - verify both operations serialize and cannot produce queued harness + contradictory watcher state without invalidation.

2. **Claim-time race**
   - queued HARNESS_TEST vs watcher status mutation;
   - queued HARNESS_TEST vs watcher authority mutation;
   - queued HARNESS_TEST vs budget/policy drift where reachable;
   - confirm no false QUEUED -> RUNNING after safety drift.

3. **Finalization race**
   - RUNNING HARNESS_TEST vs watcher status mutation;
   - RUNNING HARNESS_TEST vs authority drift;
   - verify no false PASS / NO_MATERIAL_CHANGE after safety drift.

4. **Lock coverage**
   - prove queue, watcher mutation, claim, and result all acquire the same advisory lock key;
   - inspect for any alternate mutation route that can change watcher status, authority, or budget without acquiring/invalidation semantics.

5. **Transaction semantics**
   - verify invalidation and watcher mutation are atomic;
   - verify safety-block run update and receipt insertion are atomic;
   - verify claim state transition and claim receipt are atomic;
   - verify finalization and completion receipt remain atomic.

6. **Deadlock / lock ordering**
   - search for inconsistent lock acquisition order;
   - verify no route holds a conflicting row lock before acquiring the common advisory lock in a way that introduces a deadlock cycle.

7. **Fail-closed behavior**
   - multiple active harnesses;
   - already-finalized harness;
   - stale runtime;
   - missing Control/Worker proof;
   - missing target job;
   - target changed from OBSERVE;
   - nonzero target budget;
   - real watcher enabled;
   - R0 authority drift;
   - external execution lock drift.

8. **Regression preservation**
   - GitHub OIDC exact identity binding;
   - Preview-only harness mode;
   - no static-secret fallback in harness mode;
   - standard/harness mode isolation;
   - zero candidates;
   - zero spend;
   - no external commerce authority.

## Constraints

Do not enable real watchers in live infrastructure.
Do not deploy this remediation merely to test it unless a later explicit proving handoff authorizes that gate.
Do not weaken deployment protection.
Do not expose or rotate secrets.
Do not repair findings in this role.
Preserve every failure with exact lineage.

If a defect is found:
- issue a stable Re-Challenger finding ID;
- preserve exact evidence;
- STOP without repair.

If the remediation survives:
- issue a Re-Challenger PASS bound to exact candidate `92c070503...`;
- state clearly that live deployment proof and Independent Assurance remain separate later gates.

Current branch head at activation:
`92c070503f8a7f8a06468f0aca87591bf73d340b`
