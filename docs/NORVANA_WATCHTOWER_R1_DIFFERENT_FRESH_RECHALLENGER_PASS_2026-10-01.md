# NORVANA WATCHTOWER R1 — DIFFERENT FRESH RE-CHALLENGER PASS

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`R1_DIFFERENT_FRESH_RECHALLENGER_PASS`

This disposition is limited to the exact immutable remediation candidate below and the bounded recurring Local Producer observe lane after remediation of:

`NW-R1-FC-01 — required five-watcher topology is not enforced fail-closed`

I did not build or repair this candidate.

I am not the Remediation Builder, the Fresh Challenger that issued NW-R1-FC-01, any prior R0/R1 Challenger/Re-Challenger, Controlled Live-Proof Operator, or Independent Assurance role.

I did not deploy, copy to main, activate R1, enable a watcher, execute a live R1 observation, or widen authority.

This PASS is not closure and does not authorize deployment or R1 activation. It permits progression only to a separate controlled R1 activation/proof gate.

## Exact immutable candidate

Commit:

`b98706f0231d9ee038845b8381bbc494185a37df`

Parent:

`95b1f58be62da62c1708651aa90924d92e969210`

Tree:

`2e044d9687cbb53e864692a1031949031de9a636`

Git object independently confirms the exact commit, parent, and tree.

Parent-to-candidate comparison is exactly one commit ahead and changes only:

- `tests/watchtower-policy.test.ts`

Remediation-activation head `8fad3175d1b09027d76adb8a7c686e36fb749f91` to candidate is exactly two commits ahead and changes only:

- `src/lib/watchtower/policy.ts`
- `tests/watchtower-policy.test.ts`

No R1 workflow, queue route, claim route, finalization route, worker authentication, source-fetch helper, scheduler, executor, commerce, supplier, fulfillment, payment, publication, repricing, refund, federation, or deployment configuration file changed in the remediation delta.

## Recovery CI reconciliation

Required Recovery CI:

`36883896225 — SUCCESS`

Independent GitHub run metadata confirms:

- event: `push`
- head SHA: `b98706f0231d9ee038845b8381bbc494185a37df`
- branch: `recovery/2026-09-26-norvana-modernization-r0`
- run attempt: `1`
- job: `110442217906 — static-verification — SUCCESS`

The job log independently confirms exact checkout of the frozen candidate and:

`59 PASS / 0 FAIL`

Also successful in the same exact-candidate run:

- runtime dependency audit;
- high-severity dependency gate;
- current-tree secret-regression scan;
- TypeScript typecheck;
- lint with no errors;
- production build.

Green CI was not accepted as the challenge result by itself.

## NW-R1-FC-01 remediation re-challenge

The shared evaluator now binds the watcher snapshot to exactly these five canonical identities:

- `free-supplier-watch`
- `global-resale-sourcing-watch`
- `local-producer-watch`
- `operating-cost-watch`
- `drop-opportunity-watch`

Independent static attack of `evaluateObserveProofWatcherSnapshot(jobs)` confirms fail-closed enforcement of all required topology properties:

1. `jobs.length` must equal the five canonical rows.
2. Duplicate slugs are rejected.
3. Unknown or substituted slugs are rejected.
4. Every canonical slug must be present.
5. Exactly one row may be `ENABLED`.
6. The enabled row must be exactly `local-producer-watch`.
7. The target authority must be exactly `OBSERVE`.
8. The target budget must be exactly `0`.
9. Every canonical non-target row must be exactly `PAUSED`.
10. Every row must remain inside the R0 authority ceiling.
11. Every row must retain a zero automation budget.

The following adversarial states therefore fail closed:

- target-only snapshot;
- four-row snapshot with one canonical watcher missing;
- six-row snapshot with an additional watcher;
- five-row snapshot with an arbitrary substituted watcher;
- duplicate canonical watcher identity;
- more than one enabled watcher;
- enabled non-target watcher;
- non-paused canonical non-target watcher;
- target with non-OBSERVE authority;
- target or non-target with nonzero budget;
- ACT authority in any canonical row.

The exact intended five-row snapshot passes.

The checked-in default job templates contain exactly the same five canonical slugs, and exact-candidate CI includes a regression test binding the policy slug set to `WATCHTOWER_JOB_TEMPLATES`.

## Three-boundary enforcement

The hardened shared evaluator is used against the complete `watchJobs` snapshot at all three material execution boundaries:

1. R1 queue:
   `src/app/api/watchtower/observe-r1/queue/route.ts`
2. Observe-proof claim:
   `src/app/api/watchtower/observe-proof/claim/route.ts`
3. Observe-proof result finalization:
   `src/app/api/watchtower/observe-proof/[id]/result/route.ts`

Each route loads the watcher rows and calls `evaluateObserveProofWatcherSnapshot(jobs)`.

The finalization route blocks the active run if required safety state drifts before completion.

## Preserved R1 controls

Independent candidate inspection confirms the following controls remain intact.

### Source-disabled state

`scripts/watchtower-r1-config.mjs` retains:

`WATCHTOWER_R1_ENABLED = false`

The R1 workflow preflight invokes this source gate before OIDC authority is available. The current candidate therefore remains non-activatable by source default.

The observe destination also remains deliberately unpinned:

`__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`

so the worker fails closed until a separate controlled activation/proof gate pins an exact Preview.

### Daily workflow and no-OIDC preflight

`.github/workflows/watchtower-local-producer-r1.yml` retains exactly one schedule:

`17 14 * * *`

The preflight job has `contents: read` and no `id-token: write`.

OIDC authority appears only in the dependent `local-producer-r1` job after successful preflight.

Both checkout steps use:

`ref: ${{ github.sha }}`

so workflow execution is pinned to the triggering SHA.

### R1-specific OIDC queue gate

The R1 queue route uses:

`requireWatchtowerR1Worker(req)`

The worker authentication path first performs signed GitHub OIDC verification and then applies `evaluateGitHubR1QueueClaims`.

The R1-specific claim requires the exact R1 workflow identity:

`norrijam405/norvana/.github/workflows/watchtower-local-producer-r1.yml@refs/heads/main`

The old one-shot observe-proof workflow identity therefore cannot authorize R1 queue creation.

### Server-side cadence and serialization

The policy retains:

`WATCHTOWER_R1_MIN_INTERVAL_MS = 20 * 60 * 60 * 1000`

The R1 queue endpoint applies `evaluateR1QueueCadence` server-side, using the durable R1 queue receipt history.

Queue creation is inside the shared PostgreSQL advisory-lock domain, preventing concurrent queue operations from bypassing the cadence check.

The route also refuses any non-empty executable queue.

### Normal scheduler/executor and external action locks

R1 queue/claim/finalization require the observe-proof environment gate to remain closed unless all of the following are false:

- normal queue;
- normal executor;
- fulfillment;
- supplier connectors;
- IgniAqua federation.

The R1 client does not call the generic `/api/watchtower/tick` scheduler path and does not enable queue/executor environment flags.

The generic scheduler remains independently gated by `NORVANA_WATCHTOWER_QUEUE_ENABLED === "true"`; otherwise it returns inert with zero queued runs.

### Zero candidates / zero cost

The R1 queue acknowledgement must report `estimatedCostCents: 0`.

The observe worker sends:

- `candidates: []`
- `estimatedCostCents: 0`

The result route independently rejects:

- any nonzero estimated cost;
- any nonzero candidate count.

The completed acknowledgement is rechecked by the worker for zero candidates and zero cost.

### Approved public sources and redirect hardening

The observe claim remains bounded to exactly the two approved source entries:

- Oklahoma Department of Agriculture, Food and Forestry — Market Development;
- USDA Agricultural Marketing Service — Local Food Directories.

The fetch helper allows only HTTPS on:

- `ag.ok.gov`
- `ams.usda.gov`
- `www.ams.usda.gov`

It rejects URL credentials and unapproved ports.

Redirect following is manual. Every redirect target is parsed and revalidated against the same HTTPS/host/credential/port policy before any request is issued to the next hop.

Unexpected 3xx responses fail closed.

### Consequential-action ceiling

Before public-source retrieval, the worker requires every returned hard limit to be exactly `false`:

- spend money;
- publish products;
- place orders;
- change prices;
- activate suppliers;
- issue refunds;
- fulfill orders;
- activate federation;
- emit candidates.

The target watcher is limited to `OBSERVE` and `$0`; ACT is rejected by the shared R0 authority gate.

No commerce, paid infrastructure, supplier activation, fulfillment, publication, repricing, refund, or federation widening was found in the exact candidate.

## Deployment state

Exact candidate `vercel.json` retains:

```json
"git": {
  "deploymentEnabled": false
}
```

The `vercel.json` blob is unchanged from remediation activation head through the exact candidate.

The exact candidate Git commit timestamp is:

`2026-10-01T15:23:35Z`

A live Vercel deployment query scoped from that timestamp returned:

`0 deployments`

Therefore no Vercel deployment exists for candidate:

`b98706f0231d9ee038845b8381bbc494185a37df`

The newest recovery Preview remains the historical R0 controlled proof deployment:

`dpl_AYcKaR2fP556xhAGtMmhvk5fgFJY`

sourced from:

`048b92f094d9ec5ea38f35ba984e32097d559847`

It is not treated as R1 proof.

## Preserved lineage

The R0 post-real-observe Independent Assurance PASS document remains present at:

`docs/NORVANA_WATCHTOWER_R0_POST_REAL_OBSERVE_INDEPENDENT_ASSURANCE_PASS_2026-10-01.md`

Its blob SHA is identical at remediation activation head and at the exact candidate:

`c18b3d15d1efb02ba64cce84d51fecd393a4304b`

The original R1 Fresh Challenger FAIL remains present at:

`docs/NORVANA_WATCHTOWER_R1_FRESH_CHALLENGER_FAIL_2026-10-01.md`

Its blob SHA is also identical at remediation activation head and at the exact candidate:

`4d2fba389e5ac4d59b73c22190fe18ea5cb5fa79`

NW-R1-FC-01 therefore remains preserved rather than rewritten.

## Different Fresh Re-Challenger conclusion

No material defect was found in the exact immutable remediation candidate under the required R1 re-challenge scope.

Final disposition:

`R1_DIFFERENT_FRESH_RECHALLENGER_PASS`

This PASS does not authorize deployment, copying to main, source activation, watcher enablement, or live R1 observation.

The only permitted next stage is a separate controlled R1 activation/proof gate with its own bounded authority and durable receipts.
