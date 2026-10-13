# Acre Era — Universal Vendor Qualification R0

Date: 2026-10-13
Repository: norrijam405/norvana
Frozen parent commit: b83ef31e01a52a053806919e5f90d687d901edda
Mission: ACRE-UVQ-001
Status: SPECIFICATION / TEST ACCEPTANCE ONLY — not evidence of implementation pass

## Verified Preview baseline
- Neon project: bitter-snow-32439396
- Preview branch: br-purple-dawn-attktu71 (acreera-preview-2026-10-13)
- Vercel Preview branch-specific DATABASE_URL saved, without changing Production.
- Pet Hair Remover Mitt, products.id=13, supplier_sku=CJYD233200801AZ.
- products.status=staged, products.price=0, products.cost=0.64.
- era_products assignment to goods-era exists and is ACTIVE.
- Vercel deployment dpl_7hE3wAyKDNq5UBkHBtPeZrodfFdr READY.
- This proves CJ product staging and association, NOT universal vendor compatibility, publishing, route quality, or checkout readiness.

## Universal catalog contract
Every supplier adapter should produce normalized, evidence-backed records with:
1. Source identity: provider, immutable provider product ID, source timestamp, source URL/reference, variant ID, and idempotency key.
2. Product identity: title, description, category, SKU, images, rights evidence, physical attributes, currency and provenance.
3. Offer economics: supplier unit cost, outbound shipping, duties/taxes/fees where applicable, returns reserve, processing time, selling price, contribution estimate and freshness timestamp.
4. Fulfillment facts: stock status, quantity or declared unknown, origin, delivery range, service area, carrier/mode and evidence timestamp.
5. Compliance/readiness: supplier authorization, prohibited/regulated item checks, media rights, returns/refund terms, claims substantiation and risk flags.
6. Placement: stage product and optional Era association independently; publication is a separate operator-approved transition.

## Non-negotiable invariants
- Preview and Production credentials/databases must not be conflated.
- Unknown, stale, contradictory or unverified facts remain UNKNOWN; never silently infer VERIFIED.
- Repeat import/placement with same provider + variant must be idempotent; no duplicate catalog rows or cross-provider SKU collision.
- Supplier identifiers are not globally unique unless namespaced by provider.
- A saved product is not automatically published; ACTIVE Era assignment must not override a staged product's nonpublic status.
- Zero/missing selling price must block public purchase.
- Route verification never substitutes for supplier readiness or legal/rights approval.
- No live order, payment, seller contact or carrier booking in qualification tests.
- Detailed provider credentials never appear in receipts, logs, GitHub artifacts or UI.
- Supplier-agnostic errors must explain which validation gate failed, without masking a persistence failure.

## Qualification lanes / test fixtures
A — CJ Dropshipping: Re-stage an existing read-only CJ candidate. Assert normalized pricing, route facts and exactly one supplier-qualified draft product. Confirm staged, not published.
B — Second remote vendor (synthetic): Same canonical fields with another provider ID but overlapping merchant SKU. Assert no collision or record overwrite.
C — Local farm (synthetic): Perishable lot, local pickup time window, freshness/use-by, variable daily stock; reject unsupported parcel-shipping assumptions and expired pickup windows.
D — Wholesaler (synthetic): Case-pack MOQ, tier pricing, lead time and stock timestamp; reject per-unit mispricing.
E — Adversarial negative tests: Empty variant, absent price, unsupported currency, forged image rights, missing shipping route, stale inventory, duplicate placement and cross-Era authorization bypass. Must fail closed.
F — Persistence and reconciliation: Verify staged product in products, supplier identity in normalized tables as applicable, and correct relation in era_products; none public or purchasable.

## Evidence required for each lane
- Exact source commit SHA and root tree, test runner version, isolated Preview DB identity.
- Redacted provider fixture and canonical normalization output.
- SQL/read evidence for products and era_products before/after, counts proving idempotency.
- Explicit PASS / FAIL / NOT EXECUTED by invariant; preserving failures.
- Independent fresh challenge before claiming all-vendor coverage.

## Immediate work order
1. Inspect existing merchandising/place endpoint, CJ adapter, supplier tables and current integration test suite at frozen parent commit.
2. Add tests for A, B and E using fully synthetic providers where possible.
3. Implement smallest provider-neutral corrections indicated by failing tests (not a redesign).
4. Validate against isolated Preview branch; never mutate the production branch.
5. Run farm and wholesaler fixtures, then a fresh independent challenge.
6. Keep deployment preview-only, PR draft until evidence establishes safety.

## Explicitly excluded
No production migration or deployment, live charges, live orders, supplier/carrier API mutations, real farm enrollment, advertising spend, autonomous pricing publication, or customer notifications.
