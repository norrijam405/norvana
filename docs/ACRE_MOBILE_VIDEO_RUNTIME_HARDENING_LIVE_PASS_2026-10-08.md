# ACRE MOBILE VIDEO RUNTIME HARDENING — LIVE PASS

Date: 2026-10-08
Mission: Acre Era mobile experience / ACRE-FOUNDATION-001
Status: LIVE PASS
Exact certified product head: 97c5848a1c8320a90f7ebdd2f83b628b7229a83c
GitHub validation: Acre Era Intelligence Delivery R0 run #493 — SUCCESS
Vercel deployment: dpl_H8fHQuqDBVKYdhqfWgmucHvVx1Do — READY

## Problem

Mobile browsers can suppress or reject autoplay even when background video uses muted, autoplay, loop, and playsInline. The prior implementation depended on browser behavior and could leave mobile users with inconsistent motion.

## Runtime policy implemented

1. Poster/still is rendered first.
2. When motion is allowed, the video explicitly attempts playback after it can play.
3. The video fades in only after the browser emits playing.
4. Playback promise rejection or media error fails closed to the poster/still.
5. prefers-reduced-motion continues to disable motion intentionally.
6. No blank/black hero is required for failure recovery.

## Surfaces hardened

- Acre Era rotating homepage hero
- shared JourneyHero used by Market / Finds / Era Drop
- dynamic Era hero media
- Market farm-life story media

## User experience rule

Normal capable device -> muted inline looping background video.
Reduced-motion preference -> poster/still.
Autoplay/network/media failure -> poster/still.
No user action is required to recover.

## Explicitly preserved

- desktop behavior
- current IA and CTA hierarchy
- Concept A identity
- apex indexing
- preview noindex policy
- Pinterest verification tag
- Impact verification tag
- commerce/Watchtower boundaries

## Live checks

https://acreera.com/
- HTTP 200
- Pinterest verification tag present
- Impact verification tag present
- Acre Era mark present

https://preview.acreera.com/
- HTTP 200
- X-Robots-Tag: noindex, nofollow, noarchive
- verification tags present

Aliases bound to this exact deployment:
- acreera.com
- www.acreera.com
- preview.acreera.com

## Founder device verification requested

On a normal-motion phone session:
- hero should begin on poster/still and transition to motion once playback starts;
- if the browser blocks playback, the still should remain polished and readable;
- reduced-motion users should not receive autoplay motion.
