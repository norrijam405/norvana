"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCart } from "./cart-context";
import { Footer } from "./footer";
import { EvolvingField } from "./acre-era/evolving-field";
import { FarmLifeStory } from "./acre-era/farm-life-story";
import { BringItHere } from "./acre-era/bring-it-here";
import { ACRE_ERA_WORLDS } from "@/lib/acre-era/brand";

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  niche: string;
  images: string[];
  rating: number;
  reviewCount: number;
  tags: string[];
};

type Volume = {
  id: number;
  volumeNumber: number;
  niche: string;
  description: string;
  isActive: boolean;
};

type Review = {
  id: number;
  author: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
};

const PRODUCT_EMOJIS: Record<string, string> = {
  "home-fragrance": "🕯️",
  kitchen: "☕",
  "home-decor": "🛋️",
  workspace: "🖊️",
  art: "🎨",
  garden: "🌿",
  wellness: "🧘",
  bath: "🧼",
  stationery: "📓",
  grocery: "🥕",
  food: "🍎",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={rating.toFixed(1) + " out of 5 stars"}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? "text-ember" : "text-soil/15"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const { addItem } = useCart();
  const stage =
    product.reviewCount > 8
      ? "Customer signal building"
      : product.reviewCount > 0
        ? "Early buyer signal"
        : "New Find";

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(index * 0.06, 0.24) }}
      className="group rounded-[1.6rem] border border-soil/10 bg-cream p-4 shadow-[0_18px_50px_rgba(48,46,35,.06)] transition hover:-translate-y-1"
    >
      <Link href={"/shop/" + product.slug}>
        <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[1.25rem] bg-sage-wash text-6xl">
          <div className="absolute inset-0 acre-contours opacity-25" />
          <span className="relative transition-transform duration-300 group-hover:scale-110">
            {PRODUCT_EMOJIS[product.niche] || "📦"}
          </span>
          <span className="absolute left-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-soil backdrop-blur">
            {stage}
          </span>
        </div>
        <div className="pt-4">
          <div className="flex items-center gap-2">
            <StarRating rating={product.rating || 0} />
            <span className="text-xs text-muted">({product.reviewCount})</span>
          </div>
          <h3 className="mt-2 font-display text-lg font-bold text-soil">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="font-semibold text-soil">{"$"}{product.price.toFixed(2)}</span>
            {product.compareAtPrice ? (
              <span className="text-sm text-muted line-through">{"$"}{product.compareAtPrice.toFixed(2)}</span>
            ) : null}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-leaf">
            Open the passport →
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() =>
          addItem({ id: product.id, name: product.name, price: product.price, slug: product.slug })
        }
        className="btn-primary mt-4 w-full text-sm"
      >
        Add to cart
      </button>
    </motion.article>
  );
}

export function HomeClient({
  featuredProducts,
  activeVolume,
  recentReviews,
  stats,
}: {
  featuredProducts: Product[];
  activeVolume: Volume | null;
  recentReviews: Review[];
  stats: { products: number; orders: number; subscribers: number };
}) {
  return (
    <>
      <main>
        <section className="relative isolate overflow-hidden bg-soil text-cream">
          <EvolvingField />
          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 md:py-32 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-40">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-wheat">
                A new era for the everyday market
              </p>
              <h1 className="mt-5 max-w-4xl font-display text-5xl font-black leading-[.94] md:text-7xl lg:text-8xl">
                Common needs.
                <br />
                Curious finds.
                <br />
                <span className="text-wheat">Clear reasons.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-cream/70 md:text-lg">
                Acre Era brings groceries, local producers, practical goods, and rotating discoveries into one curated marketplace. We show what we know, what is still being proven, and why an item is being shown.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop" className="btn-primary">
                  Shop Acre Era
                </Link>
                <Link href="/market" className="btn-ghost-light">
                  Enter the Market
                </Link>
              </div>
            </div>

            <div className="self-end rounded-[2rem] border border-cream/15 bg-cream/[0.08] p-6 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">The Acre Era standard</p>
              <div className="mt-6 grid gap-4">
                {[
                  ["Why it’s here", "Every product should have a reason beyond “a supplier had it.”"],
                  ["What we know", "Product, delivery, and buying-experience signals stay separate."],
                  ["What’s changing", "Era Drops and customer requests continuously shape the catalog."],
                ].map(([title, copy]) => (
                  <div key={title} className="border-t border-cream/10 pt-4 first:border-0 first:pt-0">
                    <p className="font-display text-lg font-bold">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-cream/65">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-leaf">Shop by world</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-soil md:text-5xl">
                One marketplace. Different moods.
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-muted">
              The parent brand stays broad; the experience changes when the category changes.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ACRE_ERA_WORLDS.map((world, index) => (
              <motion.div
                key={world.slug}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={world.href} className="acre-world block h-full">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">{world.eyebrow}</p>
                  <h3 className="mt-4 font-display text-2xl font-bold">{world.label}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{world.description}</p>
                  <span className="mt-8 inline-block text-sm font-semibold">Explore →</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {activeVolume ? (
          <section id="era-drop" className="border-y border-soil/10 bg-wheat/[0.18]">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-soil font-display text-xl font-black text-wheat">
                  {activeVolume.volumeNumber}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Current Era Drop</p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-soil">{activeVolume.niche}</h2>
                  <p className="mt-2 max-w-2xl text-sm text-muted">{activeVolume.description}</p>
                </div>
                <Link href="/shop" className="btn-secondary">Explore this Era →</Link>
              </div>
            </div>
          </section>
        ) : null}

        {featuredProducts.length > 0 ? (
          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-leaf">Curated now</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-soil md:text-5xl">Worth a closer look.</h2>
              </div>
              <Link href="/shop" className="hidden text-sm font-semibold text-soil md:block">See all goods →</Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProducts.map((product, index) => (
                <ProductCard product={product} index={index} key={product.id} />
              ))}
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-soil/10 bg-cream p-8 text-center">
              <h2 className="font-display text-2xl font-bold">The catalog is being prepared.</h2>
              <p className="mt-2 text-sm text-muted">We will show products here only when catalog data is actually available.</p>
            </div>
          </section>
        )}

        <div className="mx-auto max-w-7xl space-y-8 px-4 pb-20 sm:px-6 lg:px-8">
          <FarmLifeStory />
          <BringItHere />
        </div>

        {recentReviews.length > 0 ? (
          <section className="border-y border-soil/10 bg-cream py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-leaf">Customer Voice</p>
              <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <h2 className="font-display text-3xl font-bold text-soil md:text-5xl">Signal, not decoration.</h2>
                <p className="max-w-lg text-sm leading-6 text-muted">
                  Product ratings stay separate from delivery and purchase experience on product pages.
                </p>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {recentReviews.slice(0, 3).map((review) => (
                  <article key={review.id} className="rounded-[1.5rem] border border-soil/10 bg-bone p-6">
                    <StarRating rating={review.rating} />
                    <h3 className="mt-4 font-display text-lg font-bold">{review.title}</h3>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted">{review.body}</p>
                    <div className="mt-5 flex items-center gap-2 text-xs">
                      <strong>{review.author}</strong>
                      {review.verified ? <span className="badge bg-leaf/10 text-leaf">Verified purchase</span> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-[2rem] border border-soil/10 bg-sage-wash p-8 md:grid-cols-3 md:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">Built to evolve</p>
              <h2 className="mt-2 font-display text-3xl font-bold">The catalog should earn repeat visits.</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 md:col-span-2">
              <div><strong className="text-2xl">{stats.products || 0}</strong><p className="mt-1 text-sm text-muted">catalog products</p></div>
              <div><strong className="text-2xl">Era Drops</strong><p className="mt-1 text-sm text-muted">rotating discovery lanes</p></div>
              <div><strong className="text-2xl">No silent ACT</strong><p className="mt-1 text-sm text-muted">curation does not equal supplier authority</p></div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
