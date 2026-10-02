# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 FURTHER FRESH RE-CHALLENGER FAIL

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Disposition

`R2_WAVE1_FURTHER_FRESH_RECHALLENGER_FAIL`

This role independently challenged the exact immutable third-remediation candidate after the separate third Remediation Builder PASS.

This role did not build or repair the candidate and does not claim Independent Assurance.

Per the activation stop condition, challenge activity stops after preservation of the first material defect.

## Exact challenged immutable candidate

Commit:

`5e2463bdec5c2f28d65b5ec0105b55b2e65336ef`

Parent:

`5cf5323c3b2d1b27564ecccbc34f03910de239ee`

Tree:

`3a1bac47ba433cdb89d288795759b99b6b30276f`

Routing blob independently read from the exact candidate:

`0bc7d095e33cd3969480c68d83487fec53d34734`

Builder verification baseline:

`36940474974 — SUCCESS`

Builder suite baseline:

`27 PASS / 0 FAIL`

The green Builder baseline does not cure the independent defect below.

---

## Preserved finding

### NW-R2-W1-FFRC-01 — Plan-level known-cost aggregation can emit unsafe authoritative cents without forcing verification

**Severity:** Material price-integrity / arithmetic fail-open

**Affected file:**

`src/lib/partner-network/routing.ts`

**Exact candidate:**

`5e2463bdec5c2f28d65b5ec0105b55b2e65336ef`

### Root cause

The third remediation correctly validates each individual authoritative unit price and each individual calculated allocation cost with `Number.isSafeInteger(...)` and non-negative checks.

However, plan-level aggregation is performed with an unchecked accumulator:

```ts
if (knownCost === null) hasUnknownCosts = true;
else knownCostCents += knownCost;
```

There is no post-addition validation that the accumulated `knownCostCents` remains a finite, non-negative, safe-integer cents amount.

Therefore two individually valid authoritative allocation costs can cross the JavaScript safe-integer boundary when summed, while the plan continues to report the result as known and verification-complete.

### Minimal reproducer

Durable reproducer:

`tests/r2-wave1-further-fresh-rechallenger-repro-2026-10-01.ts`

Reproducer preservation commit:

`b355c39aa42cae35302fa78379b7ee3c57ee0f7b`

The reproducer uses two otherwise current, recommendation-eligible, fully VERIFIED allocations:

```text
allocation A knownCostCents = Number.MAX_SAFE_INTEGER = 9007199254740991
allocation B knownCostCents = 1
```

Each individual allocation cost is a valid safe integer.

The candidate then performs:

```text
9007199254740991 + 1 = 9007199254740992
```

Observed boundary result from the exact candidate routing logic:

```text
allocation known costs          = [9007199254740991, 1]
plan.knownCostCents              = 9007199254740992
Number.isSafeInteger(plan total) = false
plan.hasUnknownCosts             = false
plan.requiresHumanVerification   = false
plan.authority                    = RECOMMEND_ONLY
plan.canExecute                   = false
```

### Why this is material

The activation explicitly requires that calculated cost arithmetic cannot emit invalid authoritative cents and that mixed plans sum only authoritative known costs.

The exact candidate enforces the safe-integer boundary at the allocation level but not at the plan-total boundary. It can therefore publish an unsafe integer as authoritative `knownCostCents` while simultaneously declaring that costs are known and no human verification is required.

This is a fail-open contradiction at the same monetary truth boundary under remediation.

`RECOMMEND_ONLY` and `canExecute=false` remain intact; this finding is not an execution-authority bypass.

## Stop condition

Material defect found and preserved.

Do not repair in this role.  
Do not self-certify Independent Assurance.  
Do not continue to later deployment/dependency/authority gates after this first material defect.  
Do not deploy.  
Do not merge PR #5.  
Do not add persistence or live partner ingestion.  
Do not activate suppliers or credentials.  
Do not place orders, charge customers, publish inventory, submit fulfillment, or contact partners autonomously.

A separate Remediation Builder must own any correction and produce a new immutable candidate for another independent challenge.
