# Norvana Watchtower R0 — Successor Handoff
Date: 2026-09-27

Repository: `norrijam405/norvana`
PR: `#1`
Branch: `recovery/2026-09-26-norvana-modernization-r0`

Exact executable candidate:
`bf08615c9e5ec4ad139b783de012b5632fa04ee6`

Recovery CI:
`#188 — SUCCESS`

## 2026-09-28 continuation update

The executor contradiction preserved later in this handoff is now **REMEDIATED** in the exact executable candidate above and retained below only as failure lineage.

Narrow remediation now enforced:
- standard worker mode still requires `NORVANA_WATCHTOWER_EXECUTOR_ENABLED=true`
- harness worker mode requires the normal executor to remain OFF
- harness mode remains worker-secret authenticated
- harness mode can claim only `HARNESS_TEST`
- standard mode excludes `HARNESS_TEST`
- current-runtime Control Proof + Worker Proof are still required
- harness claim refuses a live normal queue or IgniAqua federation
- harness job authority must be exactly `OBSERVE`
- R0 policy still requires a $0 budget and external fulfillment/supplier actions disabled

Recovery CI #188 passed deterministic install, runtime dependency audit, the full high-severity dependency gate, current-tree secret regression checks, Watchtower policy tests, TypeScript, ESLint, and the production Next.js build.

Vercel auto-deployment remains frozen. The repaired candidate is **not deployed**. The newest known READY recovery Preview remains `ee21301e949497ac49dda056c447b6833a061a2f` / `dpl_DEkHuAvCuyzbRdjNSLYcGwnc6ByZ`.

Do not run the external harness against the older deployment. The next live gate is one exact Preview deployment of the repaired candidate, followed by current-deployment Control Proof and Worker Proof before queueing `HARNESS_TEST`.


Do not ask Norris to reconstruct history already preserved in GitHub, PR comments, or this handoff.
Do not merge PR #1 merely because CI is green.
Do not expose or request secrets.

## Deployment truth

Latest Vercel recovery Preview known READY:
`ee21301e949497ac49dda056c447b6833a061a2f`

Vercel deployment:
`dpl_DEkHuAvCuyzbRdjNSLYcGwnc6ByZ`

The GitHub candidate `78a0f9e...` is NOT claimed deployed.

Automatic Git deployments remain intentionally frozen:
`vercel.json -> git.deploymentEnabled=false`

This was done after the Vercel Hobby build-rate cooldown. Do not pay to bypass the cooldown merely to accelerate recovery.

## Founder-live state already proven

Browser evidence showed:
- owner login succeeds
- Watchtower loads
- 5 watchers exist
- 0 watchers enabled
- all remain PAUSED
- authority Locked
- database READY
- scheduler configured
- executor DISABLED
- external actions DISABLED
- IgniAqua federation PLANNED
- default and per-watcher automation budget $0
- Watchtower / Archive / Shop navigation is coherent with the storefront

Founder clarified that the temporary owner password was replaced with a permanent private password on the first successful login.

## Owner/auth hardening completed

- durable database-backed owner identity
- PBKDF2 current credential verification
- bootstrap credential only when no durable owner exists
- explicit bootstrap-derived vs permanent state
- same-origin browser mutation protection
- DB-backed login/recovery throttling
- bounded auth request bodies/password lengths
- password rotation forces re-login
- server-side owner session versioning
- password change invalidates older browser sessions
- legacy non-versioned admin guard removed from protected routes

Current-session protection covers Watchtower, products, orders, suppliers, Scout, debugger, progress, reviews, analytics, subscribers, seed/reset, and account routes.

## Dependency/build hardening completed

- Next.js moved to patched 16.3.6 line
- matching eslint-config-next 16.3.6
- patched PostCSS line
- current runtime dependency audit passes
- committed package-lock.json
- deterministic npm ci in Recovery CI
- immutable GitHub Actions SHAs
- real next build production-build gate in CI
- one async route-guard bug was caught and remediated before deployment

Four moderate dev/build-only findings remain through Drizzle Kit/esbuild. Do not run npm audit fix --force.

## Watchtower R0

Durable tables:
- watch_jobs
- watch_runs
- watch_candidates
- action_receipts

Default watchers:
1. Free Supplier Watch — RECOMMEND
2. Global & Resale Sourcing Watch — RECOMMEND
3. Local Producer Watch — OBSERVE
4. Closest-to-$0 Operations Watch — RECOMMEND
5. Drop Opportunity Watch — RECOMMEND

All default watchers start PAUSED at $0.

R0 authority ceiling:
- OBSERVE
- RECOMMEND

ACT remains locked.

Hard limits:
- no spending
- no publishing
- no order placement
- no price changes
- no supplier activation
- no refunds

## Safe Control-Plane Proof

Endpoint:
`POST /api/watchtower/self-test`

Requires:
- owner auth
- queue OFF
- executor OFF
- fulfillment OFF
- supplier connectors OFF
- IgniAqua federation OFF
- all real watchers PAUSED
- all budgets $0
- OBSERVE/RECOMMEND only
- no stale QUEUED/RUNNING runs

It uses no external network, creates a durable CONTROL_TEST run + receipt, reads both back, and can apply non-destructive Watchtower schema/bootstrap migration first.

The UI now renders the Safe Self-Test and displays current proof state. The older deployed Preview does not yet contain all current UI/proof fixes.

## Deterministic Worker Contract Proof

A second internal proof exercises:

`QUEUED -> RUNNING -> PASS`

while:
- all real watchers remain PAUSED
- normal queue OFF
- executor OFF
- external actions OFF
- network OFF
- research OFF
- candidates 0
- cost $0

Watcher enablement requires:
1. permanent owner credential
2. current-deployment Control Proof PASS
3. current-deployment Worker Proof PASS
4. OBSERVE/RECOMMEND authority
5. $0 budget

## Controlled recovery Preview deployment — 2026-09-28

A controlled recovery-branch Preview is now READY.

Deployment:
`dpl_3hor9daDE1hi1sun9mU48pA68vPb`

Preview URL:
`https://norvana-jftmx158e-norrijam405-2107s-projects.vercel.app`

Persistent recovery-branch alias:
`https://norvana-git-recovery-2026-09-e017ff-norrijam405-2107s-projects.vercel.app`

Deployed Git source:
`2c8c32c8bc9f28d80cb1f8935f96d04263534b3c`

Recovery CI #189 on that exact deployed source:
`SUCCESS`

The deployed source differs from executable candidate `bf08615c9e5ec4ad139b783de012b5632fa04ee6` only by:
- this successor handoff documentation update
- the temporary `vercel.json` branch-specific deployment gate used to create the one Preview

No Watchtower application implementation files differ from the repaired executable candidate.

After the Preview reached READY, the recovery branch was immediately refrozen:
`b185ffb65211a0a9e8c90e11c6a34f81dd44c58c`

Recovery CI #190 on the refrozen head:
`SUCCESS`

`vercel.json -> git.deploymentEnabled=false` is restored.

Vercel was rechecked after refreeze and showed no second recovery deployment. All real watchers remain PAUSED by doctrine; no executor, supplier, fulfillment, spending, publishing, or IgniAqua federation authorization was granted.

The next proof gate requires founder owner-session authentication on this deployment. Do not request or expose the founder password. The founder should sign in normally, then run current-deployment Control Proof followed by Worker Contract Proof. Only after both are PASS for the current deployment may a single `HARNESS_TEST` be queued.

## Founder-authenticated current-deployment proofs — 2026-09-28

Founder browser evidence on the recovery Preview shows:
- proof scope: `CURRENT DEPLOYMENT`
- Control proof: `PASS`
- Worker proof: `PASS`
- owner credential: `PERMANENT`
- 5 real watchers remain present and paused
- 0 watchers enabled
- 0 candidates
- authority remains locked
- executor disabled
- external actions disabled
- default automation budget $0

Visible durable proof examples included:
- Control proof run #1 / receipt #1: PASS, 5 paused watchers
- Worker proof run #2: PASS, 3 durable receipts
- repeat Worker proof run #3: PASS, 3 durable receipts
- repeat Control proof run #4 / receipt #8: PASS

Vercel runtime logs for deployment `dpl_3hor9daDE1hi1sun9mU48pA68vPb` independently show HTTP 200 responses for:
- `POST /api/watchtower/self-test`
- `POST /api/watchtower/worker-self-test`
including repeat invocations between 04:24:56Z and 04:25:09Z.

Truth state: `CONTROL_PROOF_PASS + WORKER_PROOF_PASS`.

Next allowed gate is exactly one owner-authenticated `HARNESS_TEST` queue operation. Do not enable any real watcher or normal executor.

## Deployment/runtime proof binding

watch_runs now carry runtime_id.

Runtime identity resolution:
1. VERCEL_DEPLOYMENT_ID
2. NORVANA_RUNTIME_ID
3. VERCEL_GIT_COMMIT_SHA

Control Proof and Worker Proof count only for the current deployment.

Old proof receipts cannot unlock a new deployment.

Scheduler runs are runtime-bound.
Worker claim rejects stale-runtime queued work.
Worker result finalization rejects stale-runtime work.
Dashboard proof status queries current-runtime proof records directly.

## Scheduler/worker hardening

Scheduler:
- cron secret required
- queue disabled by default
- owner/permanent state checked
- current-runtime Control Proof required
- current-runtime Worker Proof required
- authority and $0 budget rechecked
- external commerce actions must remain disabled
- atomic due-job claim prevents duplicate queueing
- target URL is no longer hard-coded to Production

Worker:
- worker secret required
- authority/$0 rechecked
- stale-runtime claims blocked
- QUEUED -> RUNNING state discipline
- result accepted only from RUNNING
- result payload/candidates/evidence/source URLs/cost bounded and validated
- finalization + candidates + receipt atomic
- duplicate/concurrent finalization cannot both win

## CURRENT WORK — External deterministic harness

Current candidate includes:

1. Harness claim isolation
`src/app/api/watchtower/runs/claim/route.ts`

Header:
`x-norvana-worker-mode: harness`

Harness mode can claim only:
`trigger = HARNESS_TEST`

Standard mode excludes HARNESS_TEST.

2. Harness queue route
`src/app/api/watchtower/harness/queue/route.ts`

Queues a HARNESS_TEST only when:
- current runtime exists
- normal queue OFF
- executor OFF at queue time
- fulfillment OFF
- supplier connectors OFF
- IgniAqua federation OFF
- permanent owner credential exists
- current-runtime Control Proof PASS exists
- current-runtime Worker Proof PASS exists
- no stale executable runs exist
- all real watchers remain PAUSED
- OBSERVE/RECOMMEND + $0 policy holds
- an OBSERVE watcher exists

3. External harness script
`scripts/watchtower-worker-harness.mjs`

It:
- calls deployed HTTPS Watchtower
- authenticates with worker secret
- claims harness mode only
- refuses non-HARNESS_TEST
- requires OBSERVE/$0
- verifies hard limits false
- submits deterministic NO_MATERIAL_CHANGE
- emits no candidates
- performs no research/model call
- reports $0 cost

4. Manual GitHub Actions harness
`.github/workflows/watchtower-worker-harness.yml`

Manual workflow_dispatch only.

Requires exact phrase:
`RUN_DETERMINISTIC_HARNESS`

Also requires:
- NORVANA_WATCHTOWER_BASE_URL
- NORVANA_WATCHTOWER_HARNESS_ENABLED=true
- NORVANA_WATCHTOWER_WORKER_SECRET
- HTTPS target

CI #187 passed with this harness code present.

## OPEN DEFECT — DO NOT RUN HARNESS YET

Current harness design has a contradictory executor precondition:

- harness queue route requires NORVANA_WATCHTOWER_EXECUTOR_ENABLED=false
- worker claim route requires NORVANA_WATCHTOWER_EXECUTOR_ENABLED=true before any claim, including harness mode

Because proofs and queued runs are bound to VERCEL_DEPLOYMENT_ID, changing the Vercel executor env and redeploying creates a new runtime identity and invalidates the prior proofs/queued HARNESS_TEST.

Therefore the harness is currently deadlocked end-to-end.

Recommended narrow remediation:

- standard worker mode must continue requiring NORVANA_WATCHTOWER_EXECUTOR_ENABLED=true
- explicit harness mode may claim HARNESS_TEST while the normal executor flag remains false
- harness mode must remain worker-secret authenticated
- harness mode must require current-runtime Control Proof + Worker Proof
- harness mode must require external fulfillment/suppliers/IgniAqua disabled
- harness mode must require OBSERVE + $0
- harness mode must never claim SCHEDULE runs
- preserve manual GitHub workflow confirmation
- preserve runtime binding

Do not solve this by turning the normal executor on.

## Immediate successor mission

1. Verify executable candidate `78a0f9e46a455413550a190ddc4f9663fb2f556c`.
2. Verify CI #187 SUCCESS, including production build.
3. Confirm deployed Vercel Preview is still older and auto-deploy is frozen.
4. Remediate the harness executor contradiction narrowly.
5. Re-run Recovery CI + production build.
6. Bank the repaired exact candidate.
7. Deploy one exact candidate only after cooldown/cost posture allows it.
8. On deployed candidate, run Control Proof.
9. Run Worker Proof.
10. Verify both are PASS for CURRENT DEPLOYMENT.
11. Queue HARNESS_TEST.
12. Run manually gated external harness.
13. Verify external harness PASS, zero candidates, $0.
14. Only then consider enabling exactly one OBSERVE-only real watcher.
15. Keep the other four PAUSED.
16. Prove one real end-to-end observation cycle before enabling a second watcher.

## Future product plan

After one real OBSERVE lane is proven:
- connect one real source-research worker
- initial preference: Local Producer Watch or another lowest-consequence OBSERVE lane
- produce sourced observations + provenance only
- no buying/publishing/supplier activation/fulfillment/spend

Then:
- allow RECOMMEND lanes to create reviewable candidates
- preserve provenance/economics
- founder remains approval authority

Later:
- free supplier intelligence
- global/resale sourcing
- local producers
- closest-to-$0 operations
- drop opportunities

Preserve lawful/authentic/profitable sourcing and true-cost comparison.

ACT authority remains a later separate mission.

## Open technical/security items

- harness executor contradiction
- no deployed real external worker proof yet
- scheduler target not activated
- normal queue disabled
- normal executor disabled
- external fulfillment disabled
- supplier connectors disabled
- IgniAqua federation disabled/planned
- historical leaked database credential in old Git history still needs rotation/revocation confirmation; never reproduce/test it
- supplier secrets need mature encrypted/secret-store handling before live connectors
- four moderate dev/build-only Drizzle Kit/esbuild findings remain
- broad legacy commerce money fields still use floats
- no Independent Challenger/Assurance promotion yet
- PR #1 remains DRAFT/unmerged

## Do not

- merge just because CI is green
- casually re-enable Vercel auto-deploy
- pay to bypass Hobby limits
- unpause all watchers
- turn normal executor on just for harness
- enable suppliers/fulfillment
- enable IgniAqua federation
- expose secrets
- ask Norris for credentials
- erase failed CI history
- claim GitHub-only PASS as deployed proof
- reuse old deployment proof for a new runtime

Truth ladder:

`CI_PASS != BUILD_PASS != DEPLOYED != CONTROL_PROOF_PASS != WORKER_PROOF_PASS != EXTERNAL_HARNESS_PASS != REAL_OBSERVE_WATCHER_PROVEN != CHALLENGER_PASS != BANKED`
