# Acre Era Hero Footage Discovery Shortlist R0

**Date:** 2026-10-04  
**Status:** discovery pools banked; individual media approval pending  
**Provider:** Pixabay  
**Credential state:** Preview secret configured in Vercel; value never copied into source or this document.

## Purpose

Create a reusable hero-footage discovery map across Acre Era's broad customer worlds.

This is discovery only. Search results are not automatically approved, downloaded, attached to an Era, or represented as real Acre Era partners/products.

## Customer worlds and initial Pixabay pools

### Everyday / Family
Primary search pools:
- https://pixabay.com/videos/search/family%20in%20the%20kitchen/
- https://pixabay.com/videos/search/grocery%20stores/
- https://pixabay.com/videos/search/groceries/

Direction:
- ordinary household activity;
- grocery unpacking / meal preparation;
- family kitchen moments;
- avoid staged imagery that feels like healthcare surveillance or institutional monitoring.

### Pets
Primary search pools:
- https://pixabay.com/videos/search/pets%20grooming/
- https://pixabay.com/videos/search/dog%20grooming/

Direction:
- dogs/cats at home;
- grooming and care;
- play and everyday pet life;
- avoid veterinary/medical implications unless the Era is actually about those products and claims are supported.

### Beauty / Wellness
Primary search pools:
- https://pixabay.com/videos/search/skincare%20routine/
- https://pixabay.com/videos/search/self%20care%20routine/
- https://pixabay.com/videos/search/cosmetic%20routine/

Direction:
- calm self-care;
- product-neutral routines;
- texture/detail shots;
- avoid medical or therapeutic implications.

### Home
Primary search pools:
- https://pixabay.com/videos/search/home%20organization/
- https://pixabay.com/videos/search/kitchen%20organization/

Direction:
- organized kitchens;
- storage;
- cleaning/reset moments;
- lived-in but uncluttered environments.

### Market / Grocery / Farm
Primary search pools:
- https://pixabay.com/videos/search/vegetable%20harvest/
- https://pixabay.com/videos/search/vegetable%20market/
- https://pixabay.com/videos/search/fresh%20vegetables/

Direction:
- harvest;
- produce handling;
- market stands;
- fresh-food preparation;
- do not imply a depicted farm is an Acre Era partner unless that relationship is real.

### Fashion / Performance
Primary search pool:
- https://pixabay.com/videos/search/running%20training/

Direction:
- movement;
- athletic detail;
- apparel/fabric motion;
- use brand-neutral footage unless explicit brand rights exist.

### Premium / Luxury
Search direction:
- craftsmanship;
- material closeups;
- restrained architecture/interiors;
- slow macro motion;
- avoid recognizable luxury trademarks unless rights exist.

### Technology / Creator
Primary search pools:
- https://pixabay.com/videos/search/computer%20desk%20setup/
- https://pixabay.com/videos/search/creator%20setup/
- https://pixabay.com/videos/search/gaming%20setup/

Direction:
- creator workspaces;
- clean electronics macros;
- keyboards/screens/lighting;
- avoid falsely depicting a specific product sold by Acre Era.

### Seasonal / Gifts
Search direction:
- gift wrapping;
- holiday home detail;
- summer/backyard gathering;
- back-to-school family activity;
- season-specific footage should not become the permanent visual identity.

## Qualification criteria

A candidate earns shortlist status only if it meets all of the following:

1. strong visual fit for the customer world;
2. usable landscape composition for hero cropping;
3. readable contrast zone for HTML headline/CTA;
4. no obvious trademark/brand implication unless rights are separately supported;
5. no misleading farm/supplier/partner implication;
6. no medical, safety, or product-performance claim implied by the footage;
7. suitable for muted autoplay;
8. reasonable clip duration / loop potential;
9. acceptable poster/still fallback;
10. license/source evidence can be recorded before approval.

## Media workflow

`DISCOVERED -> RIGHTS_REVIEW -> CREATIVE_REVIEW -> APPROVED -> ERA_ASSIGNED`

A media asset must never skip rights review.

## Preview/API state

The codebase includes:
- Pixabay provider adapter;
- admin stock-search endpoint;
- Preview-only stock-search probe;
- hero-media world query registry.

The configured Preview credential is intentionally not copied to GitHub.

Live API exercise remains pending the Vercel branch-preview deployment gate; public Pixabay discovery can continue independently until that deployment path is available.
