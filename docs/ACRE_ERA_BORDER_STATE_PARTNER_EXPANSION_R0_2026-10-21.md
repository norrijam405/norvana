# Acre Era — Border-State Partner Expansion R0 (2026-10-21)

## Scope and operating decision
Research and qualification now; national selling/fulfillment only after verified routes, agreements, product rights, and food regulations. Oklahoma borders **Texas, Arkansas, Kansas, Missouri, Colorado and New Mexico** (US Census). Prioritize nearby trade corridors over attempting nationwide chilled delivery on day one.

All organizations below are research leads / directory sources only. They are **not** confirmed Acre Era partners, have not been contacted, and must not be marked Active. No emails, SMS, CRM creates or production changes authorized by this planning document.

## Expansion sequence
- **Wave A — Oklahoma + Texas:** strengthen existing qualified local supply and pickup/delivery routes; prioritize Oklahoma City–Dallas/Fort Worth border corridor.
- **Wave B — Arkansas + Kansas + southwest Missouri:** focus Northwest Arkansas (Springdale/Fayetteville/Bentonville), Wichita, Kansas City and southwest Missouri, targeting regional aggregation partners to minimize individual onboarding friction.
- **Wave C — New Mexico + Colorado:** expand through food hubs and packaged shelf-stable local specialties first; chilled perishables are geography-restricted.
- **Wave D — nationwide:** repeat the regional supplier/passport/fulfillment model only after controlled pilots pass.

## Research starting points (not CRM contacts or verified suppliers)
- USDA Local Food Directory: https://www.ams.usda.gov/services/local-regional/food-directories-listings — national, free research gateway to food hubs, CSAs and farmers markets.
- Kansas State University local-food lists: https://extension.k-state.edu/kansaslocalfoods/resources/find-local-food/source-local-food/directories.html — From the Land of Kansas, ICT Food Circle, Shop Kansas Farms.
- Kansas City Food Hub: https://thekcfoodhub.com/farmers/ — describes itself as a cooperative wholesaler / retailer of local produce, dairy, eggs and meat from 20+ farms in the region.
- Arkansas resources: https://www.arkansaslandcan.org/state-resources/Food-Hubs-and-Farmers-Markets/102 — directory; individually verify each current listing before CRM import.
- New Mexico Harvest Food Hub: https://sjccatalog.sanjuancollege.edu/community/harvest-food-hub/ — Farmington-based grower and food hub program; confirm current activity and partnership eligibility.
- Missouri Extension market channels: https://extension.missouri.edu/publications/g6221 — guidance on coops, hubs, wholesalers and direct channels.
- Colorado: use USDA directory and state-local verified sources; no particular operator is qualified by this document.

## CRM fields and deduplication
For each verified prospect: organization legal/trading name, company domain, state/city, type (farm / ranch / butcher / producer / maker / food hub / distributor), sourced URL, public business contact, date verified, applicable fulfillment radius, shipping type and regulation flags, next task, owner, verified outreach consent/opt-out, current relationship stage and external HubSpot ID. Search exact name, domain and existing alias spelling before create. NO bulk import from directory snippets and NO invented contact emails.

Stages: IDENTIFIED → SOURCED → VERIFIED → DRAFTED → CONTACTED (only if sent) → REPLIED → QUALIFIED → PILOT_APPROVED → ACTIVE; PAUSED/REJECTED as alternatives. No automatic stage skipping.

## Reusable outreach messages
Watchtower component: `src/components/admin/producer-outreach-templates.tsx` offers six draft-only formats (farms, butchers/ranchers, specialty foods, makers, food hubs/wholesalers, follow-up). Now provides state/region choice for Oklahoma and all six bordering states; user personalizes and reviews before copying to Zoho Mail. No sending or HubSpot syncing is implemented.

**Core introduction — adaptable to any producer:**

Subject: Acre Era × [Business] — a possible local partnership

Hello [Contact],

I'm reaching out from Acre Era, a developing curated marketplace exploring relationships with independent [category] businesses in [State/Region]. We're starting with a small number of carefully qualified partners, not promising immediate sales.

I'd love to learn about [Business]'s product availability, wholesale or retail terms, photography/usage permissions, and realistic pickup, delivery or shipping options.

Would you be open to a brief introductory conversation? We're happy to start small and only proceed if the arrangement is practical for both sides.

Best regards,
Acre Era Partnerships
contact@acreera.com

**Follow-up:** only after the first verified email has actually been sent; no more than modest, relevant outreach cadence, honoring opt-outs and applicable marketing laws.

## Supplier readiness gates
- Products currently on offer with grounded inventory, price, real images/rights, margin and destination eligibility.
- Food processing/inspection, perishability, cold chain, labeling and cross-state transport compliance as appropriate; never assume local approvals cover nationwide shipments.
- Shipping/routing and delivery issue ownership; returns/refunds and clear written responsibilities.
- Partner explicitly accepts terms and approved pilot before publishing their products.
- Marketing email and SMS require valid permissions and suppression; no automated messages now.

## Success criteria for region one
3-5 high-quality qualified supplier conversations, 2 written pilot approvals, 5 real direct-sourced products, tested local shipping/pickup routes and documented margins—not 100 unverified prospect names.

## Change-control
Keep in draft PR #23 on feature/2026-10-13-acre-era-universal-vendor-qualification-r0. Preserve free/low-cost approach, do not send outside mail without approval, no Production changes. Record verified sources and links in CRM only as reviewable prospect notes.

## Sources
- US Census bordering states: https://www.census.gov/geographies/reference-files/2010/geo/state-local-geo-guides-2010/oklahoma.html
- USDA directories: https://www.ams.usda.gov/services/local-regional/food-directories-listings
