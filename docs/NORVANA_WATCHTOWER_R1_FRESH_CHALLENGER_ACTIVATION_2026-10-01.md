# NORVANA WATCHTOWER R1 — FRESH CHALLENGER ACTIVATION

Date: 2026-10-01

You are being activated as a **separate Fresh Challenger** for the Norvana Watchtower R1 bounded recurring Local Producer observe lane.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R1_BOUNDED_RECURRING_LOCAL_PRODUCER_OBSERVE_ACTIVATION_2026-10-01.md`

Then read:

`docs/NORVANA_WATCHTOWER_R1_BOUNDED_RECURRING_LOCAL_PRODUCER_OBSERVE_BUILDER_PASS_2026-10-01.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this candidate.

You are not the R1 Builder.

You are not any prior R0 Challenger/Re-Challenger, Controlled Live-Proof Operator, or Independent Assurance role.

Do not repair defects in this role.

Do not deploy, copy to main, activate R1, enable a watcher, or execute a live R1 observation.

Do not self-certify closure.

## Exact immutable R1 candidate

Commit:

`5f4211dbff81614c99fbf1ce6f49c8712017e941`

Parent:

`3d9bb03a451ff55ddeb7172de3295642b6817754`

Tree:

`b986469b36ddb1e522d78994882af7104051807e`

Required Recovery CI:

`36879287999 — SUCCESS`

Expected Watchtower tests:

`56 PASS / 0 FAIL`

## Preserved failed first candidate

`d507b0e3d55a865c81c1d1bdaba289e75c6f023d`

Recovery CI:

`36878881478 — FAIL`

Do not rewrite or erase it.

## Fresh Challenge mission

Independently attack the exact R1 candidate.

At minimum prove or disprove:

1. R1 is source-disabled by default.
2. Disabled preflight fails before any OIDC mint.
3. There is exactly one daily cron and no higher-frequency schedule.
4. Controlled manual R1 execution requires exactly `RUN_LOCAL_PRODUCER_R1`.
5. Manual confirmation remains inert data and is not present in the OIDC-capable job.
6. R1 and one-shot observe proof share a concurrency domain.
7. OIDC remains pinned to GitHub issuer, Norvana audience, repository, main ref, exact workflow ref, and GitHub-hosted runner.
8. The one-shot manual observe workflow remains restricted to workflow_dispatch.
9. The R1 workflow allows only schedule or controlled workflow_dispatch.
10. The dedicated R1 queue authentication rejects the one-shot manual proof workflow identity.
11. The R1 queue endpoint is Preview-only through OIDC auth.
12. Normal queue, normal executor, fulfillment, supplier connectors, and federation must all remain OFF.
13. Permanent owner credential remains required.
14. Current-runtime Control Proof and Worker Proof are required at R1 queue.
15. Exactly one watcher must be enabled.
16. It must be `local-producer-watch`.
17. It must be exactly `OBSERVE`.
18. It must retain a $0 budget.
19. All four non-target watchers must remain PAUSED.
20. The executable run queue must be empty before R1 queue.
21. R1 queue uses the same global observe advisory lock as queue/claim/finalization.
22. Server-side cadence checks the last durable R1 queued receipt while holding that lock.
23. The minimum interval is at least 20 hours.
24. Repeated manual dispatch inside the cadence window cannot create another run.
25. Cadence-blocked attempts fail closed and preserve a durable blocked receipt.
26. R1 queue creates only `OBSERVE_PROOF`, not generic `SCHEDULE`.
27. The R1 client validates the queue acknowledgement before invoking the existing observe worker.
28. The generic `/api/watchtower/tick` scheduler is not used by R1.
29. The normal worker/executor is not activated by R1.
30. Existing observe claim/result can authenticate only the approved one-shot or R1 workflow identities.
31. Existing observe claim/result retain runtime proof, watcher snapshot, active-run, target, authority, budget, and environment revalidation.
32. The approved public-source set is unchanged.
33. Manual per-hop redirect validation remains intact.
34. Zero candidates and zero estimated cost remain server-enforced.
35. Successful result still requires approved evidence.
36. No model call, supplier credential, commerce credential, or consequential external action is introduced.
37. ACT, spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, paid infrastructure, production promotion, and federation remain locked.
38. `git.deploymentEnabled=false` remains restored.
39. No deployment exists for `5f4211db...`.
40. R0 final Independent Assurance PASS remains preserved and unmodified.

Do not accept Builder claims merely because CI is green.

You may add adversarial local/static tests if they do not repair the candidate.

## Disposition

If any material defect is found:

`R1_FRESH_CHALLENGER_FAIL`

Preserve the exact finding durably in GitHub and stop. Do not repair it.

Only if the immutable candidate survives the independent challenge:

`R1_FRESH_CHALLENGER_PASS`

A PASS does not authorize deployment or activation. It permits only progression to a separate controlled R1 activation/proof gate.
