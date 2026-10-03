# Acre Era PostgreSQL Schema Proof — PASS

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Branch:** `feature/2026-10-03-acre-era-postgres-schema-proof-r0`  
**Proof class:** isolated disposable PostgreSQL 17 migration-chain runtime proof

## Purpose

Prove that the accumulated Acre Era backend skeleton is not merely TypeScript-valid: the numbered SQL migration lineage must compose on a real PostgreSQL runtime, be safely re-applicable, and enforce the critical database invariants added by the Era, Customer Intent, Route, Archive, Activation, and Watchtower Signal Bus lanes.

## Historical baseline

The numbered recovery migrations do not represent genesis of the original Norvana storefront.

Before `0007_customer_voice_r0.sql`, the original application already depended on legacy `products` and `reviews` tables.

Therefore the proof uses:

`tests/fixtures/norvana-pre-0007-baseline.sql`

This fixture models only those legacy prerequisites. It is a CI test fixture, not a production bootstrap.

## Initial proof failure

Initial workflow:

`37142319783`

Initial candidate:

`3ce9564104c0402ba09350fd992fcdfc5054531e`

The workflow established that:

- PostgreSQL 17 started successfully;
- the explicit legacy baseline applied;
- all 14 numbered migrations applied successfully;
- all 14 numbered migrations reapplied successfully.

The verifier then failed on:

`missing index: era_archive_snapshots_digest_idx`

Root cause:

Migration SQL used unnamed/constraint-generated unique indexes while `src/db/schema.ts` defined canonical explicit index names.

The same naming drift also affected Watchtower Signal Bus uniqueness indexes.

No production database was involved.

## Remediation

The migration SQL was aligned with the canonical Drizzle schema by adding explicit named unique indexes:

- `era_archive_snapshots_digest_idx`
- `watchtower_signals_signal_key_idx`
- `watchtower_signal_projections_signal_projector_idx`
- `watchtower_signal_projections_key_idx`

The verifier was also extended to require the projection-key index.

## Passing proof

Exact passing candidate:

`f6f28dc609d28e395a8017203198f2aa3086be28`

GitHub Actions run:

`37145206527`

Environment:

- GitHub-hosted Ubuntu runner
- disposable `postgres:17` service container
- isolated database `acre_era_schema_proof`
- no production credentials
- no production database
- no customer data

### Execution

1. Create explicit pre-0007 legacy baseline.
2. Apply every `drizzle/*.sql` migration in lexical order.
3. Reapply every numbered migration to prove idempotent replay.
4. Verify required tables/columns/indexes/triggers.
5. Execute behavioral database invariant probes.
6. Run application TypeScript typecheck.
7. Run Watchtower Signal Bus regression tests.

### Verifier result

```json
{
  "status": "PASS",
  "migrationCount": 14,
  "requiredTableCount": 27,
  "watcherCount": 7,
  "invariants": {
    "singleActivePrimary": "PASS",
    "immutableEraArchive": "PASS",
    "immutableWatchtowerSignals": "PASS",
    "immutableWatchtowerProjections": "PASS"
  }
}
```

The same run also passed:

- `npm run typecheck`
- `npm run test:watchtower-signals`

## Behavioral database probes

The verifier did not rely only on metadata.

It proved that PostgreSQL rejects:

- a second simultaneous active-primary Era;
- UPDATE of an Era archive snapshot;
- DELETE of an Era archive snapshot;
- UPDATE of an immutable Watchtower signal;
- DELETE of an immutable Watchtower signal projection.

## What this proves

At this exact candidate:

- migrations `0001` through `0014` compose successfully on PostgreSQL 17;
- the migration chain can be reapplied without failing;
- canonical named indexes required by the application schema exist;
- critical archive and evidence streams enforce immutability in PostgreSQL itself;
- the active-primary Era uniqueness invariant is database-enforced;
- the seven Watchtower Intelligence R2 default jobs are present after migration;
- application TypeScript remains valid;
- Signal Bus policy regressions remain green.

## What this does not prove

This proof does not:

- apply migrations to Production;
- prove the current production database has the same historical baseline;
- authorize automatic production migration;
- activate an Era;
- activate a product route;
- connect a live Watchtower collector;
- send alerts;
- deploy a storefront;
- spend money.

Production migration remains a separate governed operation requiring reconciliation of the actual target database state before mutation.
