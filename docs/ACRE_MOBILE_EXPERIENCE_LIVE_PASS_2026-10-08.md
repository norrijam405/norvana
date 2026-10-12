# ACRE MOBILE EXPERIENCE PASS — LIVE

Date: 2026-10-08
Mission: ACRE-FOUNDATION-001 / MOBILE EXPERIENCE
Status: LIVE PASS
Exact certified head: 351a7f667ebbf1422a67a6ca428cd148a4a6f4a2
GitHub validation: Acre Era Intelligence Delivery R0 run #483 — SUCCESS
Vercel deployment: dpl_3yowzFF3FgUseLNdMndvApFVAdrS — READY

## Objective

Improve Acre Era phone usability without redesigning the product, changing IA, or weakening the existing desktop experience.

## Mobile issues addressed

1. Header and menu touch targets were too tight for comfortable phone use.
2. Mobile menu could grow beyond the usable viewport.
3. Hero sections consumed too much vertical space on small screens.
4. Era selector pills wrapped into tall stacks instead of behaving like a compact mobile control.
5. Primary/secondary CTAs were less thumb-friendly than they should be.
6. Cart drawer used desktop-scale spacing on a full-width mobile panel.
7. Footer signup input/button could become cramped side-by-side.
8. Market story card was overly tall for small-screen context.

## Components changed

- src/components/navbar.tsx
- src/components/acre-era/journey-hero.tsx
- src/components/acre-era/acre-era-home-journey.tsx
- src/components/acre-era/era-renderer.tsx
- src/components/cart-drawer.tsx
- src/components/footer.tsx
- src/components/acre-era/farm-life-story.tsx

## Design decisions

### Navigation
- reduced phone header height while preserving desktop;
- retained logo + wordmark;
- 44px minimum touch targets for cart/menu;
- mobile menu now respects viewport height and scrolls internally;
- active route is visible in the mobile menu;
- aria-expanded / aria-controls added to menu toggle;
- Admin / Watchtower remains available but visually secondary.

### Hero systems
- reduced minimum mobile hero height;
- clamp-based headline sizing for narrow devices;
- mobile-first padding;
- CTAs become full-width on phones;
- Era/media selectors become horizontal swipe rows with 44px controls;
- desktop sizing preserved at sm/lg breakpoints.

### Cart
- true dynamic viewport height using h-dvh;
- tighter phone padding;
- larger quantity/close touch controls;
- safe-area-aware bottom padding.

### Footer
- newsletter form stacks vertically on narrow phones;
- button becomes full-width on mobile.

### Market story
- reduced minimum image/story height on phones;
- smaller mobile padding/headline scale.

## Explicitly preserved

- global navigation structure;
- Market / Goods / Finds / Era Drop IA;
- Concept A identity;
- desktop layout behavior;
- Watchtower boundaries;
- commerce truth;
- Pinterest/Impact verification tags;
- apex indexing policy;
- preview noindex policy.

## Live verification

https://acreera.com/
- 200
- Concept A mark present
- Pinterest verification meta tag present
- public apex remains indexable

https://preview.acreera.com/
- 200
- X-Robots-Tag: noindex, nofollow, noarchive

https://acreera.com/robots.txt
- 200

Aliases on exact deployment:
- acreera.com
- www.acreera.com
- preview.acreera.com

## Next verification

Founder/device review is useful for visual tuning on:
- small iPhone-width viewport;
- large phone viewport;
- menu open state;
- homepage hero;
- cart drawer;
- Market / Goods / Finds / Era Drop page heroes.

Only evidence-backed follow-up corrections should be made.
