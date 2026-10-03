# Acre Era North Star — Site Map & Page Blueprint

**Date:** 2026-10-03  
**Status:** founder-approved product north star / durable UX blueprint  
**Scope:** customer-facing Acre Era system  
**Implementation principle:** skeleton first, skin second

## 1. Product thesis

Acre Era is a curated buying network with a storefront.

The differentiation is not maximum SKU count. Acre Era should help customers decide **what is worth buying, why it is here, who is responsible for fulfillment/checkout, what evidence supports the product, and whether a better route exists**.

Each major category, brand program, season, or curation can become an **Era**.

An Era is a bounded customer world with:

- its own hero media;
- editorial story;
- accent/mood tokens;
- curation;
- product ordering;
- Watchtower data emphasis;
- archive identity;
- customer demand/alert hooks.

An Era must still inherit the Acre Era trust system.

## 2. Global site map

### Primary

- `/` — Home / Current Era
- `/era/[slug]` — generic Era experience
- `/market` — Market / farm + grocery
- `/shop` — Goods / all direct-purchase inventory
- `/partners` — Partner Market / affiliate + referral curation
- `/partners/archive` — Partner Era archive
- `/archive` — all Acre Era historical collections
- `/shop/[slug]` — product detail + Passport

### Planned first-class Era destinations

These may resolve through `/era/[slug]` rather than each having custom hardcoded pages:

- Electronics
- Fashion
- Luxury
- Sports / performance
- Home
- Wellness
- seasonal / holiday
- college / dorm
- creator / gaming
- local seasonal market

### Customer utility surfaces

Planned:

- `/watchlist` — saved products, brands, price/stock alerts
- `/requests` — Bring It Here demand board
- `/compare` — product/source comparison
- `/account` — customer profile, preferences, orders, alerts
- `/orders` — Acre Era checkout orders only
- partner referral history should not be represented as Acre Era orders

## 3. Global visual system

Acre Era should feel like one brand with multiple worlds.

Persistent spine:

- Acre Era logo/shell
- typography system
- navigation behavior
- Passport grammar
- source/checkout badges
- Customer Voice
- archive grammar
- accessibility behavior
- reduced-motion behavior

Per-Era variation:

- hero video or motion asset
- poster/fallback
- accent colors
- background texture/motion
- hero headline
- editorial copy
- section order
- card emphasis
- data modules

Do not create unrelated mini-sites.

## 4. Home / Current Era

Purpose: introduce the currently active editorial world and show the breadth of Acre Era without dumping the whole catalog.

Recommended section order:

1. **Current Era cinematic hero**
   - approved hero video or animated fallback
   - Era name/story
   - “Enter the Era”
   - optional secondary route to Market / Partner Finds
2. **Why this Era exists**
   - demand signal
   - seasonal/contextual reason
   - Watchtower evidence summary
3. **Curated products**
   - limited set, not an endless grid
   - source model visible
4. **Partner Finds**
   - approved referral products
5. **Market / local teaser**
   - current season / farm story
6. **Electronics worth watching**
7. **Luxury / fashion editorial teaser**
8. **Bring It Here**
9. **Customer Voice**
10. **Archive**
11. **Alerts / watchlist prompt**

Hero content changes by active Era without changing global shell.

## 5. Generic Era page — `/era/[slug]`

Every Era resolves from backend data.

Required modules:

- hero media + poster fallback
- Era title, eyebrow, story
- lifecycle dates/status
- “why now” / curation thesis
- curated product grid
- Passport-ready product cards
- Watchtower “what we know” summary
- demand / Bring It Here
- Customer Voice where relevant
- archive link / prior related Eras
- alert/watchlist CTA

Optional modules:

- comparison table
- brand story
- buying guide
- short editorial video
- local map/producer module
- specification explainer
- authenticity/provenance explainer
- bundle/kit
- trend/history chart
- price-watch module

## 6. Era examples

### Electronics Era

Hero:
- licensed/owned clean technology motion
- product macro/details, desk setups, gaming/creator scenes

Core data:
- brand
- model
- GTIN/UPC
- MPN/SKU
- condition
- warranty
- authorized source
- stock
- landed economics
- shipping
- returns
- recalls/safety
- competitor price range
- price history

Customer tools:
- compare
- price watch
- back-in-stock
- “better source found”
- bundles

### Fashion / Sports Era

Hero:
- licensed/owned lifestyle/performance media
- actual brand campaign/runway/sports assets only where program rights allow

Core data:
- brand relationship
- collection/season
- sizes/colors
- stock by variant
- returns
- authorized imagery
- wholesale/direct/referral source
- contribution economics

Customer tools:
- size/variant alerts
- drop reminders
- curated looks/bundles

### Luxury Era

Hero:
- restrained premium motion, not fake-brand cosplay

Core data:
- provenance
- seller/source
- invoice/reseller evidence
- authentication result/provider
- condition
- identifiers
- packaging
- warranty
- return/fraud exposure
- image/logo rights

Customer-facing emphasis:
- proof before placement
- exact condition
- exact responsibility for checkout/returns
- no vague “authentic” badge without evidence

### Market / Farm Era

Hero:
- real partner-farm footage when available
- licensed agriculture footage only when not presented as a specific partner

Core data:
- producer
- service area
- season
- harvest/pack details where applicable
- pickup/delivery
- availability
- handling/allergens
- evidence-backed claims

Customer tools:
- seasonal alerts
- producer follow
- “bring this farm here”
- baskets/bundles

### Partner Era

Hero:
- editorial category/brand-adjacent motion only with rights
- not a wall of affiliate links

Core:
- partner relationship
- commission/referral truth
- approved media rights
- checkout destination
- observed price/time
- return/warranty responsibility

Checkout:
- transparent handoff
- no Acre Era cart representation

## 7. Product page / Acre Era Passport 2.0

Every product page should answer:

1. **What is it?**
2. **Why is it here?**
3. **Who is the source?**
4. **Who owns checkout?**
5. **Who fulfills it?**
6. **What do customers say?**
7. **What is still unknown?**
8. **What happens if something goes wrong?**
9. **Is the price/availability current?**
10. **Can Acre Era alert me to a better opportunity?**

Passport dimensions:

- source model
- authorization state
- image-rights state
- condition
- provenance/authenticity
- product rating
- fulfillment rating
- purchase-experience rating
- warranty
- returns
- last observed price/stock
- recall/safety state
- evidence freshness

Do not collapse all trust into one badge.

## 8. Partner Market

`/partners`

Partner products should feel curated inside Acre Era, not like advertisements pasted onto the page.

Features:

- current Partner Era
- editorial hero
- curated product list
- transparent partner checkout labels
- commission disclosure
- approved imagery only
- Passport
- category/brand filtering
- saved/watch alerts
- Partner Archive

`/partners/archive` preserves closed Partner Eras.

## 9. Archive

Archive is a strategic feature, not a dead-products page.

Archive should preserve:

- Era title
- dates
- hero/poster rights-safe historical asset
- curation story
- product membership as-of that Era
- historical source/relationship status
- what changed
- customer response/demand summary
- links to current replacements where appropriate

Never rewrite history to make an old Era appear to have had a later authorization or supplier relationship.

## 10. Bring It Here / Demand Board

Current request capture should evolve into public lifecycle states:

- REQUESTED
- GAINING_SUPPORT
- RESEARCHING
- SOURCE_FOUND
- QUALIFYING
- APPROVED
- ENTERING_ERA
- DECLINED
- ON_HOLD
- RETIRED

Customers should be able to request:

- product
- brand
- farm/grower
- maker
- category
- feature/kit

Repeated requests become demand evidence, not automatic publication authority.

## 11. Customer alerts / Watchtower-to-customer

Planned alert types:

- price below threshold
- back in stock
- brand added
- Era opens
- local seasonal availability
- better verified source found
- request status changed
- product qualification completed
- partner relationship/checkout changed materially

Customer alerts must not reveal internal confidential supplier data.

## 12. Comparison / Best Route

Acre Era may compare multiple legitimate ways to obtain a product.

Possible routes:

- Acre Era direct
- authorized distributor
- brand direct
- affiliate/referral
- local partner
- authenticated resale

The customer recommendation must not secretly optimize only for Acre Era commission.

Show relevant differences:

- total customer price
- delivery estimate
- warranty
- returns
- condition
- source/authentication
- checkout owner

Internal contribution economics may influence whether Acre Era carries a route, but customer-facing “best” logic must remain transparent and customer-relevant.

## 13. Bundles / kits

Potential high-value curated bundles:

- College Setup
- Creator Desk
- Gaming Setup
- New Apartment
- First Garden
- Local Breakfast
- Travel Kit
- Fitness Starter
- Home Office

A bundle may include multiple commerce models, but checkout/fulfillment must remain explicit.

## 14. Watchtower customer-growth role

Watchtower should increasingly answer:

- what customers are asking for
- what is trending
- where price is moving
- which sources are legitimate
- which route has acceptable customer economics
- which products have recall/authenticity/warranty risk
- what is out of stock
- what has improving or degrading Customer Voice
- which Era theme has enough evidence to justify a drop

Watchtower remains behind the scenes; expose useful evidence, not internal governance jargon.

## 15. What Acre Era should not become

- an infinite supplier catalog
- a coupon/affiliate-link farm
- a fake luxury outlet
- a generic AI-generated storefront
- a brand-campaign scraper
- a financing-first essential-goods store
- a site where visual novelty hides weak fulfillment
- a collection of unrelated microsites

## 16. Success metrics to eventually instrument

Customer:
- return visitor rate
- Era revisit rate
- alert/watchlist conversion
- Bring It Here participation
- product-page-to-checkout/referral conversion
- verified review participation
- repeat purchase

Merchandising:
- contribution per visitor
- contribution per product slot
- Era sell-through
- product qualification acceptance rate
- return rate
- warranty/fraud loss
- affiliate EPC/commission quality
- local fulfillment reliability

Trust:
- source evidence freshness
- image-rights coverage
- authorization coverage
- Passport completeness
- unresolved recall/authenticity conflicts

## 17. Current implementation rule

Do not hardcode a new page for every niche unless the experience genuinely requires custom functionality.

Default path:

**create Era data -> assign approved assets -> assign curated products -> bind Watchtower profile -> render through Era Engine.**
