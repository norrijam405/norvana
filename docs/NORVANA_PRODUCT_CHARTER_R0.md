# Norvana Product Charter R0

**Status:** modernization candidate  
**Product authority:** Norvana remains the canonical owner of Norvana business state.  
**Federation principle:** shared IgniAqua service does not imply shared authority.

## North star

Norvana is a curated commerce platform built around discovery rather than an infinite catalog.

The original founder promise remains active:

> The primary discovery storefront rotates into a new niche approximately every two weeks.

Rotation is a product policy, not a database assumption. It may later become evidence-driven, but historical quarterly demo dates must not silently redefine the founder intent.

## Three customer lanes

### 1. Norvana Drops

Time-boxed curated collections.

- Default starting cadence: approximately 14 days.
- Small, intentional assortment.
- Strong editorial identity.
- Retired drops remain browsable in the Archive.
- Scout may recommend candidates; Scout may not publish autonomously.
- Supplier availability, landed cost, quality evidence and margin must be explicit.

### 2. Norvana Local

Persistent local-food and local-maker marketplace.

Local inventory follows real availability and seasonality rather than the Drops rotation.

Initial product model should be capable of recording:

- producer/farm identity;
- source/location;
- product and variant;
- harvest/pack date when relevant;
- lot/batch when relevant;
- available quantity;
- availability window;
- pickup/delivery method and service radius;
- certifications/claims with evidence;
- allergen and handling information when relevant;
- provenance/source;
- last verification timestamp.

Local does not auto-onboard a farm because it appears in a directory. Discovery, qualification, commercial agreement and publication are separate states.

### 3. Norvana World

Future global discovery lane.

Start with ordinary merchandise and lower-complexity shelf-stable goods. International perishables and regulated food flows require separate legal, customs, food-safety, traceability and supplier-qualification work before activation.

## Closest-to-$0 Finance doctrine

Norvana should help eligible customers minimize the real cost of financing rather than maximize financed volume.

"Closest to $0" means:

**minimize verified customer financing cost subject to the customer's chosen constraints.**

The comparison objective should consider at least:

- cash price;
- financed principal;
- APR;
- origination and platform fees;
- down payment;
- term;
- promotional expiration;
- late-fee structure;
- prepayment rules;
- merchant-funded discounts;
- total of payments;
- total financing cost;
- effect of choosing a cheaper payment path when one exists.

The customer-facing system must not imply that financing is free unless the verified terms actually produce $0 financing cost.

Norvana should display the cheapest verified path first by **total customer cost**, not by lowest monthly payment.

A lower monthly payment can cost more overall. The UI must show that tradeoff plainly.

### Essential-goods guardrail

Norvana Local groceries and other essential consumables should not default to encouraging debt. When financing is technically available, Norvana should first surface lower-cost non-credit payment paths and should not use manipulative urgency to push financing.

### Provider neutrality

No financing provider is preferred merely because it pays Norvana more.

Future finance-provider adapters must expose normalized terms so the comparison layer can evaluate customer cost independently of provider branding.

A provider candidate is not eligible for customer presentation until its fee/APR/term data has been verified and its commercial incentives are disclosed internally.

### Future Finance Passport

A normalized offer should eventually include:

- provider and product identifier;
- eligibility scope;
- purchase amount;
- APR / promotional APR;
- term;
- down payment;
- all known borrower fees;
- all known merchant fees;
- monthly payment;
- total of payments;
- total financing cost;
- prepayment rule;
- late-fee rule;
- expiration;
- evidence source and fetched-at time;
- uncertainty / assumptions;
- customer-cost rank computed from verified terms.

IgniAqua may research, normalize and verify financing evidence. Norvana retains the decision about which offers appear to customers.

## IgniAqua service boundary

Norvana may consume bounded IgniAqua services for:

- Scout research and evidence;
- supplier/connector qualification;
- Workforce/Green Room qualification;
- model routing;
- action receipts and provenance;
- continuity and recovery;
- Roadmap/Boardroom coordination;
- Darwin experiments and recommendations;
- finance-offer normalization and verification.

IgniAqua does not automatically gain authority over:

- product publication;
- price changes;
- customer records;
- orders;
- payments/refunds;
- financing enrollment;
- supplier orders;
- inventory truth;
- farmer onboarding;
- customer communications;
- deployment or DNS.

## Truth-state vocabulary

Use explicit states instead of overloaded booleans.

Examples:

- DISCOVERED
- EVIDENCE_COLLECTED
- QUALIFIED
- APPROVED
- PUBLISHED
- AVAILABLE
- OUT_OF_STOCK
- RETIRED
- REVOKED
- UNKNOWN

For finance:

- OFFER_OBSERVED
- TERMS_PARSED
- TERMS_VERIFIED
- ELIGIBILITY_UNKNOWN
- CUSTOMER_ELIGIBLE
- CUSTOMER_NOT_ELIGIBLE
- EXPIRED
- WITHDRAWN

For suppliers/farms:

- DISCOVERED
- CONTACTED
- DOCUMENTS_PENDING
- QUALIFIED
- COMMERCIAL_APPROVED
- CONNECTOR_QUALIFIED
- ACTIVE
- SUSPENDED

## Non-goals for R0

R0 does not authorize:

- live supplier ordering;
- autonomous product publication;
- live financing applications;
- use of recovered historical credentials;
- unrestricted debugger/self-modification;
- representing simulated Scout data as current market intelligence.
