# NORVANA WATCHTOWER R0 — POST REAL OBSERVE INDEPENDENT ASSURANCE PASS

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Recovery branch: `recovery/2026-09-26-norvana-modernization-r0`

## Role disposition

`INDEPENDENT_ASSURANCE_PASS`

This disposition is limited to the completed Norvana Watchtower R0 controlled real-observe proof and the exact evidence reconciled below.

I did not build or repair the challenged candidate, did not act as any Challenger/Re-Challenger, did not act as the Controlled Live-Proof Operator, did not deploy or rerun the proof, and do not authorize commerce or broader automation authority.

## Exact challenged executable baseline

Commit:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

Git object independently confirms:

- parent: `a739df30377c56a03214b1c5a14127375f0a3baa`
- tree: `827f8a25ecd8d8f0844e2385f244df26ac1d4415`

Recovery CI:

`36758702065 — SUCCESS`

GitHub run metadata independently confirms:

- event: `push`
- head SHA: `44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`
- run attempt: `1`
- job `110035415122 — static-verification — SUCCESS`

The job log independently confirms exact checkout of `44fe8b23...` and:

`49 PASS / 0 FAIL`

## Post-candidate recovery lineage before deployment gate

The deployment-gate parent is:

`32998ddc2cfa67d30874a521c1ccc77ade3cce15`

GitHub compare from `44fe8b23...` through that parent is exactly four commits ahead and changes only four documentation files:

- remediation Builder PASS after NW-R0-OBS-06;
- Different Fresh Re-Challenger activation;
- Different Fresh Re-Challenger PASS;
- controlled live-proof activation.

No executable file changed before the deployment gate.

## Controlled Preview gate/refreeze

One-shot gate:

`048b92f094d9ec5ea38f35ba984e32097d559847`

Its only change is:

`vercel.json: git.deploymentEnabled false -> true`

Gate CI:

`36796336948 — SUCCESS`

Immediate refreeze:

`cb697773eecb1a7848c9fdf6268e4706346a00bf`

Its only change is:

`vercel.json: git.deploymentEnabled true -> false`

Refreeze CI:

`36796436113 — SUCCESS`

The Vercel deployment inventory for the complete gate/refreeze/main-pin window contains exactly one deployment:

- deployment: `dpl_AYcKaR2fP556xhAGtMmhvk5fgFJY`
- origin: `https://norvana-ipgbcuf24-norrijam405-2107s-projects.vercel.app`
- source SHA: `048b92f094d9ec5ea38f35ba984e32097d559847`
- source branch: `recovery/2026-09-26-norvana-modernization-r0`
- region: `iad1`
- state: `READY`

No second deployment was created by the refreeze, and the later main proof pin created no deployment.

Current recovery `vercel.json` and exact main proof-pin `vercel.json` both retain:

`git.deploymentEnabled=false`

## Exact main proof-client pin

Main proof pin:

`c60823b0e8c55d703a8a6a09e9a96c2cb08b1fdd`

The five proof workflow/client files were independently compared between exact challenged candidate `44fe8b23...` and the main pin.

Byte-for-byte identical:

- `.github/workflows/watchtower-observe-proof.yml`
- `scripts/watchtower-observe-proof.mjs`
- `scripts/watchtower-observe-proof-confirmation.mjs`
- `scripts/watchtower-observe-proof-fetch.mjs`

Only changed file:

- `scripts/watchtower-observe-proof-destination.mjs`

Only semantic difference:

`__NORVANA_CONTROLLED_PREVIEW_NOT_PINNED__`

became:

`https://norvana-ipgbcuf24-norrijam405-2107s-projects.vercel.app`

No other proof-client semantic change was found.

## NW-R0-OBS-01 through NW-R0-OBS-06 lineage

The preserved lineage independently reconciles as follows:

1. `NW-R0-OBS-01 — REAL_OBSERVE_ACTIVATION_DEADLOCKS_ON_RUNTIME_BOUND_PROOFS_AND_DEPLOYMENT_TIME_QUEUE_EXECUTOR_FLAGS`
   - preserved activation finding;
   - remediation Builder PASS;
   - bounded `OBSERVE_PROOF` lane retained.

2. `NW-R0-OBS-02 — OBSERVE_PROOF_REDIRECT_CHAIN_VALIDATES_ONLY_FINAL_HOST`
   - Fresh Challenger failure preserved;
   - remediation retained;
   - current fetch helper uses `redirect: "manual"`, validates every hop before request, enforces HTTPS, approved host, credential rejection, custom-port rejection, and bounded redirect depth.

3. `NW-R0-OBS-03 — OBSERVE_PROOF_OIDC_TOKEN_DESTINATION_IS_MUTABLE_AND_UNBOUND`
   - Different Fresh Re-Challenger failure preserved;
   - source-controlled destination module retained;
   - worker no longer accepts a mutable runtime destination.

4. `NW-R0-OBS-04 — OBSERVE_PROOF_CONFIRMATION_INPUT_SHELL_INJECTION_CAN_MINT_OIDC_BEFORE_DESTINATION_VALIDATION`
   - Different Fresh Re-Challenger failure preserved;
   - remediation retained;
   - workflow has a separate no-OIDC `preflight` job with `contents: read` only;
   - the proof job has `needs: preflight` and receives `id-token: write` only after preflight.

5. `NW-R0-OBS-05 — OWNER_SESSION_SAME_ORIGIN_GUARD_REQUIRES_ORIGIN_ON_SAFE_GET_AND_BLOCKS_REQUIRED_JOB_SNAPSHOT`
   - controlled live-proof failure preserved;
   - safe-read guard retained only for `GET /api/watchtower/jobs`;
   - `POST /api/watchtower/jobs` and `PATCH /api/watchtower/jobs/{id}` retain strict mutation guard.

6. `NW-R0-OBS-06 — SAME_ORIGIN_GUARDS_COMPARE_HOST_ONLY_AND_ACCEPT_CROSS_SCHEME_OR_MALFORMED_ORIGIN`
   - Fresh Challenger failure preserved;
   - final remediation candidate `44fe8b23...` retained;
   - full canonical request-origin comparison, serialized Origin validation, full Referer-origin validation, and contradictory provenance rejection remain present;
   - Different Fresh Re-Challenger PASS remains preserved at commit `90b3bccc3282be69a552cbf5391bd35086a599f4`.

Path-specific GitHub history was checked for the principal preserved finding/PASS/FAIL reports across NW-R0-OBS-01 through NW-R0-OBS-06. Each checked report has exactly one commit in its file history on the recovery branch. No rewrite of those reports was found.

## Founder/runtime owner chain

The preserved owner helper was independently reviewed.

It fails unless all five watchers are `PAUSED` before activation.

It then permits exactly one enabled watcher and verifies:

- slug: `local-producer-watch`
- authority: `OBSERVE`
- budget: `$0`
- every non-target watcher remains `PAUSED`

It then requires one successful `OBSERVE_PROOF` queue acknowledgement for the same target at zero estimated cost.

A preserved authenticated screen recording of the exact controlled Preview before activation independently shows:

- `WATCHERS 5`
- `ENABLED 0`
- `CANDIDATES 0`
- `AUTHORITY Locked`

Evidence file:

`20261001-0340-04.3389006.mp4`

SHA-256:

`12af01eb3933d405f0ca04b777e855c78d1cfb32e080c1b5cac23bb7f86bdf19`

The recording also shows the owner helper completing with:

`WATCHTOWER_REAL_OBSERVE_OWNER_CHAIN_READY`

The preserved operator receipt identifies:

- Control Proof run: `23`
- Control receipt: `48`
- Local Producer Watch job id: `3`
- Observe Proof run: `25`
- Observe Proof queue receipt: `52`

No contradiction was found.

## Fresh external proof

Workflow run:

`36813143368`

GitHub run metadata independently confirms:

- workflow: `Norvana Watchtower Real Observe Proof`
- event: `workflow_dispatch`
- head branch: `main`
- head SHA: `c60823b0e8c55d703a8a6a09e9a96c2cb08b1fdd`
- run number: `1`
- run attempt: `1`
- status: `completed`
- conclusion: `success`

This is a fresh workflow dispatch, not a rerun.

Jobs:

- `preflight — SUCCESS`
- `local-producer-observe-proof — SUCCESS`

The preflight job log independently confirms exact checkout of `c60823b0...`, exact confirmation data, and the exact Preview destination.

The proof job log independently confirms exact checkout of `c60823b0...`, revalidation of the exact Preview destination, OIDC use only in the proof job, and final output:

`{"result":"PASS","authMode":"GITHUB_OIDC_OBSERVE_PROOF","runId":25,"status":"PASS","candidateCount":0,"estimatedCostCents":0,"evidenceCount":2,"sourceCount":2}`

The one-shot worker contains exactly one claim POST and exactly one result POST, with no retry loop around either request. Combined with workflow run attempt `1` and a single successful proof job, no duplicate GitHub-side claim/result execution path was found.

## Public-source boundary

The worker requires exactly two approved URLs:

- `https://ag.ok.gov/divisions/market-development/`
- `https://www.ams.usda.gov/services/local-regional/food-directories`

The fetch helper allows only:

- `ag.ok.gov`
- `ams.usda.gov`
- `www.ams.usda.gov`

Every redirect is followed manually only after validation of the next hop. The worker emits zero candidates and fixes estimated cost at zero.

The successful proof output confirms two evidence records and two sources.

## Consequential-action ceiling

Before any source retrieval, the worker requires all of the following hard limits to be exactly `false`:

- spend money;
- publish products;
- place orders;
- change prices;
- activate suppliers;
- issue refunds;
- fulfill orders;
- activate federation;
- emit candidates.

The successful external proof could not have reached PASS if any required hard limit were widened.

No ACT, spending, ordering, publishing, repricing, refund, supplier activation, fulfillment, paid infrastructure, or federation action was found.

Normal recovery deployment remains refrozen.

## Final safe-default restoration

A preserved authenticated post-proof recording of the exact controlled Preview shows:

- Local Producer Watch: `Paused`
- Free Supplier Watch: `Paused`
- Global & Resale Sourcing Watch: `Paused`

Evidence file:

`20261001-1246-50.8479791.mp4`

SHA-256:

`4bd4e89c79878e35deafc4a03f5e5a97c49d10989234a26925c35cd0b6b9d858`

The owner helper had independently established five watchers with zero enabled before activation and structurally allowed only Local Producer Watch to be enabled for the proof; all non-target watchers were required to remain PAUSED. The post-proof recording confirms the only target returned to PAUSED.

The operator receipt additionally preserves the exact server-side final mutation:

`2026-10-01T12:46:02Z PATCH /api/watchtower/jobs/3 -> 200`

The Vercel runtime-log API could not be re-read in this assurance session because the connected log query returned `ExceedsBillingLimitError` / timeout. That tooling limitation was not treated as evidence of success. Instead, final-state assurance rests on the independently reviewed owner-helper invariants, the fresh GitHub proof execution, the authenticated post-proof recording, and the preserved server-side receipt. No material inconsistency was found among them.

## Independent Assurance conclusion

The full controlled proof chain reconciles without a material inconsistency:

- exact challenged candidate and tree;
- exact Recovery CI and 49/49 tests;
- documentation-only pre-gate descendants;
- exactly one controlled Preview;
- immediate refreeze;
- no second deployment from refreeze;
- main pin changed only the destination;
- main pin produced no site deployment;
- founder/runtime chain remained bounded to Local Producer Watch / OBSERVE / $0;
- one OBSERVE_PROOF was queued;
- fresh workflow_dispatch run, attempt 1;
- no-OIDC preflight completed before OIDC mint;
- exact main SHA and exact Preview destination used;
- two approved public sources only;
- PASS / runId 25 / zero candidates / zero estimated cost / two evidence / two sources;
- one-shot claim/result path;
- final Local Producer Watch restoration to PAUSED;
- no other watcher widening;
- no ACT/commerce/federation widening;
- principal NW-R0-OBS-01 through NW-R0-OBS-06 reports remain preserved and unrewritten.

Final disposition:

`INDEPENDENT_ASSURANCE_PASS`

This PASS does not itself authorize commerce, production promotion, ACT authority, paid infrastructure, normal autonomous execution, fulfillment, supplier activation, or IgniAqua federation.
