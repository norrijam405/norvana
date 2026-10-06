"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCart } from "./cart-context";
import { Footer } from "./footer";

type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  niche: string;
  volumeNumber: number;
  images: string[];
  rating: number;
  reviewCount: number;
  commerceModel?: string;
  imageRightsState?: string;
  externalSellerName?: string | null;
  tags: string[];
  previewOnly?: boolean;
  accent?: string;
  icon?: string;
};

const PRODUCT_EMOJIS: Record<string, string> = {
  "home-fragrance": "🕯️",
  "kitchen": "☕",
  "home-decor": "🛋️",
  "workspace": "🖊️",
  "art": "🎨",
  "garden": "🌿",
  "wellness": "🧘",
  "bath": "🧼",
  "stationery": "📓",
  "grocery": "🥕",
  "food": "🍎",
  "produce": "🥬",
  "pets": "🐾",
  "pet": "🐾",
  "beauty": "✨",
  "skincare": "🧴",
  "family": "👨‍👩‍👧‍👦",
  "baby": "🍼",
  "kids": "🧸",
  "electronics": "🎧",
  "tech": "💻",
  "creator": "🎥",
  "fashion": "👟",
};

type SortOption = "newest" | "price-asc" | "price-desc" | "rating";

export function ShopClient({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [sort, setSort] = useState<SortOption>("newest");
  const { addItem } = useCart();

  const niches = useMemo(() => [...new Set(products.map((p) => p.niche))], [products]);
  const allTags = useMemo(() => [...new Set(products.flatMap((p) => p.tags))], [products]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedNiche) {
      result = result.filter((p) => p.niche === selectedNiche);
    }

    if (selectedTag) {
      result = result.filter((p) => p.tags.includes(selectedTag));
    }

    switch (sort) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return result;
  }, [products, search, selectedNiche, selectedTag, sort]);

  return (
    <>
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 rounded-[2rem] border border-soil/10 bg-cream p-7 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Acre Era Goods</p>
            <h1 className="mt-3 max-w-4xl font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
              Everyday needs, useful finds, and the stuff worth coming back for.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
              Household basics, family, pets, beauty, home, market, style, tech and more. The shelf grows from real availability and real demand — not filler inventory.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
              {[
                ["🧺", "Everyday"],
                ["👨‍👩‍👧‍👦", "Family"],
                ["🐾", "Pets"],
                ["✨", "Beauty"],
                ["🏡", "Home"],
                ["🥕", "Market"],
                ["👟", "Style"],
                ["🎧", "Tech"],
              ].map(([icon, label]) => (
                <div key={label} className="rounded-xl border border-soil/10 bg-bone px-3 py-3">
                  <span className="text-xl">{icon}</span>
                  <span className="mt-1 block text-xs font-semibold text-soil">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search what you need..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="input md:w-48"
            >
              <option value="">All departments</option>
              {niches.map((n) => (
                <option key={n} value={n}>{n.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="input md:w-48"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* Tag Pills */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSelectedTag("")}
                className={`badge cursor-pointer transition-colors ${
                  !selectedTag ? "bg-indigo-accent text-white" : "bg-surface-hover text-muted hover:text-obsidian"
                }`}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                  className={`badge cursor-pointer transition-colors ${
                    selectedTag === tag ? "bg-indigo-accent text-white" : "bg-surface-hover text-muted hover:text-obsidian"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Results count */}
          <p className="text-sm text-muted mb-6">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>

          {/* Product Grid */}
          {filtered.length === 0 ? (
            <div className="grid gap-5 py-8 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-[2rem] border border-soil/10 bg-cream p-8 md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">Shelf in progress</p>
                <h2 className="mt-3 font-display text-3xl font-bold">We’re building the shelf with products worth carrying.</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
                  Acre Era is not filling empty space with pretend inventory. As real products and partners are qualified, they will show up here across everyday needs, pets, family, beauty, home, market, style and tech.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/market" className="btn-primary">Explore Market</Link>
                  <Link href="/#bring-it-here" className="btn-secondary">Tell us what you want</Link>
                </div>
              </div>
              <div className="rounded-[2rem] bg-soil p-8 text-cream md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wheat">Built for repeat life</p>
                <h3 className="mt-3 font-display text-2xl font-bold">Not just the flashy stuff.</h3>
                <p className="mt-3 text-sm leading-6 text-cream/70">
                  Dog food. Shampoo. School supplies. Kitchen basics. Produce. Chargers. Gifts. The goal is a useful store first, with rotating Eras making discovery fun.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product, i) => {
                const isAffiliate = product.commerceModel === "AFFILIATE_REFERRAL";
                const isPreview = product.previewOnly === true || product.commerceModel === "PREVIEW_ONLY";
                const imageRightsOk = ["OWNED", "BRAND_AUTHORIZED", "SUPPLIER_AUTHORIZED", "AFFILIATE_FEED_AUTHORIZED"].includes(product.imageRightsState || "");
                const displayImage = imageRightsOk ? product.images?.[0] : null;
                return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card group hover:shadow-md transition-all"
                >
                  <div>
                    <div
                      className={
                        "aspect-square overflow-hidden rounded-xl flex items-center justify-center text-5xl transition-transform duration-300 " +
                        (isPreview
                          ? "bg-gradient-to-br " + (product.accent || "from-[#4a4a42] to-[#8f7c55]")
                          : "bg-surface-hover group-hover:scale-105")
                      }
                    >
                      {displayImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={displayImage} alt={product.name} className="h-full w-full object-contain bg-white" referrerPolicy="no-referrer" />
                      ) : isPreview ? (
                        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-cream">
                          <span className="text-7xl drop-shadow-sm">{product.icon || PRODUCT_EMOJIS[product.niche] || "🎁"}</span>
                          <span className="mt-5 rounded-full border border-white/20 bg-black/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                            Preview concept
                          </span>
                        </div>
                      ) : (
                        PRODUCT_EMOJIS[product.niche] || "🎁"
                      )}
                    </div>
                    <div className="mt-4">
                      {isPreview ? (
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-leaf">
                          Preview shelf · not for sale
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span key={s} className={`text-xs ${s <= Math.round(product.rating) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                            ))}
                          </div>
                          <span className="text-xs text-muted">({product.reviewCount})</span>
                        </div>
                      )}
                      <h3 className="font-display text-base font-semibold mt-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted mt-1 line-clamp-2">{product.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-semibold">${product.price.toFixed(2)}</span>
                        {product.compareAtPrice && (
                          <span className="text-xs text-muted line-through">${product.compareAtPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isPreview ? (
                    <div className="mt-4 rounded-xl border border-soil/10 bg-bone px-4 py-3 text-center text-xs font-semibold text-muted">
                      Preview only — supplier not connected yet
                    </div>
                  ) : isAffiliate ? (
                    <Link href={`/shop/${product.slug}`} className="btn-primary w-full mt-4 text-sm py-2.5">
                      View at {product.externalSellerName || "partner"} →
                    </Link>
                  ) : (
                    <button
                      onClick={() => addItem({ id: product.id, name: product.name, price: product.price, slug: product.slug })}
                      className="btn-primary w-full mt-4 text-sm py-2.5"
                    >
                      Add to Cart
                    </button>
                  )}
                </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
