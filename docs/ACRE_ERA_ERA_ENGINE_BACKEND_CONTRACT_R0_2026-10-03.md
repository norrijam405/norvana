# Acre Era Era Engine — Backend Contract R0

**Date:** 2026-10-03  
**Status:** implementation contract  
**Goal:** allow Acre Era to create many distinct customer worlds without cloning storefront code

**Build doctrine:** skeleton first, skin second. The backend contract must exist before page-specific visual work.

## 1. Core entity: Era

An Era is a versioned, bounded curation context.

Required fields:

- slug
- name
- eyebrow
- description/story
- kind
- lifecycle state
- visibility
- start/end time
- theme tokens
- hero asset binding
- ordered page sections
- Watchtower profile
- archive policy
- created/updated timestamps

Kinds should support:

- CATEGORY
- BRAND
- SEASONAL
- PARTNER
- MARKET
- LOCAL
- EDITORIAL
- CAMPAIGN

Lifecycle:

- DRAFT
- QUALIFYING
- SCHEDULED
- ACTIVE
- CLOSED
- ARCHIVED
- SUSPENDED

Only one Era may be configured as the primary home hero at a time.

## 2. Era media assets

Media is a governed resource, not a string pasted into a page.

Required metadata:

- type: HERO_VIDEO, HERO_IMAGE, POSTER, CARD_IMAGE, EDITORIAL_VIDEO
- URL/storage reference
- rights state
- rights evidence reference
- source/owner
- associated brand/provider where relevant
- start/end rights window
- status
- checksum/digest where available
- accessibility alt/description
- poster/fallback for video
- created/updated timestamps

Rights states:

- OWNED
- LICENSED_STOCK
- BRAND_AUTHORIZED
- AFFILIATE_FEED_AUTHORIZED
- SUPPLIER_AUTHORIZED
- PENDING_VERIFICATION
- RESTRICTED
- EXPIRED
- REVOKED

Public resolver fails closed for PENDING/RESTRICTED/EXPIRED/REVOKED assets.

A Nike, Gucci, Apple, or other brand-owned campaign/runway/ad video must not be inferred as usable merely because it is publicly viewable.

## 3. Era product membership

A product can belong to multiple Eras.

Membership must preserve:

- era
- product
- position
- role: HERO, FEATURED, STANDARD, BUNDLE, WATCH
- curation reason
- evidence reference
- status
- assigned/removed timestamps

Membership does not change product source truth.

An affiliate product remains affiliate-referral inside every Era.

## 4. Era sections

Do not hardcode page layout into the database as arbitrary HTML.

Persist an ordered, typed section plan.

Supported initial section types:

- HERO
- WHY_THIS_ERA
- PRODUCT_GRID
- PARTNER_FINDS
- MARKET_TEASER
- CUSTOMER_VOICE
- BRING_IT_HERE
- WATCHTOWER_SUMMARY
- COMPARISON
- BUNDLE
- EDITORIAL
- ARCHIVE_TEASER
- ALERT_CTA

Each section may carry bounded JSON config validated by application code.

Unknown section types fail closed.

## 5. Theme tokens

Theme config is data, not unrestricted CSS.

Initial tokens:

- accent
- accentSoft
- surface
- surfaceAlt
- text
- textMuted
- heroOverlay
- motionProfile

Applications must map tokens to approved classes/variables rather than accepting arbitrary CSS/JS.

## 6. Watchtower binding

Each Era may bind a Watchtower profile specifying what intelligence matters most.

Examples:

Electronics:
- price history
- competitor range
- stock
- warranty
- recall/safety
- authorization
- contribution

Luxury:
- provenance
- authentication
- image rights
- fraud/return reserve
- seller/source

Market:
- producer
- seasonality
- availability
- service area
- customer demand

Watchtower binding is read/recommend metadata. It does not grant ACT authority.

## 7. Public Era resolver

Planned public read contract:

`GET /api/eras/[slug]`

Returns only:

- public-safe Era metadata
- approved media
- approved/public products
- public-safe Passport fields
- section plan
- archive relationship

Must not return:

- supplier credentials
- wholesale cost
- private margin
- internal fraud scores
- confidential partner contracts
- private Watchtower evidence
- admin-only notes

## 8. Home Era resolver

Planned:

`GET /api/eras/current`

Resolves exactly one active primary Era.

Ambiguous multiple-primary state must fail closed rather than silently picking one.

## 9. Archive snapshot rule

Closing an Era should produce an immutable or append-only snapshot reference so historical curation is not silently changed by later product/provider edits.

R0 may begin with durable membership + timestamps; later versions should add explicit archive snapshots.

## 10. Performance

Hero video must not block page usability.

Requirements:

- poster fallback
- lazy/load strategy appropriate to viewport
- mobile-friendly media variants later
- reduced-motion fallback
- no autoplay audio
- accessibility text
- media rights check before rendering

## 11. Authority

Era Engine may:

- resolve
- render
- recommend
- preserve curation configuration

Era Engine may not by itself:

- enroll affiliate programs
- claim brand rights
- buy inventory
- contact brands
- publish unqualified products
- create supplier orders
- change prices
- activate fulfillment
- spend money

## 12. R0 implementation sequence

1. durable schema
2. media-rights policy
3. Era validation policy
4. public-safe resolver
5. current-Era invariant
6. tests
7. admin CRUD later
8. visual composition later

## 13. Compatibility

Existing hardcoded Market and Partner pages remain valid specialized experiences while the Era Engine is introduced.

The engine should eventually let those pages consume shared Era configuration without forcing a risky rewrite in the same change.
