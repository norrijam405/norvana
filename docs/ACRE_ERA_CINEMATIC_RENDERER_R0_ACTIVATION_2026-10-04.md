# Acre Era Cinematic Renderer R0 — Activation

**Date:** 2026-10-04  
**Repository:** `norrijam405/norvana`  
**Branch:** `feature/2026-10-04-acre-era-cinematic-renderer-r0`  
**Base / frozen backend candidate:** `bcd245f48b125a4f6f875edda15077dc699f80e0`  
**Base tree:** `05509a76a76975d57275a34c6554a9c948876c83`

## Mission

Begin the founder-approved **cinematic Era renderer / visual skin** now that the isolated Acre Era full-lifecycle backend proof has survived:

- Remediation Builder;
- Fresh Re-Challenger;
- Independent Assurance.

This is the successor mission anticipated by:

- `docs/ACRE_ERA_SUCCESSOR_HANDOFF_2026-10-03.md`
- `docs/ACRE_ERA_NORTH_STAR_SITE_MAP_AND_PAGE_BLUEPRINT_2026-10-03.md`

Do not ask Norris to reconstruct history already preserved in GitHub.

## Governing proof state

The base candidate has an Independent Assurance PASS for:

`AE-LRP-R0-FRC-03 — CONTENT_REVISION_DIRECT_RESET_NEUTRALIZES_CLOSURE_CAS`

Assurance execution:

- run `37193547983`
- job `111410580520`
- PostgreSQL `17.11 (Debian 17.11-1.pgdg13+2)`
- result: PASS

The prior FRC-02, FRC-01, and FC-01 protections remain intact.

This renderer lane must not weaken or silently bypass those backend contracts.

## Product north star

Acre Era is not a generic ecommerce grid.

The customer should feel that each Era is a distinct curated world while still inheriting one trusted Acre Era shell.

The renderer must preserve:

- Acre Era shell/navigation;
- typography system;
- Passport grammar;
- source/checkout truth;
- Customer Voice grammar;
- archive grammar;
- accessibility and reduced-motion behavior;
- media-rights governance.

Per-Era variation may include:

- hero video or motion asset;
- poster/fallback;
- accent/mood tokens;
- hero headline;
- editorial story;
- section ordering;
- product curation;
- Watchtower emphasis.

Do not create unrelated mini-sites.

## R0 customer surfaces

Implement the first production-quality **renderer layer** for:

1. `/` — Current Era home
2. `/era/[slug]` — generic Era experience

The renderer must consume the existing Era Engine/public resolver contracts rather than reimplementing lifecycle truth client-side.

## Current Era home

Target composition:

1. Current Era cinematic hero
2. Era title / eyebrow / story
3. “Enter the Era” route
4. “Why this Era exists” / evidence-aware context
5. Curated products
6. optional Partner Finds teaser
7. optional Market/local teaser
8. Bring It Here / demand hook where data exists
9. Customer Voice hook where data exists
10. Archive route
11. watchlist/alert CTA where supported

R0 may omit modules that have no valid backend data, but it must not fabricate them.

## Generic Era page

Render from backend Era data:

- hero media + poster/fallback;
- Era title, eyebrow, story;
- lifecycle dates/status where customer-appropriate;
- curation thesis / “why now”;
- curated product cards;
- source / checkout responsibility;
- Passport-ready trust data;
- public-safe Watchtower summary where available;
- archive link / historical state;
- alert/watchlist CTA only where the existing backend contract supports it.

## Media rights rules

Do not use scraped or unlicensed brand campaign assets.

Public hero/media rendering must respect approved media-rights state from the backend.

If no rights-safe media is available:

- use a rights-safe local/generated/synthetic placeholder already permitted by the repository;
- or render a designed poster/fallback state.

Do not falsely imply a relationship with Nike, Gucci, Apple, luxury houses, farms, creators, or other brands/partners.

## Motion and accessibility

Cinematic does not mean inaccessible.

Required:

- reduced-motion support;
- keyboard-accessible navigation and controls;
- readable contrast;
- semantic heading order;
- responsive behavior;
- hero fallback when video/motion is unavailable;
- no critical text embedded only inside media;
- avoid layout shift that makes primary actions unusable.

## Trust / commerce truth

Do not hide or blur:

- who owns checkout;
- who fulfills;
- whether a route is direct vs partner/referral;
- product condition;
- authorization/provenance state where exposed;
- image-rights state where customer-relevant;
- uncertainty / missing evidence.

Do not collapse trust into one fake “verified” badge.

## Archive behavior

CLOSED/ARCHIVED Eras must render from the immutable historical closure snapshot path already established by the backend.

Do not rebuild historical Era content from today’s mutable catalog.

Current media-rights revocation may hide an asset while immutable historical evidence remains unchanged.

## Implementation discipline

Prefer reusable renderer primitives over niche-specific hardcoded pages.

Default model:

`Era data -> approved assets -> curated products -> Watchtower profile -> shared renderer`

Avoid hardcoding a custom page per category unless custom functionality is genuinely required.

## Verification

At minimum add or preserve tests proving:

- current Era home uses the public resolver/application contract;
- generic Era page renders from backend Era data;
- archived Era does not silently use mutable live product state;
- rights-revoked media is not rendered;
- missing media falls back safely;
- future-start Era is not exposed as current;
- reduced-motion path remains usable;
- route/checkout responsibility remains visible where applicable;
- no customer notification, supplier action, order, or paid service is triggered by rendering.

Run:

- TypeScript/typecheck;
- relevant renderer/component tests;
- existing Era Engine tests;
- existing archive/alert/activation tests;
- existing Signal Bus tests;
- lifecycle proof where practical on the branch.

## Hard safety boundary

Do not:

- merge PR #15 as part of this lane;
- deploy Production;
- migrate Production;
- change Production routing;
- activate a real Era;
- publish a real product;
- use customer data;
- send customer communications;
- activate suppliers or fulfillment;
- place orders;
- spend money;
- enable paid infrastructure;
- weaken evidence or authorization controls.

## Definition of done for Renderer R0

A disposable/local/preview build must show:

- one coherent Acre Era shell;
- a data-driven current Era home;
- a data-driven `/era/[slug]` page;
- rights-safe hero fallback behavior;
- curated product rendering with trust/checkout truth;
- historical archive-safe rendering behavior;
- responsive and reduced-motion-safe UX;
- all required regressions green.

If implementation exposes a material backend or trust-model defect, preserve it rather than hiding it in UI code.
