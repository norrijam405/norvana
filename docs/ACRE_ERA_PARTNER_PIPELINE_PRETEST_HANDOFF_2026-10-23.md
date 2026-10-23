# Acre Era — assembled partner pipeline and pre-test handoff (2026-10-23)

## Mandate
Founder wants the partner journey assembled as one workflow **before** staging/browser E2E testing. Do not call it tested, deployed, live or ready to blast to farms merely because code is committed. Keep draft PR #23 unmerged; preserve zero-cost/Preview-only rules.

## Assembly status / source paths
1. Public application: `src/app/become-a-partner/page.tsx` to `POST /api/producer-interest` (pre-existing route, requires `PRODUCER_INTEREST_INTAKE_ENABLED=true` and rate-limit provider configured). It stores `producer_interest_submissions`.
2. Protected Watchtower producer overview: `src/app/admin/producers/page.tsx`. Has link to questionnaire, the review queue, copy-only outreach drafts, browser-local media reference planner, and private call notebook.
3. Protected queue: `src/app/admin/producers/applications/page.tsx` reads latest 100 submissions, search/filter, error if DB unavailable. Controls: `src/components/admin/application-review-controls.tsx`.
4. Review decision mutation: `POST /api/admin/producer-applications/[id]/review` with admin guard and browser origin gate, DB transaction row lock, allowed statuses NEW/REVIEWING/NEEDS_INFO/QUALIFIED/DECLINED/PAUSED, mandatory reason, append-only producer conversation note. No autopublish, emails, or HubSpot changes. Code commit series `8816f1e`, `efd860c`, `f339d91`, `740aa78`. More thorough CI needed.
5. Customer commerce, payment, orders, and supplier fulfillment still separate from this pipeline and unverified E2E.

## Critical pre-test integration needs
- Make new application form, API mapping and submissions work on exact SHA in isolated Preview. Intake requires storage migration readiness, abuse protection, consent/privacy copy.
- Verify review mutation, success feedback, rejected transitions, simultaneous edits, traceable notes and access control (unauthenticated and cross-origin must fail).
- Read model `producerConversationNotes` and confirm append-only review events are visible in an operator history/detail view; current queue records notes but doesn't yet show complete history.
- Verify supplier catalog onboarding, media usage permission and upload pipeline; video planner is **browser-local only**, not secure uploads or durable sync.
- HubSpot is CRM source of truth only after a properly authorized app integration. Existing ChatGPT HubSpot connector is NOT a Watchtower OAuth grant. Avoid duplicate create/sync and never auto-email.
- Zero new recurring services, charges, production changes, unsolicited partner email or sensitive identifiers (tax IDs/home address) in GitHub.
- Company legal operator: Norris James Data LLC founder-confirmed; Acre Era trade name/permit/activity scope not independently verified, food compliance pending. Commercial launch gated.
- Recheck GitHub Actions and Vercel Preview on latest immutable head; last code-status inspection on `f339d91` returned no reported CI runs/statuses. This is lack of evidence, not success.

## Release gates (in order)
1. Independent code/read-through and typecheck/Next.js build on pinned SHA; fix compiler blockers.
2. Preview environment connection, isolated Preview DB verification and no Production access.
3. Privacy/consent/error/rate-limit/duplicate submission tests on public intake.
4. Owner login / review state / audit note / bad transition / concurrency / no-outreach tests.
5. Verified media rights and content-source review. Test-only payment E2E later; real orders blocked until seller and regulation gates.
6. Founder walkthrough only when system results and limitations can be presented honestly. No public mass distribution before intake completion.

## Founder continuity
No need to re-ask founder to explain previous decisions. Start with `ACRE_ERA_START_HERE.md`, 2026-10-21 operational roadmap, preceding successor handoff and this file. Draft PR #23 branch `feature/2026-10-13-acre-era-universal-vendor-qualification-r0`. Re-fetch current head before touching anything.
