# Acre Era — Partner Pipeline Gap Closure (2026-10-23)

## Completed on branch
- Added application decision history to the private Watchtower application queue: `src/app/admin/producers/applications/page.tsx`. Reads review events from `producer_conversation_notes` for latest 100 applications and displays status transitions with timestamp and founder note; capped at latest 500 notes with explicit caveat.
- Existing form `/become-a-partner`, rate-limited `/api/producer-interest`, private review queue and transactional status mutation are coded, **not proven live**.

## Live-evidence check (read-only, no CI expense)
- Latest observed READY Vercel staging deployment on the feature branch was commit `143eadad96627eff713851944240a59b8321f4d7`, deployment `dpl_FHEdgxzQ3Fc48odDcvDcBkCbDaoy`. It predates the newer application queue/status/history code.
- Vercel's READY state for that older deployment is NOT proof that the latest branch head builds or works.
- Must build/preview the latest pinned head in staging, confirm database schema (producer_interest_submissions + producer_conversation_notes), and exercise an isolated test application followed by an authenticated review decision and history visibility.
- Review the current frontend review controls for stale selection after router refresh, and ensure every valid backend transition is selectable. Add integration tests for failed DB, unauthenticated/cross-origin and concurrent review state.
- Media planner is browser-local only; secure direct upload requires an explicit owned storage route and cost/size/security/rights controls. No provider is authorized by merely having a storage account.
- HubSpot connector used in ChatGPT is NOT website OAuth; no CRM sync, email sending, vendor approval or live payments have been authorized.

## Founder input only when required
- Access or activation of Preview environment variables if missing, preferably without sharing secrets in chat.
- Future approval for authorized supplier outreach and final business mailing address, only after form and sender are proven.
- Product/partner media rights or consent for publication.
- Do not ask the founder to recreate project history. Use `ACRE_ERA_START_HERE.md`.

No Production edits, fees, emails or live transactions in this gap closure.
