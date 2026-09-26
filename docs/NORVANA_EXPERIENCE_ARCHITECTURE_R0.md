# Norvana Experience Architecture R0

**Status:** product/UX implementation contract  
**Reference:** current public Norvana storefront observed 2026-09-26 plus recovered Norvana lineage  
**Authority:** complements `NORVANA_PRODUCT_CHARTER_R0.md`; does not authorize live external actions

## Preserve the current visual DNA

Keep the current storefront's strongest traits:

- warm off-white storefront shell;
- obsidian/dark editorial hero;
- indigo as the primary action color;
- restrained typography and motion;
- product-first cards;
- simple header;
- Archive as a first-class concept.

Do not turn Norvana into a visually fragmented marketplace where Local, Drops and World look like unrelated companies.

## Customer information architecture

### Desktop primary navigation

`Discover | Local | Shop | Archive`

- **Discover** is the home page and current rotating Drop.
- **Local** is persistent seasonal local-farm/local-maker commerce.
- **Shop** searches/browses all currently purchasable inventory and can filter by lane.
- **Archive** contains retired Drops and editorial history.
- **World** remains feature-gated until operational and regulatory readiness is proven.

On small screens, use a compact menu plus cart. Avoid adding a permanent long row of category chips to the global header.

## Home / Discover

The existing hero remains the visual anchor.

Recommended structure:

1. Active Drop hero
   - drop title/theme;
   - concise editorial story;
   - verified end date;
   - CTA: `Explore the Drop`;
   - secondary CTA: `Shop Local`.

2. Featured products
   - real photography required before production merchandising;
   - 4–8 curated products, not an endless grid;
   - cards show price, verified availability state and fulfillment type;
   - do not show financing on every card.

3. "Fresh Near You"
   - opt-in ZIP/postal-code entry rather than mandatory precise location;
   - seasonal Local products;
   - producer/farm identity;
   - pickup/delivery badge;
   - last verified availability.

4. "Why Norvana"
   - curated, evidence-backed sourcing;
   - transparent fulfillment;
   - verified reviews;
   - lowest-real-cost payment comparison where eligible.

5. Archive teaser
   - preserve the current dark Archive treatment;
   - show prior Drop covers as editorial objects.

Remove or suppress unverified vanity claims such as customer counts, maker counts or countries shipped until backed by real business data.

## Shop

The current tag-chip wall should evolve into a controlled discovery system.

Use:

- search field;
- sort control;
- filter button/drawer;
- lane filter: `All | Drops | Local` (World later);
- category;
- price;
- availability;
- fulfillment;
- pickup/delivery;
- producer/brand;
- dietary/handling attributes when relevant to food.

Tags remain useful internally and for secondary facets, but should not dominate the page.

## Product cards

Production card contract:

- real image;
- product name;
- price;
- source badge (`Drop`, `Local`, future `World`);
- availability state;
- fulfillment summary;
- verified-review signal only when review provenance exists;
- optional `View details` / `Add to cart`.

Do not render simulated ratings or review counts as live social proof.

## Product detail page

Shared top section:

- image gallery;
- title;
- price;
- availability;
- quantity;
- add to cart;
- fulfillment estimate;
- returns/cancellation summary.

### Drops-specific evidence

- supplier/brand;
- material/specification;
- current Drop;
- limited-window status;
- source/verification freshness where useful.

### Local-specific evidence

- farm/producer;
- approximate source area;
- harvest/pack date when applicable;
- lot/batch when applicable;
- pickup/delivery window;
- service radius;
- allergens/handling;
- certifications/claims with evidence;
- last verified time.

Use customer-friendly labels. "Evidence Passport" can be an expandable transparency panel rather than accounting/governance jargon on the main page.

## Cart and checkout

One cart may contain products from multiple fulfillment classes.

The cart must group items before payment:

- `Ships to you`
- `Local delivery`
- `Pickup`

If fulfillment groups have different timing, fees or cancellation rules, show them before payment.

Server-side Norvana catalog data remains canonical for price, availability, shipping and eligible payment methods.

### Closest-to-$0 Finance placement

Do not place financing pressure on product cards.

At cart/checkout, for eligible non-essential purchases:

`Pay today: $X`

`Compare lower-cost payment options`

The comparison view should emphasize:

- total financing cost;
- APR;
- fees;
- total of payments;
- down payment;
- term;
- monthly payment;
- expiration/conditions.

Sort by verified total customer cost, not monthly-payment size.

For groceries and other essential consumables, default to ordinary payment and lower-cost non-credit paths. Credit/financing should not be promoted as the default way to buy food.

## Local marketplace flow

### Customer

1. enter ZIP/postal code or choose area;
2. see seasonal products and farms serving that area;
3. filter by pickup/delivery and category;
4. inspect producer + product evidence;
5. add to unified cart;
6. checkout with fulfillment groups clearly separated.

### Producer/farm

1. DISCOVERED
2. CONTACTED
3. DOCUMENTS_PENDING
4. QUALIFIED
5. COMMERCIAL_APPROVED
6. CONNECTOR_QUALIFIED or MANUAL_OPERATION_APPROVED
7. ACTIVE
8. SUSPENDED / RETIRED

Directory discovery never equals approved seller status.

## World lane

Keep hidden or "coming later" until qualified.

Initial World categories should favor:

- ordinary dropship merchandise;
- artisan goods;
- lower-complexity shelf-stable goods.

Cross-border regulated food and perishables require separate compliance, customs, food-safety, traceability and fulfillment qualification.

## IgniAqua fit

IgniAqua should mostly be invisible to retail customers.

### Behind the storefront

**Scout**
- trend/product research;
- local producer discovery;
- seasonality;
- competitor/pricing evidence;
- financing-offer research.

**Green Room / Workforce**
- qualify Norvana workers and service agents;
- supplier/farm onboarding workflow;
- customer-service worker qualification;
- finance-normalization worker qualification.

**Connector Passport**
- dropship APIs;
- farm portals;
- CSV/manual producer workflows;
- fulfillment;
- payment providers;
- finance providers.

**Darwin**
- propose experiments;
- compare Drop cadence;
- merchandising experiments;
- Local assortment experiments;
- never publish or spend by recommendation alone.

**Receipts / evidence**
- preserve why a product, supplier, farm, price, offer or action was approved.

### Authority boundary

IgniAqua can recommend, normalize, verify and execute only within explicit grants.

Norvana retains canonical authority for:

- catalog;
- customer;
- order;
- payment/refund;
- financing presentation/enrollment;
- supplier/farm activation;
- pricing;
- inventory;
- customer communications;
- deployment.

## Back office

Rebuild the old Engine Room as authenticated server-side operations rather than a browser password.

Recommended sections:

- Overview
- Drops
- Local
- Products
- Producers & Suppliers
- Orders & Fulfillment
- Customers
- Payments
- Finance Offers
- Scout
- Evidence / Receipts
- Settings

The old Debugger tab should not return as an unrestricted self-repair control. Diagnostics may exist, but repair actions require scoped authority and receipts.

## Highest-impact visual changes from the current site

1. Replace emoji placeholders with real product photography.
2. Replace the current tag wall with search/sort/filter controls.
3. Remove unverified demo social-proof metrics.
4. Keep Archive visually strong and editorial.
5. Add `Local` as a first-class navigation destination.
6. Keep the home page curated instead of turning it into a catalog dump.
7. Use one brand system across Drops and Local.
8. Make fulfillment type and availability obvious before checkout.
9. Move financing comparison to cart/checkout rather than product-grid pressure.
10. Keep IgniAqua intelligence backstage; expose evidence/trust, not internal machinery.

## Rollout sequence

### R0 — recover and secure
- harden current code;
- remove historical secrets;
- server-canonical checkout;
- rebuild admin identity;
- verified CI/build;
- replace simulated claims.

### R1 — storefront integrity
- production product imagery;
- search/filter redesign;
- verified reviews;
- explicit availability/fulfillment;
- configurable Drop cadence.

### R2 — Norvana Local pilot
- producer/farm data model;
- ZIP-area discovery;
- seasonal inventory;
- pickup/local delivery;
- Local Evidence Passport;
- small manually qualified producer cohort.

### R3 — IgniAqua read/recommend federation
- Scout candidate feed;
- evidence binding;
- connector qualification;
- human approval before Norvana mutation.

### R4 — finance comparison
- normalized provider adapters;
- verified terms;
- total-customer-cost calculation;
- eligibility/expiration truth states;
- checkout presentation with essential-goods guardrails.

### R5 — controlled execution
- qualified supplier/farm connectors;
- bounded fulfillment;
- readback/verification/receipts;
- rollback and incident controls.

### R6 — Norvana World
- qualified global suppliers;
- cross-border cost/fulfillment;
- category-specific regulatory gates;
- gradual geographic expansion.
