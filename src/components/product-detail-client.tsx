"use client";

import { useState } from "react";
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
  images: string[];
  rating: number;
  reviewCount: number;
  inventory: number;
  tags: string[];
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
  "kitchen": "☕",
  "home-decor": "🛋️",
  "workspace": "🖊️",
  "art": "🎨",
  "garden": "🌿",
  "wellness": "🧘",
  "bath": "🧼",
  "stationery": "📓",
};

export function ProductDetailClient({
  product,
  reviews,
}: {
  product: Product;
  reviews: Review[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ author: "", rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(
      { id: product.id, name: product.name, price: product.price, slug: product.slug },
      quantity
    );
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reviewForm, productId: product.id }),
      });
      setSubmitted(true);
    } catch {
      // ignore
    }
    setSubmitting(false);
  };

  return (
    <>
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted mb-8">
            <Link href="/shop" className="hover:text-obsidian transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-obsidian">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="aspect-square bg-surface rounded-2xl border border-border flex items-center justify-center text-8xl"
            >
              {PRODUCT_EMOJIS[product.niche] || "🎁"}
            </motion.div>

            {/* Product Info (Sticky) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:sticky md:top-24 md:self-start"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span key={i} className={`${i <= Math.round(product.rating) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                  ))}
                </div>
                <span className="text-sm text-muted">({product.reviewCount} reviews)</span>
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-bold">{product.name}</h1>

              <div className="flex items-center gap-3 mt-4">
                <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-lg text-muted line-through">${product.compareAtPrice.toFixed(2)}</span>
                    <span className="badge bg-red-50 text-error">
                      Save ${(product.compareAtPrice - product.price).toFixed(0)}
                    </span>
                  </>
                )}
              </div>

              <p className="mt-6 text-muted leading-relaxed">{product.description}</p>

              <div className="flex gap-2 mt-4 flex-wrap">
                {product.tags.map((tag) => (
                  <span key={tag} className="badge bg-surface-hover text-muted">{tag}</span>
                ))}
              </div>

              {/* Quantity Selector */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 hover:bg-surface-hover transition-colors text-lg"
                  >
                    −
                  </button>
                  <span className="px-4 py-3 font-medium min-w-[3rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-3 hover:bg-surface-hover transition-colors text-lg"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-muted">{product.inventory} in stock</span>
              </div>

              <button onClick={handleAddToCart} className="btn-primary w-full mt-6 py-4 text-base">
                Add to Cart — ${(product.price * quantity).toFixed(2)}
              </button>

              <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs text-muted">
                <div className="p-3 bg-surface-hover rounded-lg">
                  <p className="text-lg mb-1">🚚</p>
                  <p>Free Shipping $75+</p>
                </div>
                <div className="p-3 bg-surface-hover rounded-lg">
                  <p className="text-lg mb-1">↩️</p>
                  <p>30-Day Returns</p>
                </div>
                <div className="p-3 bg-surface-hover rounded-lg">
                  <p className="text-lg mb-1">✨</p>
                  <p>Quality Guarantee</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <section className="mt-20">
            <h2 className="font-display text-2xl font-bold mb-8">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-muted text-sm">No reviews yet. Be the first!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {reviews.map((review) => (
                  <div key={review.id} className="card">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span key={i} className={`text-sm ${i <= review.rating ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                        ))}
                      </div>
                      {review.verified && <span className="badge bg-green-50 text-success text-xs">✓ Verified</span>}
                    </div>
                    <h4 className="font-semibold mt-2">{review.title}</h4>
                    <p className="text-sm text-muted mt-1">{review.body}</p>
                    <p className="text-xs text-muted mt-3">— {review.author}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Write Review */}
            <div className="card max-w-lg">
              <h3 className="font-display text-lg font-semibold mb-4">Write a Review</h3>
              {submitted ? (
                <p className="text-success text-sm">Thank you for your review! ✨</p>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your name"
                    className="input"
                    value={reviewForm.author}
                    onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })}
                    required
                  />
                  <div>
                    <label className="text-sm text-muted block mb-1">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                          className={`text-2xl ${s <= reviewForm.rating ? "text-yellow-400" : "text-gray-300"}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Review title"
                    className="input"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                    required
                  />
                  <textarea
                    placeholder="Your review..."
                    className="input min-h-[100px]"
                    value={reviewForm.body}
                    onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                    required
                  />
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
