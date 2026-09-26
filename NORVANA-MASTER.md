# NORVANA — The Master Document

> **One file that binds everything together: concept → brand → design → architecture → code → data → operations → deployment → roadmap.**
>
> | | |
> |---|---|
> | **Project** | NORVANA — Curated Commerce Platform |
> | **Repository** | [github.com/norrijam405/norvana](https://github.com/norrijam405/norvana) (public) |
> | **Repo description** | *"Hopefully it works"* |
> | **Homepage** | https://norvana.vercel.app |
> | **Default branch** | `main` |
> | **Working branch** | `arena/01a0db6a-norvana` |
> | **Only commit to date** | `fb07868` — "Add files via upload" (norrijam405, 25 Jul 2026) — 61 files, 5,765 lines |
> | **Contact** | Norrisjamesdata@gmail.com |
> | **Doc generated** | 2026-09-26 |
> | **Source of truth** | Full read of the Git repository at `fb07868` |

---

## Table of Contents

1. [The Concept](#1-the-concept)
2. [The Brand](#2-the-brand)
3. [The Design System](#3-the-design-system)
4. [Product Experience — Storefront](#4-product-experience--storefront)
5. [Product Experience — The Engine Room (Admin)](#5-product-experience--the-engine-room-admin)
6. [System Architecture](#6-system-architecture)
7. [Data Model](#7-data-model)
8. [API Surface — Complete Reference](#8-api-surface--complete-reference)
9. [Supplier Integration Layer](#9-supplier-integration-layer)
10. [Payments & Order Lifecycle](#10-payments--order-lifecycle)
11. [Seed Data — The Catalog as Designed](#11-seed-data--the-catalog-as-designed)
12. [Complete File Map](#12-complete-file-map)
13. [Running It Locally](#13-running-it-locally)
14. [Deployment — Vercel](#14-deployment--vercel)
15. [Deployment — IONOS VPS](#15-deployment--ionos-vps)
16. [Security Audit & Known Gaps](#16-security-audit--known-gaps)
17. [Roadmap — From Here to Production](#17-roadmap--from-here-to-production)
18. [Appendix A — Glossary](#appendix-a--glossary)
19. [Appendix B — Arena.ai Conversation History](#appendix-b--arenaai-conversation-history)

---

## 1. The Concept

### 1.1 The one-line pitch

> **NORVANA is a curated commerce platform that sells handpicked artisan goods in rotating quarterly "Volumes," with an AI-assisted back office that scouts products, connects to supplier APIs, and auto-fulfills orders.**

### 1.2 The problem it addresses

Independent e-commerce brands face three structural problems at once:

1. **Curation doesn't scale.** Finding good products means manually trawling wholesale marketplaces, trade shows, and supplier catalogs.
2. **Fulfillment is glue code.** Every distributor (Shopify wholesalers, Printful, CJ Dropshipping, Faire, Alibaba) has a different API, a different auth scheme, and a different order payload.
3. **Infinite catalogs kill desire.** A store with 10,000 SKUs has no story. A store with 12 perfect objects does.

### 1.3 The three ideas that answer it

#### Idea 1 — **The Volume model** (the merchandising idea)

Instead of a permanent, ever-growing catalog, NORVANA publishes **Volumes**: time-boxed, themed collections that run roughly a quarter each, then retire into a browsable **Archive**.

| Volume | Theme (niche) | Window | Editorial promise |
|---|---|---|---|
| **Vol. I** | Home & Sanctuary | 2024-01-01 → 2024-04-30 | *"Curated essentials for creating your perfect home sanctuary. Fragrances, textiles, and daily rituals."* |
| **Vol. II** | Kitchen & Craft | 2024-05-01 → 2024-08-31 | *"Handmade tools and artisan pieces for the modern kitchen. Beauty meets function."* |
| **Vol. III** | Garden & Wellness | 2024-09-01 → 2024-12-31 | *"Tools for tending your garden and your mind. Nature-inspired pieces for modern living."* |

Vol. III is the active volume in the seed data (`isActive: true`).

Why it works:
- **Scarcity drives urgency** — hence the live countdown timer on the homepage ("Current Volume Ends In").
- **Themes give editorial voice** — each Volume is a point of view, not a category page.
- **The Archive becomes content** — retired Volumes are a reason to come back, and a permanent SEO asset.
- **Operationally it caps risk** — you only need to source ~12 products per quarter, not a warehouse.

Implemented in: `niche_volumes` table, `/archive`, `CountdownTimer` in `home-client.tsx`, `volumeNumber` on every product.

#### Idea 2 — **The Engine Room** (the operations idea)

The admin panel is not a CRUD dashboard. It's framed as a **cockpit** — the password screen literally says `🔐 Engine Room`. Seven tabs, each one a business function rather than a database table:

| Tab | What it's really for |
|---|---|
| 🔍 **AI Scout** | Decide *what to sell next* |
| 🏭 **Distributors** | Decide *who supplies it* |
| 📦 **Orders** | Decide *how it ships* |
| 💳 **Payments** | Watch *the money* |
| 📊 **Analytics** | Watch *the business* |
| 📝 **Progress** | Run *the project itself* |
| 🔧 **Debugger** | Keep *the machine alive* |

The Progress tab is unusual and deliberate: the app ships with its own **task tracker baked in** (`progress_notes` table, with type / status / priority / category / due date, plus a Markdown export endpoint). The build log lives inside the product.

#### Idea 3 — **The Distributor Abstraction** (the technical idea)

One interface, many supplier platforms. Any distributor that implements `SupplierConnector` can be plugged in, credentialed from the UI, catalog-synced, and order-fulfilled — without touching checkout code.

```
interface SupplierConnector {
  platform: SupplierPlatform;
  testConnection():   Promise<{ success, message }>;
  syncProducts(cursor?): Promise<ProductSyncResult>;
  submitOrder(payload):  Promise<OrderSubmitResult>;
  getOrderStatus(id):    Promise<{ status, tracking? }>;
  getInventory(ids):     Promise<Record<string, number>>;
}
```

This is the load-bearing architectural decision in the whole codebase. Everything else — the order table's `supplierOrderIds`, the fulfill endpoint's supplier-grouping loop, the credentials table — exists to serve it.

### 1.4 The business model implied by the code

```
Customer pays retail  ──▶  Stripe Checkout  ──▶  order recorded (paid)
                                                      │
                                     POST /api/orders/:id/fulfill
                                                      │
                             items grouped by product.supplierId
                                                      │
                         ┌────────────────────────────┴───────────────┐
                         ▼                                            ▼
              supplier.type === "manual"                   supplier.type === "api"
              → flagged for human action              → connector.submitOrder() at wholesale
                                                      → supplier ships direct to customer
```

Margin = retail price − `products.cost` (wholesale). The `cost` column exists precisely for margin tracking, and the AI Scout surfaces margin as a first-class signal (55%–78% on the scouted candidates).

Free shipping above **$75** (`FREE_SHIPPING_THRESHOLD`). Standard shipping quoted to Stripe as 5–10 business days.

---

## 2. The Brand

| Attribute | Value |
|---|---|
| **Name** | NORVANA (`BRAND` constant, always rendered uppercase, letter-spaced) |
| **Etymology (implied)** | *Nor-* (northern, nordic, minimal) + *-vana* (nirvana, calm, intentional) |
| **Tagline** | *Curated Objects for Intentional Living* |
| **Meta description** | *"Discover handpicked artisan goods across rotating niche collections. Quality meets curation."* |
| **Hero subline** | *"Handpicked artisan goods from the world's best makers. New volumes drop quarterly."* |
| **Order prefix** | `NRV-XXXXXX` |
| **Demo email domain** | `norvana.co` |

### 2.1 Voice

Short. Declarative. No exclamation marks in body copy. Editorial rather than salesy — product descriptions read like a catalog note, not a bullet list:

> *"Stonewashed French linen throw in oatmeal. Softens with every wash."*
>
> *"Solid copper watering can with long spout. Develops a beautiful patina over time."*
>
> *"Premium hinoki and cedarwood incense sticks with brass holder. 50 sticks included."*

Pattern: **material + origin/process + one sensory or temporal detail.** Every single description follows it.

### 2.2 The rotating hero

Three slides, 5-second auto-advance, manual dot navigation:

| # | Title | Subtitle | CTA |
|---|---|---|---|
| 1 | Volume III | Garden & Wellness | Explore the Collection |
| 2 | Curated Objects | For Intentional Living | Shop Now |
| 3 | Artisan Made | Globally Sourced | Discover More |

### 2.3 Social proof claims (homepage stats band)

| Curated Products | Happy Customers | Artisan Makers | Countries Shipped |
|---|---|---|---|
| live count (fallback `12+`) | `500+` | `15+` | `12+` |

---

## 3. The Design System

Defined in `src/app/globals.css` using Tailwind CSS v4's `@theme` block — the entire visual language is 12 colors and 3 typefaces.

### 3.1 Color tokens

| Token | Hex | Role |
|---|---|---|
| `--color-bone` | `#F9F9F7` | Page background — warm off-white, not sterile |
| `--color-obsidian` | `#111111` | Text, hero background, admin shell |
| `--color-indigo-accent` | `#6366F1` | Primary action, links, selection |
| `--color-indigo-light` | `#818CF8` | Accent on dark backgrounds, eyebrow text |
| `--color-indigo-dark` | `#4F46E5` | Hover state for primary |
| `--color-surface` | `#FFFFFF` | Cards, elevated panels |
| `--color-surface-hover` | `#F3F3F0` | Hover fill, image placeholder |
| `--color-border` | `#E5E5E0` | Hairlines — warm grey, matches bone |
| `--color-muted` | `#71717A` | Secondary text |
| `--color-success` | `#22C55E` | Verified badges, paid states |
| `--color-warning` | `#F59E0B` | Pending states |
| `--color-error` | `#EF4444` | Failures |

The palette is deliberately **bone + obsidian + one indigo**. Neutral warm base so the products carry the color; a single saturated accent so every call to action is unambiguous.

### 3.2 Typography

| Token | Family | Used for |
|---|---|---|
| `--font-display` | **Schibsted Grotesk** (400–900) | `h1`–`h4`, prices, stats, brand mark |
| `--font-body` | **Inter** (300–700) | All body copy, UI |
| `--font-mono` | **JetBrains Mono** (400–600) | Order numbers, IDs, technical values |

Loaded from Google Fonts with `preconnect` to both `fonts.googleapis.com` and `fonts.gstatic.com`, `display=swap`.

### 3.3 Component primitives

Four `@layer components` classes carry nearly the whole UI:

| Class | Definition |
|---|---|
| `.btn-primary` | `px-6 py-3`, indigo fill, white text, `rounded-lg`, hover → indigo-dark, focus ring + offset |
| `.btn-secondary` | Bordered, transparent, obsidian text, hover → surface-hover |
| `.card` | White surface, `rounded-2xl`, hairline border, `p-6`, `shadow-sm` |
| `.input` | Full-width, `px-4 py-3`, bordered, focus ring indigo, border goes transparent on focus |
| `.badge` | Pill, `text-xs font-medium`, `px-2.5 py-0.5` |

Radius ladder: `lg` (buttons, inputs) → `xl` (image tiles) → `2xl` (cards) → `3xl` (feature blocks). Consistently applied.

### 3.4 Motion

`framer-motion` throughout, with one repeated signature:

```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: i * 0.1 }}
```

Grid items stagger in at 100 ms intervals. Hero slides cross-fade over 0.6 s. Confirmation page scales from 0.95. Product tiles scale to 1.05 on hover over 300 ms. Nothing bounces, nothing spins — the motion is all "settle into place."

### 3.5 Imagery strategy (and its honest gap)

Products reference real image paths (`/images/products/candle-1.jpg`), but **no image assets ship in the repo**. The UI falls back to a **per-niche emoji** rendered at `text-5xl` in a square `surface-hover` tile:

| Niche | Glyph | Niche | Glyph |
|---|---|---|---|
| home-fragrance | 🕯️ | garden | 🌿 |
| kitchen | ☕ | wellness | 🧘 |
| home-decor | 🛋️ | bath | 🧼 |
| workspace | 🖊️ | stationery | 📓 |
| art | 🎨 | *(fallback)* | 🎁 |

It's a placeholder, but a considered one — it keeps the grid rhythm intact and reads as intentional rather than broken.

### 3.6 Dark-mode inversion for the admin

The storefront is bone-on-obsidian-accent. The Engine Room inverts it: near-black shell, `bg-white/5` panels, `border-white/10` hairlines, `text-white/50` labels. Two products, one token set — the admin *feels* like the machine room precisely because it's the photographic negative of the shop.

---

## 4. Product Experience — Storefront

### 4.1 Route map

| Route | File | Rendering | Purpose |
|---|---|---|---|
| `/` | `src/app/page.tsx` → `home-client.tsx` | Server (`force-dynamic`) + client | Hero, countdown, featured, reviews, archive teaser, stats |
| `/shop` | `src/app/shop/page.tsx` → `shop-client.tsx` | Server + client | Full catalog, search, filters, sort |
| `/shop/[slug]` | `src/app/shop/[slug]/page.tsx` → `product-detail-client.tsx` | Server + client | Product detail, gallery, reviews, add to cart |
| `/archive` | `src/app/archive/page.tsx` → `archive-client.tsx` | Server + client | Past Volumes |
| `/checkout` | `src/app/checkout/page.tsx` | Client | Address form → Stripe |
| `/confirmation` | `src/app/confirmation/page.tsx` | Client (Suspense) | Order number receipt |
| `/admin` | `src/app/admin/page.tsx` | Client | The Engine Room |

Global chrome (`layout.tsx`): `CartProvider` → `Navbar` → `CartDrawer` → page. Footer is imported per-page rather than in the layout.

### 4.2 Homepage, section by section

1. **Hero** — obsidian gradient (`from-obsidian via-gray-900 to-obsidian`) with two radial indigo glows at 25%/25% and 75%/75%, 10% opacity. Rotating slide, dual CTA (*Shop* / *View Archive*), slide-indicator bars that widen when active.
2. **Countdown band** — only renders if an active Volume exists. Four mono tiles (days/hours/minutes/seconds) ticking every second toward a 14-day horizon.
3. **Seed prompt** — if the catalog is empty, a single card: *"Welcome to NORVANA — Seed the database with sample products, suppliers, and volumes to get started."* → `🌱 Seed Database` → `POST /api/seed` → reload. A genuinely nice first-run experience.
4. **Featured Products** — top 6 by rating, 3-up grid, staggered. Star rating, review count, price with strikethrough compare-at, up to 3 tags, inline *Add to Cart*.
5. **Testimonials** — 3 most recent reviews on bone cards, author initial avatar, `✓ Verified` badge.
6. **Archive teaser** — full-bleed obsidian `rounded-3xl` block, *"Explore Past Volumes."*
7. **Stats band** — the four numbers above.
8. **Footer** — brand mark, newsletter capture (`POST /api/subscribers`), Shop / Company link columns.

### 4.3 Shop

- **Search** across name, description, and tags (case-insensitive substring).
- **Niche filter** — derived at runtime from `[...new Set(products.map(p => p.niche))]`, so it never goes stale.
- **Tag filter** — same treatment, flattened across all products.
- **Sort** — `newest` (default) · `price-asc` · `price-desc` · `rating`.

All filtering is client-side over the full server-fetched list, memoized with `useMemo`. Fine at 12 products; see §17 for what happens at 1,200.

### 4.4 Cart

`cart-context.tsx` — React Context, no external state library.

- Persisted to `localStorage` under **`norvana-cart`**, rehydrated on mount behind a `loaded` guard so the first render doesn't clobber storage.
- API: `addItem` (merges quantity if the id already exists), `removeItem`, `updateQuantity`, `clearCart`, plus derived `itemCount` and `subtotal`, plus drawer `isOpen` / `setIsOpen`.
- `CartDrawer` is a slide-out panel; the navbar cart button carries the count badge.

### 4.5 Checkout → Confirmation

1. Customer fills name, email, shipping address.
2. Subtotal computed; shipping is **$0 above $75**, otherwise a flat rate.
3. `POST /api/checkout`.
4. Server creates the order row **first** with `NRV-XXXXXX`, then creates the Stripe session, then writes `stripeSessionId` back.
5. Browser redirects to Stripe's hosted page.
6. Success → `/confirmation?order=NRV-XXXXXX&session_id=...` → big ✅, mono order number, *"A confirmation email will be sent."*
7. Cancel → `/checkout?cancelled=true`.

**Graceful degradation:** if `STRIPE_SECRET_KEY` is absent, `isStripeConfigured()` returns false, the order is still created with `paymentStatus: "unpaid"`, and the API responds `{ fallback: true, message: "Order created without payment (Stripe not configured)" }`. The store is demoable with zero configuration.

---

## 5. Product Experience — The Engine Room (Admin)

`src/app/admin/page.tsx` — 882 lines, the single largest file in the project. Gated by a client-side password check against `ADMIN_PASSWORD = "norvana"`.

### 🔍 AI Scout
A chat-style product-research assistant over `POST /api/scout`. Keyword routing (not a real LLM — see §16):

| You ask about… | It returns |
|---|---|
| `trending` / `trend` | Candidates with `trendScore > 80` |
| `margin` / `profit` | Sorted by margin, highest first |
| `bestseller` / `best` | `badge === "bestseller"` |
| `new` / `arrival` | `badge === "new"` |
| anything else | Full list + a hint listing the four keywords |

The scouting dataset (`SCOUT_PRODUCTS`) is the product-sourcing thesis in table form:

| Candidate | Trend | Margin | Suppliers | Category | Badge |
|---|---|---|---|---|---|
| Ceramic Oil Diffuser | 92 | 68% | 4 | Home Fragrance | bestseller |
| Handwoven Storage Basket | 87 | 72% | 6 | Organization | new |
| Cork Yoga Mat | 85 | 55% | 3 | Wellness | new |
| Brass Candle Snuffer | 81 | 78% | 5 | Home Decor | bestseller |
| Linen Apron | 79 | 62% | 7 | Kitchen | — |
| Recycled Glass Vase | 76 | 65% | 4 | Home Decor | new |
| Shea Butter Hand Cream | 74 | 71% | 8 | Bath & Body | — |
| Wooden Cutting Board | 71 | 58% | 5 | Kitchen | bestseller |

### 🏭 Distributors
Lists the eight supported platforms as connect-cards, plus CRUD for supplier records and a **Connect** modal that renders exactly the credential fields a given platform declares in `requiredFields`. Actions: add, edit, delete, save credentials, test connection, sync catalog.

### 📦 Orders
Order table with status, payment status, customer, total. Per-order **Fulfill** action → `POST /api/orders/:id/fulfill`.

### 💳 Payments
Stripe configuration status, and a reference panel listing the webhook events the app handles.

### 📊 Analytics
Four KPI tiles — Products (indigo), Orders (green), Subscribers (yellow), Revenue (purple) — plus a **Sales by Niche** breakdown driven by a raw SQL `GROUP BY p.niche`.

### 📝 Progress
The built-in tracker. Create notes with `type` (task/note/…), `title`, `content`, `priority` (low/medium/high), `category`, `status` (open/…), `dueDate`. Export the whole log to Markdown via `GET /api/progress/export`.

### 🔧 Self-Healing Debugger
Runs an eight-point diagnostic scan, records it to `debug_logs`, snapshots files into `code_backups`, and can restore. The eight checks:

| Check | Behaviour in current build |
|---|---|
| Database connection | always pass |
| API routes responding | always pass |
| Schema integrity | always pass |
| Environment variables | always pass |
| Memory usage | 80% pass (randomized) |
| Query performance | 70% pass |
| Cache validity | 85% pass |
| Error rate threshold | 90% pass |

Status rolls up: 0 issues → `passed`, 1–2 → `warnings`, 3+ → `errors`. Scan history is listed in the tab. **This is a simulation, not real telemetry** (§16).

---

## 6. System Architecture

### 6.1 Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Next.js App Router | 16.2.6 |
| UI | React | 19.2.6 |
| Language | TypeScript | 5.9.3 |
| Styling | Tailwind CSS (v4, `@theme`) | 4.1.17 |
| Animation | Framer Motion | ^12.42.2 |
| Database | PostgreSQL | — |
| ORM | Drizzle ORM | 0.45.2 |
| Migrations | drizzle-kit | 0.31.10 |
| Driver | `pg` | 8.20.0 |
| Payments | `stripe` + `@stripe/stripe-js` | ^22.3.2 / ^9.10.0 |
| IDs | `uuid` | ^14.0.1 |
| Lint | ESLint + `eslint-config-next` | 9.39.4 |

> Note: `package.json` still carries the scaffold name **`nextjs-postgresql-template`** — it was never renamed to `norvana`.

### 6.2 Topology

```
                         ┌───────────────────────────┐
   Browser ─────────────▶│  Next.js App Router       │
   (bone UI)             │  ├─ RSC pages (dynamic)   │
                         │  ├─ Client components     │
                         │  └─ /api/* route handlers │
                         └────────┬──────────┬───────┘
                                  │          │
                      Drizzle ORM │          │ fetch()
                                  ▼          ▼
                        ┌──────────────┐  ┌──────────────────────┐
                        │ PostgreSQL   │  │ Stripe API           │
                        │ (Neon / VPS) │  │ Shopify Admin API    │
                        │ 13 tables    │  │ Printful API         │
                        └──────────────┘  │ CJ Dropshipping API  │
                                ▲         └──────────┬───────────┘
                                │                    │
                                └──── webhooks ──────┘
                                  /api/webhooks/stripe
```

### 6.3 Rendering strategy

Every data-backed page is `export const dynamic = "force-dynamic"` — no ISR, no static generation, every request hits Postgres. Deliberate for an admin-heavy app with live inventory; a caching layer is future work (§17).

### 6.4 Error philosophy: never white-screen

The homepage wraps all four of its queries in a single `try { … } catch { /* Tables may not exist yet */ }`. If the database is unreachable or unmigrated, the page renders the seed prompt instead of a 500. Stripe is optional. Suppliers without credentials are skipped, not fatal. **The app is designed to boot with nothing configured** — that's what makes the one-click Vercel deploy in the README actually work.

### 6.5 Path aliasing

`tsconfig.json` maps `@/*` → `./src/*`. Used consistently: `@/db`, `@/db/schema`, `@/lib/stripe`, `@/components/...`.

---

## 7. Data Model

13 tables, defined in `src/db/schema.ts`.

### 7.1 Entity relationships

```
niche_volumes ──(volumeNumber)──┐
                                 ▼
suppliers ──(supplierId)──▶ products ◀──(productId)── reviews
    │                           │
    │                           └──(localProductId)──┐
    ├──▶ supplier_credentials                        │
    ├──▶ supplier_products ───────────────────────────┘
    └──▶ supplier_orders ◀──(orderId)── orders ──▶ payments
                                          ▲
                                          └── /api/webhooks/stripe

subscribers   progress_notes   debug_logs ──(scanId)──▶ code_backups
```

### 7.2 Commerce core

**`products`**

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `name` | varchar(255) | |
| `slug` | varchar(255) **unique** | URL key |
| `description` | text | default `""` |
| `price` | real | retail |
| `compare_at_price` | real nullable | strikethrough price |
| `cost` | real default 0 | **wholesale cost — margin tracking** |
| `niche` | varchar(100) default `general` | drives filters + emoji |
| `volume_number` | integer default 1 | Volume membership |
| `status` | varchar(50) default `active` | |
| `supplier_id` | integer | → suppliers |
| `supplier_sku` | varchar(100) | SKU at the supplier |
| `images` | json `string[]` | |
| `rating` | real default 0 | denormalized |
| `review_count` | integer default 0 | denormalized |
| `inventory` | integer default 100 | |
| `tags` | json `string[]` | |
| `created_at` | timestamp | |

**`reviews`** — `product_id`, `author`, `rating`, `title`, `body`, `verified`, `created_at`.

**`orders`** — `order_number` (unique, `NRV-…`), customer name/email, `shipping_address` (single text field, comma-delimited), `items` (JSON `OrderItem[]`), `subtotal` / `shipping` / `total`, `status` (pending → processing → …→ cancelled), `payment_status` (unpaid / pending / paid / failed / refunded), `stripe_payment_intent_id`, `stripe_session_id`, `supplier_order_ids` (JSON map).

```ts
type OrderItem = {
  productId: number; name: string; price: number; quantity: number;
  image?: string; supplierId?: number; supplierSku?: string;
};
```

**`payments`** — `order_id`, `stripe_payment_intent_id`, `stripe_session_id`, `amount` **in cents (integer)**, `currency`, `status`, `customer_email`, `receipt_url`, `metadata`.

**`niche_volumes`** — `volume_number`, `niche`, `description`, `hero_image`, `start_date`, `end_date` (all varchar dates), `is_active`.

**`subscribers`** — `email` with a unique index `subscribers_email_idx`.

### 7.3 Supplier subsystem

**`suppliers`** — `name`, `type` (`manual` | `api` | `dropship` | `wholesale`), `platform` (shopify / printful / …), `url`, `contact_email`, `notes`, `niches` (JSON), `is_active`, **`auto_fulfill`**.

**`supplier_credentials`** — `api_key`, `api_secret`, `access_token`, `refresh_token`, `shop_domain`, `webhook_secret`, `expires_at`, `additional_config`. Schema comment: *"encrypted in production"* — **currently plaintext** (§16).

**`supplier_products`** — the sync mirror: `external_id`, `sku`, `name`, `description`, `wholesale_price`, `retail_price`, `inventory`, `category`, `images`, `variants`, `is_imported`, `local_product_id`, `last_sync_at`.

```ts
type ProductVariant = {
  id: string; name: string; sku?: string;
  price: number; inventory: number; options: Record<string, string>;
};
```

**`supplier_orders`** — `order_id`, `supplier_id`, `external_order_id`, `status` (pending → submitted → confirmed → shipped → delivered | failed), `tracking_number`, `tracking_url`, `shipping_carrier`, `items`, `total_cost`, `response` (raw API payload), `error_message`, `submitted_at`.

### 7.4 Operations subsystem

**`debug_logs`** — `scan_id`, `status`, `summary`, `issues[]`, `backup_created`, `fixes_applied`, `duration`.
**`code_backups`** — `scan_id`, `file_path`, `content`, `checksum`.
**`progress_notes`** — `type`, `title`, `content`, `status`, `priority`, `category`, `due_date`.

---

## 8. API Surface — Complete Reference

28 route handlers under `src/app/api/`.

### Catalog
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/products` | List products |
| `POST` | `/api/products` | Create product |
| `GET` | `/api/products/[slug]` | Single product by slug |
| `GET` | `/api/volumes` | List Volumes |
| `GET` | `/api/reviews` | List reviews |
| `POST` | `/api/reviews` | Create review |

### Commerce
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/checkout` | Create order + Stripe session (falls back if Stripe unset) |
| `GET` | `/api/orders` | List orders |
| `POST` | `/api/orders` | Create order |
| `GET` | `/api/orders/[id]` | Single order |
| `POST` | `/api/orders/[id]/fulfill` | **Route order to suppliers** |
| `POST` | `/api/webhooks/stripe` | Signature-verified Stripe events |

### Suppliers
| Method | Route | Description |
|---|---|---|
| `GET` / `POST` | `/api/suppliers` | List / create |
| `GET` / `PATCH` / `DELETE` | `/api/suppliers/[id]` | Read / update / delete |
| `GET` / `POST` | `/api/suppliers/[id]/credentials` | Read / save credentials |
| `POST` | `/api/suppliers/[id]/sync` | Pull catalog into `supplier_products` |
| `GET` / `POST` | `/api/suppliers/[id]/products` | Browse synced products / import to local catalog |
| `GET` | `/api/platforms` | The eight `SUPPORTED_PLATFORMS` descriptors |

### Operations
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness |
| `GET` | `/api/analytics` | Counts, revenue, niche breakdown |
| `POST` | `/api/scout` | AI Scout query |
| `POST` | `/api/seed` | **TRUNCATE + reseed everything** |
| `POST` | `/api/subscribers` | Newsletter signup |
| `GET` / `POST` | `/api/progress` | List / create notes |
| `PATCH` / `DELETE` | `/api/progress/[id]` | Update / delete note |
| `GET` | `/api/progress/export` | Markdown export |
| `POST` | `/api/debugger/scan` | Run diagnostic scan |
| `GET` | `/api/debugger/history` | Past scans |
| `POST` | `/api/debugger/restore` | Restore from `code_backups` |

---

## 9. Supplier Integration Layer

`src/lib/supplier-integrations.ts` — 558 lines, the most sophisticated module in the codebase.

### 9.1 The eight declared platforms

| id | Name | Logo | Required fields | Niches | Connector implemented? |
|---|---|---|---|---|---|
| `shopify` | Shopify | 🛒 | `shopDomain`, `accessToken` | all | ✅ **Full** |
| `printful` | Printful | 👕 | `apiKey` | apparel, home-decor, accessories | ✅ **Full** |
| `cjdropshipping` | CJ Dropshipping | 📦 | `apiKey` | all | ✅ **Full** |
| `faire` | Faire | 🏪 | `apiKey`, `apiSecret` | home-decor, kitchen, wellness, beauty | ⬜ declared only |
| `alibaba` | Alibaba | 🏭 | `apiKey`, `apiSecret` | all | ⬜ declared only |
| `spocket` | Spocket | 🚚 | `accessToken` | all | ⬜ declared only |
| `modalyst` | Modalyst | ✨ | `apiKey` | fashion, home-decor, beauty | ⬜ declared only |
| `manual` | Manual | 📋 | — | all | n/a (human process) |

`createSupplierConnector(platform, credentials)` returns a connector for the three implemented platforms and `null` otherwise; `/api/orders/:id/fulfill` reports `"Platform not supported"` for the rest. Adding Faire is a single new class plus one `case` — the abstraction holds.

### 9.2 Connector details

**ShopifySupplierConnector** — talks to `https://{shopDomain}/admin/api/2024-01`, auth via `X-Shopify-Access-Token`.
- `testConnection` → `GET /shop.json`, returns `Connected to {shop.name}`.
- `syncProducts` → `GET /products.json?limit=50` (or `?page_info=` cursor); maps title/body_html/variants; inventory = sum of variant quantities; full variant mapping including `option1..3`.
- `submitOrder` → `POST /orders.json`; splits `name` into first/last; maps `state` → `province`; sets `financial_status: "paid"`; writes our order number into `note` as `Reference: NRV-…`.
- `getOrderStatus` → reads `fulfillment_status` + first fulfillment's tracking number.
- `getInventory` → per-product loop summing variant quantities (N+1 — see §17).

**PrintfulConnector** — `https://api.printful.com`, Bearer auth.
- Print-on-demand semantics: `inventory: 999` always, `wholesalePrice: 0` (Printful prices at order time), `category: "print-on-demand"`, `getInventory()` returns `{}`.
- `submitOrder` → `POST /orders` with a `recipient` block and `sync_variant_id` line items; our order number goes in `external_id`.

**CJDropshippingConnector** — `https://developers.cjdropshipping.com/api2.0`, `CJ-Access-Token` header.
- `syncProducts` → `POST /v1/product/list` with `{ pageNum, pageSize: 50 }`; maps `pid` / `productNameEn` / `sellPrice`; **retail price is heuristically `sellPrice × 2`**; images are a semicolon-delimited string that gets split.
- `getOrderStatus` → `GET /v1/shopping/order/getOrderDetail?orderId=…`.
- `getInventory` → returns 999 per id (CJ manages stock).

### 9.3 Shared contracts

`SupplierCredentials` · `SyncedProduct` · `ProductSyncResult` · `OrderSubmitPayload` · `OrderSubmitResult`. Every connector method returns a result object rather than throwing — failures are values, so the fulfillment loop can keep going and record a per-supplier error instead of aborting the whole order.

---

## 10. Payments & Order Lifecycle

### 10.1 Stripe configuration

```ts
STRIPE_CONFIG = {
  currency: "usd",
  paymentMethods: ["card"],
  successUrl: "/confirmation",
  cancelUrl: "/checkout",
}
```

`stripe` is `null` unless `STRIPE_SECRET_KEY` is present; `isStripeConfigured()` guards every call site.

### 10.2 Checkout session

- `mode: "payment"`, `customer_email` prefilled.
- Line items built inline from cart (`unit_amount: Math.round(price * 100)`) — no Stripe Product/Price catalog needed.
- One `shipping_option`: fixed amount, display name flips to **"Free Shipping"** when `shipping === 0`, delivery estimate 5–10 business days.
- `metadata: { orderId, orderNumber }` — this is the join key the webhook relies on.

### 10.3 Webhook handling

`POST /api/webhooks/stripe`, verified with `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`.

| Event | Effect |
|---|---|
| `checkout.session.completed` | order → `paymentStatus: paid`, `status: processing`, store payment intent; insert `payments` row (`succeeded`) |
| `payment_intent.succeeded` | retrieve latest charge, backfill `receipt_url` onto the payment |
| `payment_intent.payment_failed` | order → `paymentStatus: failed` |
| `charge.refunded` | order → `paymentStatus: refunded`, `status: cancelled`; payment → `refunded` |

### 10.4 Fulfillment algorithm

`POST /api/orders/[id]/fulfill`:

1. Load order; **404** if missing; **400** if `paymentStatus !== "paid"`.
2. Parse `shippingAddress` by splitting on `", "` → `[address1, city, "STATE ZIP"]`, country hardcoded `"US"`.
3. For each order item, look up the product to find its `supplierId`; bucket items into `itemsBySupplier`.
4. For each supplier bucket:
   - `type === "manual"` → record `{ status: "manual", message: "Manual processing required" }`, continue.
   - no credentials → `{ status: "error", message: "No credentials" }`, continue.
   - `createSupplierConnector(...)` returns null → `"Platform not supported"`, continue.
   - otherwise `connector.submitOrder(payload)`.
5. Insert a `supplier_orders` row per supplier regardless of outcome — success, failure, raw response, and error message are all persisted.
6. Write the `supplierOrderIds` map onto the order; set order status to `processing` only if **every** bucket either succeeded or is manual, else leave `pending`.
7. Return `{ orderId, fulfillmentResults, supplierOrderIds }`.

---

## 11. Seed Data — The Catalog as Designed

`POST /api/seed` truncates `products, reviews, suppliers, niche_volumes, subscribers` with `RESTART IDENTITY CASCADE`, then inserts suppliers → products (round-robin supplier assignment) → 2–4 random reviews per product → 3 Volumes → one subscriber (`demo@norvana.co`).

### 11.1 The twelve products

| # | Product | Price | Compare | Niche | Vol | ★ | Reviews | Stock |
|---|---|---|---|---|---|---|---|---|
| 1 | Midnight Orchid Candle | $34 | $42 | home-fragrance | I | 4.8 | 124 | 85 |
| 2 | Ceramic Pour-Over Set | $68 | $85 | kitchen | I | 4.9 | 89 | 42 |
| 3 | Linen Throw Blanket | $120 | $155 | home-decor | I | 4.7 | 67 | 33 |
| 4 | Japanese Incense Set | $28 | — | home-fragrance | I | 4.6 | 203 | 150 |
| 5 | Leather Journal | $48 | $60 | stationery | I | 4.8 | 167 | 55 |
| 6 | Minimalist Desk Organizer | $54 | $65 | workspace | II | 4.5 | 45 | 60 |
| 7 | Hand-Thrown Mug Set | $42 | $56 | kitchen | II | 4.8 | 156 | 72 |
| 8 | Botanical Print Set | $38 | — | art | II | 4.4 | 31 | 95 |
| 9 | Brass Plant Mister | $32 | — | garden | II | 4.5 | 88 | 110 |
| 10 | Copper Watering Can | $78 | $95 | garden | III | 4.9 | 78 | 25 |
| 11 | Wool Meditation Cushion | $65 | — | wellness | III | 4.7 | 92 | 48 |
| 12 | Artisan Soap Trio | $24 | $30 | bath | III | 4.6 | 341 | 200 |

Price band **$24–$120**, median ~$45 — comfortably above the $75 free-shipping threshold for a two-item basket, which is exactly what the threshold is designed to encourage. Five products carry a `bestseller` tag, three carry `new`.

Nine niches: `home-fragrance`, `kitchen`, `home-decor`, `workspace`, `art`, `garden`, `wellness`, `bath`, `stationery`.

### 11.2 The fifteen seed suppliers

Real, recognizable independent-design brands — the sourcing thesis made concrete:

| Supplier | Site | Note |
|---|---|---|
| Epoch Candle Co. | epochcandles.com | MOQ 50 units. Lead time 2–3 weeks. |
| Hasami Porcelain | hasami-porcelain.com | Japanese porcelain. Ships from LA warehouse. |
| Fog Linen Work | foglinenwork.com | Lithuanian linen. Seasonal collections. |
| Nippon Kodo | nipponkodo.com | Japanese incense manufacturer since 1575. |
| Grovemade | grovemade.com | Portland-based. Desk accessories and organizers. |
| East Fork Pottery | eastfork.com | Asheville NC. Reactive glazes. Popular. |
| Rifle Paper Co. | riflepaperco.com | Botanical prints and stationery. |
| Haws Watering Cans | haws.co.uk | British heritage brand. Copper and zinc. |
| Organic Cushions Co. | organiccushions.com | Buckwheat and kapok fills. Fair trade. |
| Herbivore Botanicals | herbivorebotanicals.com | Natural bath & body. Seattle. |
| Leuchtturm1917 | leuchtturm1917.com | German-made notebooks. Multiple formats. |
| Schoolhouse | schoolhouse.com | Lighting and home goods. Portland OR. |
| Vitruvi | vitruvi.com | Essential oil diffusers and blends. |
| Sabre Paris | sabre.fr | French flatware and cutlery. Bold colors. |
| HAY Design | hay.dk | Danish design. Home accessories and furniture. |

### 11.3 Review templates

Five canned reviews (Sarah M. ★5, James K. ★4, Emily R. ★5, Michael D. ★4 unverified, Lisa T. ★5), sampled 2–4 per product.

---

## 12. Complete File Map

```
norvana/
├── NORVANA-MASTER.md            ← this document
├── README.md                     Quick start, features, env vars, admin creds
├── VERCEL-DEPLOYMENT.md          63 lines — free-tier path
├── IONOS-DEPLOYMENT.md          382 lines — full VPS runbook
├── package.json                  (still named "nextjs-postgresql-template")
├── next.config.ts                empty config
├── vercel.json                   framework nextjs, region iad1, telemetry off
├── drizzle.config.json           ⚠️ contains a hardcoded Neon URL
├── tsconfig.json                 @/* → ./src/*
├── eslint.config.mjs · postcss.config.mjs · next-env.d.ts
├── scripts/
│   └── export-for-ionos.sh       tarball builder for VPS upload
└── src/
    ├── app/
    │   ├── layout.tsx            fonts, metadata, CartProvider/Navbar/CartDrawer
    │   ├── page.tsx              homepage RSC (4 queries, all in one try/catch)
    │   ├── globals.css           the entire design system (68 lines)
    │   ├── shop/page.tsx · shop/[slug]/page.tsx
    │   ├── archive/page.tsx
    │   ├── checkout/page.tsx     237 lines
    │   ├── confirmation/page.tsx
    │   ├── admin/page.tsx        882 lines — the Engine Room
    │   └── api/                  28 route handlers (see §8)
    ├── components/
    │   ├── navbar.tsx            107 — Home/Shop/Archive, cart badge, mobile menu
    │   ├── footer.tsx             75 — brand, newsletter, link columns
    │   ├── cart-context.tsx       98 — Context + localStorage("norvana-cart")
    │   ├── cart-drawer.tsx       128 — slide-out
    │   ├── home-client.tsx       353 — hero, countdown, featured, reviews, stats
    │   ├── shop-client.tsx       216 — search + niche/tag filters + sort
    │   ├── product-detail-client.tsx 262
    │   └── archive-client.tsx     83
    ├── db/
    │   ├── index.ts               25 — pg Pool + drizzle
    │   └── schema.ts             227 — 13 tables + 3 shared types
    └── lib/
        ├── constants.ts          253 — brand, threshold, all seed data
        ├── stripe.ts              19 — optional client + config
        ├── debugger.ts            45 — the 8-point simulated scan
        └── supplier-integrations.ts 558 — connectors + factory + platform registry
```

**Totals:** 61 files · 5,765 lines · `src/` alone is 5,118 lines across 57 files.

---

## 13. Running It Locally

```bash
git clone https://github.com/norrijam405/norvana.git
cd norvana
npm install

cat > .env <<'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/norvana_db
# optional — the store runs without these
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EOF

npx drizzle-kit push        # create the 13 tables
npm run dev                 # http://localhost:3000
```

Then open the homepage and click **🌱 Seed Database** (or `curl -X POST localhost:3000/api/seed`).

| Script | Does |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm start` | Serve the build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

Admin: `/admin`, password `norvana`.

---

## 14. Deployment — Vercel

The path the README advertises (one-click deploy button).

1. Push to GitHub.
2. vercel.com → **Add New Project** → import `norvana`.
3. Environment variables: `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
4. Deploy. `vercel.json` pins region **`iad1`** and disables telemetry.
5. Database: **Neon** free tier → copy the connection string into `DATABASE_URL`.
6. Custom domain: Vercel **Settings → Domains**, then add the shown records in IONOS **Domains & SSL → DNS Settings**.
7. Stripe webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`.

Cost: **$0** on free tiers.

---

## 15. Deployment — IONOS VPS

The self-hosted path (`IONOS-DEPLOYMENT.md`, 382 lines). Chosen because NORVANA needs SSR, API routes, and Postgres — IONOS "Deploy Now" static hosting can't serve it.

| Option | SSR | Price |
|---|---|---|
| **VPS (recommended)** | ✅ | ~$2–10/mo |
| Cloud Server | ✅ | ~$10+/mo |
| Deploy Now (static) | ❌ | Free–$5/mo |

**Runbook, condensed:**

1. Buy VPS Linux (Ubuntu 22.04/24.04), min **1 vCPU / 2 GB RAM / 20 GB SSD** (~$6/mo).
2. DNS: A records for `@` and `www` → VPS IP.
3. `ssh root@VPS_IP`.
4. `apt update && upgrade`; install `curl git nginx certbot python3-certbot-nginx ufw`; `ufw allow OpenSSH` + `'Nginx Full'` + `enable`; Node 20 LTS via NodeSource; `npm i -g pm2`.
5. PostgreSQL: install, enable, `CREATE USER norvana` / `CREATE DATABASE norvana_db OWNER norvana` / grant.
6. `/var/www/norvana` → clone or `scp`; `npm install`; write `.env`; `npm run build`; `npx drizzle-kit push`; `curl -X POST localhost:3000/api/seed`.
7. PM2 `ecosystem.config.js` — name `norvana`, `npm start`, port 3000, autorestart, `max_memory_restart: 500M`; `pm2 save`; `pm2 startup systemd`.
8. Nginx reverse proxy → `localhost:3000` with the standard upgrade/forwarded headers; symlink to `sites-enabled`; remove default; `nginx -t`; reload.
9. `certbot --nginx -d yourdomain.com -d www.yourdomain.com` (Let's Encrypt, auto-renew).
10. Stripe webhook → `https://yourdomain.com/api/webhooks/stripe`, subscribe to `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`.

**CI/CD** — a ready-made `.github/workflows/deploy.yml` using `appleboy/ssh-action` on push to `main`: pull → install → build → `drizzle-kit push` → `pm2 restart norvana`. Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`. *(Not yet present in the repo — it's documented but uncreated.)*

**Ops one-liners:** `pm2 logs norvana` · `pm2 restart norvana` · `pg_dump -U norvana norvana_db > backup_$(date +%Y%m%d).sql` · `certbot renew`.

**Running cost:** VPS ~$6/mo + domain ~$12/yr + free SSL ≈ **$7/mo**.

`scripts/export-for-ionos.sh` packages the project (excluding `.git`, `node_modules`, `.next`, `*.log`) into `norvana-deploy.tar.gz` for manual upload.

---

## 16. Security Audit & Known Gaps

Honest accounting. NORVANA is an impressive, coherent prototype; these are the things standing between it and taking real money.

### 🔴 Critical — fix before any real traffic

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 | **Live Neon Postgres connection string committed to the repo**, including password `npg_nyuxZlFi53hT`, in a **public** repository | `drizzle.config.json` | Rotate the Neon password immediately. Replace with `process.env.DATABASE_URL` and convert the file to `drizzle.config.ts`. Assume the credential is compromised — it's been public since the initial push. |
| 2 | **Admin password is a client-side string comparison** against `ADMIN_PASSWORD = "norvana"`, which is bundled into the JS sent to every visitor | `src/lib/constants.ts`, `src/app/admin/page.tsx` | Move auth server-side: middleware + httpOnly session cookie, hashed secret from env. |
| 3 | **Every `/api/*` route is unauthenticated.** Anyone can `POST /api/seed` and wipe the catalog, read `/api/suppliers/:id/credentials`, or `POST /api/orders/:id/fulfill` | all of `src/app/api/` | Add an auth guard to all mutating and admin routes; hard-disable `/api/seed` when `NODE_ENV === "production"`. |
| 4 | **Supplier API credentials stored in plaintext** despite the schema comment saying "encrypted in production" | `supplier_credentials` | Encrypt at rest (libsodium / KMS / `pgcrypto`); never return secrets from the GET endpoint — return a masked presence flag. |
| 5 | **`/api/seed` runs `TRUNCATE … RESTART IDENTITY CASCADE`** with no auth and no confirmation | `src/app/api/seed/route.ts` | Auth + environment gate + explicit confirm token. |

### 🟠 Important

| # | Issue | Detail |
|---|---|---|
| 6 | Client-trusted pricing | `/api/checkout` accepts `items`, `subtotal`, `shipping`, `total` straight from the browser and bills Stripe on them. A crafted request buys a $120 blanket for $1. **Recompute every amount server-side from the DB.** |
| 7 | Inventory never decrements | Nothing writes `products.inventory` down on a paid order. Overselling is guaranteed. |
| 8 | Order number collision risk | `Math.random().toString(36).substring(2,8)` → ~2 billion combinations with no retry on unique-violation. Use `nanoid`/ULID or a DB sequence. |
| 9 | Shipping address is one text blob | `fulfill` parses it by splitting on `", "` and hardcodes `country: "US"`. Any address with a comma in the street line silently produces a wrong supplier order. Store structured fields. |
| 10 | Webhook is not idempotent | Stripe retries. `checkout.session.completed` would insert duplicate `payments` rows. Key on `event.id` or upsert on the payment intent. |
| 11 | Ratings are denormalized and never recalculated | Posting a review doesn't update `products.rating` / `review_count`. |
| 12 | `/api/checkout` ignores `FREE_SHIPPING_THRESHOLD` | The threshold is applied client-side only. |
| 13 | No `.env.example`, no `.gitignore` visible in the tree | Makes credential leaks likelier (see #1). |

### 🟡 Worth knowing

| # | Item |
|---|---|
| 14 | **AI Scout is not AI.** It's `String.includes()` over eight hardcoded candidates. Genuinely useful as a UI shell; label it honestly or wire it to a real model + trend source. |
| 15 | **The Self-Healing Debugger doesn't heal anything.** Four checks always pass; four use `Math.random()`. `fixesApplied` is `Math.min(issues.length, 2)`. It's a convincing mock of an observability surface. |
| 16 | **No tests.** No test runner, no CI. |
| 17 | **5 of 8 declared platforms have no connector** (Faire, Alibaba, Spocket, Modalyst, and the Oberlo/WooCommerce entries in the `SupplierPlatform` union). The UI offers them; fulfillment returns "Platform not supported." |
| 18 | **No product images ship.** Emoji placeholders throughout. |
| 19 | **N+1 queries** — `fulfill` queries per item; Shopify `getInventory` fetches per product. |
| 20 | **No pagination anywhere.** `/api/products` returns everything; shop filtering is entirely client-side. |
| 21 | **Countdown timer is cosmetic** — always exactly 14 days from page load, not from `nicheVolumes.endDate`. |
| 22 | **Volume dates are `varchar`, not `date`** — no range queries, no ordering guarantees. |
| 23 | **`money` stored as `real`** (float) in `products`/`orders`. `payments.amount` correctly uses integer cents. Standardize on cents or `numeric`. |
| 24 | **`package.json` name** is still `nextjs-postgresql-template`. |
| 25 | **Confirmation promises an email** that no code sends. |
| 26 | **Contact email is a personal Gmail** in public docs. |
| 27 | **`suppliers.auto_fulfill` is defined but never read** — the auto-fulfillment loop it implies doesn't exist yet. |

---

## 17. Roadmap — From Here to Production

### Phase 0 — Stop the bleeding *(hours)*
1. Rotate the Neon password. Purge `drizzle.config.json` of the credential; move to env.
2. Add `.gitignore` (`.env*`, `node_modules`, `.next`) and `.env.example`.
3. Gate `/api/seed` behind auth + `NODE_ENV`.

### Phase 1 — Make it safe to take money *(days)*
4. Real server-side admin auth (middleware + httpOnly session + hashed env secret).
5. Auth guard on every mutating/admin API route.
6. **Recompute cart totals server-side** in `/api/checkout` from the products table.
7. Idempotent webhook handling keyed on `event.id`.
8. Decrement `inventory` on `checkout.session.completed`; reject out-of-stock at checkout.
9. Encrypt `supplier_credentials`; mask on read.
10. Collision-safe order numbers.

### Phase 2 — Make it real *(weeks)*
11. Structured shipping address (line1/line2/city/state/postal/country) end-to-end.
12. Transactional email — order confirmation, shipping notification, tracking (Resend/Postmark).
13. Real product photography + `next/image`; retire the emoji fallback.
14. Recalculate `rating`/`review_count` on review write; moderate reviews.
15. Server-side pagination + filtering on `/api/products`; keep the client UX identical.
16. Tests: Vitest for `lib/`, Playwright for cart → checkout → confirmation.
17. GitHub Actions CI (lint + typecheck + test) before the deploy workflow.

### Phase 3 — Deliver the promises *(weeks)*
18. **Faire connector** — highest-value missing integration for this exact niche (home-decor, kitchen, wellness).
19. Then Spocket, Modalyst, Alibaba, WooCommerce.
20. **Honor `auto_fulfill`** — trigger `/fulfill` automatically from the paid webhook for flagged suppliers.
21. Poll `getOrderStatus` on a cron; push tracking numbers to customers.
22. Replace the AI Scout stub with a real model + a real trend signal (Google Trends, marketplace bestseller feeds), scoring on live margin from `supplier_products.wholesale_price`.
23. Replace the simulated debugger with genuine health checks — DB latency, error-rate from logs, Stripe API reachability, per-connector connection tests — or rename it to what it is.

### Phase 4 — Grow *(ongoing)*
24. Drive the countdown from `nicheVolumes.endDate`; automate Volume rollover.
25. Customer accounts + order history.
26. Discount codes, gift cards, bundles.
27. SEO: per-product metadata, JSON-LD `Product` schema, sitemap, OG images.
28. Multi-currency and international shipping (the "12+ countries" claim).
29. Move Volume copy into a CMS so merchandising doesn't require a deploy.

---

## Appendix A — Glossary

| Term | Meaning in NORVANA |
|---|---|
| **Volume** | A time-boxed, themed collection (a quarter). Row in `niche_volumes`; every product carries `volumeNumber`. |
| **Archive** | Retired Volumes, browsable at `/archive`. |
| **Niche** | A product category (`home-fragrance`, `kitchen`, `garden`, …). Drives filters, emoji, analytics. |
| **Engine Room** | The admin panel at `/admin`. |
| **AI Scout** | Product-sourcing assistant tab; keyword-matched over `SCOUT_PRODUCTS`. |
| **Distributor / Supplier** | A source of goods. `manual` or API-connected via a platform connector. |
| **Connector** | A class implementing `SupplierConnector` for one platform. |
| **Fulfillment** | Splitting a paid order by supplier and submitting each part via its connector. |
| **Self-Healing Debugger** | Diagnostic tab: scan → log → backup → restore. Currently simulated. |
| **Progress note** | A task/note in the in-app tracker (`progress_notes`). |
| **NRV-XXXXXX** | Order number format. |
| **Bone / Obsidian / Indigo** | The three-color brand palette. |

---

## Appendix B — Arena.ai Conversation History

**Status: not captured — needs your input.**

You asked me to pull the NORVANA information from arena.ai as well as GitHub. I need to be straight with you about what I could and couldn't do:

- ✅ **GitHub / the repository** — fully captured. Everything above comes from a complete read of all 61 files at commit `fb07868`, plus the repo metadata, commit history, issues (none), and pull requests (none) via the GitHub API.
- ❌ **Arena.ai chat history** — I can't reach it. I run inside a sandbox with access to this Git checkout and the public web; I have no credentials for, or API access to, your Arena account, and your conversation history isn't exposed to me as a readable source. It's a privacy boundary, not something I can work around.

**Three ways to fill this section in — pick whichever is easiest:**

1. **Paste the conversations into the chat.** Even roughly — I'll organize, deduplicate, and weave them into the relevant sections above (concept notes into §1, design decisions into §3, and so on).
2. **Attach an export.** If Arena lets you export or copy a thread to a file, attach it and I'll merge it in.
3. **Tell me the story in your own words.** Where the name came from, why Volumes, what you tried and rejected, what you want it to become. That's often better source material than a transcript anyway — and it's the one part of this document that genuinely can't be reverse-engineered from code.

Things the code *can't* tell me, that I'd love to add:

- The origin of the name **NORVANA** and what it's meant to evoke.
- Why **quarterly Volumes** specifically — and whether that came before or after the catalog.
- Whether **bone + obsidian + indigo** was chosen or arrived at, and what was rejected.
- Whether there was ever a real business plan behind it — target customer, margin targets, launch timing.
- What the **AI Scout** was *supposed* to be before it became a keyword matcher.
- Why the **Progress tracker** got built into the product itself.
- What **IONOS** is for — an existing domain? an existing hosting account?
- Which ideas were cut, and why.

Once you give me any of that, I'll fold it in and reissue this file as a complete beginning-to-end record.

---

<div align="center">

**NORVANA** — *Curated Objects for Intentional Living*

Master document compiled 2026-09-26 · Source: `norrijam405/norvana` @ `fb07868` · Branch `arena/01a0db6a-norvana`

</div>
