# Norvana Watchtower R0

**Status:** implementation candidate  
**Owner:** Norvana  
**Role of IgniAqua:** bounded service provider / intelligence layer

## Purpose

Watchtower moves recurring Norvana monitoring out of ChatGPT task limits and into Norvana-owned backend state.

Norvana owns:

- job definitions;
- schedules/cadence;
- authority ceilings;
- run history;
- candidate findings;
- evidence references;
- cost accounting;
- action receipts;
- notification state.

AI/model/search providers are replaceable execution dependencies, not the canonical home of Norvana's jobs.

## R0 control panel

`/admin` becomes the Watchtower Control Panel.

R0 shows:

- Watchers;
- enabled/paused state;
- cadence;
- budget ceiling;
- authority;
- Watchtower truth state;
- recent runs;
- candidate inbox;
- scheduler/executor/federation configuration state.

The historical client-side password is retired.

## Authentication

Owner access uses:

- server-side password hash;
- scrypt verification;
- server-only session secret;
- signed HttpOnly cookie;
- no password literal in browser source.

There is no default password.

## R0 watchers

1. Free Supplier Watch
2. Global & Resale Sourcing Watch
3. Local Producer Watch
4. Closest-to-$0 Operations Watch
5. Drop Opportunity Watch

All defaults begin PAUSED until the founder initializes Watchtower.

## Authority

R0 supports:

- OBSERVE
- RECOMMEND

ACT is represented in the data model but locked from ordinary R0 controls.

Watchtower must not autonomously:

- spend money;
- bid at auctions;
- place supplier orders;
- publish products;
- change prices;
- activate suppliers/producers;
- enroll a customer in financing;
- issue refunds;
- deploy production changes.

## Execution design

The job registry and run history live in Norvana.

Execution is provider-neutral and may later be performed by:

- an IgniAqua service;
- a Norvana worker process;
- qualified source-specific connectors;
- an external model/search provider;
- deterministic code where AI is unnecessary.

The executor must return structured findings/evidence rather than only prose.

## Closest-to-$0 execution rule

Use deterministic code, feeds, APIs, RSS, cached data, and targeted source checks before paying for AI inference.

When AI/search is useful, choose the lowest-cost qualified provider for the job.

A $0 provider is not automatically preferred if it creates materially worse reliability, evidence quality, latency, security, or operating loss.

## Truth states

A job being ENABLED does not mean it executed successfully.

Runs use explicit states such as:

- QUEUED
- RUNNING
- PASS
- NO_MATERIAL_CHANGE
- BLOCKED
- FAILED

Candidate findings should preserve:

- source;
- observed-at time;
- provenance/evidence;
- economics;
- risk flags;
- confidence/uncertainty;
- recommendation;
- disposition.

## Promotion gates

Before Watchtower is considered live:

1. CI/typecheck/lint pass.
2. admin session verified in deployed environment.
3. Watchtower tables initialized.
4. scheduler endpoint/worker verified.
5. at least one OBSERVE job produces a durable receipt.
6. at least one RECOMMEND job produces a candidate with evidence.
7. failure/timeout behavior verified.
8. no ACT path can bypass the R0 authority ceiling.


## Scheduler and worker protocol

The initial scheduler may use GitHub Actions as a low-fixed-cost wake-up mechanism.

Canonical schedules remain in `watch_jobs`; GitHub does not own job truth.

### Queue flow

1. GitHub Actions calls the protected Watchtower tick endpoint.
2. The tick endpoint identifies due ENABLED jobs.
3. A durable `watch_runs` record is created as QUEUED.
4. A qualified worker claims one queued run with the worker secret.
5. Norvana returns the job instructions, source policy, budget ceiling and hard authority limits.
6. The worker returns structured findings, evidence references and candidate records.
7. Norvana stores the result and an action receipt.

Queueing and execution remain independently disabled by default.

### Worker replacement

The worker protocol is provider-neutral. A worker can be replaced without moving:

- schedules;
- job instructions;
- run history;
- candidate state;
- evidence;
- budget;
- authority;
- receipts.

### R0 hard limits returned to workers

- maySpendMoney = false
- mayPublishProducts = false
- mayPlaceOrders = false
- mayChangePrices = false
- mayActivateSuppliers = false
- mayIssueRefunds = false

A worker response cannot grant itself additional authority.
