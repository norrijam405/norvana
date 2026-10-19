# Acre Era — production launch gate (2026-10-17)

Status: NOT APPROVED FOR LIVE CHECKOUT. This file is an audit checkpoint, not a proof of release readiness.

## 2026-10-19 status update
- Chrome warning moved from active blocker to monitoring at founder direction; no security controls disabled.
- Staging deployment dpl_DJtKLrmo58nXBHm6NSyTtBW5vJUA is READY at exact commit 3c8ed4a2f93e9dabeb0309370b152afbeaca5de8.
- Build success is not checkout or production qualification.

## Confirmed
- Vercel deployment dpl_HMs4PZnWkXS8gM6zB59A11E5o3jh was READY for commit 07875a9f126a96a6265e8c73789522642ffdd9c3; it predates later navigation commits.
- Draft PR #23 remains open; no merge approval recorded.
- Checkout API has explicit Stripe and site-URL configuration failure guards, but no recorded recent production transaction certification.
- Owner reported Chrome warning 'password may be compromised' on a staging URL; TLS certificate being valid does not invalidate this warning.

## Launch blockers — close in order
1. **Browser trust monitoring (nonblocking)**: founder reports the earlier Chrome warning was a one-time incident and authorizes removing it from launch blockers. Do not disable password/session security or bypass a *new* browser warning. Reopen investigation if reproduced on the final customer domain.
2. **Public storefront reachability**: confirm intended customer domain and DNS/Vercel assignment; independently load the home, category, product, cart, shipping, returns, privacy, and contact pages from an unauthenticated browser and phone.
3. **Product truth**: only genuine authorized catalog items, current price, usable images with rights, supplier/stock availability, and verified fulfillment terms. Don't represent seeded demos or staged goods as live.
4. **Checkout**: test complete order lifecycle in Stripe TEST mode only: inventory validation, server-calculated totals, taxes/shipping disclosures, payment outcome webhook, duplicate webhook idempotency, refund and customer confirmation. No live charge without founder approval.
5. **Permissions and safeguards**: authenticate operator, test session/logout/rate limits, keep Watchtower internal routes private, preserve executor and external action locks until independently proven safe.
6. **Regression**: run consolidated Node/typecheck/route tests and real HTTP integration tests on exact commit, capture timestamps and durable receipts. Source-regex assertions do not substitute for runtime tests.
7. **Release controls**: review PR diff and regression results; then decide whether to merge and publish with rollback path. Do not infer Production readiness from READY Vercel build.

## Release stages
- **Stage A — showable public storefront**: trustworthy custom domain, security warning resolved, browsable validated catalog, truthful 'coming soon' or unavailable purchase state if payments unqualified.
- **Stage B — limited paid pilot**: Stripe test evidence plus operator approval for live switch, live product and fulfillment checks, low-risk small scope, order monitoring and rollback.
- **Stage C — scale**: real supplier integrations, verified Darwin data, Watchtower automation only under explicit bounded authority.

## Founder decisions (only when prerequisites passed)
- Confirm public Acre Era domain/brand and authorized sellers.
- Approve payment activation and legal/policy copy before any real charge.
- Choose pilot products and fulfillment partner.

All work on PR #23 is Preview-only; avoid paid services, irreversible mutations, production database writes and customer charges.
