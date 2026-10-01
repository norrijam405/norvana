# NORVANA WATCHTOWER R1 — BOUNDED RECURRING LOCAL PRODUCER OBSERVE BUILDER PASS

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`R1_REMEDIATION_BUILDER_PASS`

This Builder disposition applies only to the new R1 bounded recurring Local Producer Watch observe lane.

It does not rewrite or supersede the completed R0 real-observe evidence chain or its final `INDEPENDENT_ASSURANCE_PASS`.

No deployment, main-branch activation, watcher enablement, scheduled execution, or live R1 observation was performed in this Builder role.

## Predecessor truth

R0 post-proof Independent Assurance PASS:

`a0894dde46192ec616777bbe70474eee8463df47`

R1 activation:

`fff6957611556b4f52550a0c0067321fe4f69baf`

## Exact immutable R1 candidate

Commit:

`5f4211dbff81614c99fbf1ce6f49c8712017e941`

Parent:

`3d9bb03a451ff55ddeb7172de3295642b6817754`

Tree:

`b986469b36ddb1e522d78994882af7104051807e`

Recovery CI:

`36879287999 — SUCCESS`

Watchtower tests:

`56 PASS / 0 FAIL`

Also PASS:
- dependency install;
- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- TypeScript typecheck;
- lint;
- production build.

## Preserved failed first candidate

Commit:

`d507b0e3d55a865c81c1d1bdaba289e75c6f023d`

Tree:

`fab8fee25070f68c2ed5219c4488704c06dd8e2e`

Recovery CI:

`36878881478 — FAIL`

Disposition:
- existing R0 tests and the first R1 policy/cadence/config tests passed;
- the R1 workflow static test caught literal escape characters around GitHub expressions in the generated YAML;
- the R1 queue static test incorrectly demanded the literal receipt action string rather than use of the centralized receipt-action constant;
- the failed candidate remains preserved;
- no deployment occurred.

The remediated candidate corrected the workflow rendering and the stale static assertion, and additionally tightened R1 queue authentication to the exact R1 workflow identity.

## Exact executable delta from R1 activation

Compared with activation commit `fff6957611556b4f52550a0c0067321fe4f69baf`, the final candidate changes only:

- `.github/workflows/watchtower-local-producer-r1.yml` — new;
- `scripts/watchtower-local-producer-r1.mjs` — new;
- `scripts/watchtower-r1-config.mjs` — new;
- `scripts/watchtower-r1-trigger.mjs` — new;
- `src/app/api/watchtower/observe-r1/queue/route.ts` — new;
- `src/lib/watchtower/policy.ts`;
- `src/lib/watchtower/worker-auth.ts`;
- `tests/watchtower-policy.test.ts`.

No generic scheduler, standard worker claim/result, commerce, supplier, fulfillment, payment, publication, repricing, refund, or federation implementation was activated.

## R1 architecture

### Inert source-controlled activation

The candidate contains:

`WATCHTOWER_R1_ENABLED = false`

in:

`scripts/watchtower-r1-config.mjs`

While false, R1 preflight exits before any OIDC mint.

The Builder did not flip this sentinel.

### Bounded schedule

The source-controlled R1 workflow is:

`.github/workflows/watchtower-local-producer-r1.yml`

It contains exactly one schedule:

`17 14 * * *`

Initial cadence:

`once per day`

The R1 workflow shares the same concurrency domain as the one-shot observe-proof workflow:

`norvana-watchtower-real-observe-proof`

This serializes manual proof and R1 recurring execution at the GitHub workflow level.

### Controlled manual R1 proof

The R1 workflow also permits `workflow_dispatch` for a future controlled activation proof.

Manual confirmation must be exactly:

`RUN_LOCAL_PRODUCER_R1`

The confirmation is passed as environment data to a checked-in Node validator. It is not interpolated into shell source.

The OIDC-capable job does not receive or consume the workflow_dispatch confirmation input.

### No-OIDC preflight

The preflight job has:

`contents: read`

and no `id-token: write`.

It checks:
1. exact `github.sha`;
2. Node runtime;
3. R1 source activation sentinel;
4. R1 trigger semantics;
5. source-pinned Preview destination.

Only after successful preflight can the OIDC-capable job start.

### Exact OIDC identities

Existing one-shot observe proof remains approved only for:

- workflow: `watchtower-observe-proof.yml`;
- event: `workflow_dispatch`.

R1 execution is approved only for:

- workflow: `watchtower-local-producer-r1.yml`;
- event: `schedule` or controlled `workflow_dispatch`;
- repository: `norrijam405/norvana`;
- ref: `refs/heads/main`;
- GitHub-hosted runner;
- expected issuer and audience.

The R1 queue endpoint uses a dedicated:

`requireWatchtowerR1Worker`

gate.

The one-shot manual observe-proof workflow identity is explicitly rejected by the R1 queue-specific claims evaluator.

Claim/result remain able to authenticate the approved one-shot workflow or approved R1 workflow so the existing assured observe worker can consume the R1-queued run.

### Dedicated R1 queue endpoint

Endpoint:

`POST /api/watchtower/observe-r1/queue`

Before queueing it revalidates:
- exact R1 GitHub OIDC identity;
- Vercel Preview environment;
- normal queue OFF;
- normal executor OFF;
- fulfillment OFF;
- supplier connectors OFF;
- IgniAqua federation OFF;
- current runtime id exists;
- permanent owner credential exists;
- current-runtime Control Proof PASS;
- current-runtime Worker Proof PASS;
- exactly one enabled watcher;
- enabled watcher is `local-producer-watch`;
- authority is exactly `OBSERVE`;
- budget is exactly `0`;
- all four non-target watchers remain PAUSED;
- executable run queue is empty.

It executes inside the same PostgreSQL advisory-lock domain used by the independently assured observe-proof queue/claim/result path.

### Server-side recurrence bound

Source cron is not the only cadence control.

The R1 queue endpoint checks the last durable:

`WATCH_R1_OBSERVE_QUEUED`

receipt while holding the common advisory lock.

Minimum interval:

`20 hours`

If the interval has not elapsed:
- no run is queued;
- a durable `WATCH_R1_OBSERVE_CADENCE_BLOCKED` receipt is written;
- the request returns 409 with the next eligible time.

Thus repeated manual dispatch cannot create an unbounded observation loop.

### Reuse of independently assured observe execution

A successful R1 queue creates exactly one:

`trigger = OBSERVE_PROOF`

run for Local Producer Watch.

The R1 client:
1. authenticates with the short-lived GitHub OIDC token;
2. queues through the dedicated R1 endpoint;
3. validates the queue acknowledgement;
4. then imports the existing:
   `scripts/watchtower-observe-proof.mjs`

worker.

The independently assured observe claim/result path continues to enforce:
- exact target;
- OBSERVE only;
- $0;
- current-runtime proofs;
- exactly one active observe run;
- no concurrent executable run;
- approved official public sources only;
- manual per-hop redirect validation;
- no supplier credential;
- no commerce credential;
- no model spend;
- zero candidate emission;
- zero estimated cost;
- evidence required for PASS.

The approved public-source set is unchanged:
- Oklahoma Department of Agriculture, Food and Forestry — Market Development;
- USDA Agricultural Marketing Service — Local Food Directories.

## Generic scheduler/executor remain locked

R1 does not call:

`/api/watchtower/tick`

R1 does not activate:
- `NORVANA_WATCHTOWER_QUEUE_ENABLED`;
- `NORVANA_WATCHTOWER_EXECUTOR_ENABLED`.

The existing generic scheduler workflow remains separate and inert under the existing environment controls.

## Deployment state

Recovery remains:

`git.deploymentEnabled=false`

No Vercel deployment exists for candidate:

`5f4211dbff81614c99fbf1ce6f49c8712017e941`

The latest recovery Preview remains the prior R0 controlled proof deployment:

`dpl_AYcKaR2fP556xhAGtMmhvk5fgFJY`

from source:

`048b92f094d9ec5ea38f35ba984e32097d559847`

That deployment is not claimed as R1 proof.

## Authority ceiling

This R1 candidate does not authorize:
- ACT;
- RECOMMEND for Local Producer Watch;
- spending;
- ordering;
- publishing;
- repricing;
- refunds;
- supplier activation;
- fulfillment;
- normal scheduler execution;
- normal executor execution;
- paid infrastructure;
- production promotion;
- IgniAqua federation.

## Next gate

A genuinely separate Fresh Challenger must independently attack exact immutable candidate:

`5f4211dbff81614c99fbf1ce6f49c8712017e941`

Do not deploy, copy to main, flip the R1 activation sentinel, enable Local Producer Watch, or execute R1 before the independent challenge gate.
