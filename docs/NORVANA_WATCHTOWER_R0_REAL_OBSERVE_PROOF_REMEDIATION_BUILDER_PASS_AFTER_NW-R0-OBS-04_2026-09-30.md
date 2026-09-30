# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF REMEDIATION BUILDER PASS AFTER NW-R0-OBS-04

Date: 2026-09-30

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`REMEDIATION_BUILDER_PASS`

This disposition applies only to remediation of:

`NW-R0-OBS-04 — OBSERVE_PROOF_CONFIRMATION_INPUT_SHELL_INJECTION_CAN_MINT_OIDC_BEFORE_DESTINATION_VALIDATION`

The prior Different Fresh Re-Challenger FAIL remains preserved in:
- report commit `4a259a44631197b8e34179327d1738ee275feac1`;
- PR #1 receipt/comment `5905000694`.

No deployment or real observation proof was performed in this Builder role.

## Exact immutable remediation candidate

Commit:

`42f77893569a179f298250f6e74d9c544bde9fe7`

Parent:

`f4be6bb26a1cb49fbfdf566c459c423221a6ed90`

Tree:

`90438e3ba9610040ff6243c2a58bdf5f475ca5d2`

Required Recovery CI:

`36677962104 — SUCCESS`

Job:

`109766980203 — static-verification — SUCCESS`

Watchtower tests:

`38 PASS / 0 FAIL`

Also PASS:
- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- TypeScript typecheck;
- lint;
- production build.

## Preserved failed intermediate candidate

Commit:

`f4be6bb26a1cb49fbfdf566c459c423221a6ed90`

Recovery CI:

`36677880578 — FAIL`

Disposition:
- 37/38 Watchtower tests passed;
- the failure was a stale ordering assertion that still searched for the old single-job step name;
- the actual new no-OIDC preflight tests already passed;
- no executable safety logic was weakened to make CI pass.

## Remediation architecture

The workflow is now split into two jobs.

### Job 1 — no-OIDC preflight

Permissions:

`contents: read`

No `id-token: write` authority exists in this job.

The preflight:
1. checks out exact `${{ github.sha }}`;
2. sets up Node;
3. passes the workflow_dispatch confirmation only as an environment value;
4. validates it with the checked-in Node helper:
   `scripts/watchtower-observe-proof-confirmation.mjs`;
5. validates the source-controlled Preview destination;
6. fails closed while the destination remains UNPINNED.

The confirmation value is never directly interpolated into Bash source.

### Job 2 — OIDC-capable proof job

The proof job:
- declares `needs: preflight`;
- receives `id-token: write` only after the preflight job has succeeded;
- has no workflow_dispatch confirmation input in shell source;
- mints GitHub OIDC only after successful no-OIDC preflight;
- checks out exact `${{ github.sha }}`;
- re-validates the source-controlled destination from that exact SHA;
- runs the one-shot Local Producer Watch proof worker.

## Injection remediation

The prior vulnerable form:

`test "${{ inputs.confirmation }}" = "..."`

is removed.

The workflow now sets:

`NORVANA_WATCHTOWER_OBSERVE_PROOF_CONFIRMATION: ${{ inputs.confirmation }}`

as data and the checked-in Node validator performs strict string equality.

Adversarial confirmation strings containing:
- quote breakouts;
- shell command substitution;
- backticks;
- newlines;
- arbitrary suffixes

are rejected as data and are never evaluated as shell code.

## Preserved prior hardening

Still preserved:
- NW-R0-OBS-03 source-controlled destination binding and UNPINNED fail-closed state;
- NW-R0-OBS-02 manual per-hop redirect validation;
- current-runtime Control Proof + Worker Proof;
- exact Local Producer Watch target;
- OBSERVE-only authority;
- $0 budget;
- all other watchers PAUSED;
- exactly one active OBSERVE_PROOF;
- no concurrent executable run;
- dedicated GitHub OIDC server-side claim checks;
- zero candidate emission;
- zero estimated cost;
- normal scheduler OFF;
- normal executor OFF;
- fulfillment OFF;
- supplier connectors OFF;
- IgniAqua federation OFF;
- ACT locked.

## Deployment state

`vercel.json -> git.deploymentEnabled=false`

No Vercel deployment exists for `42f77893569a179f298250f6e74d9c544bde9fe7`.

The latest Watchtower recovery Preview remains the historical controlled deployment:
`dpl_BPEj9Df6LbziKaPh3aQffKkhGang`
from `dda91d79196a3ae0087e4ac135197eabb780bc75`.

## Next gate

A genuinely different Fresh Re-Challenger must independently challenge exact immutable candidate:

`42f77893569a179f298250f6e74d9c544bde9fe7`

Do not deploy or execute the real observation proof before that challenge gate.
