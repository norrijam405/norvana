# Acre Era Successor Handoff — Backend Skeleton + PostgreSQL Proof

**Date:** 2026-10-03  
**Repository:** `norrijam405/norvana`  
**Current public-brand direction:** Acre Era  
**Internal repository/infrastructure codename:** Norvana  
**Successor rule:** Do not ask Norris to reconstruct this work from chat history. Read the durable documents and exact PR lineage below first.

---

## 1. Founder goal

The founder wants Acre Era to be materially different from generic ecommerce, dropshipping, affiliate-link farms, Temu/Wish clones, or a flat product grid.

The product concept is:

> **Acre Era is a curated buying network where every category, season, partner program, brand program, or commercial opportunity can become a distinct “Era” or “Acre” without becoming an unrelated website.**

A customer should feel like they **enter a new Era** when they move into a niche or curation.

Examples:

- electronics / creator / gaming;
- sports / performance;
- fashion;
- luxury;
- local farm / grocery / seasonal market;
- Partner Finds / affiliate referrals;
- home / lifestyle;
- seasonal or event-driven collections.

Each Era may have its own:

- hero video or motion treatment;
- poster/fallback;
- editorial story;
- accent/mood tokens;
- section ordering;
- product curation;
- Watchtower data emphasis;
- archive identity;
- alerts/watchlist hooks.

But every Era must inherit the same Acre Era trust spine:

- Acre Era shell/navigation;
- source/checkout truth;
- Acre Era Passport;
- Customer Voice;
- Watchtower evidence;
- archive continuity;
- accessibility/performance rules;
- media-rights governance.

The founder explicitly preferred:

> **“Make sure the skeleton is formed, and we just throw the skin on it.”**

The current implementation follows that doctrine.

---

## 2. Mandatory reading order

Before material work, read:

1. `ACRE_ERA_START_HERE.md`
2. `docs/ACRE_ERA_SUCCESSOR_HANDOFF_2026-10-03.md` (this file)
3. `docs/ACRE_ERA_NORTH_STAR_SITE_MAP_AND_PAGE_BLUEPRINT_2026-10-03.md`
4. `docs/ACRE_ERA_ERA_ENGINE_BACKEND_CONTRACT_R0_2026-10-03.md`
5. `docs/ACRE_ERA_CUSTOMER_INTENT_AND_ROUTE_ENGINE_R0_2026-10-03.md`
6. `docs/ACRE_ERA_ARCHIVE_ALERT_ACTIVATION_GOVERNANCE_R0_2026-10-03.md`
7. `docs/ACRE_ERA_WATCHTOWER_SIGNAL_BUS_R0_2026-10-03.md`
8. `docs/ACRE_ERA_POSTGRES_SCHEMA_PROOF_PASS_2026-10-03.md`
9. current open PRs and exact heads before changing moving branches.

Historical continuity:

- `docs/NORVANA_EXPERIENCE_ARCHITECTURE_R0.md`

Do not silently rewrite that historical document to match current Acre Era direction.

---

## 3. Current stacked PR lineage

The current backend work is intentionally stacked.

### Earlier supporting lanes

#### PR #6 — Customer Voice R0

Title:

`Norvana Customer Voice R0 — verified reviews and live reactions`

Current known head:

`680b3d64a97696b03a8f52b401918c00d76d3e8a`

State at handoff:

- open;
- draft;
- mergeable.

Important behavior:

- verified Norvana purchase reviews;
- unverified opinions clearly labeled;
- product / fulfillment / purchase-experience ratings separated;
- Customer Voice events/reactions;
- privacy-safe buyer signals;
- external import rights gates;
- public-write throttling;
- no sentiment-based suppression.

#### PR #7 — Supplier Expansion R0

Title:

`Norvana Supplier Expansion R0 — Merchize + current Watchtower dispositions`

Current known head:

`6fe6510cb7017e80f8c4c1a4f9f44ed38e1d0c47`

State at handoff:

- open;
- draft;
- mergeable.

Important supplier truth preserved in prior work:

- CJdropshipping read-only qualification has prior live auth/catalog/stock/warehouse/freight proof.
- CJ secret name: `NORVANA_CJ_API_KEY`.
- The founder already added the CJ credential to the backend/deployment environment.
- The founder also added the Merchize access token to Vercel under `NORVANA_MERCHIZE_ACCESS_TOKEN`.
- The founder reported signing up for the other supplier companies but stopped on some onboarding/forms where the correct answer was unclear.
- Do not ask the founder to paste supplier keys into chat or GitHub.
- Do not assume any supplier account is fully API-bound unless current evidence proves it.

Supplier execution authority remains locked unless separately governed.

#### PR #9 — Acre Era Authorized Commerce + Watchtower Intelligence R2

Title:

`Acre Era Authorized Commerce + Watchtower Intelligence R2`

Head:

`2416f7529138d9ab3e8e6c9a759333b13296bc4a`

State at handoff:

- open;
- draft;
- mergeable.

This lane contains the current authorized-commerce / affiliate / brand / luxury / electronics / Watchtower intelligence direction and the Partner Market foundation.

Partner Market:

- `/partners`
- `/partners/archive`

Partner imagery is rights-gated.

Affiliate/referral checkout remains visibly separate from Acre Era checkout.

---

### Backend-first Acre Era stack

#### PR #10 — Era Engine R0

Title:

`Acre Era Era Engine R0 — backend skeleton + durable north star`

Head:

`b1254e6a342722e8b583802906c8e96980045410`

State:

- open;
- draft;
- mergeable.

Core entities:

- `eras`
- `era_media_assets`
- `era_sections`
- `era_products`
- `era_watchtower_bindings`
- `era_events`

Migration:

- `drizzle/0011_era_engine_r0.sql`

Important invariants:

- data-driven Era composition;
- typed sections;
- approved theme presets instead of arbitrary CSS/JS;
- rights-governed hero/media assets;
- one active primary Era database invariant;
- public-safe Era resolver;
- draft-only composition APIs;
- non-activating readiness gate.

Public read routes:

- `GET /api/eras/[slug]`
- `GET /api/eras/current`

Admin composition remains separate from activation.

#### PR #11 — Customer Intent + Route Engine R0

Title:

`Acre Era Customer Intent + Route Engine R0`

Head:

`ef347e1d1c5e0c6bd370a23feab8a51181d20125`

State:

- open;
- draft;
- mergeable.

Migration:

- `drizzle/0012_customer_intent_route_engine_r0.sql`

Adds:

- pseudonymous watchlists;
- alert-event queue;
- Bring It Here lifecycle/history;
- multiple product routes;
- route observation history;
- customer-first route comparison.

Watch targets:

- PRODUCT
- BRAND
- ERA
- REQUEST

Alert intentions:

- PRICE_DROP
- BACK_IN_STOCK
- BRAND_ADDED
- ERA_OPENS
- LOCAL_SEASONAL
- BETTER_ROUTE
- REQUEST_STATUS
- QUALIFICATION_COMPLETE
- PARTNER_CHANGE

Bring It Here lifecycle:

`REQUESTED -> GAINING_SUPPORT -> RESEARCHING -> SOURCE_FOUND -> QUALIFYING -> APPROVED -> ENTERING_ERA`

Side states:

- ON_HOLD
- DECLINED
- RETIRED

Route engine principle:

Private economics may determine whether Acre Era can sustainably offer a route.

But customer-visible route comparison must not rank by Acre Era commission/margin.

Customer comparison uses:

- total customer price;
- delivery;
- trust/provenance;

and returns no invented winner where meaningful tradeoffs remain.

#### PR #12 — Archive + Alert + Activation Governance R0

Title:

`Acre Era Archive + Alert + Activation Governance R0`

Head:

`992d5ffdf279e59b2a7a1bc2e7d87bbc70e09a3b`

State:

- open;
- draft;
- mergeable.

Migration:

- `drizzle/0013_archive_alert_activation_r0.sql`

Adds:

- immutable Era closure snapshots;
- alert fingerprint/evidence fields;
- media approval/revocation;
- route activation/suspension;
- Era activation/closure/archive;
- readiness fingerprints;
- transactional ACT receipts.

Important archive behavior:

- CLOSED/ARCHIVED Eras resolve from immutable closure snapshots;
- historical Eras are not rebuilt from today’s mutable catalog;
- current media rights are re-checked before archived media renders;
- revoking media hides it publicly without rewriting historical evidence;
- archived third-party product imagery is hidden by default unless historical rights state is OWNED.

Important activation rule:

A structurally valid Era is not necessarily ready **now**.

Readiness blocks:

- future start time;
- elapsed end time;
- missing hero;
- missing public-approved hero media;
- missing products where required;
- affiliate authorization/destination defects;
- invalid section plan.

Activation requires exact `readinessDigest`.

If qualifying data changed after readiness evaluation, activation fails and must be re-read.

#### PR #13 — Watchtower Signal Bus R0

Title:

`Acre Era Watchtower Signal Bus R0`

Head:

`a0e370c5821bcec2ab493a20d770de08c9b4dfff`

State:

- open;
- draft;
- mergeable.

Migration:

- `drizzle/0014_watchtower_signal_bus_r0.sql`

Adds append-only:

- `watchtower_signals`
- `watchtower_signal_projections`

Signal classes include:

- price;
- stock;
- best-route / route state;
- Era state;
- request state;
- qualification;
- partner/brand state;
- local seasonal availability;
- authorization;
- provenance;
- recall/safety;
- shipping;
- warranty;
- return policy;
- demand;
- Customer Voice.

Truth states:

- OBSERVED
- VERIFIED
- CONFLICT

Only VERIFIED signals may project into confident customer-alert intents.

Same signal key + same normalized payload = idempotent replay.

Same signal key + different normalized payload = `WATCHTOWER_SIGNAL_KEY_COLLISION`.

Signal payload boundaries:

- explicit public-safe key allowlist;
- bounded primitive public values;
- private payload blocks secrets/tokens/API keys;
- private payload blocks customer email/phone/address/IDs;
- private payload blocks payment/card identifiers;
- private payload blocks pseudonymous actor hashes.

Signal ingest/read:

- `POST /api/admin/watchtower/signals`
- `GET /api/admin/watchtower/signals?limit=50`

Authority:

`OBSERVE_PROJECT_QUEUE_ONLY`

No external notification delivery.

---

## 4. PostgreSQL proof lane

Branch:

`feature/2026-10-03-acre-era-postgres-schema-proof-r0`

Current exact head at creation of this handoff:

`9a4daf015a149e9ab37e2e710d869b09a0c25478`

Durable PASS receipt:

`docs/ACRE_ERA_POSTGRES_SCHEMA_PROOF_PASS_2026-10-03.md`

### Why this proof exists

The accumulated backend work needed real PostgreSQL verification, not only TypeScript/build tests.

The numbered migrations are not genesis migrations.

The original storefront already had legacy `products` and `reviews` before the numbered recovery migrations.

Test fixture:

`tests/fixtures/norvana-pre-0007-baseline.sql`

This is a CI fixture only.

It is not a production bootstrap.

### Initial proof failure

Initial workflow:

`37142319783`

Initial candidate:

`3ce9564104c0402ba09350fd992fcdfc5054531e`

The first run proved:

- PostgreSQL 17 started;
- baseline applied;
- all 14 migrations applied;
- all 14 migrations reapplied.

It then found a canonical index-name mismatch.

This was a real schema consistency defect, not a production failure.

### Remediation

Migration SQL was aligned with canonical Drizzle index names:

- `era_archive_snapshots_digest_idx`
- `watchtower_signals_signal_key_idx`
- `watchtower_signal_projections_signal_projector_idx`
- `watchtower_signal_projections_key_idx`

### Passing proof

Passing runtime candidate:

`f6f28dc609d28e395a8017203198f2aa3086be28`

Passing run:

`37145206527 — SUCCESS`

Verifier output:

```json
{
  "status": "PASS",
  "migrationCount": 14,
  "requiredTableCount": 27,
  "watcherCount": 7,
  "invariants": {
    "singleActivePrimary": "PASS",
    "immutableEraArchive": "PASS",
    "immutableWatchtowerSignals": "PASS",
    "immutableWatchtowerProjections": "PASS"
  }
}
```

At later documentation head:

`9a4daf015a149e9ab37e2e710d869b09a0c25478`

additional schema-proof workflow runs also passed:

- `37145308990 — SUCCESS`
- `37145382943 — SUCCESS`

The proof ran on a disposable PostgreSQL 17 service and did not touch production data.

---

## 5. Current migration lineage

Numbered migrations currently span:

- `0001_watchtower_r0.sql`
- `0002_admin_identity_r0.sql`
- `0003_owner_credential_state_r0.sql`
- `0004_admin_auth_throttle_r0.sql`
- `0005_admin_session_version_r0.sql`
- `0006_watchtower_runtime_binding_r0.sql`
- `0007_customer_voice_r0.sql`
- `0008_acre_era_marketplace_r0.sql`
- `0009_authorized_commerce_watchtower_r2.sql`
- `0010_partner_market_curations.sql`
- `0011_era_engine_r0.sql`
- `0012_customer_intent_route_engine_r0.sql`
- `0013_archive_alert_activation_r0.sql`
- `0014_watchtower_signal_bus_r0.sql`

The full chain has passed isolated PostgreSQL 17 application + reapplication testing against the explicit legacy baseline fixture.

This **does not authorize blind production application**.

The real target database must be reconciled first.

---

## 6. Brand / design north star already preserved

The founder’s design idea must not be reduced to a generic ecommerce redesign.

Desired customer experience:

- cinematic hero media;
- different hero/video/mood per Era or page;
- weekly/seasonal curation;
- “enter a new Era” feeling;
- farm/grocery experience can use real farm-life media, seasonal facts, growers, harvest stories;
- electronics should feel clean/futuristic and data-rich;
- fashion/sports can feel kinetic;
- luxury should feel restrained/premium and provenance-heavy;
- Partner Finds should feel curated, not like a wall of affiliate links.

Actual Nike, Gucci, Apple, runway, campaign, or other brand-owned media must not be treated as reusable merely because it is publicly viewable.

Media must have one of the approved rights states and durable rights evidence before public rendering.

The durable site-map/page blueprint is already in the repo.

Do not rebuild that architecture from memory.

---

## 7. Revenue / differentiation model

Acre Era should support multiple legitimate economic models without making the customer decode the backend:

- direct margin;
- authorized distribution;
- qualified suppliers;
- affiliate/referral commissions;
- local/farm marketplace economics;
- authenticated resale;
- bundles/kits;
- future services.

Differentiators already designed:

- Acre Era Passport;
- “why this is here” curation reason;
- source/checkout responsibility;
- Customer Voice;
- public Bring It Here lifecycle;
- watchlists/alerts;
- Best Route comparison;
- immutable Era archive;
- Watchtower evidence timeline;
- quality/authorization/provenance state;
- future price/stock/recall/seasonality intelligence.

The strategic goal is not “have the most products.”

The strategic goal is:

> help the customer decide what is worth buying, why Acre Era trusts it, who owns checkout/fulfillment, what is still unknown, and whether a better route exists.

---

## 8. Important secrets/configuration boundaries

Known environment names include:

- `NORVANA_CJ_API_KEY`
- `NORVANA_MERCHIZE_ACCESS_TOKEN`
- `NORVANA_CUSTOMER_VOICE_RATE_SECRET`
- `NORVANA_CUSTOMER_INTENT_SECRET`
- `NORVANA_ROUTE_MIN_CONTRIBUTION_CENTS`
- `NORVANA_ROUTE_MIN_MARGIN_BPS`

Rules:

- never print secret values;
- never ask the founder to paste them into chat/GitHub;
- do not infer that a secret exists in every environment because it exists in one;
- route activation policy values remain deliberate business-policy inputs;
- do not invent contribution/margin thresholds.

---

## 9. Current authority / what has NOT happened

As of this handoff:

- migrations 0011–0014 have **not** been intentionally applied to Production by these lanes;
- no production Era has been activated by these lanes;
- no product route has been activated by these lanes;
- no real media approval/revocation has been executed by these lanes;
- no customer email/SMS/push notification has been sent;
- no supplier order has been created;
- no supplier fulfillment has been activated;
- no product price has been autonomously changed;
- no live inventory purchase has been authorized;
- no paid service was intentionally enabled by these lanes;
- the visual cinematic Era renderer has **not** yet been built as production UI.

Keep those distinctions precise.

---

## 10. Recommended next operator mission

Do not jump straight to “make it pretty.”

The strongest next backend mission is an **isolated full lifecycle runtime proof** using the now-proven PostgreSQL schema.

Recommended proof flow:

1. create a disposable PostgreSQL database;
2. apply the proven migration chain;
3. seed a synthetic active product and synthetic owned media asset;
4. create a PRIVATE DRAFT Era through application contracts;
5. add typed sections;
6. assign the synthetic product;
7. bind a safe Watchtower facet;
8. approve synthetic OWNED media with synthetic evidence;
9. obtain readiness + `readinessDigest`;
10. activate the Era using that exact digest;
11. prove `GET /api/eras/current` resolves the active Era;
12. create a pseudonymous watch item;
13. ingest a VERIFIED synthetic price/stock/Era signal;
14. prove the Signal Bus projects exactly one pending customer alert;
15. replay the same signal and prove idempotence;
16. close the Era;
17. prove immutable closure snapshot;
18. archive it;
19. mutate the live product afterward;
20. prove archived public resolution still uses the historical snapshot;
21. revoke the synthetic media and prove archived rendering hides the asset without mutating the snapshot.

This should remain isolated and synthetic.

After that end-to-end backend proof passes, the architecture is strong enough to begin the cinematic renderer / Era visual skin with substantially lower risk.

---

## 11. Stacked PR handling

Do not merge or rewrite the stack casually.

At handoff, the relevant stacked order is:

`PR #9 -> PR #10 -> PR #11 -> PR #12 -> PR #13 -> PostgreSQL proof branch`

Before any merge/promotion:

- re-fetch exact heads;
- confirm bases;
- confirm mergeability;
- confirm current CI;
- reconcile whether earlier supporting PRs #6/#7 must merge separately or be rebased into the final line;
- preserve evidence receipts;
- do not silently squash away meaningful governance history unless the merge plan explicitly preserves the receipts elsewhere.

A fresh reviewer/rechallenger is appropriate before canonical promotion.

---

## 12. Founder interaction guidance

The founder wants momentum and does not want repeated reconstruction questions.

Use the repo as the primary continuity source.

Ask Norris only when a genuine founder-only decision/credential/external form is unavoidable.

For supplier onboarding forms, if the founder shows the screen, answer the exact field/question directly.

For secrets, guide them to the deployment secret manager; never ask them to paste the value into chat.

For visual work later, preserve the “new Era / new Acre” concept rather than reverting to a generic storefront.

---

## 13. Handoff state

This handoff is intended to make the next agent operational without access to this chat.

Start from the exact repository state, re-fetch current PR/branch heads, and continue from durable evidence rather than conversational memory.
