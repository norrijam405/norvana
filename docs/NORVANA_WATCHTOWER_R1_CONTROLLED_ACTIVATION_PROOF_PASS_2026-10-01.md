# NORVANA WATCHTOWER R1 — CONTROLLED ACTIVATION / PROOF PASS

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Recovery branch: `recovery/2026-09-26-norvana-modernization-r0`

## Operator disposition

`R1_CONTROLLED_ACTIVATION_PROOF_PASS`

This disposition is limited to the controlled R1 activation/proof chain for `local-producer-watch`.

This operator was not the R1 Builder, Fresh Challenger, Different Fresh Re-Challenger, any prior R0 controlled proof operator, or Independent Assurance. No remediation was performed in this role.

## Challenged R1 candidate

Commit:

`b98706f0231d9ee038845b8381bbc494185a37df`

Tree:

`2e044d9687cbb53e864692a1031949031de9a636`

Required predecessor disposition:

`R1_DIFFERENT_FRESH_RECHALLENGER_PASS`

PASS report commit:

`5af5f07750fd88a6bfd1f5782b12c93a3ae36e0e`

Recovery CI:

`36883896225 — SUCCESS`

Watchtower tests:

`59 PASS / 0 FAIL`

## Phase A — exact controlled Preview PASS

Recovery was reconciled from the challenged candidate to the pre-gate head. The only post-candidate paths were documentation/receipt files.

One deployment gate was opened by changing only:

`vercel.json -> git.deploymentEnabled=false -> true`

Gate commit:

`e84079f66f39d75a1d956124e999313b18dbecce`

Exactly one new recovery Preview was created:

- deployment: `dpl_26T6YqZcRrdBfqJMg2cVbo3HZwML`
- origin: `https://norvana-k2f4sadfk-norrijam405-2107s-projects.vercel.app`
- branch: `recovery/2026-09-26-norvana-modernization-r0`
- project: `norvana`
- region: `iad1`
- target: non-production Preview
- state: `READY`

Recovery was immediately refrozen:

Refreeze commit:

`41f2fa88fd51a48e8eee37fece8c19c4fc53e6a4`

`git.deploymentEnabled=false`

Vercel reconciliation showed no second recovery Preview created by the refreeze.

## Phase B — exact source activation on main PASS

The challenged R1 workflow/client bytes were staged and compared before main activation.

The only intentional semantic substitutions relative to the challenged candidate were:

1. `WATCHTOWER_R1_ENABLED = false -> true`
2. `__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__ -> https://norvana-k2f4sadfk-norrijam405-2107s-projects.vercel.app`

Shared observe-proof and fetch bytes matched the challenged candidate exactly.

Main activation was squash-merged through PR #4.

Exact main activation commit:

`88df5ac3f976d508985ffa0de58d77091759cff4`

Post-merge re-read confirmed:

- exact expected bytes for all seven required R1/shared client files;
- `main/vercel.json -> git.deploymentEnabled=false`;
- zero Vercel deployments created by the main activation commit.

At proof completion, `main` remained exactly at activation commit `88df5ac3...`.

## Phase C — founder-authenticated current-runtime safety proof PASS

The founder used the normal authenticated owner browser session on the exact controlled Preview.

Exact Preview runtime logs confirmed all required requests returned HTTP 200:

- `POST /api/watchtower/self-test`
- `POST /api/watchtower/worker-self-test`
- `GET /api/watchtower/jobs`
- `PATCH /api/watchtower/jobs/3`
- `GET /api/watchtower/jobs`

The control proof and worker proof completed on the current runtime.

The browser proof enforced the exact five canonical watcher identities:

- `free-supplier-watch`
- `global-resale-sourcing-watch`
- `local-producer-watch`
- `operating-cost-watch`
- `drop-opportunity-watch`

Initial state required all five PAUSED with zero budgets.

The authenticated mutation enabled only:

`local-producer-watch`

with:

- status: `ENABLED`
- authority: `OBSERVE`
- budget: `0`

The other four canonical watchers remained `PAUSED`.

## Phase D — first controlled manual R1 proof PASS

Fresh workflow run:

`36899872706`

Workflow:

`Norvana Watchtower Local Producer R1`

Exact checkout:

`88df5ac3f976d508985ffa0de58d77091759cff4`

Manual confirmation:

`RUN_LOCAL_PRODUCER_R1`

Preflight passed with no OIDC authority.

Preflight proved:

- R1 source activation enabled;
- manual trigger accepted as data;
- exact controlled Preview destination pinned.

OIDC was minted only after successful preflight.

R1 queue output:

`{"result":"R1_QUEUE_PASS","runId":28,"receiptId":59,"runtimeId":"dpl_26T6YqZcRrdBfqJMg2cVbo3HZwML","minimumIntervalHours":20}`

Observe result output:

`{"result":"PASS","authMode":"GITHUB_OIDC_OBSERVE_PROOF","runId":28,"status":"PASS","candidateCount":0,"estimatedCostCents":0,"evidenceCount":2,"sourceCount":2}`

Exact Preview runtime logs independently showed:

- one `POST /api/watchtower/observe-r1/queue -> 200`
- one `POST /api/watchtower/observe-proof/claim -> 200`
- one `POST /api/watchtower/observe-proof/28/result -> 200`

No duplicate queue/claim/result activity was observed in the proof window.

## Phase E — server-side 20-hour cadence lock PASS

A distinct second fresh `workflow_dispatch` was created. The successful first run was not rerun.

Second workflow run:

`36901087953`

Exact checkout:

`88df5ac3f976d508985ffa0de58d77091759cff4`

Preflight passed again.

OIDC was minted only after preflight.

The queue endpoint rejected the second attempt fail-closed with HTTP 409:

`WATCHTOWER_R1_CADENCE_NOT_ELAPSED`

Exact workflow error:

`R1 recurring observe requires at least 20 hours between queue operations.`

Reported next eligibility:

`2026-10-02T13:30:46.573Z`

Exact Preview runtime reconciliation for the second-attempt window showed exactly one request:

- `POST /api/watchtower/observe-r1/queue -> 409`

There was no second `/observe-proof/claim` request and no second `/observe-proof/{id}/result` request.

Therefore the second controlled manual attempt did not create a second observe execution path.

## Recurring activation state at operator handoff

Source state on `main` was independently re-read after both proof attempts:

- `WATCHTOWER_R1_ENABLED = true`
- exact controlled Preview origin remains pinned
- daily cron `17 14 * * *` remains present
- `main/vercel.json -> git.deploymentEnabled=false`
- `main` remains exactly at `88df5ac3f976d508985ffa0de58d77091759cff4`

The successful R1 queue receipt started the 20-hour recurrence window.

No Independent Assurance is performed or claimed by this operator.

## Final disposition

`R1_CONTROLLED_ACTIVATION_PROOF_PASS`

Next authorized stage:

A separate post-activation Independent Assurance review of the exact activation/proof chain.
