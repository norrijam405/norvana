# NORVANA WATCHTOWER R0 — REAL OBSERVE PROOF REMEDIATION BUILDER PASS AFTER NW-R0-OBS-01

Date: 2026-09-29

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role

Disposition:

`REMEDIATION_BUILDER_PASS`

This Builder disposition applies only to the remediation of:

`NW-R0-OBS-01 — REAL_OBSERVE_ACTIVATION_DEADLOCKS_ON_RUNTIME_BOUND_PROOFS_AND_DEPLOYMENT_TIME_QUEUE_EXECUTOR_FLAGS`

The prior Watchtower Independent Assurance disposition remains preserved as:

`INDEPENDENT_ASSURANCE_PASS`

The Builder has not deployed this candidate, has not run a real observation proof, and has not self-certified Fresh Challenger or Independent Assurance.

## Exact immutable executable candidate

Commit:

`d9483a9f14b1c1d1198d06fa07f8fe1907f65ce1`

Parent:

`24d653916371b7b6cc7130426cdea455739e7a7d`

Tree:

`b7c506f333ed69a715ea4d86224bfb4ff051c698`

Required Recovery CI:

`36666294007 — SUCCESS`

The successful CI passed:
- dependency install;
- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- Watchtower policy/adversarial tests;
- TypeScript typecheck;
- lint;
- production build.

Watchtower tests:

`28 PASS / 0 FAIL`

The known four moderate development-only dependency advisories remain non-blocking and were not silently rewritten.

## Preserved failed-candidate lineage

The Builder preserved each failed intermediate candidate.

### Failed candidate 1

Commit:

`d7d8ecbcdae97aab410163bf2dacf9da1fa33452`

Tree:

`dcf6516d42622002b9396d2626db420b23134153`

Recovery CI:

`36665879653 — FAIL`

Disposition:
- 27/28 Watchtower tests passed;
- one route-isolation test incorrectly required the literal `local-producer-watch` string inside a route that correctly referenced the centralized approved-target constant;
- no failed candidate was rewritten or force-replaced.

### Failed candidate 2

Commit:

`2aaf7f2811015a3e866f86276433068b04d1fdd6`

Tree:

`b25ffa0f8b9c9735a07c1de1e657c74c1642acce`

Recovery CI:

`36666069748 — FAIL`

Disposition:
- the first brittle assertion was corrected;
- the same route-isolation test still duplicated policy error-code literals from the policy helper rather than testing use of the helper itself;
- the candidate remained failed and preserved.

### Failed candidate 3

Commit:

`6171e2c96a34da56e59ba313f6bcef3bd78f0425`

Tree:

`55b9b70f7aa54db6680faa07447f6d597b4f68cc`

Recovery CI:

`36666172585 — FAIL`

Disposition:
- source redirect pinning and the OIDC mint path were hardened;
- the stale route-isolation assertion had not yet been corrected;
- the candidate remained failed and preserved.

### Failed candidate 4

Commit:

`24d653916371b7b6cc7130426cdea455739e7a7d`

Tree:

`a253cbc308dda4750310243e3346a3c1f05cecd1`

Recovery CI:

`36666219671 — FAIL`

Disposition:
- 28/28 Watchtower tests passed;
- TypeScript rejected the evidence normalization union because nullable evidence entries could reach the typed persistence shape;
- the candidate remained failed and preserved.

The final candidate `d9483a9...` corrected evidence normalization without weakening the runtime policy.

## Executable delta from activation baseline

Compared with Builder activation head `814170dd3666807eb99e53707b28040ed41a40cd`, the exact candidate changes only these executable/test files:

- `.github/workflows/watchtower-observe-proof.yml`
- `scripts/watchtower-observe-proof.mjs`
- `src/app/api/watchtower/observe-proof/[id]/result/route.ts`
- `src/app/api/watchtower/observe-proof/claim/route.ts`
- `src/app/api/watchtower/observe-proof/queue/route.ts`
- `src/lib/watchtower/policy.ts`
- `src/lib/watchtower/worker-auth.ts`
- `tests/watchtower-policy.test.ts`

No existing normal scheduler, normal worker claim/result route, fulfillment path, supplier connector, payment path, publication path, repricing path, refund path, or federation path was widened.

## Remediation architecture

The candidate adds a separate one-shot `OBSERVE_PROOF` lane instead of switching on the normal scheduler/executor.

### Queue boundary

The owner-only queue route requires:
- Preview-safe environment;
- normal queue OFF;
- normal executor OFF;
- external fulfillment OFF;
- supplier connectors OFF;
- IgniAqua federation OFF;
- permanent owner credential;
- current-runtime Control Proof;
- current-runtime Worker Proof;
- exactly one enabled watcher;
- exact target `local-producer-watch`;
- exact `OBSERVE` authority;
- exact $0 budget;
- all other watchers PAUSED;
- empty executable run queue.

It queues exactly one `OBSERVE_PROOF` run and writes a durable `WATCH_OBSERVE_PROOF_QUEUED` receipt.

### Worker authentication boundary

The proof worker uses dedicated GitHub OIDC authentication.

Claims are pinned to:
- issuer `https://token.actions.githubusercontent.com`;
- Norvana owner audience;
- repository `norrijam405/norvana`;
- `refs/heads/main`;
- `workflow_dispatch`;
- exact workflow `.github/workflows/watchtower-observe-proof.yml`;
- GitHub-hosted runner;
- Vercel Preview only.

The proof worker does not inherit the standard Watchtower worker secret or standard worker authority.

### Claim boundary

Claim revalidates, under the common Watchtower advisory-lock serialization domain:
- locked environment;
- current runtime identity;
- current Control + Worker proofs;
- exact watcher snapshot;
- exactly one active `OBSERVE_PROOF`;
- no concurrent executable run;
- exact Local Producer Watch binding.

It can transition only that one run from `QUEUED -> RUNNING`.

It cannot claim `SCHEDULE` or `HARNESS_TEST`.

### Real read-only observation

The deterministic proof worker is restricted to exactly two approved public sources:

- `https://ag.ok.gov/divisions/market-development/`
- `https://www.ams.usda.gov/services/local-regional/food-directories`

Execution is:
- HTTPS GET only;
- public source retrieval only;
- no supplier API credential;
- no commerce credential;
- no AI/model call;
- zero monetary budget;
- no recommendation candidate emission.

Redirects are followed only if the final HTTPS host remains in the approved host set.

### Result boundary

Finalization revalidates:
- dedicated OIDC authentication;
- locked environment;
- exact runtime;
- `OBSERVE_PROOF` trigger;
- `RUNNING` state;
- current Control + Worker proofs;
- exact watcher snapshot and target;
- exactly one active executable proof;
- zero estimated cost;
- zero candidates.

Successful proof requires at least one approved-source evidence reference.

The route persists structured findings/evidence and writes a durable `WATCH_OBSERVE_PROOF_COMPLETED` receipt.

Safety drift fails closed and may durably BLOCK the proof. It does not silently continue.

## Explicitly still forbidden

This candidate does not authorize:
- spending;
- product publication;
- order placement;
- repricing;
- refunds;
- supplier activation;
- fulfillment;
- normal scheduler execution;
- normal worker execution;
- ACT authority;
- IgniAqua federation activation;
- paid infrastructure.

## Deployment state

`vercel.json` remains:

`git.deploymentEnabled=false`

No deployment of the new executable candidate was created by the Builder. The newest recovery Preview remains the previously controlled Watchtower deployment sourced from `dda91d79196a3ae0087e4ac135197eabb780bc75`.

## Next gate

A genuinely separate Fresh Challenger must independently attack exact immutable candidate:

`d9483a9f14b1c1d1198d06fa07f8fe1907f65ce1`

Do not deploy or execute the real observation proof before the required challenge gate.
