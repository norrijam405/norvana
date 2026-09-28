# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER FAIL AFTER NW-R0-CHAL-01 REMEDIATION

Date: 2026-09-28

Role: Different Fresh Re-Challenger  
Repository: `norrijam405/norvana`  
PR: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

This Re-Challenger did not build the remediation, did not act as the original Fresh Challenger, did not act as Independent Assurance, and performed no repair.

## Disposition

**FAIL**

Stable finding:

`NW-R0-RECHAL-01 — MULTIPLE_ACTIVE_HARNESSES_ARE_NOT_REJECTED_AT_CLAIM_OR_FINALIZATION`

## Exact candidate evaluated

Corrected remediation candidate:

`92c070503f8a7f8a06468f0aca87591bf73d340b`

Parent remediation candidate with preserved CI typing failure:

`2277a0a326ce04f60666a922d36314c7b22c34c4`

Builder CI:
- `36479883114` — FAILURE at TypeScript
- `36479978476` — SUCCESS

Original preserved Challenger finding:

`NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`

Historical external harness PASS remains preserved:
- GitHub run `36455613388`
- job `109041083231`
- Watchtower run `15`
- `NO_MATERIAL_CHANGE`
- candidate count `0`
- estimated cost `0`

That historical execution remains valid historical evidence. It is not Re-Challenger proof for this remediation.

## What survived independent attack

The remediation materially closes the original watcher-mutation TOCTOU path for the ordinary application mutation route:

- HARNESS_TEST queue creation acquires the common PostgreSQL transaction-level advisory lock.
- watcher status/authority PATCH acquires the same lock and atomically blocks active QUEUED/RUNNING HARNESS_TEST runs before committing the watcher mutation.
- harness claim acquires the same lock and re-reads current-runtime proofs plus the complete watcher PAUSED/R0/$0 snapshot before QUEUED -> RUNNING.
- harness finalization acquires the same lock and re-reads current-runtime proofs plus the complete watcher PAUSED/R0/$0 snapshot before RUNNING -> final.
- claim transition + claim receipt are transactionally coupled.
- result finalization + completion receipt remain transactionally coupled.
- queue insertion + queue receipt are transactionally coupled.
- watcher invalidation + watcher mutation are transactionally coupled.
- the four critical routes acquire the advisory lock before their safety-relevant row updates, so no inconsistent advisory-lock/row-lock ordering was found among those routes.
- harness authentication remains Preview-only and application-level harness mode has no static worker-secret fallback.
- exact GitHub OIDC claim binding remains present in `worker-auth.ts`.
- harness result enforcement remains zero spend + zero candidates.

Recovery CI `36479978476` independently shows 17 Watchtower tests passing, followed by TypeScript, lint, and production build success.

## Fresh finding

The activation explicitly requires fail-closed behavior for **multiple active harnesses**.

The exact candidate does not enforce that condition at claim or finalization.

### Claim path

In:

`src/app/api/watchtower/runs/claim/route.ts`

harness mode selects only the oldest queued HARNESS_TEST:

```ts
const [candidate] = await tx
  .select()
  .from(watchRuns)
  .where(and(eq(watchRuns.status, "QUEUED"), eq(watchRuns.trigger, "HARNESS_TEST")))
  .orderBy(asc(watchRuns.createdAt))
  .limit(1);
```

It does not first establish that exactly one active HARNESS_TEST exists across `QUEUED` / `RUNNING`.

If the database already contains two active harnesses, the first claim can transition one to RUNNING while the other remains active.

Because claims are serialized by the advisory lock rather than rejected on multiplicity, a later harness claim can then claim the second queued HARNESS_TEST as well. The lock serializes the unsafe multiplicity; it does not fail closed on it.

### Finalization path

In:

`src/app/api/watchtower/runs/[id]/result/route.ts`

harness finalization revalidates:
- current runtime,
- RUNNING state,
- current Control Proof,
- current Worker Proof,
- all real watchers PAUSED / R0 / $0,
- exact target OBSERVE / $0,
- zero-cost / zero-candidate result effects.

It does not re-check that the run being finalized is the only active HARNESS_TEST.

Therefore a RUNNING harness can finalize successfully while another QUEUED or RUNNING HARNESS_TEST remains active.

## Reachability / why queue serialization is not sufficient

The repaired queue route itself prevents a second sanctioned queue operation by requiring an empty executable queue under the common advisory lock.

That does not satisfy the activation's explicit fail-closed requirement for a pre-existing or anomalous multiple-active-harness state.

Such a state can exist because:
- historical pre-remediation queue operations were not protected by this serialization design;
- database recovery/manual corruption or legacy state may violate the new invariant;
- the claim/result endpoints are security boundaries and must validate the invariant they rely on rather than assuming the queue path was the only writer in all historical states.

The remediation correctly treats stale runtime, proof drift, watcher drift, target drift, and result effects as conditions to revalidate. Multiple-active-harness state is the missing fail-closed predicate.

## Deterministic test gap

`tests/watchtower-policy.test.ts` contains:
- watcher drift snapshot tests;
- common-lock source checks;
- active harness invalidation source checks;
- environment lock checks;
- target OBSERVE/$0 checks.

It does not contain a regression asserting that claim/finalization refuse multiple active HARNESS_TEST runs.

Builder CI success therefore does not cover the activation's multiple-active-harness attack case.

## Security consequence

The design intends one tightly bounded deterministic harness proof at a time.

Allowing more than one active HARNESS_TEST means:
- the proof protocol can have ambiguous concurrent active proof state;
- multiple workers can sequentially claim separate harnesses despite the single serialization lock;
- one harness can produce a completion acknowledgement while another harness remains executable.

This does not by itself grant commerce authority, spend, publishing, supplier activation, order placement, repricing, or refunds. It does violate the required proof-state uniqueness / fail-closed invariant.

## Required remediation acceptance criteria

A later Remediation Builder should make active HARNESS_TEST uniqueness an execution-time invariant, not only a queue-time assumption.

At minimum:
- claim must refuse/block when active HARNESS_TEST cardinality is not exactly one for the candidate execution state;
- finalization must refuse/block if another QUEUED/RUNNING HARNESS_TEST exists;
- the check must occur inside the same advisory-locked transaction as claim/finalization;
- safety-block state change and durable receipt insertion must be atomic;
- deterministic regression must cover:
  - two QUEUED HARNESS_TEST rows -> claim fails closed;
  - one RUNNING + one QUEUED HARNESS_TEST -> finalization fails closed;
  - concurrent claims cannot yield two RUNNING HARNESS_TESTs.

Preserve all prior PASS/FAIL lineage exactly.

## Boundary

No remediation was performed.

No deployment was created.
No real watcher was enabled.
No external commerce action was enabled.
No spend occurred.
No secret was exposed or rotated.

Truth state:

`EXTERNAL_HARNESS_PASS + FRESH_CHALLENGER_FAIL(NW-R0-CHAL-01) + REMEDIATION_BUILDER_PASS(92c070503...) + DIFFERENT_FRESH_RECHALLENGER_FAIL(NW-R0-RECHAL-01)`

Not Independent Assurance.
Not BANKED.
