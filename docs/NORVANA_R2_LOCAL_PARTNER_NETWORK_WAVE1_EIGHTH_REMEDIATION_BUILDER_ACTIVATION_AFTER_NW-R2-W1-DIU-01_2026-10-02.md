# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 EIGHTH REMEDIATION BUILDER ACTIVATION AFTER NW-R2-W1-DIU-01

Date: 2026-10-02

You are being activated as the **separate Remediation Builder** for Norvana R2 Local Partner Network & Order Routing Wave 1 after a preserved Fresh Re-Challenger failure.

Repository:

`norrijam405/norvana`

Pull Request:

`#5`

Branch:

`feature/2026-10-01-norvana-r2-local-partner-network`

Begin with:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_POST_UIFRC_FRESH_RECHALLENGER_FAIL_2026-10-02.md`

Then read:

`tests/r2-wave1-post-uifrc-fresh-rechallenger-repro-2026-10-02.ts`

Then reconcile the Seventh Remediation Builder PASS:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_SEVENTH_REMEDIATION_BUILDER_PASS_AFTER_NW-R2-W1-UIFRC-01_2026-10-01.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Fresh Re-Challenger that issued `NW-R2-W1-DIU-01`.

Do not self-certify Fresh Re-Challenge or Independent Assurance.

## Exact failed candidate

Frozen candidate commit:

`aaf1824b98a11b1a990acecd1b12a76be0747f5a`

Tree:

`579a6646e290c9661103a01c9b0f709b294784c7`

Routing blob:

`e347586fdf43e431448607812306a227c5662847`

Builder baseline before the challenge:

`36965478032 — SUCCESS`

`52 PASS / 0 FAIL`

## Preserved Fresh Re-Challenger evidence

Finding:

`NW-R2-W1-DIU-01 — default-ignorable combining-mark-only unit is accepted as verified coverage and suppresses uncovered-demand truth`

Reproducer commit:

`24c7776559207caf585118cf91c9d7207f1dd8ba`

Challenge harness commit:

`754a1626375fdb538689153a73165b792aabecad`

Challenge CI:

`37028697299 — FAILURE`

Challenge job:

`110910038033`

Observed tests:

`52 PASS / 1 FAIL`

Observed failure:

`expected allocations.length = 0`

`actual allocations.length = 1`

The production routing blob at the challenge harness commit remained exactly:

`e347586fdf43e431448607812306a227c5662847`

## Builder mission

Repair only the preserved unit-semantics defect without weakening prior protections.

At minimum:

1. reject U+034F COMBINING GRAPHEME JOINER as a valid demand or offer unit;
2. reject default-ignorable combining-mark-only tokens that can survive `trim()`;
3. preserve rejection of Unicode `Cc` and `Cf` characters from the seventh remediation;
4. preserve ordinary outer whitespace normalization;
5. preserve valid visible units including `lb`, `kg`, `dozen`, and `fl oz`;
6. preserve exact-unit comparison semantics unless a narrower validated canonicalization is explicitly justified;
7. do not introduce unit conversion, implicit synonym mapping, or case folding;
8. preserve finite-positive demand and availability validation;
9. preserve monetary safe-integer and aggregate-overflow fail-closed behavior;
10. preserve stale evidence and service-area protections;
11. preserve explicit uncovered-demand truth;
12. preserve `RECOMMEND_ONLY` and `canExecute=false`;
13. do not add persistence, ingestion, deployment, supplier activation, credentials, ordering, charging, publishing, fulfillment submission, partner contact, or ACT authority.

Do not merely special-case U+034F if the same semantic defect remains reachable through adjacent default-ignorable combining marks or variation-selector-only tokens.

Use the preserved reproducer as a required regression test.

## Required verification

Produce a new immutable candidate and execute the full R2 CI surface.

The Builder must not claim PASS unless all required checks are green, including:

- the preserved DIU reproducer;
- all existing R2 tests;
- secret-regression gate;
- TypeScript typecheck;
- R2-surface lint;
- production build;
- runtime dependency audit;
- full dependency high-severity gate.

Record exact commit, parent, tree, routing blob, test/reproducer blob(s), CI run ID, and test counts in a durable Builder PASS receipt.

## Stop condition

If remediation cannot close the defect without broadening authority or weakening prior truth boundaries, preserve a Builder FAIL and stop.

If the candidate passes Builder verification, stop after preserving the immutable Builder PASS and activate a genuinely separate Fresh Re-Challenger.

Do not self-certify the next gate.
