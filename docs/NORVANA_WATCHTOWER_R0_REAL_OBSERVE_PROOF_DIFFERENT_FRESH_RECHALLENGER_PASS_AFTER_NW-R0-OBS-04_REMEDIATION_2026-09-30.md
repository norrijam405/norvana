# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER PASS AFTER NW-R0-OBS-04 REMEDIATION

Date: 2026-09-30

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`DIFFERENT_FRESH_RECHALLENGER_PASS`

This disposition is bound only to the exact immutable remediation candidate below.

I did not build or repair this candidate. I did not deploy it, execute the real observation proof, or self-certify closure.

## Exact immutable candidate challenged

Commit:

`42f77893569a179f298250f6e74d9c544bde9fe7`

Parent:

`f4be6bb26a1cb49fbfdf566c459c423221a6ed90`

Activation-declared tree:

`90438e3ba9610040ff6243c2a58bdf5f475ca5d2`

GitHub compare independently confirms that the candidate is exactly one commit ahead of the declared parent and changes only:

- `tests/watchtower-policy.test.ts`

The parent contains the executable NW-R0-OBS-04 remediation; the candidate only aligns the stale ordering assertion with that already-present no-OIDC preflight architecture.

## Required Recovery CI independently reconciled

Required run:

`36677962104 — SUCCESS`

Job:

`109766980203 — static-verification — SUCCESS`

The job log independently confirms checkout of exact commit:

`42f77893569a179f298250f6e74d9c544bde9fe7`

Watchtower tests:

`38 PASS / 0 FAIL`

The same run also completed:

- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- TypeScript typecheck;
- lint with no errors;
- production build.

The production dependency audit reported zero vulnerabilities. The full dependency audit reported only existing moderate-severity development-tool findings and did not trip the configured high-severity gate.

## Re-challenge of NW-R0-OBS-04

Preserved finding under re-challenge:

`NW-R0-OBS-04 — OBSERVE_PROOF_CONFIRMATION_INPUT_SHELL_INJECTION_CAN_MINT_OIDC_BEFORE_DESTINATION_VALIDATION`

The exact candidate survives this re-challenge.

### 1. Untrusted confirmation is no longer shell source

The vulnerable form is absent:

`test "${{ inputs.confirmation }}" = "..."`

The exact workflow contains the workflow input only as step environment data:

`NORVANA_WATCHTOWER_OBSERVE_PROOF_CONFIRMATION: ${{ inputs.confirmation }}`

The step executes only:

`node scripts/watchtower-observe-proof-confirmation.mjs`

The checked-in validator performs strict string equality against:

`RUN_LOCAL_PRODUCER_OBSERVE_PROOF`

and never evaluates the input as code.

The exact candidate's test suite exercises quote breakout, command substitution, backticks, newline injection, and empty confirmation strings. All are rejected.

CI specifically confirms:

- `observe-proof confirmation validator treats workflow input strictly as data — PASS`
- `observe-proof workflow has no direct confirmation expression in shell source — PASS`

No material shell-injection path from `workflow_dispatch.inputs.confirmation` remains.

### 2. Preflight has no OIDC mint authority

The workflow-level `id-token: write` grant was removed.

The `preflight` job declares only:

`contents: read`

There is no `id-token: write` in the preflight job.

GitHub's OIDC documentation states that `id-token: write` is required for a job or workflow to request a GitHub Actions OIDC JWT. Therefore a rejected confirmation or destination in preflight does not have OIDC-mint authority.

Reference:

https://docs.github.com/en/actions/reference/security/oidc

### 3. OIDC-capable job is dependency-gated

The OIDC-capable job declares:

`needs: preflight`

and has no `if: always()` or equivalent bypass.

GitHub's job dependency semantics require a needed job to complete successfully before the dependent job runs; failed or skipped prerequisite jobs skip the dependent job unless an overriding conditional is present.

Reference:

https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs

Therefore failed/skipped preflight cannot reach the OIDC-capable job.

### 4. Exact-SHA checkout binding is present in both jobs

Both jobs check out:

`ref: ${{ github.sha }}`

The preflight therefore validates the confirmation and source-controlled destination from the exact workflow run SHA.

The proof job also checks out that exact SHA before executing the source-controlled worker and re-validates the source-controlled destination from that same SHA.

No mutable branch-head checkout is used by this workflow.

### 5. No untrusted workflow_dispatch execution path remains in the OIDC job

The OIDC-capable job contains no reference to `inputs.confirmation`.

Before repository code is executed in that job, the only shell step requests the GitHub OIDC token using GitHub-provided `ACTIONS_ID_TOKEN_REQUEST_URL` and `ACTIONS_ID_TOKEN_REQUEST_TOKEN` plus a constant audience.

The manually supplied confirmation value is absent from that shell source and from the job environment.

### 6. Source-controlled destination binding remains intact

`scripts/watchtower-observe-proof-destination.mjs` remains the canonical destination source.

The current candidate remains intentionally fail-closed at:

`__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`

The validator still requires:

- HTTPS;
- no URL credentials;
- no non-default port;
- an exact Norvana Vercel Preview hostname shape;
- origin-only URL with no path, query, or fragment.

The worker imports the same helper and does not read an observe-proof base URL from runtime environment variables.

This preserves NW-R0-OBS-03.

### 7. Per-hop redirect hardening remains intact

`scripts/watchtower-observe-proof-fetch.mjs` still uses:

`redirect: "manual"`

Every redirect target is validated before the next request is issued.

Unapproved intermediate hosts are rejected before contact, unsupported redirect statuses fail closed, and redirect depth is capped.

The exact candidate CI confirms the relevant redirect tests remain PASS.

This preserves NW-R0-OBS-02.

## Current-runtime proof and cardinality invariants

Static review of the exact candidate confirms that queue, claim, and finalization remain bound to the current runtime identity.

The observe-proof queue requires current-runtime successful:

- `CONTROL_TEST`
- `WORKER_TEST`

The claim route re-checks both proofs against the same current runtime.

The result route re-checks both proofs again before finalization and blocks the run if safety state drifted.

The queue operation uses the shared Watchtower advisory lock and refuses any already-active executable run.

The claim operation requires exactly one active executable run and exactly one active `OBSERVE_PROOF` in `QUEUED` state.

The finalization operation requires exactly one active executable run and the same `OBSERVE_PROOF` run in `RUNNING` state.

## OIDC server-side isolation remains intact

The observe-proof worker route remains distinct from the normal worker-secret path.

Server-side GitHub OIDC verification still requires:

- GitHub Actions issuer;
- expected Norvana audience;
- repository `norrijam405/norvana`;
- approved main ref;
- `workflow_dispatch` event;
- exact approved observe-proof workflow identity;
- GitHub-hosted runner;
- valid RS256 signature against GitHub JWKS;
- valid token time window.

No normal Watchtower worker secret is accepted by the observe-proof claim/result routes.

## Zero-effect and consequential-action locks remain intact

The observe-proof environment must keep all of these disabled:

- normal Watchtower queue;
- normal Watchtower executor;
- external fulfillment;
- supplier connectors;
- IgniAqua federation.

Watcher-state policy still requires:

- exactly one enabled real watcher;
- that watcher must be `local-producer-watch`;
- authority must be `OBSERVE`;
- budget must be `0`;
- all other watchers must be `PAUSED`;
- every watcher must remain inside the R0 authority ceiling and zero-budget policy.

The worker still requires all returned hard limits to be explicitly false for:

- spending;
- publishing;
- ordering;
- repricing;
- supplier activation;
- refunds;
- fulfillment;
- federation;
- candidate emission.

The result route independently rejects any nonzero reported cost or nonzero candidate count and persists zero cost / zero candidate effect for accepted results.

No ACT authority is introduced by this remediation.

## Deployment state independently reconciled

Repository state remains:

`vercel.json -> git.deploymentEnabled=false`

Live Vercel reconciliation found no deployment for candidate:

`42f77893569a179f298250f6e74d9c544bde9fe7`

The newest Watchtower recovery-branch Preview observed remains:

`dpl_BPEj9Df6LbziKaPh3aQffKkhGang`

from commit:

`dda91d79196a3ae0087e4ac135197eabb780bc75`

This predates the challenged remediation candidate.

No deployment or real observation proof was performed in this Re-Challenger role.

## Preserved prior failure lineage

The prior failed executable candidate remains preserved:

`bedd8f972b298a779e6d2fb5a24e673d78e550ce`

Prior failure report commit:

`4a259a44631197b8e34179327d1738ee275feac1`

PR #1 receipt/comment:

`5905000694`

The failed intermediate remediation candidate also remains preserved:

`f4be6bb26a1cb49fbfdf566c459c423221a6ed90`

with Recovery CI:

`36677880578 — FAIL`

The failed run shows the Watchtower test step failing while later typecheck/lint/build steps were skipped. Candidate `42f7789...` changed only the stale test ordering assertion and did not weaken executable safety logic.

## Final disposition

`DIFFERENT_FRESH_RECHALLENGER_PASS`

No material defect was found in the exact immutable remediation candidate.

This PASS does not authorize deployment or execution of the real observation proof and does not self-certify closure.

It permits progression only to a separate controlled live-proof gate.
