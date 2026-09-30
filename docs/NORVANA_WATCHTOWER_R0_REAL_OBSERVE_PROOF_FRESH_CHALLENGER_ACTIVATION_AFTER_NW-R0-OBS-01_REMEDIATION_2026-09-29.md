# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF FRESH CHALLENGER ACTIVATION AFTER NW-R0-OBS-01 REMEDIATION

Date: 2026-09-29

You are being activated as a **separate Fresh Challenger** for the post-assurance Norvana Watchtower R0 real-observe proof lane.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R0_POST_ASSURANCE_REAL_OBSERVE_ACTIVATION_FINDING_2026-09-29.md`

Then read:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_REMEDIATION_BUILDER_ACTIVATION_2026-09-29.md`

and:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_REMEDIATION_BUILDER_PASS_AFTER_NW-R0-OBS-01_2026-09-29.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this candidate.

You are not the Remediation Builder.

You are not the prior Watchtower Fresh Challenger, Different Fresh Re-Challenger, controlled live-proof operator, or Independent Assurance role.

Do not repair defects in this role.

Do not deploy or execute the real observation proof from this role.

Do not self-certify closure.

## Exact immutable candidate under challenge

Commit:

`d9483a9f14b1c1d1198d06fa07f8fe1907f65ce1`

Parent:

`24d653916371b7b6cc7130426cdea455739e7a7d`

Tree:

`b7c506f333ed69a715ea4d86224bfb4ff051c698`

Required Recovery CI:

`36666294007 — SUCCESS`

Expected Watchtower tests:

`28 PASS / 0 FAIL`

## Preserved finding

`NW-R0-OBS-01 — REAL_OBSERVE_ACTIVATION_DEADLOCKS_ON_RUNTIME_BOUND_PROOFS_AND_DEPLOYMENT_TIME_QUEUE_EXECUTOR_FLAGS`

The prior `INDEPENDENT_ASSURANCE_PASS` applies to the earlier assured Watchtower candidate and remains preserved. This is a new post-assurance executable change and must be challenged independently.

## Challenge mission

Attack the exact candidate, with emphasis on proving or disproving all of these properties:

1. The new lane actually resolves `NW-R0-OBS-01` without enabling the normal queue or normal executor.
2. Queue, claim, and finalization all require current-runtime Control Proof + Worker Proof and do not accept stale-runtime proof substitution.
3. Exactly one enabled real watcher is required, and it must be `local-producer-watch`, `OBSERVE`, $0.
4. All four other watchers must remain PAUSED.
5. Exactly one active `OBSERVE_PROOF` is allowed and no concurrent `SCHEDULE`, `HARNESS_TEST`, or other executable run can coexist.
6. The common advisory lock actually serializes proof queue/claim/finalization against safety-relevant watcher/run mutations.
7. Dedicated GitHub OIDC authentication cannot be confused with:
   - the normal worker secret;
   - the earlier HARNESS_TEST workflow;
   - a different repository;
   - a different ref;
   - a different workflow;
   - a self-hosted runner;
   - a non-Preview deployment.
8. The proof worker cannot claim or finalize `SCHEDULE` or `HARNESS_TEST`.
9. Public-source retrieval is genuinely read-only and pinned:
   - only HTTPS;
   - only approved source URLs/hosts;
   - redirects cannot escape to an unapproved host;
   - no supplier credential;
   - no commerce credential;
   - no model/API spend.
10. Candidate emission is impossible in the proof path.
11. Nonzero estimated cost is rejected.
12. Successful completion cannot be recorded without approved evidence.
13. Watcher, authority, budget, environment, proof, runtime, or executable-state drift between queue, claim, and finalization fails closed.
14. Failure after claim cannot silently become PASS.
15. No path widens ACT, ordering, publication, repricing, refunds, supplier activation, fulfillment, or IgniAqua federation.
16. `git.deploymentEnabled=false` remains restored and the Builder did not deploy the candidate.
17. The prior failed Builder candidates and CI failures remain preserved rather than rewritten.

Inspect the actual code and tests. Do not accept Builder claims merely because CI is green.

You may create additional adversarial static/unit checks if they do not repair the candidate. Preserve any finding durably in GitHub.

## Disposition

If any material defect is found:

`FRESH_CHALLENGER_FAIL`

Preserve the exact finding and evidence. Do not repair it.

Only if the exact immutable candidate survives the independent challenge:

`FRESH_CHALLENGER_PASS`

A Fresh Challenger PASS does not authorize deployment, real observation execution, ACT authority, commerce, supplier activation, fulfillment, paid infrastructure, or federation.
