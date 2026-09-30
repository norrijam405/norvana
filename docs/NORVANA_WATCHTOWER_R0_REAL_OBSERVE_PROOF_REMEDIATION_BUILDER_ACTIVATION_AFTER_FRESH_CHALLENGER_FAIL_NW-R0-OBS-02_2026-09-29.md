# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF REMEDIATION BUILDER ACTIVATION AFTER FRESH CHALLENGER FAIL NW-R0-OBS-02

Date: 2026-09-29

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

You are the **separate Remediation Builder** after the Fresh Challenger failure preserved on PR #1 as comment `5903888375`.

You are not the Fresh Challenger that issued the failure.

Do not rewrite the prior Independent Assurance PASS, the prior `NW-R0-OBS-01` Builder lineage, or any failed candidate/CI receipt.

Do not deploy or execute the real observation proof from this role.

Do not self-certify Fresh Challenger or Independent Assurance.

## Exact failed candidate

Commit:

`d9483a9f14b1c1d1198d06fa07f8fe1907f65ce1`

Parent:

`24d653916371b7b6cc7130426cdea455739e7a7d`

Tree:

`b7c506f333ed69a715ea4d86224bfb4ff051c698`

Recovery CI:

`36666294007 — SUCCESS`

## Preserved Fresh Challenger finding

`NW-R0-OBS-02 — OBSERVE_PROOF_REDIRECT_CHAIN_VALIDATES_ONLY_FINAL_HOST`

The failed candidate uses automatic Fetch redirect following and validates only the final `response.url`. A chain:

approved host -> unapproved host -> approved host

can therefore leave the allowlist mid-chain while still satisfying the final-host check.

## Remediation mission

Implement the narrowest repair:

1. Replace automatic redirect following for observe-proof public-source retrieval with explicit manual redirect handling.
2. Validate the current URL before every network request.
3. Validate every redirect target before following it.
4. Permit HTTPS only.
5. Permit only the exact approved host set.
6. Resolve relative `Location` values against the current approved URL, then validate the resolved target before requesting it.
7. Reject redirects with a missing or invalid `Location`.
8. Cap redirect depth and fail closed on loops/excessive chains.
9. Preserve GET-only, public-source-only, credential-free retrieval.
10. Preserve the exact approved initial source list.
11. Preserve zero spend and zero candidate emission.
12. Add an adversarial executable unit test proving `approved -> unapproved -> approved` is rejected **before any request is sent to the unapproved host**.
13. Add coverage for an allowed approved-host redirect chain and redirect-depth failure.
14. Do not weaken queue/claim/finalization, OIDC, runtime binding, watcher cardinality, authority, budget, or consequential-action locks.
15. Keep `git.deploymentEnabled=false`.

Bank an exact executable candidate and required Recovery CI receipt.

Then hand the exact candidate to a genuinely separate Fresh Challenger.

Do not perform that Fresh Challenger yourself.
