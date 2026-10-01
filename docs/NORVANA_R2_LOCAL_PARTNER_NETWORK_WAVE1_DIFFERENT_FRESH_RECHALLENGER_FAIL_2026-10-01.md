# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 DIFFERENT FRESH RE-CHALLENGER FAIL

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Disposition

`R2_WAVE1_DIFFERENT_FRESH_RECHALLENGER_FAIL`

This role independently challenged the exact remediation candidate after the separate Remediation Builder PASS.

This role did not build or repair the candidate and does not claim Independent Assurance.

## Exact challenged immutable remediation candidate

Commit:

`37eabcea19faa3c99bfd31413f75fd86b363853c`

Parent:

`e963b6d64dd1775d521dcfc9dccdd2acda41fef0`

Tree asserted by activation:

`0f68cef6bcbc470e9db65aa778a0a4124460b2e2`

Routing blob independently confirmed unchanged at the re-challenge branch before preservation:

`dc62796d3f75e5fe8889fbe3de5ed0c26ae99a10`

Builder verification baseline:

`36930706898 — SUCCESS`

Builder tests:

`16 PASS / 0 FAIL`

The green Builder baseline does not cure the independent defect below.

---

## Preserved finding

### NW-R2-W1-DFRC-01 — VERIFIED price state with no numeric amount yields unknown cost while falsely reporting no human verification required

**Severity:** Material truth-state / verification-boundary contradiction

**Affected file:**

`src/lib/partner-network/routing.ts`

**Exact candidate:**

`37eabcea19faa3c99bfd31413f75fd86b363853c`

### Root cause

The remediation correctly gates known price/cost promotion through:

`offer.priceState === "VERIFIED"`

and therefore a `VERIFIED` offer with:

`unitPriceCents = null`

correctly produces:

- allocation `unitPriceCents = null`;
- allocation `knownCostCents = null`;
- plan `hasUnknownCosts = true`.

However, `verificationRequired` is computed only from claim-state/evidence-age checks:

- availability state;
- price state;
- service-area state;
- evidence age.

It does **not** include the condition that a current numeric price amount is absent.

Therefore a fully covered allocation with all claim states marked VERIFIED but `unitPriceCents = null` produces the contradictory output:

```text
allocation.knownCostCents          = null
plan.hasUnknownCosts               = true
allocation.verificationRequired    = false
plan.requiresHumanVerification     = false
```

The same plan also emits:

`"At least one proposed allocation has unknown current cost."`

while simultaneously declaring that no human verification is required.

### Minimal reproducer

Durable reproducer:

`tests/r2-wave1-different-fresh-rechallenger-repro-2026-10-01.ts`

Reproducer preservation commit:

`2ba575cb80f92384c92ef354c753e45717070850`

The reproducer constructs an otherwise recommendation-eligible partner and a fresh allocatable offer with:

```ts
availabilityState: "VERIFIED",
priceState: "VERIFIED",
unitPriceCents: null,
serviceAreaState: "VERIFIED_MATCH"
```

and asserts that an allocation whose current cost remains unknown must not report verification complete.

On the exact candidate, the cost-unknown assertions pass, but the verification assertions fail because both verification flags are false.

### Why this is material

Wave 1 explicitly requires unknown cost handling to remain explicit and every plan to disclose whether human verification is required.

A downstream review surface can reasonably use `requiresHumanVerification` as the plan-level gate for whether a proposal is ready for human acceptance/review. The exact candidate can therefore describe a financially incomplete allocation as requiring no verification even while simultaneously declaring that its current cost is unknown.

`RECOMMEND_ONLY` and `canExecute=false` remain intact; this finding is not an execution-authority bypass. It is a contradiction in the plan's safety/truth-state signaling.

## Other re-challenge observations before stop condition

The preserved predecessor finding `NW-R2-W1-FC-01` appears remediated for `UNKNOWN`, `STALE`, and `CLAIMED` numeric price states:

- non-VERIFIED numeric price evidence is not promoted into known allocation cost;
- mixed plans sum only VERIFIED known costs;
- non-VERIFIED price states continue to force verification;
- ordinary price tie-breaking does not use the non-VERIFIED numeric amount;
- VERIFIED numeric pricing still produces known cost;
- stale availability and over-age offer evidence continue to fail closed;
- `authority = "RECOMMEND_ONLY"` and `canExecute = false` remain intact.

The re-challenge stops on the first newly preserved material defect, per activation.

## Stop condition

Material defect found and preserved.

Do not repair in this role.  
Do not self-certify Independent Assurance.  
Do not deploy.  
Do not merge PR #5.  
Do not add persistence or live partner ingestion.  
Do not activate suppliers or credentials.  
Do not place orders, charge customers, publish inventory, submit fulfillment, or contact partners autonomously.

A separate Remediation Builder must own any correction and produce a new immutable candidate for another independent challenge.
