# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF REMEDIATION BUILDER PASS AFTER NW-R0-OBS-03

Date: 2026-09-29

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`REMEDIATION_BUILDER_PASS`

This Builder disposition applies only to remediation of:

`NW-R0-OBS-03 — OBSERVE_PROOF_OIDC_TOKEN_DESTINATION_IS_MUTABLE_AND_UNBOUND`

The Different Fresh Re-Challenger FAIL is preserved at:
- report: `docs/NORVANA_WATCHTOWER_R0_REAL_OBSERVE_PROOF_DIFFERENT_FRESH_RECHALLENGER_FAIL_AFTER_NW-R0-OBS-02_REMEDIATION_2026-09-29.md`
- report commit: `27c3491baebb3b585aa10f301fab5e9723c93d50`
- PR #1 receipt/comment: `5904379440`

The prior redirect remediation for `NW-R0-OBS-02` remains preserved.

The Builder did not deploy the candidate, did not execute a real observation proof, and did not self-certify Re-Challenger or Independent Assurance.

## Exact immutable remediation candidate

Commit:

`bedd8f972b298a779e6d2fb5a24e673d78e550ce`

Parent:

`e26da0b3886c6a690c2cc2915322b55da1cb8f11`

Tree:

`8bb00e193e5330e71c38db552c01ad0096a8a99b`

Required Recovery CI:

`36672087507 — SUCCESS`

Job:

`109749067318 — static-verification — SUCCESS`

Watchtower tests:

`35 PASS / 0 FAIL`

Also PASS:
- dependency install;
- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- TypeScript typecheck;
- lint;
- production build.

## Remediation

The credential-bearing destination is no longer sourced from a mutable repository variable, secret, workflow input, or base-URL environment variable.

New source-controlled destination module:

`scripts/watchtower-observe-proof-destination.mjs`

The immutable candidate contains:

`__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`

as the destination sentinel.

While that sentinel remains, destination validation throws and exits nonzero.

### Pre-mint execution order

The workflow now orders the proof path as:

1. checkout exact repository state;
2. set up Node;
3. verify exact manual confirmation;
4. execute the source-controlled destination validator;
5. only after that succeeds, mint GitHub OIDC;
6. execute the observe-proof worker.

Therefore the immutable Builder candidate cannot mint the proof OIDC token while its destination is unpinned.

### Worker destination binding

The worker now imports:

`requirePinnedObserveProofBaseUrl`

from the checked-in destination module.

It no longer reads:
- `NORVANA_WATCHTOWER_OBSERVE_PROOF_BASE_URL`;
- `NORVANA_WATCHTOWER_OBSERVE_PROOF_ENABLED`.

The only credential-bearing environment input retained by the worker is the already-minted OIDC token itself.

### Destination validation

The source-controlled destination validator requires:
- HTTPS;
- no URL username/password;
- no custom port other than default HTTPS;
- exact origin-only form with no path/query/fragment;
- Norvana controlled Preview host shape:
  `norvana-<deployment-slug>-norrijam405-2107s-projects.vercel.app`.

It rejects:
- arbitrary attacker HTTPS origins;
- suffix-confusion hosts;
- HTTP downgrade;
- URL userinfo;
- custom ports;
- path-bearing URLs;
- query-bearing URLs;
- fragment-bearing URLs;
- malformed URLs;
- the explicit UNPINNED sentinel.

### Regression coverage

New tests prove:
- the checked-in candidate is unpinned and fails closed;
- attacker and malformed destinations are rejected;
- a representative exact Norvana Preview origin is accepted by the validator;
- workflow checkout and pin validation occur before OIDC mint;
- the workflow contains no mutable repository-variable destination;
- the worker contains no environment-derived base URL.

The prior NW-R0-OBS-02 redirect tests remain present and passing:
- per-hop manual redirect validation;
- approved -> unapproved -> approved rejection before the unapproved request;
- valid approved redirect chain;
- redirect cap fail-closed behavior.

## Preserved safety invariants

The remediation does not weaken:
- dedicated GitHub OIDC claim verification;
- current-runtime Control Proof;
- current-runtime Worker Proof;
- exact `local-producer-watch` target;
- exact `OBSERVE` authority;
- exact $0 budget;
- all other watchers PAUSED;
- exactly one active `OBSERVE_PROOF`;
- no concurrent executable run;
- zero recommendation candidates;
- zero estimated cost;
- normal scheduler OFF;
- normal executor OFF;
- external fulfillment OFF;
- supplier connectors OFF;
- IgniAqua federation OFF;
- ACT locked;
- no spending, ordering, publishing, repricing, refunds, supplier activation, or fulfillment.

## Deployment state

`vercel.json -> git.deploymentEnabled=false`

No Vercel deployment exists for candidate `bedd8f972...`.

Latest recovery Preview remains:

`dpl_BPEj9Df6LbziKaPh3aQffKkhGang`

sourced from:

`dda91d79196a3ae0087e4ac135197eabb780bc75`

No real observe proof was executed.

## Controlled pin boundary

The Builder intentionally did not invent a future Preview URL.

If a separate independent Re-Challenger passes this exact candidate, a separate controlled live-proof operator may:
- deploy the exact challenged application candidate to exactly one Preview;
- capture the exact immutable Preview origin;
- copy the already-challenged observe-proof workflow/client bytes to `main` if needed for `workflow_dispatch`;
- replace only the UNPINNED source literal with the exact Preview origin;
- reconcile the copy/pin diff before any OIDC mint.

That later controlled pin/deploy operation is not part of this Builder PASS.

## Next gate

A genuinely different Fresh Re-Challenger must independently challenge exact immutable candidate:

`bedd8f972b298a779e6d2fb5a24e673d78e550ce`

The Builder role ends here.
