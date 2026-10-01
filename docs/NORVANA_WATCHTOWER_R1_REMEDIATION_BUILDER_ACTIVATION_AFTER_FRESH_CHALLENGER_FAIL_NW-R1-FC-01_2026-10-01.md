# NORVANA WATCHTOWER R1 — REMEDIATION BUILDER ACTIVATION AFTER FRESH CHALLENGER FAIL NW-R1-FC-01

Date: 2026-10-01

Repository: `norrijam405/norvana`
Pull Request: `#1`
Branch: `recovery/2026-09-26-norvana-modernization-r0`

You are the **separate Remediation Builder** after the R1 Fresh Challenger failure:

`NW-R1-FC-01 — required five-watcher topology is not enforced fail-closed`

Durable failure report:

`docs/NORVANA_WATCHTOWER_R1_FRESH_CHALLENGER_FAIL_2026-10-01.md`

Failure report commit:

`f3d73325598c11b49a196956b7c4d297da42e79c`

PR #1 failure receipt:

`5934454487`

You are not the Fresh Challenger that issued this finding.

Do not rewrite prior PASS/FAIL lineage.

Do not deploy, copy to main, activate R1, enable a watcher, or execute a live R1 observation in this role.

Do not self-certify Fresh Challenger, Re-Challenger, Independent Assurance, or closure.

## Exact failed R1 candidate

`5f4211dbff81614c99fbf1ce6f49c8712017e941`

Tree:

`b986469b36ddb1e522d78994882af7104051807e`

Recovery CI:

`36879287999 — SUCCESS`

Watchtower tests:

`56 PASS / 0 FAIL`

## Preserved finding

The shared:

`evaluateObserveProofWatcherSnapshot(jobs)`

gate proves target authority/status/budget and pauses of returned non-target rows, but it does not prove the exact canonical five-watcher topology.

It can accept:
- target only;
- target plus only three canonical non-target rows;
- target plus substituted arbitrary paused rows;
- target plus additional paused rows.

Because the same evaluator is reused at R1 queue, observe claim, and result finalization, topology drift can survive all three boundaries.

## Required remediation

Harden the shared watcher snapshot gate to require exactly and only these five canonical watcher identities:

- `free-supplier-watch`
- `global-resale-sourcing-watch`
- `local-producer-watch`
- `operating-cost-watch`
- `drop-opportunity-watch`

The gate must fail closed unless:

1. exactly five watcher rows are present;
2. every canonical slug appears exactly once;
3. no unknown or substituted slug is present;
4. `local-producer-watch` is the only ENABLED watcher;
5. `local-producer-watch` is exactly `OBSERVE`;
6. `local-producer-watch` budget is exactly 0;
7. each of the other four canonical watchers is PAUSED;
8. every watcher remains inside the R0 authority ceiling and zero-budget policy.

Add adversarial tests covering at minimum:
- target only;
- target plus three canonical non-target rows;
- target plus five non-target rows;
- target plus an arbitrary replacement paused watcher;
- duplicate canonical slug;
- exact intended five-watcher snapshot.

Preserve:
- R1 source-disabled-by-default behavior;
- daily cron;
- 20-hour server-side cadence lock;
- R1-specific OIDC queue gate;
- no-OIDC preflight;
- exact source-pinned destination discipline;
- normal scheduler/executor OFF;
- zero candidates / zero cost;
- approved public sources and redirect hardening;
- all ACT/commerce/supplier/fulfillment/federation locks;
- `git.deploymentEnabled=false`.

Bank an immutable remediation candidate and successful Recovery CI, then prepare a genuinely separate Different Fresh Re-Challenger activation.
