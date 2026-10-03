# Acre Era Archive, Alert & Activation Governance R0

**Date:** 2026-10-03  
**Status:** backend implementation contract

## Purpose

Close the remaining backend gap between qualified configuration and durable customer experience.

This lane adds:

1. immutable Era closure snapshots;
2. deduplicated customer-alert evaluation;
3. explicit media approval;
4. explicit route activation;
5. explicit Era activation/closure;
6. receipts and fail-closed readiness checks.

## Archive snapshots

Closing an Era must preserve the curation as it existed at closure.

Snapshot content includes:

- Era identity/lifecycle/theme/archive policy;
- ordered sections and config;
- media metadata and rights state;
- product membership, curation reason, source/commerce truth, and displayed price state;
- Watchtower public-facet bindings.

Snapshots exclude:

- supplier credentials;
- order/customer PII;
- private product cost;
- private route contribution economics;
- private Watchtower findings not explicitly bound as public facets.

Each snapshot is canonicalized and SHA-256 digested.

Database UPDATE and DELETE operations on `era_archive_snapshots` are rejected by PostgreSQL triggers.

A later archive UI may render only assets whose rights remain valid; immutable history does not grant perpetual public media rights.

## Alert evaluator

Watchtower/admin signals may be evaluated against pseudonymous watchlists.

The evaluator:

- requires a bounded signal type/target/signal key;
- filters payload to a small public-safe allowlist;
- honors product price thresholds;
- SHA-256 fingerprints `watch item + signal type + signal key`;
- queues a PENDING alert only once;
- does not send email, SMS, push, or marketing messages.

Delivery remains a future separately governed lane.

## Activation is separate from qualification

### Media

Draft media may become APPROVED only if:

- rights state is public-eligible;
- rights evidence is present;
- media/poster URL is safe;
- rights window is currently valid;
- customer-facing visual/video assets include accessibility text.

### Product route

QUALIFYING routes may become ACTIVE only if:

- route evidence exists;
- verification is fresh;
- authorization and provenance are not UNVERIFIED;
- checkout ownership/destination is coherent;
- affiliate destinations pass the provider/domain allowlist;
- private contribution economics meet configured minimums.

Production policy variables:

- `NORVANA_ROUTE_MIN_CONTRIBUTION_CENTS`
- `NORVANA_ROUTE_MIN_MARGIN_BPS`

If these are absent or invalid, route activation fails closed.

### Era

An Era may become ACTIVE only after the existing Era readiness evaluator passes and an activation evidence reference is supplied.

Making an Era the primary home Era additionally relies on the database single-active-primary invariant.

## Closure

Closing an active Era:

1. requires closure evidence;
2. creates the immutable closure snapshot;
3. records the snapshot digest;
4. clears primary-home status;
5. transitions the Era to CLOSED;
6. preserves public historical identity without implying expired media may still render.

## Authority

This lane contains code capable of state transitions when used by authenticated admin callers.

This development PR itself does not apply migrations, execute any activation, publish a new Era, activate a route, approve real media, or deploy to Production.
