# NORVANA WATCHTOWER R0 — FRESH CHALLENGER FAIL

Date: 2026-09-28

Role: Fresh Challenger  
Repository: `norrijam405/norvana`  
PR: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

This Challenger did not build the candidate and did not repair it.

## Disposition

**FAIL**

Stable finding:

`NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`

## Exact candidate / proof lineage evaluated

Forwarded-OIDC implementation:
`3df5b173b67459af648deb09c3436f3eed69eb83`

Controlled deployed source:
`6b57a0bc024b81374259e086ac8febca80ac0573`

Exact Preview deployment:
`dpl_8x2cGxz52kDwbiJPMyFBPjGv5wMv`

Main harness workflow source:
`b50e02045565f20da8a071ab9d8fe3ef35ec08b6`

External harness PASS:
- run `36455613388`
- job `109041083231`
- Watchtower run `15`
- `NO_MATERIAL_CHANGE`
- candidate count `0`
- estimated cost `0`

The successful external harness evidence remains valid as evidence of what occurred in that run. It is not sufficient to close the candidate because the state invariant below is not revalidated at claim time.

## Finding

The owner-only harness queue route correctly checks that **all real Watchtower jobs are PAUSED** before inserting a `HARNESS_TEST`.

However, that safety fact is only checked at queue time.

After a HARNESS_TEST has been queued, the normal owner job-update route can set a Watchtower job to `ENABLED` using the already-present current-runtime Control Proof and Worker Proof. That route does not reject enablement merely because a HARNESS_TEST is QUEUED.

The external harness claim route then:
- authenticates the harness;
- checks executor / queue / external-action environment locks;
- checks current-runtime Control + Worker proof existence;
- selects the queued HARNESS_TEST;
- re-reads only the candidate job;
- checks that candidate job authority is OBSERVE and budget is $0;

but it does **not** re-read all Watchtower jobs and does not require every real watcher to still be PAUSED.

Therefore the state can transition:

1. all jobs PAUSED;
2. owner queues HARNESS_TEST;
3. owner enables a real watcher using the ordinary job PATCH path;
4. external harness claims the already-queued HARNESS_TEST;
5. claim can still succeed while the global invariant `all real watchers PAUSED` is false.

The same drift can occur after claim and before result finalization because the result route also does not revalidate the global paused-watcher invariant.

## Why this matters

The proof chain advertises a bounded harness in which real watchers remain PAUSED. That assertion is not transactionally or temporally bound to claim/result execution.

This is a classic time-of-check/time-of-use gap:
`SAFE_AT_QUEUE != SAFE_AT_CLAIM != SAFE_AT_FINALIZATION`

It does not show that run 15 caused a consequential commerce action. It shows that the implementation permits a later harness execution to produce a PASS even after one of the global safety facts used to justify that proof has changed.

For enterprise use, this would allow a proof or authority prerequisite to become stale between authorization and execution.

## Static reproduction basis

`src/app/api/watchtower/harness/queue/route.ts`
- loads all `watchJobs`;
- refuses queueing unless every job is `PAUSED` and inside R0 policy.

`src/app/api/watchtower/jobs/[id]/route.ts`
- allows `PATCH status=ENABLED` after current-runtime Control + Worker proof;
- does not reject enablement because an active HARNESS_TEST is QUEUED/RUNNING.

`src/app/api/watchtower/runs/claim/route.ts`
- does not re-check that all `watchJobs.status === PAUSED`;
- validates only the selected candidate job's authority/budget.

`src/app/api/watchtower/runs/[id]/result/route.ts`
- does not re-check the global paused-watcher invariant before finalization.

No live watcher was enabled to demonstrate this finding because the Challenger activation explicitly forbids enabling real watchers. The failure is established from the executable control-flow/state-transition paths.

## Required remediation acceptance criteria

A remediation must make the global harness safety state current at execution, not merely historical.

At minimum, independently demonstrate one coherent fail-closed design such as:
- claim revalidates **all real watchers PAUSED** and all R0 safety predicates immediately before QUEUED -> RUNNING;
- result revalidates all required mutable safety predicates immediately before RUNNING -> final;
- or the system binds a safety epoch/hash to the queued run and invalidates/refuses execution when any relevant watcher/policy state changes.

Additionally:
- job enablement should either refuse while a HARNESS_TEST is QUEUED/RUNNING, or atomically invalidate/block the harness proof;
- concurrent mutation must fail closed;
- adversarial regression must cover queue -> mutate watcher -> claim and claim -> mutate watcher -> result;
- prior external PASS run `36455613388` must remain preserved as historical evidence and must not be rewritten as a Challenger PASS.

## Challenger boundary

Per activation rules, no remediation was implemented in this role.

Truth state after Challenger:

`EXTERNAL_HARNESS_PASS + FRESH_CHALLENGER_FAIL(NW-R0-CHAL-01)`

Not `BANKED`.
