# Acre Era — Successor Agent Handoff (2026-10-21)

## START HERE — do not reconstruct history from founder
1. Read `ACRE_ERA_START_HERE.md`, `README.md`, `docs/ACRE_ERA_OPERATIONAL_ROADMAP_2026-10-21.md`, and the repository's prior handoff/evidence docs. Keep this business **Acre Era**; repo is `norrijam405/norvana` for historical reasons.
2. Re-fetch draft PR #23 and its exact immutable head; **last observed prior to this handoff**: `74c93a02f9aa4ba4fc332e33445276e394839879`. This hash will change as handoff docs are added. Never assume a stale SHA is current. Branch `feature/2026-10-13-acre-era-universal-vendor-qualification-r0`.
3. Reconcile GitHub PR/CI, Vercel Preview and Neon Preview before editing. Do not touch Production Neon/Vercel, send outside mail, incur paid services, or initiate live transactions without explicit approval.

## Founder intent
- Make **Acre Era a real, polished, low-cost, distinctive curated marketplace**; founder needs operational website, not mocks. Launch small: 5 *qualified, actually available* Goods + 5 honestly labeled affiliate Finds.
- Categories include farmers, butchers, honey/bakeries, local makers, wholesalers/food hubs; geography Oklahoma and Texas initially. Archive/Past Era represents discontinued historical items without false purchasability.
- Watchtower is operations front end; HubSpot is **CRM source of truth** for companies, contacts, follow-ups and marketing preferences; ecommerce DB is **order source of truth**. Darwin may propose but not send, spend, publish or ship without approval.
- Founder likes practical, understandable steps over huge undifferentiated reports. The exact phrase “Challenge failed” signals need for comprehensive new-agent handoff.

## Implemented/verified in this work lineage
- Connected **ChatGPT HubSpot plugin** (HubSpot account ID 247749145); connector supports company/contact CRUD. **Not a direct Watchtower CRM connection.**
- HubSpot records: Miniature Harvest company ID 354532086476; Chefs First Farms 354528543429; Clayton contact 573794278121; Justin contact 573794278123. These contacts **not yet associated** with companies; identities/email affiliations need verification before sending.
- Seven Oklahoma company-only prospects created: Urban Agrarian 354399637214; 74C Meat Co. 354381663951; Firebird's Meat Market 354367234775; Prairie Earth Gardens 354322251464; Cityside.Farm 354324056775; OKC Food Hub 354387015389; Roark Acres 354376218299. Six enriched with sourced public domains, contact notes, phone when available, city/state; Prairie Earth Gardens deliberately untouched pending validation. **No outreach sent; no partner accepted**.
- Draft PR #23 already had protected Watchtower `/admin/producers` page, producer conversation notebook, supplier surfaces, `/admin/orders` showing database-backed orders + supplier fulfillment, checkout and Stripe webhook routes. **Do NOT claim live checkout works; test-mode configuration and end-to-end verification are pending.**
- Commits: `84e94e2f` added HubSpot links to producer workspace, `cd4a422c` added honest HubSpot planned-connection entry, `0762ae20` fixed silent order DB failure disguised as zero, `b0240f5f` introduced six editable client-side templates, `74c93a02` surfaced them inside protected `/admin/producers`. Template feature is draft-only/copy, NOT send/sync.
- Zoho business mail: primary `norrisjames@acreera.com`, partnership alias `contact@acreera.com`, support alias `support@acreera.com`. Zoho CRM IMAP setup blocked; no verified outbound API or HubSpot inbox connection. User does NOT want to wrestle settings; prefer simple reviewed email workflow.

## Status distinctions and gaps
- The source code is on a draft PR, NOT released. There may be stale Vercel Previews; fetch exact head and test. Previous non-current Preview IDs are NOT proof of current readiness.
- Existing 12 generic "active" product listings in Preview DB lacked verified source/images/fulfillment; 2 CJ placeholders had empty images and price 0. Qualify before publishing; never silently invent products or images.
- No CRM-to-website OAuth bridge, supplier ID mapping, campaign automation, customer loyalty engine, customer reward wallet, or verified customer email delivery yet. Do not describe these as active.
- HubSpot templates are NOT saved in HubSpot: they are currently Watchtower draft templates in PR only.
- Do not add production secrets or use a ChatGPT HubSpot token inside app; register proper OAuth/private app according to account and least privilege.
- Preview DB branch prior context: Neon project `bitter-snow-32439396`, preview branch `br-purple-dawn-attktu71`; PRODUCTION branch `br-wild-block-ats5m7pb` is OFF LIMITS.
- Vercel project `norvana` `prj_S1SduRA8yEPwpy4HECxPZLdWpNli`, team `team_0UoZtmNNnCvwQ2tqcLuGdevX`; verify Preview build for new commit before assuming deployment.

## Next actions in order
A. Inspect current branch, unit tests/CI and protected Watchtower page; test six templates in Preview without emailing. Fix actual compile/build issues if present.
B. Qualify 5 real Goods + 5 affiliate Finds, with trust passports, hard evidence, prices/margins/photos/license, availability and fulfillment.
C. Stripe test checkout/webhook/idempotency + order database state; demonstrate order in Watchtower, failed/abandoned routes, refund handling and delivery exception without live money.
D. Prototype server-only HubSpot OAuth adapter read-only; scopes, tenant check, credential rotation, reconciliation and disabled-by-default flag. Then partner qualification pipeline and association mapping.
E. Build Community & Loyalty (discount-first, no additional paid software, opt-in/suppression), initial tasks and reviewed outreach workflow. Test costs, no automatic sends.
F. Execute launch readiness gates; seek explicit authorization before promoting Production or sending farm invitations.

## Operating doctrine
Proof before claims. No customer-facing 503 hidden behind a generic success; no silent order-data failure; no misleading real-product photos, prices or inventory. Never confuse draft CRM records with partnerships. Keep original PR as draft, minimize CI/action usage, maintain tests and durable SHA evidence. Preserve costs near zero; explicit approval for destructive, live financial or external messaging operations.

For vision and exact milestones, read `docs/ACRE_ERA_OPERATIONAL_ROADMAP_2026-10-21.md`.
