# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 POST-UIFRC FRESH RE-CHALLENGER FAIL

Date: 2026-10-02

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Disposition

`R2_WAVE1_POST_UIFRC_REMEDIATION_FRESH_RECHALLENGER_FAIL`

This role independently challenged the exact immutable seventh-remediation candidate after the separate Seventh Remediation Builder PASS.

This role did not repair the candidate and does not claim Independent Assurance.

Per the activation stop condition, challenge activity stops after preservation of the first material defect.

## Exact challenged immutable candidate

Commit:

`aaf1824b98a11b1a990acecd1b12a76be0747f5a`

Parent:

`48e923fd1eabc362e3ca0558bcdc1525a47905d3`

Tree:

`579a6646e290c9661103a01c9b0f709b294784c7`

Routing blob:

`e347586fdf43e431448607812306a227c5662847`

Original candidate test blob:

`4f02868edae6012e5be4d6a8d3ad1415e990ec4f`

Builder verification:

`36965478032 — SUCCESS`

Builder baseline:

`52 PASS / 0 FAIL`

## Challenge harness preservation

Minimal reproducer:

`tests/r2-wave1-post-uifrc-fresh-rechallenger-repro-2026-10-02.ts`

Reproducer preservation commit:

`24c7776559207caf585118cf91c9d7207f1dd8ba`

Reproducer blob:

`fc735e01be44b8b733bdba7b90961a73c926028e`

The R2 test command was then extended only to execute the new challenge reproducer.

Challenge harness commit:

`754a1626375fdb538689153a73165b792aabecad`

The production routing source remained byte-identical to the frozen candidate during the challenge:

`src/lib/partner-network/routing.ts` blob:

`e347586fdf43e431448607812306a227c5662847`

No production routing repair was made.

## Executed CI evidence

GitHub Actions run:

`37028697299 — FAILURE`

Job:

`110910038033 — static-verification`

The secret-regression gate passed before the challenge test executed.

R2 test result:

`52 PASS / 1 FAIL`

Failing subtest:

`default-ignorable combining-mark-only quantity unit cannot establish verified coverage`

Observed assertion:

`expected allocations.length = 0`

`actual allocations.length = 1`

The test runner reported:

`ERR_ASSERTION`

and exited with code 1.

Because the challenge test intentionally failed first, later typecheck/lint/build/audit steps in that run were skipped. Their prior Builder PASS remains preserved but does not cure this finding.

---

## Preserved finding

### NW-R2-W1-DIU-01 — default-ignorable combining-mark-only unit is accepted as verified coverage and suppresses uncovered-demand truth

**Severity:** Material routing-integrity / unit-semantics fail-open

**Affected file:**

`src/lib/partner-network/routing.ts`

**Exact candidate:**

`aaf1824b98a11b1a990acecd1b12a76be0747f5a`

### Root cause

The seventh remediation rejects only Unicode control and format categories:

```ts
const UNSAFE_UNIT_CHARACTERS = /[\p{Cc}\p{Cf}]/u;
```

and otherwise accepts any non-empty string that survives `trim()`.

U+034F COMBINING GRAPHEME JOINER is a default-ignorable combining mark. It is not category `Cc` or `Cf`.

Independent Node `v22.16.0` runtime semantics confirmed:

- `"\u034F".trim().length === 1`;
- `/[\p{Cc}\p{Cf}]/u.test("\u034F") === false`;
- `/\p{Default_Ignorable_Code_Point}/u.test("\u034F") === true`;
- the value survives JSON serialization.

Therefore the frozen candidate normalizes U+034F as a valid unit instead of rejecting it.

When otherwise VERIFIED demand and offer rows both use the same U+034F unit, exact equality succeeds and the routing engine creates an allocation.

The executed challenge CI proved the resulting observable behavior:

`plan.allocations.length === 1`

where the fail-closed expectation is zero allocations plus explicit uncovered demand and human verification.

### Why this is material

A positive quantity paired only with a default-ignorable combining mark does not establish a meaningful measurement basis.

The candidate can therefore:

- accept an effectively invisible/semantically undefined measurement token;
- treat matching default-ignorable tokens as compatible;
- create a proposed allocation;
- suppress uncovered-demand truth;
- avoid the intended invalid-unit fail-closed path;
- compute cost against that undefined unit basis.

`RECOMMEND_ONLY` and `canExecute=false` remain intact; this finding is not an execution-authority bypass.

## Stop condition

Material defect found, executed, and preserved.

Do not repair in this role.  
Do not self-certify Independent Assurance.  
Do not continue to later deployment or assurance gates after this first material defect.  
Do not deploy.  
Do not merge PR #5.  
Do not add persistence or live partner ingestion.  
Do not activate suppliers or credentials.  
Do not place orders, charge customers, publish inventory, submit fulfillment, or contact partners autonomously.

A separate Remediation Builder must own correction and produce a new immutable candidate for another independent challenge.
