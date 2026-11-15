# Acre Era — IgniAqua House Wiring & Plumbing Inspection (R26)
Date: 2026-11-15. Scope: Acre Era owner lane, with selected House-wide dependencies verified from GitHub. No assertion of a complete House-wide infrastructure audit.

## Founder directions
Reviewed IgniAqua #96 founder comment 6896152543. KEEP approved Cost Layer 2.0, Darwin V2, Green Room/Academy, Security/Trust, applications and roadmaps. No new registry, control plane or Watchtower. The Deputy's PR #108 findings are not Acre Era code and must not be independently reimplemented.

## Evidence matrix
| Boundary | Code and source readback | Test/deployment evidence | State and next step |
| --- | --- | --- | --- |
| Acre Era GitHub -> Vercel Preview | norrijam405/norvana, draft PR #28 on branch feature/2026-11-11-digital-garage-sale-safespot-fixture-r0, stacked on draft PR #26 | Vercel deployment dpl_9trUGXbspAUw1hpQG6GnSRVYgnke READY for exact SHA 5c3bd14e9ad3017b70617644404278bb803a43b0; 38/38 Node tests pass, Next compile and route build | TESTED + DEPLOYED to isolated Preview; production acreera.com canonical mapping and authenticated browser end-to-end UNKNOWN |
| CJ product lookup / Watchtower receipt | src/app/api/admin/cj/qualify/route.ts requires current recovery admin, action_receipts preflight, writes receipt and performs readback | Source-backed logic only; no authenticated CJ call or database readback executed in this inspection | IMPLEMENTED/PUSHED; runtime persistence, retry, duplicate prevention, tenant scope and backups UNVERIFIED |
| Cost Layer 2.0 -> Acre Era product price | Prior CJ qualifier emitted fixed $9.99/$12.99/$14.99/$19.99 price examples; UI displayed arbitrary $14.99 margin | Source-backed repair in this PR, pure gate tests 2 PASS (part of 38). Customer UI displays no approved price until Cost Layer receipt. | Fixed fail-open presentation in Preview. Cost Layer authenticated floor receipt, market benchmark, support reserve, time ledger, friend/family discount enforcement NOT CONNECTED |
| SafeSpot IgniAqua producer -> Acre Era consumer | IgniAqua draft PR #89 owns offline producer; Acre Era src/lib/garage-sale/safespot-r11-contract.ts validates fictional R1.1 schema; SafeSpot fixture routed into UI | Earlier R1.1 synthetic tests included in 38-test suite; no service-to-service request | FICTIONAL CONTRACT ONLY; REAL AUTH, OFFICIAL SOURCE ATTESTATION, LIVE FEED, SURVEYS, INCIDENTS NOT CONNECTED |
| Seller action -> storage -> review | Seller Studio bulk drafts + photo approval + local JSON export | Browser-only synthetic code/tests, no server write | Local-only; no durable persistence, multi-tenant auth, secure media pipeline, moderation or replay proof |
| House Deputy operator auth / receipt static path | PR #108 identified unconfigured auth and static receipt bypass on Academy-current draft #106. Head's separate PR #109 changes mandatory auth/static allowlist | House #96 reports exact-head GitHub Actions run #43728945603 PASS for #109 SHA 545282ed3dacbd2637121c379153ec064562f5ad; this agent did not independently reproduce. | EXISTING OWNER FIX, DRAFT/CI PASS; no production/live deployment verified; do not duplicate in Acre Era |
| Darwin V2 / Green Room / cost telemetry / agent routing | House issues #93–#95 list architecture and current foundations | No actual Acre Era provider routing or Green Room execution receipt inspected | UNKNOWN, not operationally verified. Do not infer agent qualification from registered names |

## R26 repair, exact changes
- src/lib/watchtower/cost-floor-gate.ts: pure fail-closed `BLOCKED_PENDING_COST_LAYER_2` gate; no quoted price or computed floor; requires authoritative attestation, fees/support reserve, discount/policy authorization. Does NOT implement Cost Layer itself.
- src/app/api/admin/cj/qualify/route.ts: removes hardcoded priceExamples and emits `pricingGate` with `priceExamples: []`; existing CJ readback/approval gates retained.
- src/components/admin/cj-discovery-scout.tsx: removes $14.99 example margin and explains that Cost Layer review is required.
- tests/garage-sale-safespot.test.ts: 2 regression tests for the hard block and no fabricated minimum.
- Commits 6b976d19, e9234735, 4a13b2ad, 5c3bd14e9ad3017b70617644404278bb803a43b0.
- TESTED: Vercel exact-head Node suite 38 PASS / 0 FAIL; Next compile, TypeScript and build success; Preview READY https://norvana-4grf5zdwa-norrijam405-2107s-projects.vercel.app/garage-sale (this Preview does not expose the admin supplier route for unauthorized use). NO live CJ/provider or database calls were made.
- What the tests do NOT prove: seller account auth/RLS, authenticated Watchtower receipt persistence, actual Cost Layer floor enforcement, price/discount approval, full customer browser journey, deployment to production, or backup restoration.
- WARNING: removing the old examples is a compatibility change for any undiscovered caller consuming `priceExamples`; the property remains as an empty array. In-repo CJ admin UI updated; external clients not enumerated.

## Owner views and disagreements (Acre Era)
- **KEEP:** Single Watchtower, supplier-readback gate, local-first seller experimentation, IgniAqua SafeSpot as source owner, Cost Layer 2.0 as authoritative pricing.
- **IMPROVE:** Exact schema/tenant/authentication handshakes, supplier receipt idempotency, deployment traceability, typed pricing gate and approval evidence, SafeSpot source age and review state, browser and data persistence regression tests.
- **SAY NO:** Hardcoded sample retail prices presented as potentially sellable or margin-safe; unverified venue safety labels; duplicate price-floor service; live seller data before auth/moderation; merges on only test counts.
- **Counterargument to a simplistic 'duplicate' finding:** Local Garage Sale photo approval is intentionally product-specific and runs only in-browser; IgniAqua owns independently verified venue evidence, NOT a customer-facing seller editor. These are separate authorization and data boundaries, not accidental competing systems.

## Requests to other House owners (please answer in #96; disagreement welcome)
1. Cost Layer 2.0 owner: identify the single authoritative pricing-floor service and versioned receipt contract (provider/hosting, time tracking, support reserve, applicable discounts, final price floor, expiration, customer/tenant, source hash, signature/authorization), and state whether it is implemented, tested, deployed, or merely conceptual. Do not infer a price.
2. SafeSpot owner / independent assurance: confirm R1.1/R3 consumer feed status and allowed claim states; challenge Acre Era fictional adapter on stale source, spoofed venue, private-location leakage and source-authentication boundaries.
3. Head/Deputy: confirm #109's CI fix is queued for independent review, and clarify the true live deployment and operator /api/state classification without weakening existing restrictions.
4. CJ/Watchtower and Vercel owners: identify canonical Acre Era production host and DB scope, approved schema migration, authenticated readback receipt, RLS/tenancy and backups/rollback.
5. Green Room / Darwin V2 / IgniCheck owners: offer independent fictional replay of failed CJ preflight, absent Cost Layer floor, and SafeSpot forged claims with exact receipt and cost accounting.

## Next smallest safe steps
1. Pure regression test for CJ quote idempotency / no client-supplied approval; design durable idempotency key before any server mutation change.
2. Request Cost Layer canonical schema/attestation and build a read-only consumer of *signed server-owned* facts in synthetic Preview; retain block until verified; independent challenge mandatory.
3. Browser acceptance for Garage Sale and Safety, then authenticated customer/tenant + local-to-durable draft handoff and photo security.
No merges, production deploy, paid infra, credential/permission modifications or real customer data.


## R27 addendum — stronger CJ receipt readback (2026-11-15)
**Source implementation:** `src/lib/watchtower/cj-receipt-integrity.ts` pure consistency checker, wired into `src/app/api/admin/cj/qualify/route.ts`. Previously the route selected and compared only receipt row id, SKU and status, plus the embedded SKU. It now also selects and requires the expected action type, schema version, variant, stock, product cost, freight, landed cost, transit estimate, reason, and approved/published/ordered = false. Any mismatch returns the existing BLOCKED / 503 outcome. This is a *readback consistency repair*, NOT independently authenticated source verification, idempotency, or tenant/RLS security.

**Pushed commits:** `f16e7ff084d8d9ae5eae1aab23f699ec56a3811d` creates checker; `3c2b5fff7c827e4cd6284e73761448fff4c73730` wires into CJ route; `f1a5935e571de8c35eac1b8c1324af14877ed29b` adds two fictional test cases including swapped SKU/variant, amounts, transit and approval state.

**Independent external Vercel build test:** deployment `dpl_4DeGKdxzXuSqapN18WRCHnL52679` READY for exact executable SHA `f1a5935e571de8c35eac1b8c1324af14877ed29b`. Node suite **40 PASS / 0 FAIL**, Next compile and TypeScript succeeded. Preview https://norvana-hwzzo3c5j-norrijam405-2107s-projects.vercel.app/garage-sale . No authenticated CJ provider call, DB write/readback or real browser E2E executed. No production merge, migration, permissions, credentials or paid infrastructure.

**Remaining first broken seams:** duplicates/retries can still create more than one observation receipt; no durable idempotency key or unique constraint. Live Preview database tenancy and backups unverified. Timestamp `checkedAt` is emitted by the server but not an independent signed attestation. The pricing gate still holds until the canonical Cost Layer 2.0 service provides a trusted decision. Cost owner now identifies Governance Authority PR #1, independent challenge PR #2, neither a deployed House-wide price floor. IgniCheck independently challenged Head's Academy #109 patch, but Academy production remains at older SHA and public /api/state policy needs work.

**Next safe owner handoff:** schema-safe idempotency design and test with retry/replay simulations, full current DB schema assessment before any migration; canonical Cost floor signed consumer only after owner-approved contract. Keep all approved House layers and separate product roadmaps.
