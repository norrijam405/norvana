# ACRE ERA / NORVANA

> **Successor agents:** before material storefront, Era, merchandising, affiliate, or Watchtower work, start with [ACRE_ERA_START_HERE.md](ACRE_ERA_START_HERE.md). Do not ask the founder to reconstruct the product vision already preserved there.

**Acre Era** is the current public-brand direction. **Norvana** remains the internal repository/infrastructure codename during controlled migration.

The current customer-experience north star is [docs/ACRE_ERA_NORTH_STAR_SITE_MAP_AND_PAGE_BLUEPRINT_2026-10-03.md](docs/ACRE_ERA_NORTH_STAR_SITE_MAP_AND_PAGE_BLUEPRINT_2026-10-03.md). The backend-first Era model is defined in [docs/ACRE_ERA_ERA_ENGINE_BACKEND_CONTRACT_R0_2026-10-03.md](docs/ACRE_ERA_ERA_ENGINE_BACKEND_CONTRACT_R0_2026-10-03.md).

Norvana is the historical/internal lineage of the curated commerce platform being recovered and modernized from its original dropshipping storefront.

## Product direction

Norvana is evolving into three connected commerce lanes:

- **Norvana Drops** — the founder's rotating discovery storefront, starting from an approximately two-week niche cadence.
- **Norvana Local** — persistent, seasonal local-farm and local-maker commerce.
- **Norvana World** — future global discovery and qualified cross-border commerce.

The Archive preserves retired Drops instead of turning Norvana into an infinite catalog.

See [docs/NORVANA_PRODUCT_CHARTER_R0.md](docs/NORVANA_PRODUCT_CHARTER_R0.md).

Founder-approved decisions are preserved in [docs/NORVANA_DECISION_LEDGER_R0.md](docs/NORVANA_DECISION_LEDGER_R0.md). Successor workers should reconcile that ledger before material Norvana work.

Norvana-owned recurring monitoring and the rebuilt admin control plane are defined in [docs/NORVANA_WATCHTOWER_R0.md](docs/NORVANA_WATCHTOWER_R0.md).

Global, liquidation and resale sourcing rules are in [docs/NORVANA_GLOBAL_RESALE_SOURCING_R0.md](docs/NORVANA_GLOBAL_RESALE_SOURCING_R0.md).

## Closest-to-$0 Finance

Norvana's finance objective is to help eligible customers minimize verified total financing cost. It is not a promise that financing will literally cost $0.

The comparison layer is intended to normalize APR, fees, down payment, term, promotional conditions, total of payments and total financing cost, then surface the lowest-cost verified path without favoring a provider because it pays Norvana more.

Essential groceries should not default to debt promotion.

## IgniAqua federation

Norvana remains the canonical owner of its catalog, customers, orders, payments, suppliers, inventory, storefront and product decisions.

IgniAqua may provide bounded services such as Scout research, evidence/provenance, connector qualification, Workforce/Green Room qualification, model routing, continuity/recovery and Darwin recommendations.

**Shared service does not imply shared authority.**

## Recovery security state

This branch intentionally fails closed while historical security shortcuts are removed.

- Historical browser-only admin password: disabled.
- Privileged mutations: protected by a temporary server-to-server recovery gate.
- Supplier connector execution: disabled by default.
- External supplier fulfillment: disabled by default.
- Raw supplier-secret storage: disabled.
- Checkout prices/totals: recalculated from server-side catalog data.
- Historical/static Scout: internal and explicitly non-live.
- Debugger/progress/admin data: internal.
- Historical credentials: treat as compromised if still valid and rotate/revoke at the provider.

See [docs/SECURITY_RECOVERY_R0.md](docs/SECURITY_RECOVERY_R0.md).

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required configuration is documented in `.env.example`. Never commit real secrets.

## Verification

Before promotion, run:

```bash
npm run typecheck
npm run lint
npm run build
```

Recovery work is not equivalent to production readiness. Supplier ordering, live financing, autonomous publishing and deployment require separate verification and authorization.


### Watchtower Preview bootstrap

Browser-local Preview setup helper: `/admin/setup`

The helper generates bootstrap/security values locally in the browser. Generated secrets must go directly into Vercel Preview environment variables and must never be committed or pasted into chat.

Safe configuration-state probe: `/api/admin/setup-status`
