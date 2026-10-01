# NORVANA WATCHTOWER R1 — BOUNDED RECURRING LOCAL PRODUCER OBSERVE ACTIVATION

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#1`  
Branch: `recovery/2026-09-26-norvana-modernization-r0`

## Predecessor truth

The Norvana Watchtower R0 controlled real-observe proof completed with:

`INDEPENDENT_ASSURANCE_PASS`

Exact Independent Assurance PASS commit:

`a0894dde46192ec616777bbe70474eee8463df47`

The independently assured executable baseline remains:

`44fe8b23faca9f6e0a47dc5556f2f2cc78f293ae`

R1 is a new mission. It does not rewrite, supersede, or broaden the R0 evidence chain.

## R1 mission

Build the narrowest recurring observation lane for exactly one watcher:

`local-producer-watch`

Authority:

`OBSERVE`

Budget:

`$0`

All four non-target watchers:

`PAUSED`

## Architectural rule

Do **not** activate the generic Norvana scheduler or normal executor.

R1 must reuse the independently assured dedicated observe-proof safety model:

- normal queue OFF;
- normal executor OFF;
- external fulfillment OFF;
- supplier connectors OFF;
- IgniAqua federation OFF;
- current-runtime Control Proof PASS;
- current-runtime Worker Proof PASS;
- permanent owner credential;
- exactly one enabled watcher;
- exact target `local-producer-watch`;
- exact authority `OBSERVE`;
- exact budget `0`;
- all non-target watchers PAUSED;
- no concurrent executable run;
- GitHub-hosted OIDC worker;
- exact approved public sources;
- manual per-hop redirect validation;
- zero candidate emission;
- zero estimated cost.

## New R1 authority

The only new execution authority permitted by this mission is:

an exact source-controlled GitHub Actions R1 workflow may, on a bounded schedule, authenticate with GitHub OIDC and queue one dedicated `OBSERVE_PROOF` for Local Producer Watch when every existing observe-proof safety invariant still holds.

The scheduled workflow may then consume that one run through the existing observe-proof claim/result path.

## Cadence

Initial R1 cadence:

`once per day`

A source cron alone is insufficient.

The server must also enforce a minimum interval between successful R1 queue operations so repeated manual dispatch cannot turn the lane into an unbounded loop.

Initial server-side minimum interval:

`20 hours`

A failed or blocked R1 queue attempt must not silently widen or fall back to the generic scheduler.

## Source-controlled activation

The challenged Builder candidate must be **inert by default**.

It must contain a checked-in R1 activation sentinel set to disabled.

While disabled:
- scheduled/manual R1 preflight must fail before OIDC mint;
- no R1 queue call may occur.

A future separate Controlled Activation Operator may change only the challenged activation sentinel and exact Preview destination pin on `main`, after independent challenge and controlled deployment.

## Manual R1 proof

The R1 workflow may also support `workflow_dispatch` solely for controlled activation proof.

Manual execution must require the exact confirmation phrase:

`RUN_LOCAL_PRODUCER_R1`

The confirmation must be treated as data, never interpolated into shell source.

## Required implementation boundaries

1. Add a dedicated R1 queue endpoint.
2. Require GitHub OIDC for the R1 queue endpoint.
3. Allow observe-proof claim/result authentication from:
   - the existing exact manual observe-proof workflow; or
   - the exact R1 scheduled workflow.
4. R1 OIDC identity must remain pinned to:
   - GitHub issuer;
   - Norvana audience;
   - `norrijam405/norvana`;
   - `refs/heads/main`;
   - GitHub-hosted runner;
   - exact R1 workflow ref;
   - event `schedule` or controlled `workflow_dispatch`.
5. Add source-controlled R1 enabled/disabled configuration.
6. Add safe manual-trigger validation.
7. Add exactly one daily GitHub schedule.
8. Use the same concurrency domain as the one-shot observe-proof workflow.
9. Queue must revalidate current runtime, proofs, watcher snapshot, environment, empty executable queue, and R1 minimum interval.
10. Queue must write a durable R1-specific receipt.
11. The recurring client must queue first, verify the acknowledgement, then invoke the already-proven observe-proof worker.
12. Do not change approved source set.
13. Do not allow candidates.
14. Do not allow nonzero cost.
15. Do not turn on the generic queue or executor.
16. Do not enable ACT or RECOMMEND for the target.
17. Do not deploy in the Builder role.
18. Keep `git.deploymentEnabled=false`.

## R1 Builder completion gate

Builder PASS requires:
- full Recovery CI SUCCESS;
- policy/adversarial tests PASS;
- typecheck PASS;
- lint PASS;
- production build PASS;
- dependency/security gates PASS;
- deployment still frozen;
- exact candidate banked;
- separate Fresh Challenger activation prepared.

Do not self-challenge.
