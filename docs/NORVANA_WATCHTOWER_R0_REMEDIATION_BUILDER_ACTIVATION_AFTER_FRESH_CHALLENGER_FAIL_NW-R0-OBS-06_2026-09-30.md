# NORVANA WATCHTOWER R0 — REMEDIATION BUILDER ACTIVATION AFTER FRESH CHALLENGER FAIL NW-R0-OBS-06

Date: 2026-09-30

Repository: `norrijam405/norvana`
Pull Request: `#1`
Branch: `recovery/2026-09-26-norvana-modernization-r0`

You are the **separate Remediation Builder** after the Fresh Challenger failure:

`NW-R0-OBS-06 — SAME_ORIGIN_GUARDS_COMPARE_HOST_ONLY_AND_ACCEPT_CROSS_SCHEME_OR_MALFORMED_ORIGIN`

Durable failure report:

`docs/NORVANA_WATCHTOWER_R0_FRESH_CHALLENGER_FAIL_AFTER_NW-R0-OBS-05_REMEDIATION_2026-09-30.md`

Failure report commit:

`56e2e8a750564c624f6d9a8db0580a853069d10e`

PR #1 receipt:

`5914937102`

You are not the Fresh Challenger that issued this finding.

Do not rewrite prior PASS/FAIL lineage.

Do not deploy or rerun the real observation proof in this role.

Do not self-certify Fresh Challenger, Re-Challenger, Independent Assurance, or closure.

## Exact failed candidate

`7e6b525d914b35eebfd207ed2cb3013ac09fd007`

Tree:

`c2d4e94a401b80e9adad8c9db7a9a52c1cdf9378`

Recovery CI:

`36735040684 — SUCCESS`

## Required remediation properties

Implement full web-origin semantics for both the authenticated safe-read guard and the retained strict mutation guard.

At minimum:

1. Compare the complete expected request origin, including scheme, host, and effective port.
2. Use the actual request origin as the comparison target; do not reduce it to Host alone.
3. Treat an Origin header as a serialized origin, not an arbitrary URL:
   - reject `Origin: null`;
   - reject paths;
   - reject query strings;
   - reject fragments;
   - reject URL userinfo;
   - reject non-http(s) schemes;
   - reject non-canonical/default-port spellings that are not the serialized origin.
4. Reject same-host cross-scheme Origin values.
5. For Referer, compare its parsed full `.origin` to the expected request origin; a path is allowed in Referer.
6. Fail closed on malformed Referer values.
7. When multiple provenance signals are present, all must agree:
   - an explicit valid Origin cannot be overridden by contradictory Fetch Metadata or Referer;
   - `Sec-Fetch-Site: same-origin` cannot override an attacker Referer;
   - a same-origin Referer cannot override `Sec-Fetch-Site: cross-site` or `same-site`.
8. Origin-less safe GET/HEAD may pass only when at least one accepted same-origin browser provenance signal is present and no supplied signal contradicts it.
9. Origin-less unsafe methods remain rejected.
10. The strict mutation guard must still require an explicit valid same-origin Origin.
11. Server-admin-token authentication behavior must remain unchanged.
12. GET /api/watchtower/jobs remains the only Watchtower jobs route using the safe-read guard.
13. POST /api/watchtower/jobs and PATCH /api/watchtower/jobs/{id} remain on the strict mutation guard.
14. Preserve NW-R0-OBS-02 redirect hardening.
15. Preserve NW-R0-OBS-03 source-controlled destination binding.
16. Preserve NW-R0-OBS-04 no-OIDC preflight / inert confirmation handling.
17. Preserve all runtime proof, watcher/run cardinality, zero-cost/zero-candidate, and consequential-action locks.
18. Keep `git.deploymentEnabled=false`.
19. Do not deploy.

Add adversarial executable tests for cross-scheme, path-bearing Origin, `Origin: null`, contradictory Fetch Metadata + Referer, same-site-but-not-same-origin, malformed Referer, exact port behavior, and mutation semantics.

Bank an immutable remediation candidate and successful Recovery CI, then hand it to a genuinely separate Fresh Challenger.
