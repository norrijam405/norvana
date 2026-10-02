# NORVANA CJ READ-ONLY LIVE PROVING R0 — FRESH CHALLENGER ACTIVATION

Date: 2026-09-29

You are being activated as a **separate Fresh Challenger** for Norvana CJdropshipping Read-Only Live Proving R0.

Repository:
`norrijam405/norvana`

Pull Request:
`#3`

Branch:
`feature/2026-09-29-norvana-cj-readonly-qualification-r0`

Begin with:
`docs/NORVANA_CJ_READONLY_QUALIFICATION_R0.md`

Then read:
`docs/NORVANA_CJ_READONLY_LIVE_PROVING_R0_BUILDER_PROOF_2026-09-29.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this candidate.
You are not the Remediation Builder.
You are not Independent Assurance.
Do not repair defects in this role.

## Live proof to challenge

Final successful controlled Preview:

`dpl_EfUjDwjvi2aWchTorjetSvUndjXA`

Gate commit:

`e50a68ca6d2479f1262cb4b9c04b1273e9d9cf7a`

State:

`READY`

Post-probe branch remains frozen.

## Required attack

At minimum independently evaluate:

1. the final Preview was actually built from the claimed gate commit;
2. the one-shot build probe fails closed on any failed read stage;
3. the probe cannot create/confirm/cancel an order;
4. the probe cannot pay, publish, activate a supplier, fulfill, refund, or reprice;
5. no API key/access token/refresh token is printed or returned;
6. Product List V2 parsing matches the current admitted contract;
7. stock read truth does not fabricate quantity;
8. warehouse evidence derived from stock is correctly labeled and not broadened into a global-warehouse claim;
9. freight calculation is quote-only, requires at least one live normalized quote for PASS, and cannot submit an order;
10. the prior authentication failure and global-warehouse-list failure are preserved;
11. branch deployment is refrozen after proof;
12. registry state `FREIGHT_QUOTE_PROVEN` does not imply `READ_ONLY_SHADOW_VERIFIED` or ACT authority.

If a defect is established:
- issue `CJ-LIVE-R0-CHAL-XX`;
- preserve exact evidence;
- STOP without repair.

If no defect is established:
- issue `FRESH_CHALLENGER_PASS` bound to the exact live-proof lineage.

NO FAKE PASS.

Activation status: `READY_FOR_SEPARATE_FRESH_CHALLENGER`
