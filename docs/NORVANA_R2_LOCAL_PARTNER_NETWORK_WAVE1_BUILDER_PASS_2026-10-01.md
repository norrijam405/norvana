# NORVANA R2 — LOCAL PARTNER NETWORK & ORDER ROUTING WAVE 1 BUILDER PASS

Date: 2026-10-01

Repository: `norrijam405/norvana`  
Pull Request: `#5`  
Branch: `feature/2026-10-01-norvana-r2-local-partner-network`

## Role disposition

`R2_WAVE1_BUILDER_PASS`

This Builder PASS is limited to the **pre-operational Partner Network + deterministic recommendation/routing contract**.

It does not authorize persistence, live directory ingestion, supplier promotion, partner contact, order submission, customer charging, publishing, fulfillment, deployment, or ACT authority.

## Mission activation

Activation document:

`docs/NORVANA_R2_LOCAL_PARTNER_NETWORK_AND_ORDER_ROUTING_ACTIVATION_2026-10-01.md`

Activation commit:

`a41f4af1cf07f0d45a8af2f8420830a754e5926e`

Base:

`main@88df5ac3f976d508985ffa0de58d77091759cff4`

R1 remains separate and unchanged.

## Exact immutable candidate

Commit:

`6c439deaf794721cbe7adfe04e1340a8bbf54a8e`

Parent:

`b20192dca613711b012056b76fac5157353a2a5d`

Tree:

`17c025957e42dcad9919ca52fb970919fb5b874c`

R2 CI:

`36921048979 — SUCCESS`

R2 tests:

`12 PASS / 0 FAIL`

Also PASS:
- new-secret regression scan;
- TypeScript typecheck;
- R2-surface lint;
- production build;
- runtime dependency audit;
- full high-severity dependency gate.

No Vercel deployment exists for the R2 feature branch.

## Preserved failed/intermediate evidence

The Builder preserves all earlier candidate failures rather than rewriting them.

Notable R2 verification history:

- `36919057053 — FAIL`
  - CI used `npm ci` on a repository without a lockfile.
  - No R2 product test executed.

- `36919400023 — FAIL`
  - inherited vulnerable dependency stack blocked at runtime audit.

- `36920035029 — FAIL`
  - inherited client-side admin password was correctly detected by the initial whole-tree secret scan.
  - R2 did not introduce it.

- `36920236892 — FAIL`
  - R2 tests executed; 11/12 passed.
  - one routing expectation exposed hidden fulfillment-mode preference overriding lower price.

- `36920601594 — FAIL`
  - 12/12 R2 tests passed.
  - typecheck exposed explicit-.ts import compatibility with the existing TS config.

- `36920819409 — FAIL`
  - R2 tests and typecheck passed.
  - app-wide lint exposed inherited admin/checkout/cart lint debt outside the R2 surface.

The final candidate remedies R2-owned defects and separates inherited base debt from R2 regression checks.

## Exact executable/configuration delta from R2 activation

Compared with activation commit `a41f4af1...`, the final candidate changes only:

- `.github/workflows/r2-partner-network-ci.yml`
- `package.json`
- `src/lib/partner-network/policy.ts`
- `src/lib/partner-network/routing.ts`
- `src/lib/partner-network/sources.ts`
- `src/lib/partner-network/types.ts`
- `tests/partner-network.test.ts`
- `tsconfig.json`

No existing operational supplier, supplier credential, supplier product, supplier order, customer order, checkout, or fulfillment route was modified.

## Pre-operational Partner Network contract

R2 defines partner types including:

- FARM
- RANCH
- CSA
- FOOD_HUB
- FARMERS_MARKET
- BAKERY
- COOP
- LOCAL_MANUFACTURER
- WHOLESALER
- PACKER
- COLD_STORAGE
- COURIER
- OTHER_LOCAL_BUSINESS

Partner lifecycle states:

- `DISCOVERED`
- `EVIDENCE_VERIFIED`
- `RECOMMENDED`
- `REJECTED`
- `STALE`

Claim states:

- `UNKNOWN`
- `CLAIMED`
- `VERIFIED`
- `STALE`

No R2 state equals an operational supplier.

## Authority contract

The only R2 authority is:

`RECOMMEND_ONLY`

The contract explicitly reports:

- `canActivateSupplier=false`
- `canCreateCredentials=false`
- `canPlaceOrder=false`
- `canChargeCustomer=false`
- `canPublishInventory=false`
- `canSubmitFulfillment=false`
- `canContactPartnerAutonomously=false`

## Qualification policy

Candidate recommendation eligibility is deterministic and evidence-bound.

The policy considers:
- verified identity;
- location evidence;
- product/category evidence;
- service-area evidence;
- wholesale evidence;
- pickup/delivery/aggregation capability;
- evidence freshness;
- category coverage.

Hard blockers include:
- REJECTED or STALE candidate state;
- unverified identity;
- unknown/stale location;
- unknown/stale product coverage;
- empty categories;
- missing evidence;
- evidence outside the allowed freshness window.

Unknown current inventory, price, minimum order, lead time, or certifications remain explicit warnings rather than silently becoming facts.

## Discovery source registry

Initial source registry is discovery-only and includes official/public source families such as:

- USDA AMS Local Food Directories;
- USDA Farmers Market Directory;
- USDA CSA Directory;
- USDA On-Farm Market Directory;
- state Department of Agriculture directories;
- Cooperative Extension directories.

The source registry creates no credentials and performs no supplier activation.

## Deterministic routing proposal

R2 can construct a multi-partner proposed fulfillment plan.

A plan is always:

`authority = RECOMMEND_ONLY`

and:

`canExecute = false`

The router can split one demand line across multiple recommendation-eligible partners.

It explicitly reports:
- allocations;
- uncovered demand;
- alternates;
- known cost;
- unknown-cost presence;
- human-verification requirement;
- warnings.

## Routing fail-closed controls

An offer cannot allocate demand unless:
- partner is recommendation-eligible;
- offer category matches demand category;
- partner evidence covers that category;
- offer unit exactly matches demand unit;
- service area is not NO_MATCH;
- availability is not UNKNOWN or STALE;
- available quantity is known and positive;
- offer evidence is within the routing freshness window.

Current offer evidence older than 30 days cannot allocate.

Offer evidence older than 7 days can still be considered within the 30-day maximum but forces human reverification.

Duplicate same-partner offers for one demand line are collapsed deterministically so one partner's stated availability cannot be double-counted.

When evidence trust is equal, known lower cost is preferred.

Fulfillment mode is disclosed but no longer receives a hidden trust bonus that can silently override price.

## Verification results

The 12-test suite proves at minimum:

1. R2 has recommendation authority only.
2. discovery sources are discovery-only.
3. evidence-qualified candidates can become RECOMMENDED.
4. stale evidence fails recommendation closed.
5. unverified identity cannot be recommended.
6. one demand line can be split across multiple partners.
7. unknown quantity cannot masquerade as inventory.
8. service-area NO_MATCH cannot allocate.
9. claimed availability / unknown price forces human verification.
10. category and unit mismatch cannot allocate.
11. stale offer evidence cannot allocate.
12. duplicate same-partner offers cannot double-count availability.

## Dependency security prerequisite included

The inherited branch base failed the runtime dependency audit.

The R2 candidate minimally updates:
- Next.js to `16.3.8`;
- `eslint-config-next` to `16.3.8`;
- PostCSS to `8.5.23`.

The final runtime and high-severity audits pass.

These version changes are part of the exact candidate and must be challenged as part of Wave 1.

## Known inherited security debt not claimed as fixed

The repository base still contains historical security/configuration debt outside the R2-owned executable surface, including:
- a legacy client-side admin-password pattern;
- a source-controlled database connection configuration in the old Drizzle config/history.

R2 did not introduce these items.

The final R2 CI checks **new regressions introduced by R2** rather than falsely claiming the inherited repository is globally secret-clean.

Those inherited issues require a separate controlled security remediation before any production promotion that depends on the affected surfaces.

Do not expose credentials or rotate production secrets as part of this Wave 1 Builder role.

## Persistence boundary

No database schema or migration was added.

No discovered farm/business is persisted.

No live USDA/state/extension directory ingestion ran.

No R2 candidate was copied into existing operational `suppliers` tables.

That boundary is intentional.

Persistence and discovery ingestion may begin only after this pure contract survives an independent Fresh Challenger.

## Deployment state

No R2 Vercel deployment exists.

No production or Preview deployment was authorized by this Builder.

## Next gate

A genuinely separate Fresh Challenger must independently attack exact candidate:

`6c439deaf794721cbe7adfe04e1340a8bbf54a8e`

Do not add persistence, run live directory ingestion, merge PR #5, deploy R2, or promote any partner into operational supplier state before the challenge.

If the candidate survives, the next Builder mission may introduce a separate pre-operational persistence layer and bounded public-directory ingestion.
