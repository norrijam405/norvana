# Acre Era CJ qualification: retry/idempotency durability gate (R28)
Date 2026-11-17. Code state: isolated draft, Preview-only. No migration was run.

## Exact source evidence
- Existing source: `src/db/schema.ts` defines `action_receipts` with serial primary key (`id`), `action_type`, `authority_class`, `subject_type`, `subject_id`, `status`, `actor`, JSON `details`, `created_at`. There is **no unique request key, provider call identity, or atomic replay constraint** on this table in the inspected Drizzle source. Live database schema, tenancy and indexes were not inspected; do not extrapolate schema source into a claim about live DB.
- Existing CJ route: `src/app/api/admin/cj/qualify/route.ts` authorizes admin, checks `action_receipts` exists, calls CJ and writes a receipt plus readback. R27 readback validation is not deduplication, and insert then select is not atomic request reservation.
- R28 now uses `src/lib/watchtower/cj-retry-policy.ts`: requests bearing **any** `Idempotency-Key` are blocked HTTP 409 before CJ, because the server cannot honor that contract. Legacy no-key observations remain allowed but return `retrySafe:false` on acknowledged receipt and persistence error. No automatic retry should be implemented. It is NOT true idempotency for legacy calls.
- Tests: new negative header and legacy no-guarantee cases added to existing suite.

## Lowest-risk durable design (proposal only; NOT a migration or authorization)
1. Establish canonical admin actor/tenant scope for API-token requests and browser sessions. Do not accept tenant IDs or price approvals from request JSON. If actor scope cannot be established, deny. Confirm existing database tenancy model before any table changes.
2. Define `cj_qualification_requests` as a **new dedicated request-identity ledger** after schema review; do not overload the existing append-only `action_receipts` as a volatile lock. Fields: server-derived tenant/actor, random client request key (bounded), SHA-256 canonical payload fingerprint (normalized SKU + optional variant + version), request state `IN_PROGRESS/COMPLETE/FAILED_UNKNOWN`, reservation timestamp, completion timestamp, optional receipt ID and JSON response digest. Unique constraint on `(tenant_scope, request_key)`; no customer PII or secrets in log fields. Exact schema/type/retention pending DB owner approval.
3. **Transactional reservation before any supplier call:** insert unique request identity atomically. On unique conflict compare stored fingerprint under authenticated same-tenant scope. Different payload → 409; same payload and COMPLETE → return *already saved* readback-verified result; IN_PROGRESS → 409/202 no external duplicate call. Avoid in-memory maps or SELECT-then-INSERT.
4. For crashed/timeout requests, do not simply expire-and-reexecute a supplier call whose outcome is unknown. Require an explicit recovery state and provider-safe query/reconciliation. Source external supplier quote calls are observational but can still incur API cost and rate limits.
5. Persist COMPLETE receipt and response identity inside a DB transaction with proof that row and payload match; no response may claim persistence or repeatability before readback. Tenant/actor authorization applies to retrieval.
6. Set explicit retention and cleanup policy that does not permit old request keys to replay new effects. Restore/recovery test needed before release.
7. Before activation, run concurrent 2/20 request simulations, collision across tenants, same-key different-payload, network timeout, process restart, readback mismatch, expired key, lost response and malicious large key; also verify provider call count and total fees. Independent IgniCheck/security challenge.
8. Use Cost Layer 2.0 for retail quote authorization separately. CJ receipt idempotency must never grant retail pricing or publication authority.

## Milestone R28 test receipt
- Draft repo `norrijam405/norvana`, branch `feature/2026-11-11-digital-garage-sale-safespot-fixture-r0`.
- Commits: `58ca2f80` retry gate; `3da4a824` route admission; executable `f5838f40f602cbc341b1d31cc43d6e75a5322339` tests.
- Vercel isolated deployment `dpl_G2zaD3ecMGLXsuFJoN9KqWn1NHPX` **READY** for exact executable SHA, 42/42 automated tests PASS, TypeScript and build PASS; https://norvana-7zswv2gvs-norrijam405-2107s-projects.vercel.app/garage-sale.
- No authenticated CJ service call, real DB write, provider cost test, process restart, browser acceptance or independent security test completed. No production merge, schema migration, credentials, permissions, or paid resources changed.

## Owners and release blockers
- Acre Era owner: keep this non-deceptive retry admission state and move only after real DB review.
- DB/DevOps owner: identify live Preview DB, existing indexes/tenant boundaries, backups and migration plan; propose atomic unique-key reservation schema and rollback.
- Cost Layer 2.0 owner: canonical commercial floor receipt (separate from supplier quote provenance).
- IgniCheck + Deputy: independently challenge duplicate/retry and tenant boundary before enabling a real `Idempotency-Key`.
- Head/House #96: maintain architectural owner/cost/security separation; preserve the single Watchtower.

**Keep:** existing Watchtower observations, receipt readback, no duplicate system.
**Improve:** durable request identity and replay-safe recovery.
**No:** promise idempotency from merely matching receipt rows, use a local process cache as distributed lock, retry an unknown supplier request blindly, or promote draft logic to production without founder approval.
