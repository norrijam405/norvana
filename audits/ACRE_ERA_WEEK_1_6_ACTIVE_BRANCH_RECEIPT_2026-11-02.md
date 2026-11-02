# Acre Era Week 1.6 — Active-branch Verification Receipt
Date: 2026-11-02
Evidence level: CODE_INSPECTION + VERCEL DEPLOYMENT METADATA, not end-to-end behavior
Status: PARTIAL; production remains unchanged

## Source of truth
Repository: norrijam405/norvana
Active recent preview branch: `feature/2026-10-13-acre-era-universal-vendor-qualification-r0`
Latest observed Vercel READY preview deployment: `dpl_HJMwurDu8GYhu1B5xqZFMCEwGUhv`, commit `f35cc8dec756cedc2cc110a9db400382a9558b79` (variant selector repair).
Vercel custom domain `acreera.com` verified and assigned to the same project; domain settings specify older `feature/2026-10-04-acre-era-intelligence-delivery-r0`. Hence READY preview != live custom-domain version.

## Verified by code inspection
- `src/app/watchtower/page.tsx` redirects to `/admin/cockpit`.
- `src/app/admin/page.tsx` redirects to `/admin/cockpit`. This consolidates two entry URLs, but old/stale deployments or other watchtower sections may still explain owner-visible discrepancies.
- `src/app/admin/cockpit/page.tsx` uses current admin session checks and renders scout/candidate controls.
- `src/app/api/products/route.ts` POST invokes `requireCurrentRecoveryAdmin`. Product input schema validation and complete publication controls still need review.
- `src/app/api/reviews/route.ts` has throttle, submission policy, moderation, and an order/email paid-purchase check when purchase proof provided. Unverified reviews exist as a distinct state; test public display rules.
- `src/app/api/checkout/route.ts` reconstructs line-item prices from active catalog rows; blocks live Stripe secret in nonproduction. Webhook, fulfillment and idempotence require verification.
- `package.json` exposes focused tests: watchtower, voice, acre-era, authorized-commerce, era-engine, intent-routes, archive-alert, signals, intelligence-delivery. These tests were not executed in this audit.

## Acceptance gates / next evidence receipts
1. Compare Vercel domain source deployment SHA with latest preview SHA; capture exact route/UI for each.
2. Run all eight relevant test scripts plus build/typecheck in isolated checkout without publishing or spending; save stdout, exit code, SHA and timestamp.
3. Test `/watchtower`, `/admin` and `/admin/cockpit` on owner-accessible preview; verify same cockpit and backend table state; no accidental dual databases.
4. Run read-only product flow: scout discovery → exact CJ variant → cost+freight+stock → eligibility; hold if evidence missing.
5. Review photo rights chain (original supplier asset, license/permission, canonical SKU, attribution and sync rules) before any imported images.
6. Review customer reviews as verified/unverified/externally sourced; never synthesize testimonials or scrape republished content without rights.
7. Verify draft/approval/publish lifecycle and receipts for both products and featured farms; no direct live publish in test.
8. Read-only smoke checks for homepage, mobile, search, catalog, cart, image load, applications, admin and suppliers; checkout/webhook only in sandbox with explicit guardrails.

## Standard test receipt fields
`receipt_id,environment,deployment_id,commit_sha,route,operation,run_at_utc,expected,observed,status(PASS|FAIL|BLOCKED|NOT_RUN),evidence_refs,redacted_input_hash,remediation,reviewed_by`.

## Boundaries
No live orders, real charges, supplier activation, content publication, production merge or destructive database operations. A Vercel READY status is a successful deployment state, not functional proof. No claim of complete verification until receipts exist.
