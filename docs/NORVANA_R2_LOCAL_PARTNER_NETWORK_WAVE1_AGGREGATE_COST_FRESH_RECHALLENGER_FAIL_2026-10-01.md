# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 AGGREGATE-COST FRESH RE-CHALLENGER FAIL

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Disposition

`R2_WAVE1_AGGREGATE_COST_FRESH_RECHALLENGER_FAIL`

This role independently challenged the exact immutable fourth-remediation candidate after the separate fourth Remediation Builder PASS.

This role did not build or repair the candidate and does not claim Independent Assurance.

Per the activation stop condition, challenge activity stops after preservation of the first material defect.

## Exact challenged immutable candidate

Commit:

`e6191046ae83a2bd480949cf0625e2da5a2d94b9`

Parent:

`64a8b839d470b1da365eab72035be65392d1aef3`

Tree:

`2769f916736043c961310fc5676a45436e0b075f`

Routing blob independently read from the exact candidate:

`b9cfee7827c4713ad83cd62bdbce4a2e441c720c`

Builder verification baseline:

`36960201366 — SUCCESS`

Builder suite baseline:

`33 PASS / 0 FAIL`

The exact workflow run independently confirms:

- workflow: `Norvana R2 Partner Network CI`;
- head SHA: `e6191046ae83a2bd480949cf0625e2da5a2d94b9`;
- conclusion: `success`.

The green Builder baseline does not cure the independent defect below.

---

## Preserved finding

### NW-R2-W1-ACFRC-01 — NaN available quantity becomes an allocation and suppresses uncovered-demand truth

**Severity:** Material routing-integrity / numeric fail-open

**Affected file:**

`src/lib/partner-network/routing.ts`

**Exact candidate:**

`e6191046ae83a2bd480949cf0625e2da5a2d94b9`

### Root cause

The offer eligibility gate rejects an available quantity only when:

```ts
offer.availableQuantity === null || offer.availableQuantity <= 0
```

For JavaScript `NaN`:

```text
NaN === null  -> false
NaN <= 0      -> false
```

Therefore a VERIFIED offer carrying `availableQuantity: NaN` passes the quantity eligibility gate.

The allocation path then performs:

```ts
const quantity = Math.min(remaining, offer.availableQuantity ?? 0);
if (quantity <= 0) continue;
```

With finite positive demand and `availableQuantity = NaN`:

```text
Math.min(1, NaN) -> NaN
NaN <= 0         -> false
```

so the non-finite quantity is pushed into a proposed allocation.

The calculated-cost helper correctly returns null for the non-finite allocation quantity, which forces unknown-cost and human-verification state. However, the routing coverage state then executes:

```ts
remaining -= quantity;
```

which turns `remaining` into `NaN`.

The final uncovered-demand check is:

```ts
if (remaining > 0) { ... }
```

and:

```text
NaN > 0 -> false
```

Therefore the exact candidate emits a non-finite allocation quantity while suppressing the uncovered-demand record for a demand line that was never validly covered.

### Minimal reproducer

Durable reproducer:

`tests/r2-wave1-aggregate-cost-fresh-rechallenger-repro-2026-10-01.ts`

Reproducer preservation commit:

`2cd5ae77e748b882dd7c6f241064ff5fadabde03`

The reproducer uses otherwise current, recommendation-eligible, fully VERIFIED routing evidence with:

```ts
demand.quantity = 1;
offer.availableQuantity = Number.NaN;
offer.unitPriceCents = 250;
offer.availabilityState = "VERIFIED";
offer.priceState = "VERIFIED";
offer.serviceAreaState = "VERIFIED_MATCH";
```

Deterministic evaluation of the exact candidate code path yields:

```text
allocation.quantity               = NaN
allocation.knownCostCents         = null
allocation.verificationRequired   = true
plan.hasUnknownCosts              = true
plan.requiresHumanVerification    = true
remaining after allocation        = NaN
plan.uncovered.length             = 0
```

The human-verification flag does not restore the corrupted routing truth: the plan contains an invalid allocation and omits the uncovered demand that should remain.

### Why this is material

Wave 1 is an order-routing recommendation layer. Allocation quantity and uncovered-demand state are core routing truth outputs.

A non-finite source quantity must not become a proposed allocation, and it must not be able to erase the uncovered remainder through JavaScript NaN comparison behavior.

This defect is adjacent to the arithmetic boundaries under re-challenge: the fourth remediation validates authoritative monetary arithmetic, but the quantity arithmetic feeding allocation and coverage remains fail-open for NaN.

The defect can also create serialization ambiguity because JSON serialization converts numeric NaN values to `null`, potentially obscuring the original invalid numeric state downstream.

The preserved aggregate-cost remediation itself appears to close `NW-R2-W1-FFRC-01` for the inspected overflow/null-state paths before this new stop condition was reached.

`RECOMMEND_ONLY` and `canExecute=false` remain intact; this finding is not an execution-authority bypass.

## Stop condition

Material defect found and preserved.

Do not repair in this role.  
Do not self-certify Independent Assurance.  
Do not continue to later Vercel/dependency/security/authority gates after this first material defect.  
Do not deploy.  
Do not merge PR #5.  
Do not add persistence or live partner ingestion.  
Do not activate suppliers or credentials.  
Do not place orders, charge customers, publish inventory, submit fulfillment, or contact partners autonomously.

A separate Remediation Builder must own any correction and produce a new immutable candidate for another independent challenge.
