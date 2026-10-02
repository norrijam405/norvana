# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 NEW DIFFERENT FRESH RE-CHALLENGER FAIL

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Disposition

`R2_WAVE1_NEW_DIFFERENT_FRESH_RECHALLENGER_FAIL`

This role independently challenged the exact immutable second-remediation candidate after the separate second Remediation Builder PASS.

This role did not build or repair the candidate and does not claim Independent Assurance.

## Exact challenged immutable candidate

Commit:

`b7d8d6b61b76b417c881d6ef7a2badd1f6ed4d09`

Parent:

`d36c2284287aad5dda2daa8d1869cb6743e972ef`

Tree:

`0df1a399e0433862c7bd82a4bfb429d7f089c5b0`

Routing blob independently read from the exact candidate:

`a2a8a60f684ccd727d842fe996860dc39c25a643`

Builder verification baseline:

`36938586771 — SUCCESS`

Builder suite baseline:

`20 PASS / 0 FAIL`

The green Builder baseline does not cure the independent defect below.

---

## Preserved finding

### NW-R2-W1-NDFRC-01 — VERIFIED negative current price is promoted to authoritative known cost and verification-complete state

**Severity:** Material price-integrity / truth-state fail-open

**Affected file:**

`src/lib/partner-network/routing.ts`

**Exact candidate:**

`b7d8d6b61b76b417c881d6ef7a2badd1f6ed4d09`

### Root cause

The second remediation distinguishes `VERIFIED + null` from a verified numeric price, but the authoritative-price helper accepts every non-null JavaScript number when `priceState === "VERIFIED"`.

There is no validity gate requiring the cents amount to be a finite, non-negative current monetary amount before the value:

- receives verified-price trust credit;
- enters duplicate/ranking price comparison;
- becomes allocation `unitPriceCents`;
- becomes allocation `knownCostCents`;
- contributes to plan `knownCostCents`;
- allows `verificationRequired=false`;
- allows `requiresHumanVerification=false`.

A JSON-representable negative cents value therefore crosses the authoritative price boundary.

### Minimal reproducer

Durable reproducer:

`tests/r2-wave1-new-different-fresh-rechallenger-repro-2026-10-01.ts`

Reproducer preservation commit:

`65ad4748b9bc52948664dadca416aa7bd9be0e97`

The reproducer uses an otherwise current, recommendation-eligible offer with:

```ts
unitPriceCents: -1,
priceState: "VERIFIED",
availabilityState: "VERIFIED",
serviceAreaState: "VERIFIED_MATCH"
```

On the exact candidate the observed result is:

```text
allocation.unitPriceCents          = -1
allocation.knownCostCents          = -1
allocation.verificationRequired    = false
plan.knownCostCents                = -1
plan.hasUnknownCosts               = false
plan.requiresHumanVerification     = false
```

Independent local execution used Node `v22.16.0` against the exact candidate routing logic.

### Why this is material

Wave 1 treats VERIFIED price state as the boundary for authoritative known cost and routing price trust.

A negative cents amount is not a valid current purchase price for this routing model, yet the exact candidate treats it as authoritative and verification-complete. That can make an invalid offer look cheaper than valid offers, contaminate known-cost totals with negative money, and suppress the human-verification gate.

This is a fail-open contradiction at the same price-truth boundary being remediated by this wave.

`RECOMMEND_ONLY` and `canExecute=false` remain intact; this finding is not an execution-authority bypass.

## Stop condition

Material defect found and preserved.

Per activation, the re-challenge stops here.

Do not repair in this role.  
Do not self-certify Independent Assurance.  
Do not deploy.  
Do not merge PR #5.  
Do not add persistence or live partner ingestion.  
Do not activate suppliers or credentials.  
Do not place orders, charge customers, publish inventory, submit fulfillment, or contact partners autonomously.

A separate Remediation Builder must own any correction and produce a new immutable candidate for another independent challenge.
