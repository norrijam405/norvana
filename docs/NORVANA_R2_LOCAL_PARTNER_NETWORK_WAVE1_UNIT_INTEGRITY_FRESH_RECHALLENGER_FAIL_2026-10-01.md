# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 UNIT-INTEGRITY FRESH RE-CHALLENGER FAIL

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Challenge evidence branch: `challenge/2026-10-01-r2-unit-integrity-fresh-rechallenger-fail`

## Disposition

`R2_WAVE1_UNIT_INTEGRITY_FRESH_RECHALLENGER_FAIL`

This role independently challenged the exact immutable sixth-remediation candidate.

This role did not build or repair the candidate and does not claim Independent Assurance.

Per the activation stop condition, challenge activity stops after preservation of the first material defect.

## Exact challenged immutable candidate

Commit:

`7f5f4f8370fec3343ff83468169f5e68112ce7ca`

Parent:

`1dbc8b1406e61e0d484dfc2e4637c8889fac1c62`

Tree:

`f27fba093be07bc5a1a2737a285a020a782fd1bc`

Routing blob read from the exact candidate:

`33096121cd2cad5e6482aeca97a329f731e511de`

Builder verification baseline:

`36963393209 — SUCCESS`

Builder test baseline:

`47 PASS / 0 FAIL`

The challenge evidence branch was created directly from the exact candidate. The reproducer commit adds only the challenge test and does not modify routing logic.

## Preserved finding

### NW-R2-W1-UIFRC-01 — invisible format-only quantity unit is accepted as verified coverage and suppresses uncovered-demand truth

**Severity:** Material routing-integrity / unit-semantics fail-open

**Affected file:**

`src/lib/partner-network/routing.ts`

### Root cause

The candidate validates units with:

```ts
function normalizeUnit(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
```

ECMAScript `String.prototype.trim()` does not remove U+200B ZERO WIDTH SPACE.

Therefore:

```text
"\u200B".trim().length === 1
```

An otherwise verified demand/offer pair with matching `unit = "\u200B"` passes unit validation and exact equality even though the rendered measurement basis is invisible and semantically undefined.

### Minimal reproducer

Durable reproducer:

`tests/r2-wave1-unit-integrity-fresh-rechallenger-repro-2026-10-01.ts`

Reproducer commit:

`3c6067e72ab723df3ffdae3958bbd8a0aeb18e49`

The evidence branch is rooted directly at the challenged candidate, so the reproducer imports the candidate routing implementation without using the later moving feature-branch routing blob.

### Deterministic runtime observation

Node runtime execution of the candidate logic with:

```ts
demand.quantity = 1;
demand.unit = "\u200B";
offer.availableQuantity = 1;
offer.unit = "\u200B";
offer.unitPriceCents = 250;
offer.availabilityState = "VERIFIED";
offer.priceState = "VERIFIED";
offer.serviceAreaState = "VERIFIED_MATCH";
```

produced:

```text
trimmedLength                         = 1
plan.allocations.length               = 1
plan.allocations[0].quantity          = 1
plan.allocations[0].unit              = U+200B
plan.allocations[0].knownCostCents    = 250
plan.allocations[0].verificationRequired = false
plan.uncovered.length                 = 0
plan.requiresHumanVerification        = false
plan.knownCostCents                   = 250
plan.authority                        = RECOMMEND_ONLY
plan.canExecute                       = false
```

The preserved reproducer asserts fail-closed behavior and therefore fails against the frozen candidate.

No GitHub workflow run/status was attached to the challenge evidence commit at preservation time; this receipt does not misrepresent absent CI as execution evidence.

### Why this is material

The preserved predecessor defect was that an undefined measurement basis could be treated as verified compatibility and suppress uncovered-demand truth.

The sixth remediation rejects empty strings and ordinary trim-removable whitespace, but still permits an invisible format-only string to become a valid normalized unit. Matching copies of that invisible unit establish compatibility, allocate demand, compute known cost, and report complete coverage without human verification.

This is the same truth-integrity class at a neighboring unit-validation boundary, not a cosmetic display issue.

`RECOMMEND_ONLY` and `canExecute=false` remain intact in the observed reproducer. This finding is not an execution-authority bypass.

## Stop condition

Material defect found and preserved.

Do not repair in this role.  
Do not self-certify Independent Assurance.  
Do not continue to later challenge gates after this first material defect.  
Do not deploy.  
Do not merge PR #5.  
Do not add persistence or live partner ingestion.  
Do not activate suppliers or credentials.  
Do not place orders, charge customers, publish inventory, submit fulfillment, or contact partners autonomously.

A separate Remediation Builder must own any correction and produce a new immutable candidate for another independent challenge.
