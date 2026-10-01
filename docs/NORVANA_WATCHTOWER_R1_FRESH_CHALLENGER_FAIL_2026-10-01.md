# NORVANA WATCHTOWER R1 — FRESH CHALLENGER FAIL

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`R1_FRESH_CHALLENGER_FAIL`

This is a separate Fresh Challenger disposition for the bounded recurring Local Producer observe lane.

I did not build the challenged candidate.

I did not repair the defect.

I did not deploy, copy to main, enable R1, enable a watcher, execute a live R1 observation, or broaden any authority.

## Exact challenged candidate

Commit:

`5f4211dbff81614c99fbf1ce6f49c8712017e941`

Parent:

`3d9bb03a451ff55ddeb7172de3295642b6817754`

Activation-declared tree:

`b986469b36ddb1e522d78994882af7104051807e`

Required Recovery CI:

`36879287999 — SUCCESS`

Fresh Challenger independently confirmed from the workflow job log that Recovery CI checked out exact commit:

`5f4211dbff81614c99fbf1ce6f49c8712017e941`

and that Watchtower policy tests reported:

`56 PASS / 0 FAIL`

Green CI is not accepted as closure.

## Preserved finding

### NW-R1-FC-01 — required five-watcher topology is not enforced fail-closed

**Severity:** material gate failure

The activation requires the R1 queue/claim/finalization safety state to contain:

- exactly one enabled watcher;
- that watcher exactly `local-producer-watch`;
- authority exactly `OBSERVE`;
- budget exactly `0`;
- all four non-target watchers present and `PAUSED`.

The immutable candidate does not enforce the required exact five-watcher topology.

### Exact enforcement path

The R1 queue endpoint:

`src/app/api/watchtower/observe-r1/queue/route.ts`

loads all `watchJobs` rows and delegates the watcher-state decision to:

`evaluateObserveProofWatcherSnapshot(jobs)`

from:

`src/lib/watchtower/policy.ts`

The same evaluator is reused by the existing observe-proof claim/finalization path.

That evaluator currently proves only that:

1. at least one watcher row exists;
2. exactly one row has status `ENABLED`;
3. the enabled row is `local-producer-watch`, `OBSERVE`, and `$0`;
4. every row other than `local-producer-watch` is `PAUSED`;
5. every returned row stays inside R0 authority and zero-budget policy.

It does **not** prove:

- `jobs.length === 5`;
- that exactly four non-target watcher rows exist;
- that the four canonical non-target watcher identities are present;
- that no additional unexpected paused watcher row exists.

### Deterministic counterexamples

The evaluator accepts a snapshot containing only:

```text
local-producer-watch | ENABLED | OBSERVE | $0
```

because the array is non-empty, exactly one watcher is enabled, the enabled watcher is the approved target, and there are no non-target rows for the loop to reject.

Therefore all four required non-target watchers can be absent and the R1 queue gate can still proceed.

The evaluator also accepts the approved target plus any number of arbitrary extra paused zero-budget R0-valid watcher rows, because it does not bind the snapshot to an exact canonical watcher set.

### Why this is material

The Fresh Challenger activation explicitly requires:

`All four non-target watchers must remain PAUSED.`

A missing required watcher is not a paused watcher.

The current code therefore fails open on watcher-topology deletion/substitution/addition drift while claiming to revalidate the complete watcher snapshot.

Because the same snapshot evaluator is reused at queue, observe claim, and observe result finalization, the topology gap persists across all three safety boundaries.

This is a direct failure of the required bounded R1 state contract, even though the target watcher itself remains restricted to `OBSERVE` and `$0`.

## Remediation requirement for a separate Builder

Do not treat this report as a repair.

A separate Remediation Builder should make the watcher snapshot gate prove the exact canonical topology, including exact cardinality and exact watcher identities, while preserving:

- exactly one enabled `local-producer-watch`;
- `OBSERVE` authority;
- `$0` budget;
- exactly four canonical non-target watchers;
- every non-target watcher `PAUSED`;
- rejection of missing, duplicate, substituted, or additional watcher rows.

Adversarial tests should cover at minimum:

- target only;
- target plus three canonical non-target watchers;
- target plus five non-target watchers;
- target plus an arbitrary replacement paused watcher;
- the exact intended five-watcher snapshot.

## Stop condition

Per the Fresh Challenger activation, discovery of this material defect ends this challenge.

No remaining activation assertions are promoted to PASS by this document.

No deployment or activation is authorized.

Final disposition:

`R1_FRESH_CHALLENGER_FAIL`
