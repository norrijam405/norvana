# Acre Era — Operational Roadmap (2026-10-21)

**Source of truth:** Work is on draft PR #23, branch `feature/2026-10-13-acre-era-universal-vendor-qualification-r0`. Norvana remains the repository codename. This document is a committed plan, NOT evidence of deployment, complete integrations, sales, or supplier agreements. Do not merge or modify Production without explicit founder approval.

## Product differentiation / unique identity
- **One curated storefront, multiple "Eras":** Goods (small, genuinely purchasable curated catalog), Finds (clearly marked affiliate links), Market Era (local farms, makers, butchers with geography/availability and pickup constraints), Past Era (historical/discontinued products and provenance, explicitly not presented as purchasable).
- **Producer story cards:** opt-in vendor-approved origin stories, real photography/video with usage rights, seasonal harvest notes, maker biographies and geographical sourcing; no invented endorsements.
- **Local-first "what can reach me" discovery:** location/ZIP eligibility, time windows, market-day pickup, local delivery and normal parcels presented as distinct routes. Do not promise cold chain or permit cross-jurisdiction food sales unless verified.
- **Curated trust passport per listing:** proof of supplier identity, photo rights, verified availability, unit economics, fulfillment owner, shipping radius, restrictions, and last verified date. Unverified goods remain draft.
- **Human-first Watchtower:** convenient CRM and fulfillment links, clear missing-evidence statuses, approval-gated consequences, low-cost tooling, and Darwin recommendations only; no fabricated success.
- **Community & Loyalty:** repeat-buyer recognition, opt-in communication, low-cost coupon rewards, future birthday/referral perks, separate transactional vs marketing consent; do not promise cashback liabilities.

## Delivery priorities and acceptance gates

### P0 — Launch prerequisites (do these before any commercial release)
1. **Qualify first ten real offers:** target 5 directly sourced Goods + 5 genuine affiliate Finds, with lawful permission, supplier availability, image rights, price, cost/margin, shipping/pickup and exclusions. Current generic listing/zero-price placeholders are NOT qualified.
2. **Checkout / Stripe test mode:** inspect checkout and webhook idempotency, retries, order database state, canceled/failed payment paths; run reproducible end-to-end Stripe test purchase; preserve receipt with commit SHA and Preview deployment identifier. NEVER use live charges for testing.
3. **Watchtower orders:** order search and detail drilldown; status events, fulfillment owner, supplier handoff and shipping exceptions; alert if DB is unavailable (failure must not look like zero orders). Customer order canonical database remains source of truth; HubSpot is not order ledger.
4. **Support + basic policies:** refund/return, shipping, privacy, terms, vendor payout responsibilities, contact@acreera.com and support@acreera.com routing validated; customer notifications only with verified domain and sender.
5. **Production readiness gate:** Preview auth, security, secrets separation, pricing/stock behavior, mobile checkout, accessibility, policies and rollback. No merge/deployment without separate founder authorization.

### P1 — Producer and relationship growth
6. **HubSpot ↔ Watchtower read-only adapter:** OAuth installed for this app (ChatGPT connector does NOT grant website access), minimum CRM scopes, server-only encrypted secrets, explicit tenant binding, rotation/revoke, reconciliation/idempotent sync; shadow-mode first. Support companies, contacts, tasks and CRM links. No automatic external messages.
7. **Partnership pipeline:** Identified → Verified → Contact Drafted → Contacted (only after verified send) → Replied → Qualified → Pilot Approved → Active → Paused; record evidence/owner/next follow-up date and explicit approval. Distinguish HubSpot prospect from approved seller.
8. **Outreach Studio:** six interactive templates (farm, butcher, specialty, maker, hub, follow-up); personalize, edit, copy to business email, no auto-send. Later approved sender verification, consent, message logs, opt-out/suppression.
9. **Market Era partner-to-product linking:** attach external HubSpot company ID to a supplier record; qualification gates, product photos/usage rights, real inventory, local pickup/radius, routing, substitutions and delivery exceptions. Meat requires legal inspection/handling/cold-chain validation.
10. **Customer CRM + Community & Loyalty:** use HubSpot to track identities/engagement with explicit consent; ecommerce DB retains orders and discount eligibility. Start with no-fee discount codes/minimum basket/margin protection; never assume SMS or HubSpot marketing automation is free. Refunds must reverse earned eligibility as appropriate; prevent coupon stacking/abuse.

### P2 — Experiences that make Acre Era distinctive
11. **Digital farm stand / seasonal drops:** transparent weekly crop availability, preorders ONLY where fulfillment and payment terms supported, producer-approved showcases, limited-capacity drops.
12. **Local discovery by neighborhood:** locally relevant partnerships, delivery/pickup filters, no fake proximity/location assumptions.
13. **Tasteful loyalty wallet:** history of eligible purchases, coupon availability, expiry and plain language restrictions; referral attribution after fraud screening.
14. **Producer dashboard:** seller-owned catalog/stock updates and permissioned account access; not a promise of automatic sync from POS systems.
15. **Past Era collector/archive story:** archival images and product history clearly marked not currently for sale, or links to legitimate resale only when verified.
16. **Darwin opportunity/exception scouting:** evidence-based alerts for stock, order failures, pricing changes, partner follow-ups, new products. Bounded, human approval for consequential actions and cost caps.

## First operational marketplace target
- 10 real launch offers; 2+ independently verified partner candidates; one reproducible test checkout; one verified failed-payment replay; a complete order-to-fulfillment walkthrough; founder-approved policies; zero unapproved paid infrastructure.
- Do not equate code committed, Preview deployed, tests passing, and Production release; record each independently.

## Financial and safety constraints
- Spend as close to $0 as practical; no new paid tiers, paid APIs, unexpected outreach charges or live payments without founder permission.
- Only send outside business communications with explicit send authorization and verified `contact@acreera.com` sender identity; do not use unrelated Gmail accounts.
- No speculative customer records, fabricated reviews/sales, unsupported vendor guarantees, or promotional SMS without consent.
- Preserve current PR as draft; independent tests and clear evidence receipts before merge.

## Links
- [Start here](../ACRE_ERA_START_HERE.md)
- [Live roadmap successor handoff](ACRE_ERA_SUCCESSOR_HANDOFF_2026-10-21.md)
- [Draft PR #23](https://github.com/norrijam405/norvana/pull/23)

## Geographic growth activation (2026-10-21)
- [Oklahoma border-state partner expansion plan](ACRE_ERA_BORDER_STATE_PARTNER_EXPANSION_R0_2026-10-21.md): Texas, Arkansas, Kansas, Missouri, Colorado, New Mexico; research lead sources, scalable outreach, safe phased national rollout. No outreach sent and no companies auto-added to CRM.

## Producer intake and media operator upgrade (2026-10-21)
- Public questionnaire at `/become-a-partner` collects business identity, region, product types, seasonality, fulfillment, and permission interest; submits to the existing rate-limited `/api/producer-interest` and stores review-only submissions. **NOT LIVE** until `PRODUCER_INTEREST_INTAKE_ENABLED=true`, abuse quota and Preview database readiness are verified. Do not share the URL with prospects until a test submission and operator review path both pass.
- Protected Watchtower `/admin/producers` links the questionnaire and includes a browser-local video link/rights planner. **This is not an upload/storage/publishing feature**; next iteration needs server-side signed upload, owned storage, type/size scanning, usage rights, thumbnail/preview and approval gates, with explicit cost validation.
- Successor: inspect actual code commits and run Preview build + server intake and operator review E2E before launch; privacy notice, anti-spam controls and contact routing need verification.
