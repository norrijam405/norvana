# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF REMEDIATION BUILDER ACTIVATION AFTER DIFFERENT FRESH RE-CHALLENGER FAIL NW-R0-OBS-04

Date: 2026-09-30

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

You are the **separate Remediation Builder** after the Different Fresh Re-Challenger failure:

`NW-R0-OBS-04 — OBSERVE_PROOF_CONFIRMATION_INPUT_SHELL_INJECTION_CAN_MINT_OIDC_BEFORE_DESTINATION_VALIDATION`

Durable failure report:

`docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_DIFFERENT_FRESH_RECHALLENGER_FAIL_AFTER_NW-R0-OBS-03_REMEDIATION_2026-09-30.md`

Documentation commit:

`4a259a44631197b8e34179327d1738ee275feac1`

PR #1 durable receipt/comment:

`5905000694`

You are not the Re-Challenger that issued this finding.

Do not rewrite prior PASS/FAIL lineage.

Do not deploy or execute the real observation proof in this role.

Do not self-certify Re-Challenger or Independent Assurance.

## Exact failed executable candidate

`bedd8f972b298a779e6d2fb5a24e673d78e550ce`

Tree:

`8bb00e193e5330e71c38db552c01ad0096a8a99b`

Recovery CI:

`36672087507 — SUCCESS`

## Preserved finding

The failed workflow directly interpolated the untrusted manual workflow input into generated Bash:

`test "${{ inputs.confirmation }}" = "RUN_LOCAL_PRODUCER_OBSERVE_PROOF"`

A crafted confirmation value can therefore execute shell before the checked-in destination validator runs. Because the same job already has `id-token: write`, that injected shell can reach GitHub's OIDC mint capability.

## Remediation mission

Implement the narrowest structural repair:

1. Never interpolate `inputs.confirmation` directly into shell source.
2. Split preflight and proof authority into separate jobs.
3. The preflight job must have no `id-token: write` permission.
4. Preflight must:
   - check out exact `github.sha`;
   - set up the required runtime;
   - compare confirmation safely via an environment variable or non-shell workflow condition;
   - execute the source-controlled destination validator;
   - fail closed while destination is UNPINNED.
5. The OIDC-capable proof job must depend on successful preflight.
6. The OIDC-capable job must use exact `github.sha`, not mutable branch-head checkout.
7. No untrusted workflow_dispatch input may be executed as shell/code in the OIDC-capable job.
8. No OIDC mint may occur when preflight fails, is skipped, or rejects the destination.
9. Preserve source-controlled destination binding from NW-R0-OBS-03.
10. Preserve per-hop public-source redirect hardening from NW-R0-OBS-02.
11. Preserve queue/claim/finalization, runtime proof binding, OIDC server-side claims, watcher/run cardinality, zero-cost/zero-candidate, and all consequential-action locks.
12. Keep `git.deploymentEnabled=false`.
13. Do not deploy.
14. Add regression tests proving:
   - no direct `${{ inputs.confirmation }}` interpolation exists in shell `run:` content;
   - preflight has no id-token write authority;
   - proof job depends on preflight;
   - preflight validation precedes any OIDC-capable job;
   - malicious confirmation strings cannot become shell source;
   - exact SHA checkout is used for both jobs.

Bank an immutable remediation candidate and hand it to a genuinely different Fresh Re-Challenger.
