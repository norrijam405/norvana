# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER ACTIVATION AFTER FRESH CHALLENGER FAIL

Date: 2026-09-28

You are being activated as a **separate Remediation Builder** for Norvana Watchtower R0.

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

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Fresh Challenger who issued the failure.
You are not Independent Assurance.

## Failed lineage to preserve

External harness historical PASS:
- GitHub run `36455613388`
- job `109041083231`
- Watchtower run `15`
- `NO_MATERIAL_CHANGE`
- candidate count `0`
- estimated cost `0`

Fresh Challenger finding:

`NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`

Do not erase, relabel, or overwrite the historical external PASS or Challenger FAIL.

## Defect summary

The harness queue route proves all real Watchtower jobs are PAUSED when HARNESS_TEST is queued.

After queueing, the ordinary owner job PATCH path can enable a real watcher using already-valid Control and Worker proofs.

The harness claim and result routes do not revalidate the global all-real-watchers-PAUSED invariant. Therefore the mutable safety state can drift after queue and the HARNESS_TEST can still claim/finalize.

## Required remediation properties

Remediate the time-of-check/time-of-use gap without weakening any existing lock.

At minimum:

1. Immediately before HARNESS_TEST `QUEUED -> RUNNING`, fail closed unless:
   - every real watcher is still `PAUSED`;
   - every real watcher remains within R0 authority;
   - every real watcher budget remains $0;
   - normal queue remains OFF;
   - normal executor remains OFF;
   - fulfillment remains OFF;
   - supplier connectors remain OFF;
   - IgniAqua federation remains OFF;
   - current-runtime Control + Worker proofs still exist;
   - candidate run is current-runtime HARNESS_TEST / OBSERVE / $0.

2. Immediately before HARNESS_TEST `RUNNING -> final`, revalidate all mutable safety predicates that can change without a deployment.

3. Prevent or invalidate contradictory owner mutations:
   - either reject enabling a real watcher while any HARNESS_TEST is QUEUED/RUNNING;
   - or atomically invalidate/block the active HARNESS_TEST when such mutation occurs.

4. Add adversarial regression coverage for:
   - queue HARNESS_TEST -> enable watcher -> claim must fail;
   - claim HARNESS_TEST -> enable watcher -> result must fail;
   - concurrent job mutation vs claim;
   - concurrent job mutation vs finalization;
   - no false PASS after safety-state drift.

5. Preserve:
   - GitHub OIDC exact-identity verification;
   - Preview-only harness mode;
   - no static-secret fallback in harness mode;
   - mode isolation;
   - stale-runtime rejection;
   - zero-candidate and zero-cost HARNESS_TEST result enforcement;
   - transactional finalization + receipt;
   - all historical failure lineage.

## Builder proof required

Produce deterministic tests and CI evidence bound to the exact remediation candidate.

Do not claim Challenger PASS.
Do not claim Independent Assurance PASS.
Do not enable real watchers or external commerce authority during remediation proof.

If a live proving step eventually becomes necessary, stop at the founder-live boundary and hand off exact instructions.

Current branch head at activation:
`ee59a6fd3d22931a6652c780b78e506da1e1bef5`
