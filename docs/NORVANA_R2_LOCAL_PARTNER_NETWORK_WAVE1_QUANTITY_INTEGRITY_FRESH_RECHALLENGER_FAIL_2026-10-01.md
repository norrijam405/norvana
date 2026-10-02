# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 QUANTITY-INTEGRITY FRESH RE-CHALLENGER FAIL

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Disposition

`R2_WAVE1_QUANTITY_INTEGRITY_FRESH_RECHALLENGER_FAIL`

This role independently challenged the exact immutable fifth-remediation candidate after the separate fifth Remediation Builder PASS.

This role did not build or repair the candidate and does not claim Independent Assurance.

Per the activation stop condition, challenge activity stops after preservation of the first material defect.

## Exact challenged immutable candidate

Commit:

`1160a28e308fa506b7533394aaf1e7f47648a6b3`

Parent:

`1f5140eb683da623c760e67240415194f5cdb2b5`

Tree:

`4fd36c6240e7ba555af3fd51e15ee6eec2cca84f`

Exact routing blob independently read from the candidate:

`5874759bf3419de89e37193a83cb29ae9ea92bc2`

The branch routing blob was also `5874759bf3419de89e37193a83cb29ae9ea92bc2` at challenge time; post-candidate branch changes before this reproducer were documentation-only.

Builder verification baseline:

`36961546880 — SUCCESS`

The exact workflow job independently confirms successful steps for:
- R2 partner-network tests;
- typecheck;
- R2-surface lint;
- production build;
- runtime dependency audit;
- full dependency high-severity gate.

The green Builder baseline does not cure the independent defect below.

---

## Preserved finding

### NW-R2-W1-QIFRC-01 — blank quantity unit is accepted as verified coverage and suppresses uncovered-demand truth

**Severity:** Material routing-integrity / unit-semantics fail-open

**Affected file:**

`src/lib/partner-network/routing.ts`

**Exact candidate:**

`1160a28e308fa506b7533394aaf1e7f47648a6b3`

### Root cause

Demand and offer units are modeled as unconstrained strings:

```ts
unit: string;
```

The routing eligibility gate verifies only exact equality:

```ts
if (offer.unit !== line.unit) return false;
```

It does not require either unit to be non-empty or otherwise meaningful.

Therefore an otherwise verified demand/offer pair with:

```ts
demand.unit = "";
offer.unit = "";
```

passes the unit gate because:

```text
"" === "" -> true
```

The quantity itself is finite and positive, so the candidate proceeds to allocation and treats the line as fully covered even though the measurement basis is undefined.

### Minimal reproducer

Durable reproducer:

`tests/r2-wave1-quantity-integrity-fresh-rechallenger-repro-2026-10-01.ts`

Reproducer preservation commit:

`ce4ac1524bd4ec930a5f03efc66c6e59c7495f56`

The reproducer uses otherwise current, recommendation-eligible, fully VERIFIED routing evidence with:

```ts
demand.quantity = 1;
demand.unit = "";
offer.availableQuantity = 1;
offer.unit = "";
offer.unitPriceCents = 250;
offer.availabilityState = "VERIFIED";
offer.priceState = "VERIFIED";
offer.serviceAreaState = "VERIFIED_MATCH";
```

Deterministic execution with Node `v22.16.0` against the exact candidate routing logic produced:

```text
plan.allocations.length                 = 1
plan.allocations[0].quantity            = 1
plan.allocations[0].unit                = ""
plan.allocations[0].knownCostCents      = 250
plan.allocations[0].verificationRequired= false
plan.uncovered.length                   = 0
plan.hasUnknownCosts                    = false
plan.requiresHumanVerification          = false
plan.knownCostCents                     = 250
```

The result is JSON-serializable and preserves the empty unit as `""`, so serialization does not fail closed or expose a non-finite value.

### Why this is material

Wave 1 routing truth is expressed as quantities **in units**. A positive numeric quantity without a defined measurement unit cannot safely establish that demand and supply are commensurate.

The candidate currently treats matching blank units as sufficient evidence of unit compatibility, then:
- emits a proposed allocation;
- reports the line as fully covered;
- reports no uncovered remainder;
- does not require human verification;
- computes an authoritative known cost.

This is a unit/coverage truth defect adjacent to the quantity-integrity boundary under challenge. The fifth remediation closes the preserved NaN/non-finite quantity path, but it does not validate the semantic unit required to interpret those quantities.

`RECOMMEND_ONLY` and `canExecute=false` remain intact in the observed reproducer; this finding is not an execution-authority bypass.

## Stop condition

Material defect found and preserved.

Do not repair in this role.  
Do not self-certify Independent Assurance.  
Do not continue to later Vercel/deployment or additional challenge gates after this first material defect.  
Do not deploy.  
Do not merge PR #5.  
Do not add persistence or live partner ingestion.  
Do not activate suppliers or credentials.  
Do not place orders, charge customers, publish inventory, submit fulfillment, or contact partners autonomously.

A separate Remediation Builder must own any correction and produce a new immutable candidate for another independent challenge.
