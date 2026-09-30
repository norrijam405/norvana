# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF REMEDIATION BUILDER ACTIVATION AFTER DIFFERENT FRESH RE-CHALLENGER FAIL NW-R0-OBS-03

Date: 2026-09-29

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

You are the **separate Remediation Builder** after the Different Fresh Re-Challenger failure:

`NW-R0-OBS-03 — OBSERVE_PROOF_OIDC_TOKEN_DESTINATION_IS_MUTABLE_AND_UNBOUND`

The failure is durably preserved in:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_DIFFERENT_FRESH_RECHALLENGER_FAIL_AFTER_NW-R0-OBS-02_REMEDIATION_2026-09-29.md`

Documentation commit:

`27c3491baebb3b585aa10f301fab5e9723c93d50`

PR #1 receipt/comment:

`5904379440`

You are not the Re-Challenger that issued the finding.

Do not rewrite prior PASS/FAIL lineage.

Do not deploy or execute the real observation proof in this role.

Do not self-certify Re-Challenger or Independent Assurance.

## Exact failed executable candidate

`42674b7682be919b326aba0d7b72d5b3a4df76ef`

Tree:

`7a887cb65f54da9809e1e81f148e9d871bff7bc0`

Recovery CI:

`36669458901 — SUCCESS`

## Remediation mission

Remove mutable destination authority from repository variables and bind credential transmission to checked-in source.

Required properties:

1. The observe-proof workflow must not obtain its credential-bearing destination from repository variables, secrets, workflow inputs, or arbitrary environment variables.
2. The worker must not obtain its credential-bearing destination from `process.env`.
3. The checked-in candidate must contain an explicit UNPINNED sentinel and must fail before OIDC mint while that sentinel remains.
4. OIDC mint must occur only after:
   - checkout;
   - Node setup;
   - explicit confirmation;
   - successful checked-in destination-pin validation.
5. Destination validation must require:
   - HTTPS;
   - no userinfo;
   - no non-default port;
   - origin-only URL;
   - exact Norvana Vercel project deployment-host shape.
6. No request carrying the GitHub OIDC token may be constructed before the pinned destination has been validated.
7. The worker and pre-mint gate must use the same source-controlled destination definition.
8. Add tests proving:
   - the UNPINNED candidate fails closed;
   - attacker HTTPS origins are rejected;
   - suffix-confusion hosts are rejected;
   - HTTP, userinfo, custom-port, path/query/hash forms are rejected;
   - a representative exact Norvana deployment origin can pass when explicitly supplied to the validator;
   - workflow checkout and pin validation precede OIDC mint;
   - the workflow contains no mutable repository-variable destination;
   - the worker contains no environment-derived base URL.
9. Preserve all NW-R0-OBS-02 per-hop redirect remediation.
10. Preserve queue/claim/finalization, runtime proof binding, OIDC claim checks, watcher/run cardinality, zero-cost/zero-candidate, and consequential-action locks.
11. Keep `git.deploymentEnabled=false`.
12. Do not deploy.

## Future controlled pin rule

The Builder must not invent a Preview URL.

After independent re-challenge passes, a separate controlled live-proof operator may:
1. deploy the exact challenged application candidate to exactly one Preview;
2. obtain the exact immutable Preview origin;
3. copy the already-challenged observe-proof workflow/client bytes to `main` if required by GitHub `workflow_dispatch`;
4. change only the source-controlled UNPINNED destination literal to that exact Preview origin;
5. independently reconcile that pin/copy diff before minting any OIDC token.

That later pin is not authorized by this Builder role.

Bank an immutable remediation candidate and hand it to a genuinely different Fresh Re-Challenger.
