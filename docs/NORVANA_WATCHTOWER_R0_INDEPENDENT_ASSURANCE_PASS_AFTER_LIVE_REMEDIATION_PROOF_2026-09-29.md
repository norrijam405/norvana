# NORVANA WATCHTOWER R0 — INDEPENDENT ASSURANCE PASS AFTER LIVE REMEDIATION PROOF

Date: 2026-09-29

Role: Independent Assurance  
Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Disposition

**INDEPENDENT_ASSURANCE_PASS**

This disposition is bound to the exact remediation candidate:

`d9b166e640791c0b939f40ccb46f2dff354b5270`

and the controlled live-proof lineage specified by the activation.

No remediation was performed in this role. This PASS does not constitute BANKED closure and does not authorize production commerce, ACT authority, paid infrastructure, supplier activation, fulfillment, or IgniAqua federation.

## Exact candidate and CI reconciliation

Exact remediation candidate:
`d9b166e640791c0b939f40ccb46f2dff354b5270`

Recovery CI:
`36567655635`

Independent GitHub reconciliation confirms:
- run head SHA exactly `d9b166e640791c0b939f40ccb46f2dff354b5270`;
- event `push`;
- attempt `1`;
- conclusion `success`;
- Watchtower policy/adversarial tests: **23 PASS / 0 FAIL**;
- TypeScript: PASS;
- ESLint: PASS;
- production Next.js build: PASS;
- runtime dependency audit: PASS;
- current-tree secret regression gate: PASS;
- full dependency high-severity gate: PASS.

Non-dispositive CI note: the high-severity audit output also reported four moderate-severity development-dependency advisories; they did not fail the configured high-severity gate and are not a Watchtower R0 assurance finding.

## Preserved PASS/FAIL lineage

The historical findings remain preserved and are not relabeled:

1. `NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`
2. `NW-R0-RECHAL-01 — MULTIPLE_ACTIVE_HARNESSES_ARE_NOT_REJECTED_AT_CLAIM_OR_FINALIZATION`
3. `NW-R0-RECHAL-02 — STALE_HARNESS_RETIREMENT_BYPASSES_GLOBAL_LOCK_AND_CAN_PERSIST_STALE_SAFETY_EVIDENCE`

Independent source review at the exact candidate confirms the final remediation retains:
- common PostgreSQL transaction-level advisory locking for harness queue, claim, finalization, watcher safety mutation, and stale retirement;
- current-runtime Control Proof and Worker Proof revalidation;
- exactly-one active `HARNESS_TEST` checks at execution boundaries;
- all-real-watchers PAUSED / R0 / zero-budget revalidation;
- guarded stale retirement by exact run id, trigger, state, and stale runtime;
- atomic state transition plus durable receipt behavior;
- zero-cost / zero-candidate harness result enforcement.

The Different Fresh Re-Challenger PASS remains bound to the same exact candidate and does not erase any prior failure.

## Controlled Preview executable lineage

Controlled Preview:
`dpl_BPEj9Df6LbziKaPh3aQffKkhGang`

Vercel independently reports:
- state: `READY`;
- project: `norvana`;
- branch: `recovery/2026-09-26-norvana-modernization-r0`;
- deployment source: `dda91d79196a3ae0087e4ac135197eabb780bc75`;
- region: `iad1`.

Independent comparison from exact challenged candidate `d9b166e...` to deployment source `dda91d...` shows exactly five changed paths:
- four documentation files;
- `vercel.json`, changing only `git.deploymentEnabled` for the controlled gate.

No Watchtower application implementation file changed between the challenged candidate and the controlled Preview source.

The refreeze commit:
`dcdcce9995dc9e88f5038b5b552a7a4e3a992574`

changes only `vercel.json` back to:
`git.deploymentEnabled=false`.

The current recovery branch also resolves `vercel.json` to `git.deploymentEnabled=false`.

Net comparison from `d9b166e...` to the recovery branch at assurance time is documentation-only; there is no later executable Watchtower drift on that branch.

Vercel deployment listing shows the controlled Preview remains the newest deployment from the recovery branch; later listed deployments belong to other feature branches.

## Current-runtime owner proof

On exact controlled Preview `dpl_BPEj9Df6LbziKaPh3aQffKkhGang`, independent Vercel runtime-log review shows exactly one successful invocation each in the inspected proof window:

- `POST /api/watchtower/self-test` -> 200
- `POST /api/watchtower/worker-self-test` -> 200
- `POST /api/watchtower/harness/queue` -> 200

No stale-retirement call was required and no duplicate queue invocation appears in the inspected window.

The exact deployed code makes those 200 responses fail-closed on the relevant mutable safety predicates:
- Control Proof requires queue disabled, executor disabled, consequential external paths disabled, zero executable runs, all watchers PAUSED, authority bounded to OBSERVE/RECOMMEND, and zero budgets.
- Worker Proof requires queue/executor disabled, external paths disabled, all watchers PAUSED and inside R0 policy, and a current-runtime Control Proof.
- Harness queue requires current-runtime Control + Worker proofs, an empty executable queue, all watchers PAUSED / R0 / zero-budget, an OBSERVE / $0 target, and the common advisory lock.

## Fresh external harness proof

Fresh workflow run:
`36663671190`

Independent GitHub reconciliation confirms:
- workflow: `Norvana Watchtower External Harness`;
- event: `workflow_dispatch`;
- head branch: `main`;
- head SHA: `94210031161c5c6999947db44465ee08978c4722`;
- run attempt: `1`;
- conclusion: `success`;
- job: `109723655463`;
- explicit confirmation gate passed;
- GitHub OIDC token mint step passed;
- exact harness client checkout: `3df5b173b67459af648deb09c3436f3eed69eb83`;
- exact base URL equals the controlled Preview URL.

The checked-out harness client performs only:
1. authenticated harness claim;
2. validation of HARNESS_TEST / OBSERVE / $0 / hard limits;
3. authenticated zero-effect result finalization.

It emits:
```json
{"result":"PASS","authMode":"GITHUB_OIDC","runId":18,"status":"NO_MATERIAL_CHANGE","candidateCount":0,"estimatedCostCents":0}
```

## Runtime cross-check for run 18

Independent Vercel runtime logs on the exact Preview show:
- exactly one `POST /api/watchtower/runs/claim` -> 200;
- exactly one `POST /api/watchtower/runs/18/result` -> 200;
- no duplicate claim/result in the inspected proof window.

The deployed claim/finalization paths:
- require Preview-only GitHub OIDC for harness mode;
- revalidate current runtime identity;
- acquire the common advisory lock;
- require exactly one active HARNESS_TEST;
- require current-runtime Control Proof + Worker Proof;
- re-read the complete watcher snapshot and require all real watchers PAUSED / R0 / zero-budget;
- require the target job to be OBSERVE / $0;
- require queue, executor, external fulfillment, supplier connectors, and federation disabled;
- require HARNESS_TEST finalization to have zero spend and zero candidates;
- transactionally couple transitions and durable receipts.

The successful claim and finalization therefore provide execution-time evidence that the mutable safety predicates held at both boundaries.

## Authority and consequential-action boundary

Exact candidate policy permits only:
- `OBSERVE`
- `RECOMMEND`

The owner job mutation API rejects `ACT` with:
`ACT authority is locked in R0.`

The harness returns hard limits:
- maySpendMoney: false
- mayPublishProducts: false
- mayPlaceOrders: false
- mayChangePrices: false
- mayActivateSuppliers: false
- mayIssueRefunds: false

The runtime request-path inventory for the inspected proof window contains the owner/admin pages plus only these Watchtower proof endpoints:
- self-test;
- worker-self-test;
- harness queue;
- harness claim;
- run 18 result.

No runtime request-path evidence was observed for spending, ordering, publishing, repricing, refunds, supplier activation, external fulfillment, or IgniAqua federation activation.

## Independent Assurance conclusion

No material inconsistency, stale proof, duplicate active harness state, unreviewed executable drift, authority widening, or unverifiable required receipt was established.

Disposition:

`INDEPENDENT_ASSURANCE_PASS`

This PASS is limited to Norvana Watchtower R0 Independent Assurance for the exact evidence above. It is not BANKED closure and does not authorize real commerce actions, ACT authority, paid infrastructure, supplier activation, fulfillment, or federation.
