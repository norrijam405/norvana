# NORVANA WATCHTOWER R0 — DIFFERENT FRESH RE-CHALLENGER PASS AFTER NW-R0-RECHAL-02 REMEDIATION

Date: 2026-09-29

Role: **Different Fresh Re-Challenger**  
Repository: `norrijam405/norvana`  
PR: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

This Re-Challenger did not build the remediation, did not act as the prior Fresh Challenger or prior Different Fresh Re-Challengers, did not act as Independent Assurance, and performed no repair.

## Disposition

**PASS**

Bound only to exact remediation candidate:

`d9b166e640791c0b939f40ccb46f2dff354b5270`

No new Re-Challenger finding was established.

This PASS does **not** relabel or erase any prior failure lineage.

## Preserved lineage

Historical external harness PASS remains historical evidence only:
- GitHub run `36455613388`
- job `109041083231`
- Watchtower run `15`
- final status `NO_MATERIAL_CHANGE`
- candidate count `0`
- estimated cost `0`

Original Fresh Challenger finding:

`NW-R0-CHAL-01 — HARNESS_SAFETY_PROOF_CAN_GO_STALE_AFTER_QUEUE_BEFORE_CLAIM`

Prior Remediation Builder PASS:

`92c070503f8a7f8a06468f0aca87591bf73d340b`

Prior Different Fresh Re-Challenger finding:

`NW-R0-RECHAL-01 — MULTIPLE_ACTIVE_HARNESSES_ARE_NOT_REJECTED_AT_CLAIM_OR_FINALIZATION`

Prior Remediation Builder PASS:

`d64fb23a0667dd764e45b0136a21dbab58c9ed1b`

Prior Different Fresh Re-Challenger finding:

`NW-R0-RECHAL-02 — STALE_HARNESS_RETIREMENT_BYPASSES_GLOBAL_LOCK_AND_CAN_PERSIST_STALE_SAFETY_EVIDENCE`

Failed remediation candidate:

`f482e4504ba98412a24a5a7b7c92eac94fc6dc02`

Failed Recovery CI:

`36567544257 — FAILURE`

The failure is preserved as a deterministic source-order regression-test failure. The implementation was not deployed.

Corrected remediation candidate:

`d9b166e640791c0b939f40ccb46f2dff354b5270`

Exact-candidate Recovery CI:

`36567655635 — SUCCESS`

Observed CI gates:
- deterministic install: PASS
- runtime dependency audit: PASS
- full dependency high-severity gate: PASS
- current-tree secret regression gate: PASS
- Watchtower policy/adversarial tests: **23 PASS / 0 FAIL**
- TypeScript: PASS
- ESLint: PASS
- production Next.js build: PASS

## Independent attack results

### 1. Retirement vs watcher mutation — PASS

Exact source review confirms:
- stale retirement acquires the common PostgreSQL transaction-level advisory lock before accepting mutable Watchtower safety state;
- watcher status/authority mutation acquires the same advisory lock before reading and writing its safety-relevant state;
- watcher mutation first cannot leave a stale successful retirement receipt because retirement re-reads the watcher/run state after it obtains the lock;
- retirement first completes its guarded transition and durable receipt before a watcher mutation can enter the same protected domain;
- concurrent application requests therefore serialize instead of observing the old pre-transaction snapshot that produced `NW-R0-RECHAL-02`.

### 2. Retirement state guard — PASS

The protected retirement update is conditioned on all of:
- exact run id;
- trigger `HARNESS_TEST`;
- status `QUEUED`;
- exact stale runtime id.

If the row changes before the protected update, no row is returned and the route emits:

`WATCHTOWER_STALE_RETIREMENT_STATE_CHANGED`

No `WATCH_HARNESS_STALE_RUN_RETIRED` receipt is inserted on that failed guarded transition.

The required trigger-change, runtime-change, and BLOCKED/RUNNING state-change cases therefore fail closed.

### 3. Retirement cardinality — PASS

Inside the locked transaction:
- zero executable runs returns a no-retirement response;
- exactly one valid stale `QUEUED HARNESS_TEST` may proceed;
- multiple `QUEUED/RUNNING` executable runs are rejected;
- a sole non-`HARNESS_TEST` active run is rejected by stale-retirement policy;
- a same-runtime HARNESS_TEST is rejected;
- a RUNNING HARNESS_TEST is rejected.

### 4. Watcher snapshot — PASS

The retirement route reads the current watcher set only after the common advisory lock.

`evaluateHarnessWatcherSnapshot` rejects:
- missing watcher initialization;
- any watcher not `PAUSED`;
- authority outside R0;
- any nonzero automation budget.

The receipt is created from the watcher/run state accepted inside the protected transaction.

### 5. Lock protocol and alternate writers — PASS

The same constants are used by:
- harness queue;
- stale-harness retirement;
- watcher status/authority mutation;
- harness claim;
- harness finalization.

Exact constants:

`WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_1`  
`WATCHTOWER_HARNESS_ADVISORY_LOCK_KEY_2`

Each of the five critical routes acquires `pg_advisory_xact_lock` before its safety-relevant row transition.

Repository source review found the active HARNESS_TEST application mutation set to be:
1. `harness/queue` — creation;
2. `harness/retire-stale` — stale retirement;
3. `jobs/[id]` — watcher-mutation invalidation;
4. `runs/claim` — claim / safety block;
5. `runs/[id]/result` — finalization / safety block.

No additional application HARNESS_TEST writer was established outside this lock domain. Other Watchtower writers create or transition CONTROL_TEST, WORKER_TEST, or SCHEDULE runs instead.

### 6. Receipt integrity — PASS

`WATCH_HARNESS_STALE_RUN_RETIRED` is inserted only after the guarded retirement update succeeds.

Receipt fields bind to the protected state, including:
- stale runtime id;
- current runtime id;
- original trigger `HARNESS_TEST`;
- original status `QUEUED`;
- PAUSED watcher safety state;
- watcher count observed in the protected snapshot;
- disabled queue/executor/external-action state;
- $0 cost;
- common safety-lock identity.

The response is derived from the successful transaction outcome rather than the old pre-transaction candidate.

### 7. Regression preservation — PASS

Independent source review confirms the earlier protections remain present:
- active HARNESS_TEST uniqueness at claim/finalization;
- multiplicity blocking with durable receipts;
- watcher-drift revalidation at claim/finalization;
- current-runtime Control Proof + Worker Proof revalidation;
- exact OBSERVE / $0 harness target;
- Preview-only GitHub OIDC harness authentication;
- no static worker-secret fallback in harness mode;
- zero-cost / zero-candidate HARNESS_TEST result enforcement;
- external fulfillment, supplier connectors, normal executor, normal queue, and IgniAqua federation remain locked for harness proof.

The historical external harness PASS is preserved as historical evidence and is not treated as proof that this remediation was deployed.

### 8. Adversarial source review — PASS

No new alternate application route was found that can create or mutate an active HARNESS_TEST outside the common lock protocol.

No new evidence path was established that can emit a successful stale-retirement receipt after a failed guarded transition.

## Exact-candidate / branch separation

The executable/security disposition is bound to:

`d9b166e640791c0b939f40ccb46f2dff354b5270`

Later branch commits containing the Builder proof and this role activation are documentation lineage only and are not substituted for the exact candidate under review.

## Scope boundary

No deployment was created.
No live watcher was enabled.
No normal executor was enabled.
No supplier, fulfillment, publishing, repricing, ordering, refund, or spending authority was enabled.
No IgniAqua federation was enabled.
No secret was exposed or rotated.
No remediation was performed in this role.

## Re-Challenger truth state

`EXTERNAL_HARNESS_PASS + FRESH_CHALLENGER_FAIL(NW-R0-CHAL-01) + REMEDIATION_BUILDER_PASS(92c070503...) + DIFFERENT_FRESH_RECHALLENGER_FAIL(NW-R0-RECHAL-01) + REMEDIATION_BUILDER_PASS(d64fb23...) + DIFFERENT_FRESH_RECHALLENGER_FAIL(NW-R0-RECHAL-02) + REMEDIATION_BUILDER_PASS(d9b166e...) + DIFFERENT_FRESH_RECHALLENGER_PASS(d9b166e...)`

This is **not** deployment/live proof for the remediation candidate.
This is **not** Independent Assurance.
This is **not** BANKED closure.

Deployment/live proof and Independent Assurance remain separate later gates.
