# NORVANA R2 — LOCAL PARTNER NETWORK WAVE 1 SEVENTH REMEDIATION BUILDER ACTIVATION AFTER NW-R2-W1-UIFRC-01

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Role

You are being activated as the **separate Seventh Remediation Builder** for Norvana R2 Local Partner Network & Order Routing Wave 1 after the preserved Unit-Integrity Fresh Re-Challenger failure.

You are not the Fresh Re-Challenger that issued `NW-R2-W1-UIFRC-01`.

Do not self-certify re-challenge or Independent Assurance.

## Governing failure

Begin with:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_WAVE1_UNIT_INTEGRITY_FRESH_RECHALLENGER_FAIL_2026-10-01.md`

Governing FAIL receipt commit:

`99aaedf75325be11c8d725c3100bf5317fea1ad1`

Preserved finding:

`NW-R2-W1-UIFRC-01 — zero-width format-only quantity unit is accepted as verified coverage and suppresses uncovered-demand truth`

Exact failed candidate:

`7f5f4f8370fec3343ff83468169f5e68112ce7ca`

Tree:

`f27fba093be07bc5a1a2737a285a020a782fd1bc`

Durable reproducer preservation commit:

`504b4388a909a05cfd324f4f3e0f3a78630f72be`

## Builder mission

Remediate only the unit-integrity boundary required to close `NW-R2-W1-UIFRC-01`.

At minimum:

1. reject format-only or invisible/control-character unit tokens;
2. reject U+200B ZERO WIDTH SPACE, U+200C ZERO WIDTH NON-JOINER, and U+2060 WORD JOINER;
3. ensure such demand units cannot route and force human verification;
4. ensure such offer units cannot allocate valid demand;
5. ensure invalid unit rows cannot suppress uncovered-demand truth;
6. preserve outer ordinary whitespace normalization;
7. preserve exact semantic matching after validation;
8. preserve valid visible units and positive fractional quantity behavior;
9. preserve all monetary, quantity, stale-evidence, and recommendation-authority protections;
10. preserve `RECOMMEND_ONLY` and `canExecute=false`.

Prefer a narrow fail-closed validation rule rather than unit conversion, synonym mapping, case folding, or a broad redesign.

## Authority ceiling

Do not:
- add persistence;
- run live partner ingestion;
- deploy R2;
- merge PR #5;
- contact farms or businesses;
- promote suppliers;
- create supplier credentials;
- place orders;
- charge customers;
- publish inventory;
- submit fulfillment;
- activate ACT authority.

## Builder stop condition

Produce:
- a new immutable remediation candidate;
- deterministic regression tests;
- CI evidence;
- a Builder PASS receipt only if the exact candidate passes all required gates.

Any later re-challenge must be performed by a genuinely separate challenger.
