# NORVANA CJ READ-ONLY — REMEDIATION BUILDER ACTIVATION AFTER LIVE FREIGHT CHALLENGER FAIL

Date: 2026-09-29

You are being activated as a **separate Remediation Builder** for Norvana CJdropshipping Read-Only Qualification R0.

Repository:
`norrijam405/norvana`

Pull Request:
`#3`

Branch:
`feature/2026-09-29-norvana-cj-readonly-qualification-r0`

Begin with:
`docs/NORVANA_CJ_READONLY_FRESH_CHALLENGER_FAIL_AFTER_LIVE_FREIGHT_PROOF_2026-09-29.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

You are not the Fresh Challenger that issued this finding.
You are not Independent Assurance.
Do not self-certify closure.

Exact failed executable/UI candidate:
`228d17c2ebaa8b01361580a8a88b6c8e4fde7a0b`

Preserve exact finding:
`CJ-R0-LIVE-CHAL-01 — ALTERNATE_LIVE_PROBE_ROUTE_BYPASSES_EXPLICIT_CONFIRMATION_GUARD`

## Narrow remediation objective

Eliminate the alternate execution path around the explicit live-probe confirmation boundary.

At minimum:
- inventory every runtime route that can invoke `runCJLiveReadOnlyProbe`;
- ensure no alternate route can execute live CJ reads without the intended explicit gate;
- prefer removing obsolete diagnostic/proving routes when they are no longer required;
- if any runtime live-probe route remains, keep it Preview-only and fail closed under the existing external-fulfillment/federation safety conditions;
- do not expose the API key/access token;
- add regression coverage that scans all CJ live-probe runtime routes rather than only one named route;
- preserve provider-level `FREIGHT_QUOTE_PROVEN`;
- preserve all merchandising candidates as `UNBOUND` / `NOT_FOR_SALE`;
- preserve `LOCKED_R0` execution authority;
- preserve current `git.deploymentEnabled=false`.

Do not create a new live supplier call merely to remediate this routing defect unless a later independent gate explicitly requires one.

## Required verification

Run the full CJ qualification CI including:
- secret regression gate;
- Watchtower regressions;
- Supplier Gateway regressions;
- CJ offline tests;
- CJ live-read mocked tests;
- typecheck;
- lint;
- production build.

Bank an exact remediation candidate and proof.

Then prepare a **different Fresh Re-Challenger** activation. Do not perform that role yourself.

No order.
No payment.
No publication.
No fulfillment.
No supplier activation.
No ACT authority.
