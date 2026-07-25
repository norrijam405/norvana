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
  tags: string[];
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
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold">Shop</h1>
            <p className="text-muted mt-2">Browse our curated collection of artisan goods.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
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
              <option value="">All Niches</option>
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
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-muted">No products found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card group hover:shadow-md transition-all"
                >
                  <Link href={`/shop/${product.slug}`}>
                    <div className="aspect-square bg-surface-hover rounded-xl flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-300">
                      {PRODUCT_EMOJIS[product.niche] || "🎁"}
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={`text-xs ${s <= Math.round(product.rating) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                          ))}
                        </div>
                        <span className="text-xs text-muted">({product.reviewCount})</span>
                      </div>
                      <h3 className="font-display text-base font-semibold mt-2 group-hover:text-indigo-accent transition-colors line-clamp-1">
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
                  </Link>
                  <button
                    onClick={() => addItem({ id: product.id, name: product.name, price: product.price, slug: product.slug })}
                    className="btn-primary w-full mt-4 text-sm py-2.5"
                  >
                    Add to Cart
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
