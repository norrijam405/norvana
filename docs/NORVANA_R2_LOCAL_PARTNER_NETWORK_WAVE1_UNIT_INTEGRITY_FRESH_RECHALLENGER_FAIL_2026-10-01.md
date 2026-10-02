# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 UNIT-INTEGRITY FRESH RE-CHALLENGER FAIL

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Disposition

`R2_WAVE1_UNIT_INTEGRITY_FRESH_RECHALLENGER_FAIL`

This role independently challenged the exact immutable sixth-remediation candidate after the separate sixth Remediation Builder PASS.

This role did not build or repair the candidate and does not claim Independent Assurance.

Per the activation stop condition, challenge activity stops after preservation of the first material defect.

## Exact challenged immutable candidate

Commit:

`7f5f4f8370fec3343ff83468169f5e68112ce7ca`

Parent:

`1dbc8b1406e61e0d484dfc2e4637c8889fac1c62`

Tree:

`f27fba093be07bc5a1a2737a285a020a782fd1bc`

Exact routing blob independently read from the candidate:

`33096121cd2cad5e6482aeca97a329f731e511de`

The branch routing blob was independently re-read before repro preservation and was still the same exact blob:

`33096121cd2cad5e6482aeca97a329f731e511de`

## Builder baseline independently reconciled

Builder verification run:

`36963393209 — SUCCESS`

Exact checkout in the job log resolves to:

`7f5f4f8370fec3343ff83468169f5e68112ce7ca`

The job independently reports:

- R2 tests: `47 PASS / 0 FAIL`;
- typecheck: PASS;
- R2-surface lint: PASS;
- production build: PASS;
- runtime dependency audit: `0 vulnerabilities`;
- full dependency high-severity gate: PASS, with four moderate development-chain findings preserved below the configured blocker.

The green Builder baseline does not cure the independent defect below.

---

## Preserved finding

### NW-R2-W1-UIFRC-01 — zero-width format-only quantity unit is accepted as verified coverage and suppresses uncovered-demand truth

**Severity:** Material routing-integrity / unit-semantics fail-open

**Affected file:**

`src/lib/partner-network/routing.ts`

**Exact candidate:**

`7f5f4f8370fec3343ff83468169f5e68112ce7ca`

### Root cause

The sixth remediation added this unit normalizer:

```ts
function normalizeUnit(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}
```

Demand and offer units are then compared only after this normalization.

That closes empty-string and ordinary whitespace-only cases, but it treats any string that survives JavaScript `trim()` as a valid measurement unit.

A unit containing only U+200B ZERO WIDTH SPACE survives `trim()`:

```text
"\u200B".trim().length === 1
```

An independent Node `v22.16.0` runtime semantics check confirmed:

```text
ZERO WIDTH SPACE: trimLength=1 equal=true
```

U+200C ZERO WIDTH NON-JOINER and U+2060 WORD JOINER also survive `trim()`.

Therefore otherwise eligible demand and offer rows using the same format-only unit pass both validation and exact equality:

```text
normalizeUnit("\u200B") -> "\u200B"
normalizeUnit("\u200B") -> "\u200B"
"\u200B" === "\u200B" -> true
```

The candidate can then allocate a positive finite quantity and treat the demand as covered even though the measurement basis is visually blank and semantically undefined.

This is the same truth-boundary class as the preserved blank-unit defect, reached through an adjacent Unicode format-character representation rather than an empty or ordinary-whitespace string.

### Serialization boundary

The format-only unit is JSON-serializable. An independent Node `v22.16.0` check produced a valid JSON object containing the U+200B byte sequence, so serialization does not fail closed.

The serialized unit is visually blank, which makes the defect especially difficult to detect through ordinary logs or UI review.

### Durable reproducer

Reproducer:

`tests/r2-wave1-unit-integrity-fresh-rechallenger-repro-2026-10-01.ts`

Reproducer preservation commit:

`504b4388a909a05cfd324f4f3e0f3a78630f72be`

The reproducer uses otherwise current, recommendation-eligible, fully VERIFIED routing evidence and sets:

```ts
demand.unit = "\u200B";
offer.unit = "\u200B";
```

Its fail-closed expectation is:

```ts
plan.allocations.length === 0
plan.uncovered.length === 1
plan.requiresHumanVerification === true
```

The exact candidate routing blob makes the unit survive normalization and satisfy equality, so that expectation is not enforced by the frozen bytes.

### Why this is material

Wave 1 routing truth is expressed as quantities in units. A positive quantity paired with a format-only, visually blank token does not establish that demand and supply share a defined measurement basis.

The candidate's current boundary can therefore:

- accept a semantically undefined unit as valid;
- treat two matching invisible tokens as compatible;
- create a proposed allocation;
- suppress uncovered-demand truth;
- emit a normalized allocation unit that remains visually blank;
- avoid forcing human verification when all other evidence is VERIFIED;
- compute and aggregate a known cost against that undefined measurement basis.

`RECOMMEND_ONLY` and `canExecute=false` remain intact; this finding is not an execution-authority bypass.

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
