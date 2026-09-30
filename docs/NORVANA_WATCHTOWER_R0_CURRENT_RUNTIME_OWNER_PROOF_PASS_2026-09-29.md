# NORVANA WATCHTOWER R0 — CURRENT-RUNTIME OWNER PROOF PASS

Date: 2026-09-29

Repository: `norrijam405/norvana`
PR: `#1`
Controlled Preview deployment:
`dpl_BPEj9Df6LbziKaPh3aQffKkhGang`

Controlled Preview source:
`dda91d79196a3ae0087e4ac135197eabb780bc75`

Exact challenged executable candidate:
`d9b166e640791c0b939f40ccb46f2dff354b5270`

## Owner-authenticated runtime chain

Founder signed in normally on the exact new Preview and executed the fail-closed owner helper.

Independent Vercel runtime evidence on exact deployment confirms:

- exactly one `POST /api/watchtower/self-test` -> HTTP 200;
- exactly one `POST /api/watchtower/worker-self-test` -> HTTP 200;
- exactly one `POST /api/watchtower/harness/queue` -> HTTP 200;
- no stale-harness retirement request was required in this chain.

The grouped runtime counts for the observed window show:
- `/api/watchtower/self-test`: 1;
- `/api/watchtower/worker-self-test`: 1;
- `/api/watchtower/harness/queue`: 1.

No duplicate HARNESS_TEST queue invocation was observed.

## Current truth

`CONTROLLED_PREVIEW_READY + REFROZEN + CURRENT_RUNTIME_CONTROL_PROOF_PASS + CURRENT_RUNTIME_WORKER_PROOF_PASS + EXACTLY_ONE_FRESH_HARNESS_TEST_QUEUED`

Safety posture remains:
- all real watchers PAUSED;
- normal queue OFF;
- normal executor OFF;
- external fulfillment OFF;
- supplier connectors OFF;
- IgniAqua federation OFF;
- R0 authority only;
- $0 automation posture;
- no spending, publication, ordering, repricing, refund, supplier activation, or fulfillment action.

## External harness pre-pin

The main manual external harness workflow is pinned to this exact new Preview at commit:

`94210031161c5c6999947db44465ee08978c4722`

The harness remains:
- manual `workflow_dispatch`;
- exact confirmation phrase required;
- GitHub OIDC authenticated;
- Preview-only;
- exact OIDC-capable client checkout preserved;
- OBSERVE-only;
- $0;
- all hard limits false.

The harness has not yet been dispatched in this proof chain.

## Next exact gate

Dispatch exactly one NEW `Norvana Watchtower External Harness` workflow from `main` with confirmation:

`RUN_DETERMINISTIC_HARNESS`

Do not rerun a historical workflow run.

After dispatch, independently verify:
- GitHub OIDC mint PASS;
- exact client checkout PASS;
- exactly one claim;
- exactly one result submission;
- final `NO_MATERIAL_CHANGE`;
- candidateCount `0`;
- estimatedCostCents `0`;
- no external action;
- durable final receipt path.

Do not claim `LIVE_REMEDIATION_PROOF_PASS` until that fresh external harness succeeds.
