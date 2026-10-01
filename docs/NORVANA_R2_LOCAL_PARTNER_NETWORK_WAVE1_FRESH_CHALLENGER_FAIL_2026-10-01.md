# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 FRESH CHALLENGER FAIL

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Disposition

`R2_WAVE1_FRESH_CHALLENGER_FAIL`

This Fresh Challenger did not build or repair the challenged candidate.

Per the activation contract, challenge activity stops after preservation of the first material defect.

## Exact challenged immutable candidate

Commit:

`6c439deaf794721cbe7adfe04e1340a8bbf54a8e`

Parent:

`b20192dca613711b012056b76fac5157353a2a5d`

Tree asserted by activation:

`17c025957e42dcad9919ca52fb970919fb5b874c`

Required R2 CI:

`36921048979 — SUCCESS`

Observed R2 test result in that run:

`12 PASS / 0 FAIL`

The green Builder/CI state does not cure the defect below.

---

## Preserved finding

### NW-R2-W1-FC-01 — UNKNOWN/STALE price state can be converted into a known cost

**Severity:** Material truth-state / fail-closed defect

**Affected file:**

`src/lib/partner-network/routing.ts`

**Exact candidate:** `6c439deaf794721cbe7adfe04e1340a8bbf54a8e`

### Root cause

The router correctly marks a non-`VERIFIED` price as requiring human verification:

- line 158: `offer.priceState !== "VERIFIED"`
- line 163: warning `"Price is not verified."`

However, the cost truth-state is derived only from whether `unitPriceCents` is null:

- lines 167-168:
  `offer.unitPriceCents === null ? null : quantity * offer.unitPriceCents`
- lines 170-171:
  only `knownCost === null` sets `hasUnknownCosts = true`

Therefore an offer can carry:

`priceState = "UNKNOWN"` or `priceState = "STALE"`

while also carrying a numeric `unitPriceCents`, and the router will:

1. allocate the offer if its other allocation gates pass;
2. compute a numeric `knownCostCents`;
3. add that amount to plan-level `knownCostCents`;
4. leave `hasUnknownCosts = false` if every allocated offer has a numeric value;
5. only add a warning / human-verification flag.

That converts an explicitly unknown or stale price truth-state into a plan-level known cost.

### Minimal adversarial reproducer

Use an otherwise recommendation-eligible partner and a current, allocatable offer such as:

```ts
{
  partnerCandidateId: "farm-a",
  demandLineId: "tomatoes",
  category: "produce",
  unit: "lb",
  availableQuantity: 1,
  unitPriceCents: 250,
  availabilityState: "VERIFIED",
  priceState: "UNKNOWN",
  serviceAreaState: "VERIFIED_MATCH",
  fulfillmentMode: "PICKUP",
  evidenceObservedAt: "2026-10-01T20:00:00.000Z"
}
```

For demand quantity `1 lb`, the current router computes:

```text
allocation.knownCostCents = 250
plan.knownCostCents       = 250
plan.hasUnknownCosts      = false
allocation.verificationRequired = true
```

The verification warning does not restore the lost cost truth-state: the plan still represents the amount as a known cost.

The same defect exists for `priceState = "STALE"` when `unitPriceCents` is numeric and the offer's overall `evidenceObservedAt` passes the routing-age gate.

### Why this is material

The Wave 1 activation requires:

- unknown pricing to remain unknown;
- unknown-cost handling to remain explicit rather than become a confirmed/known cost;
- stale evidence to fail closed where it governs a claim;
- truth states to remain evidence-bound.

The challenged implementation violates that contract at the routing output boundary.

The existing 12-test suite does not cover this contradiction. Its unknown-price case uses `unitPriceCents: null`, so it cannot detect the failure mode where the authoritative truth state is UNKNOWN/STALE but a numeric amount is also present.

## Stop condition

Material defect found.

Do not repair in this role.  
Do not add persistence.  
Do not run live partner ingestion.  
Do not deploy.  
Do not merge PR #5.  
Do not contact farms or businesses.  
Do not promote any candidate into operational supplier state.

A separate Remediation Builder should own any correction and produce a new immutable candidate for re-challenge.
