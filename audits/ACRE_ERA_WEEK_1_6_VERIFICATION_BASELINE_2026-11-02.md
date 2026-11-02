# Acre Era / Norvana — Week 1.6 verification baseline
Date: 2026-11-02
Status: SOURCE_REVIEW_ONLY; NOT LIVE VERIFIED
Scope: connected repository `norrijam405/norvana` default branch. Relationship of this repository/deployment to current acreera.com remains UNVERIFIED.

## Evidence and findings
- `src/app/admin/page.tsx`: client-side `ADMIN_PASSWORD` equality check and admin tabs; not a server-enforced authorization boundary. **HIGH PRIORITY** investigate and gate all privileged API writes server-side.
- `src/app/api/products/route.ts`: POST directly inserts client-supplied body, with no authorization or schema validation visible in the inspected handler. **HIGH PRIORITY**.
- `src/app/api/reviews/route.ts`: POST directly inserts user-provided review body and recalculates aggregate rating; no purchase verification/moderation visible. **HIGH PRIORITY** for trust and abuse.
- `src/app/api/checkout/route.ts`: customer-provided items, subtotal, shipping, total are used for order and Stripe line items; server-side catalog-priced reconciliation is not visible. **HIGH PRIORITY**.
- `src/app/api/scout/route.ts`: recommendations based on static `SCOUT_PRODUCTS`; not live evidence of supplier stock, freight, review provenance, or real-time trends.
- `scripts/watchtower-observe-proof.mjs`: exists with OBSERVE-only mode, pinned approved sources, zero-spend and zero-candidate checks, plus a result submission flow; successful execution not proven in this audit.

## Receipt schema (proposal)
Each check should generate immutable record: receipt_id, environment, deployment_id, git_sha, feature, timestamp_utc, actor, test_name, inputs_redacted, output_hash, evidence_links, status (PASS|FAIL|BLOCKED|NOT_RUN), observed_vs_expected, remediation_owner. Keep observed evidence separate from assumptions.

## Required release gates
1. Identify authoritative Acre Era repository, team, deployment, domains, and all Watchtower URLs. No consolidation or deployment until mapped.
2. Confirm whether two Watchtower interfaces use same data models and backend; preserve all data and functions.
3. Add real API authorization and schema validation to product, review, supplier, and publishing writes.
4. Reprice basket server-side from catalog SKUs, shipping rules, currency and inventory; verify Stripe webhook signatures/idempotency; sandbox only.
5. Product publication: DRAFT → VERIFIED → APPROVED → PUBLISHED; require SKU, supplier stock, price, freight, margin, image rights/license, correct variant, and receipts.
6. Photo ingestion only from sources with reuse rights, with source URL, license and attribution receipts; no blind scraping.
7. Reviews: genuine verified-purchase review flow or attributed source-backed summaries; never represent external summaries as customer testimonials.
8. Run read-only smoke checks: homepage, category listing, product detail, image delivery, cart, checkout sandbox, webhook sandbox, admin, farms, supplier sync, Watchtower; record one receipt per check.

## Audit limits
This document is a code-review baseline, **not** a passing test suite. No live storefront or database check, payment, order, supplier activation, content publication, or destructive action was performed. The current Acre Era production deployment was not located in the accessible Vercel team.
