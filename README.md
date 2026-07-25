# NORVANA — Curated Commerce Platform

A fullstack e-commerce platform built with Next.js, PostgreSQL, and Stripe.

## Features

- 🛒 **Shop** — Filterable product catalog with search
- 🛍️ **Cart** — Slide-out drawer with localStorage persistence  
- 💳 **Payments** — Stripe Checkout integration
- 📦 **Orders** — Order management with status tracking
- 🏭 **Suppliers** — Multi-distributor integration system
- 🔐 **Admin** — Password-protected dashboard

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL + Drizzle ORM
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Payments:** Stripe

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/database
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Getting Started

```bash
npm install
npm run dev
```

## Admin Access

- **URL:** `/admin`
- **Password:** `norvana`

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/norvana)
