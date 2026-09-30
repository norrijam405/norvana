# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER ACTIVATION AFTER NW-R0-OBS-03 REMEDIATION

Date: 2026-09-29

You are being activated as a **different Fresh Re-Challenger** for the post-assurance Norvana Watchtower R0 real-observe proof lane.

Repository:

`norrijam405/norvana`

Pull Request:

`#1`

Branch:

`recovery/2026-09-26-norvana-modernization-r0`

Begin with:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_REMEDIATION_BUILDER_ACTIVATION_AFTER_DIFFERENT_FRESH_RECHALLENGER_FAIL_NW-R0-OBS-03_2026-09-29.md`

Then read:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_REMEDIATION_BUILDER_PASS_AFTER_NW-R0-OBS-03_2026-09-29.md`

Also reconcile:
- prior Different Fresh Re-Challenger report commit `27c3491baebb3b585aa10f301fab5e9723c93d50`;
- PR #1 receipt/comment `5904379440`.

Do not ask Norris to reconstruct history already preserved in GitHub.

You did not build this remediation candidate.

You are not the Remediation Builder.

You are not the Different Fresh Re-Challenger that issued `NW-R0-OBS-03`.

You are not any prior Watchtower Challenger/Re-Challenger, controlled live-proof operator, or Independent Assurance role.

Do not repair defects in this role.

Do not deploy or execute the real observation proof.

Do not self-certify closure.

## Exact immutable remediation candidate

Commit:

`bedd8f972b298a779e6d2fb5a24e673d78e550ce`

Parent:

`e26da0b3886c6a690c2cc2915322b55da1cb8f11`

Tree:

`8bb00e193e5330e71c38db552c01ad0096a8a99b`

Required Recovery CI:

`36672087507 — SUCCESS`

Expected Watchtower tests:

`35 PASS / 0 FAIL`

## Preserved finding to re-challenge

`NW-R0-OBS-03 — OBSERVE_PROOF_OIDC_TOKEN_DESTINATION_IS_MUTABLE_AND_UNBOUND`

The previous failed candidate allowed a mutable repository variable to choose the HTTPS destination that received the freshly minted GitHub OIDC token.

## Re-Challenge mission

Independently attack the exact remediation candidate.

At minimum prove or disprove:

1. No repository variable, secret, workflow input, or arbitrary environment value controls the credential-bearing destination.
2. The worker no longer reads its base URL from `process.env`.
3. The checked-in candidate contains the explicit UNPINNED sentinel.
4. The candidate cannot mint OIDC while that sentinel remains.
5. Checkout and Node setup occur before destination validation.
6. Destination validation occurs before the OIDC request endpoint is called.
7. A failed destination check cannot fall through to mint.
8. The worker and pre-mint gate use the same checked-in destination source.
9. The destination validator rejects:
   - attacker HTTPS origin;
   - suffix confusion;
   - HTTP downgrade;
   - userinfo;
   - custom port;
   - path/query/fragment;
   - malformed URL.
10. The destination validator accepts only the intended Norvana Vercel controlled-Preview host shape.
11. The candidate cannot be tricked by case, trailing dot, Unicode/punycode, percent encoding, IPv4/IPv6, alternate port syntax, or URL parser ambiguity.
12. No OIDC-bearing request is made before destination validation succeeds.
13. The future pin boundary is explicit and does not silently authorize the Builder to invent or deploy a URL.
14. The prior NW-R0-OBS-02 per-hop redirect remediation remains intact.
15. Queue/claim/finalization current-runtime proof binding remains intact.
16. Watcher/run cardinality remains intact.
17. Zero-cost/zero-candidate constraints remain intact.
18. Dedicated OIDC claim isolation remains intact.
19. ACT, spending, ordering, publishing, repricing, refunds, supplier activation, fulfillment, normal scheduler/executor, and IgniAqua federation remain locked.
20. `git.deploymentEnabled=false` remains restored.
21. No deployment exists for the candidate and no real observation proof was performed.
22. Prior PASS/FAIL lineage remains preserved.

Do not accept the Builder report merely because CI is green.

You may add adversarial local/static tests if they do not repair the candidate.

## Disposition

If any material defect is found:

`DIFFERENT_FRESH_RECHALLENGER_FAIL`

Preserve the exact finding durably in GitHub. Do not repair it.

Only if the exact immutable candidate survives:

`DIFFERENT_FRESH_RECHALLENGER_PASS`

PASS does not authorize deployment or execution. It permits progression only to a separate controlled live-proof gate.
