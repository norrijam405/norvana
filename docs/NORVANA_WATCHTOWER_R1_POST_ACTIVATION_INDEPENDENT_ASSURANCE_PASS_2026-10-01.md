# NORVANA WATCHTOWER R1 — POST-ACTIVATION INDEPENDENT ASSURANCE PASS

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Recovery branch: `recovery/2026-09-26-norvana-modernization-r0`

## Independent Assurance disposition

`R1_POST_ACTIVATION_INDEPENDENT_ASSURANCE_PASS`

This disposition is limited to the completed Norvana Watchtower R1 controlled activation/proof chain for the bounded recurring `local-producer-watch` OBSERVE lane.

This assurance role is separate from the R1 Builder, Fresh Challenger, Different Fresh Re-Challenger, Controlled R1 Activation / Proof Operator, and prior R0 controlled operators.

No remediation was performed. Neither R1 workflow was rerun. No Preview was created. Watcher state was not mutated. Authority was not widened.

## Governing activation and predecessor receipts

Independent Assurance activation:

`docs/NORVANA_WATCHTOWER_R1_POST_ACTIVATION_INDEPENDENT_ASSURANCE_ACTIVATION_2026-10-01.md`

Activation commit:

`b6103b9046e96083589cd4e7678e16eef4dab690`

Controlled activation/proof PASS receipt:

`docs/NORVANA_WATCHTOWER_R1_CONTROLLED_ACTIVATION_PROOF_PASS_2026-10-01.md`

PASS receipt commit:

`238fbb5369d6b6cf269737ce8531ea9d20ff7a50`

Required predecessor disposition independently reconciled:

`R1_DIFFERENT_FRESH_RECHALLENGER_PASS`

Predecessor PASS report commit:

`5af5f07750fd88a6bfd1f5782b12c93a3ae36e0e`

## Exact challenged candidate

Commit:

`b98706f0231d9ee038845b8381bbc494185a37df`

Parent:

`95b1f58be62da62c1708651aa90924d92e969210`

Tree:

`2e044d9687cbb53e864692a1031949031de9a636`

The Git object independently confirms the exact commit, parent, and tree.

Recovery CI run:

`36883896225 — SUCCESS`

The run independently confirms exact-candidate checkout and `59 PASS / 0 FAIL` Watchtower tests. Runtime dependency audit reported zero production/runtime vulnerabilities; the high-severity dependency gate, secret-regression scan, typecheck, lint error gate, and production build all completed successfully.

## Controlled Preview lineage

Gate commit:

`e84079f66f39d75a1d956124e999313b18dbecce`

The gate commit changes only:

`vercel.json -> git.deploymentEnabled=false -> true`

Candidate-to-gate comparison is five commits ahead. The only aggregate changed paths are four documentation/receipt files plus `vercel.json`. No application/server/R1 execution semantics changed before deployment.

Exact controlled Preview:

- deployment: `dpl_26T6YqZcRrdBfqJMg2cVbo3HZwML`
- origin: `https://norvana-k2f4sadfk-norrijam405-2107s-projects.vercel.app`
- project: `norvana`
- source branch: `recovery/2026-09-26-norvana-modernization-r0`
- source commit: `e84079f66f39d75a1d956124e999313b18dbecce`
- region: `iad1`
- target: non-production Preview
- state: `READY`

Refreeze commit:

`41f2fa88fd51a48e8eee37fece8c19c4fc53e6a4`

Its parent is exactly the gate commit and its only change restores:

`git.deploymentEnabled=true -> false`

Candidate-to-refreeze comparison contains only the four documentation/receipt files. Therefore the executable/configuration state is restored to the challenged candidate after the one deployment gate.

The Vercel deployment window spanning gate, refreeze, and main activation contains exactly one deployment: the controlled Preview above. No second deployment was created by refreeze and no deployment was created by the main activation.

The gate Recovery CI run was superseded/cancelled by the immediate refreeze under the recovery workflow's `cancel-in-progress: true` concurrency policy. The refreeze Recovery CI run `36895148638` completed successfully. This is not a material assurance mismatch because the refreeze is the exact child of the gate, restores the only gate mutation, and the final refrozen state received successful Recovery CI.

## Exact main activation

Main activation commit:

`88df5ac3f976d508985ffa0de58d77091759cff4`

Independent byte reconciliation was performed for the seven governed R1/shared client files plus `vercel.json`.

Exact-equal candidate/main blobs:

- `.github/workflows/watchtower-local-producer-r1.yml`
- `scripts/watchtower-local-producer-r1.mjs`
- `scripts/watchtower-r1-trigger.mjs`
- `scripts/watchtower-observe-proof.mjs`
- `scripts/watchtower-observe-proof-fetch.mjs`
- `vercel.json`

The two non-identical governed source files become byte-identical after applying only the two authorized activation substitutions:

1. `WATCHTOWER_R1_ENABLED = false -> true`
2. `__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__ -> https://norvana-k2f4sadfk-norrijam405-2107s-projects.vercel.app`

No third semantic substitution was required.

`vercel.json` is byte-identical between the challenged candidate and main activation and remains:

`git.deploymentEnabled=false`

At assurance inspection, `main` remained exactly at:

`88df5ac3f976d508985ffa0de58d77091759cff4`

The R1 workflow retains one daily schedule:

`17 14 * * *`

The preflight job has no OIDC mint authority. The dependent execution job gains `id-token: write` only after preflight and its first authority-bearing action is explicitly the post-preflight OIDC mint.

## Founder-authenticated current-runtime proof

Exact controlled Preview runtime logs around 2026-10-01 17:13 UTC independently confirm:

- `POST /api/watchtower/self-test -> 200`
- `POST /api/watchtower/worker-self-test -> 200`
- `GET /api/watchtower/jobs -> 200`
- `PATCH /api/watchtower/jobs/3 -> 200`
- `GET /api/watchtower/jobs -> 200`

A preserved founder-authenticated runtime proof artifact was independently inspected. It enforces and completes assertions that:

- exactly five canonical watcher identities are present;
- all five begin PAUSED with zero budgets;
- only `local-producer-watch` is mutated to ENABLED;
- its authority is exactly `OBSERVE`;
- its budget remains `0`;
- the four canonical non-target watchers remain PAUSED;
- normal queue/executor and consequential external actions remain disabled.

A separate unauthenticated read attempt during Independent Assurance returned `401` with `NORVANA_ADMIN_AUTH_REQUIRED`, confirming that the privileged jobs surface remained protected. No authentication bypass was attempted and no watcher mutation was performed by Independent Assurance.

## First fresh R1 proof

GitHub Actions run:

`36899872706`

Independent run metadata confirms:

- workflow: `Norvana Watchtower Local Producer R1`;
- event: fresh `workflow_dispatch`;
- run attempt: `1`;
- exact head SHA: `88df5ac3f976d508985ffa0de58d77091759cff4`;
- overall conclusion: `success`;
- preflight job: `success`;
- execution job: `success`.

Raw job logs independently confirm:

- exact SHA checkout in both jobs;
- source activation PASS;
- manual trigger accepted as data;
- exact controlled Preview destination PASS;
- OIDC minted only in the dependent post-preflight job;
- queue output:
  `{"result":"R1_QUEUE_PASS","runId":28,"receiptId":59,"runtimeId":"dpl_26T6YqZcRrdBfqJMg2cVbo3HZwML","minimumIntervalHours":20}`
- final observe output:
  `{"result":"PASS","authMode":"GITHUB_OIDC_OBSERVE_PROOF","runId":28,"status":"PASS","candidateCount":0,"estimatedCostCents":0,"evidenceCount":2,"sourceCount":2}`

Exact Preview runtime logs for the proof window contain exactly:

- one `POST /api/watchtower/observe-r1/queue -> 200`
- one `POST /api/watchtower/observe-proof/claim -> 200`
- one `POST /api/watchtower/observe-proof/28/result -> 200`

No duplicate queue, claim, or result activity was present in that proof window.

## Second fresh cadence-block proof

GitHub Actions run:

`36901087953`

Independent run metadata confirms:

- workflow: `Norvana Watchtower Local Producer R1`;
- event: distinct fresh `workflow_dispatch`;
- run attempt: `1`;
- exact head SHA: `88df5ac3f976d508985ffa0de58d77091759cff4`;
- preflight: `success`;
- OIDC mint after preflight: `success`;
- bounded observe step: expected `failure` on the queue rejection.

Raw job logs independently confirm the exact fail-closed response:

`HTTP 409`

`WATCHTOWER_R1_CADENCE_NOT_ELAPSED`

`R1 recurring observe requires at least 20 hours between queue operations.`

Reported next eligibility:

`2026-10-02T13:30:46.573Z`

Exact Preview runtime logs for the second-attempt window contain exactly:

- one `POST /api/watchtower/observe-r1/queue -> 409`

There is no second observe claim and no second observe result. The cadence-block attempt therefore did not create a second observe execution path.

## Assurance conclusion

The challenged candidate, one-gate/one-Preview recovery lineage, refreeze, exact main activation, founder-authenticated runtime proof, first successful R1 execution, and second cadence-block execution independently reconcile without material mismatch.

The evidence supports the bounded recurring R1 state only:

- `local-producer-watch = ENABLED`
- authority `OBSERVE`
- budget `0`
- four canonical non-target watchers PAUSED
- one daily R1 schedule
- 20-hour server-side recurrence floor demonstrated fail-closed
- main deployment remains frozen
- controlled destination remains the exact Preview
- no second observe execution path was created by the cadence test

Final disposition:

`R1_POST_ACTIVATION_INDEPENDENT_ASSURANCE_PASS`

This PASS does not widen authority and does not by itself authorize any later production promotion, paid action, fulfillment, supplier activation, publication, repricing, refund, ACT authority, or other stage outside the bounded R1 assurance scope.
