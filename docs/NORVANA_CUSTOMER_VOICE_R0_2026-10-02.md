# Norvana Customer Voice R0

Date: 2026-10-02

Branch: `feature/2026-10-02-norvana-customer-voice-r0`

Base: `recovery/2026-09-26-norvana-modernization-r0@dd49581340c4901fd309aa7746e856d505fd6114`

## Purpose

Customer Voice is Norvana's provider-neutral review and reaction layer. It is deliberately separate from the R2 Local Partner Network assurance lane.

The same canonical Norvana product can accumulate review provenance from Norvana purchases and, later, authorized external commerce channels without making the supplier or storefront the owner of review truth.

## R0 customer-facing behavior

- Customers can publish product reviews from the product page.
- Positive and negative reviews use the same publication path. Sentiment is not used to suppress or delay a review.
- A reviewer can identify as an individual or as a business / organization buyer.
- Product quality is rated separately from optional fulfillment/delivery and buying-experience ratings; only the product rating contributes to the product's aggregate stars.
- A Norvana order number plus purchase email can verify that:
  - the order exists;
  - the payment state is `paid`;
  - the email matches the order;
  - the order contains the reviewed product.
- The purchase email is used transiently for verification and is not copied onto the review record.
- Verified Norvana purchases may expose only privacy-safe buyer signals: a quantity band (`1 unit`, `2–9 units`, `10–49 units`, or `50+ units`) and whether the buyer has more than one paid Norvana order. Exact larger-order quantities and the email are not displayed on the review.
- A verified purchase receives `NORVANA_PURCHASE` provenance.
- An opinion without purchase proof remains clearly labeled as not purchase-verified.
- Review counts and aggregate rating include only `PUBLISHED` reviews.
- Product pages refresh review state about every four seconds while visible.
- Helpful / Not Helpful reactions update without a page reload.
- Review submission and reaction endpoints are rate-limited. Production requires `NORVANA_CUSTOMER_VOICE_RATE_SECRET`.

## Provenance and durable history

Review records preserve:

- canonical product id;
- buyer type;
- optional business name;
- optional fulfillment rating;
- optional buying-experience rating;
- optional verified purchase-quantity band;
- optional repeat-buyer signal;
- verification state;
- moderation state;
- source channel;
- source label;
- optional source order id;
- optional external source review id and source URL;
- helpful / not-helpful totals;
- created / updated timestamps.

`review_events` provides an append-only event trail for submissions, imports, and reactions.

## Authorized external reviews

`POST /api/reviews/import` is admin-gated and requires `rightsConfirmed=true`.

External review text must not be scraped and relabeled as Norvana content. Import requires an authorized API/feed/export or other documented display/syndication right.

An imported review can carry `EXTERNAL_PURCHASE` only when the source integration actually supplies purchase verification.

External reviews are deduplicated by source channel + source label + source review id.

## Abuse and moderation boundary

R0 structural validation rejects malformed submissions and public write endpoints have quotas.

R0 does not automatically score review sentiment and does not treat a low star rating as an abuse signal.

A future abuse-moderation lane may hold/remove content for neutral reasons such as spam, impersonation, threats, personal-information exposure, malware links, or other prohibited content. Those rules must be independent of whether the opinion is favorable or unfavorable.

## Database migration

Apply:

`drizzle/0007_customer_voice_r0.sql`

before enabling public review writes in a deployed environment.

## Deployment prerequisites

1. Apply the Customer Voice migration to the target database.
2. Set a strong `NORVANA_CUSTOMER_VOICE_RATE_SECRET`.
3. Preserve existing Stripe/order payment truth because Norvana purchase verification relies on `orders.payment_status='paid'`.
4. Run Customer Voice CI and require green tests, typecheck, lint, build, runtime dependency audit, and high-severity dependency gate.
5. Exercise one unverified review, one verified paid-order review, and one reaction in preview before production promotion.
6. Do not import third-party review text until the corresponding source-specific rights and identity mapping are documented.

## Explicit non-goals

Customer Voice R0 does not:

- claim an opinion is objectively honest;
- buy or incentivize a particular review sentiment;
- hide negative reviews because they are negative;
- create supplier ordering authority;
- change R2 partner-routing authority;
- scrape external marketplace reviews;
- expose buyer purchase emails on review records.
