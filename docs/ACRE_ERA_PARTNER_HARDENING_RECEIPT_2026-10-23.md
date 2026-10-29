# Acre Era — 2026-10-23 partner pipeline hardening receipt

## Committed without Production changes
- `805b5a5` — refreshed server statuses reset a stale decision dropdown.
- `b280087` — public questionnaire stores full product description in the existing 1500-character `capacityNotes` field rather than silently truncating the response as a 120-character category string. This is a compatibility workaround; migrate to a dedicated `productDescription` column with reviewed migration later.
- `562960d` — queue makes that combined product-details/notes field explicit.
- Earlier `fc4d376` — visible decision history for reviewed applications.
- All on draft PR #23, not deployed, not build tested.

## Activation prerequisites: still BLOCKED / NOT TESTED
1. Pinned branch TypeScript and Next.js build, independent read-through; no green CI reported at last read.
2. Latest Vercel staging READY deployment previously mapped to older SHA `143eadad96627eff713851944240a59b8321f4d7`. Do not use that deployment as evidence for current implementation.
3. Preview database must have `producer_interest_submissions` and `producer_conversation_notes` tables; `PRODUCER_INTEREST_INTAKE_ENABLED=true` and existing quota protections need verified configuration before public sharing.
4. E2E form submit, operator review transition and note replay, multiple requests/concurrent reviews, auth/CSRF and denial paths must pass before partner outreach.
5. Secure photo/video *uploads* are not yet implemented; browser-local link planner only. Need approve provider/storage isolation, max sizes, antivirus/validation, rights checks and low-cost budget before server route.
6. ChatGPT HubSpot connector is not a website credential. Do not install unknown tokens or claim CRM sync until separate authorization and app OAuth/secure server-only token is in place.
7. No business outreach without verified sender, opted-out recipients suppression, approved public mailing address and founder review. Home address remains intentionally excluded.
8. Norris James Data LLC exists founder-confirmed, but Acre Era trade name/retail permits/food compliance not verified. No live checkout.

## Founder help
No immediate action necessary for code. To activate Preview or external apps later, founder may need to set credentials/configurations in provider dashboards privately, authorize appropriate integrations, and grant usage rights to media. No paid subscriptions or live financial operations without confirmation.
