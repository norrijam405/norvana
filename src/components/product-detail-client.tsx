"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCart } from "./cart-context";
import { Footer } from "./footer";
import { ProductTrustPanel } from "./acre-era/product-trust-panel";

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
  supplierId?: number | null;
  commerceModel?: string;
  sourceProviderSlug?: string | null;
  brandName?: string | null;
  authorizationState?: string;
  imageRightsState?: string;
  externalSellerName?: string | null;
  tags: string[];
};

type Review = {
  id: number;
  author: string;
  rating: number;
  fulfillmentRating?: number | null;
  purchaseExperienceRating?: number | null;
  purchaseQuantityBand?: string | null;
  repeatBuyer?: boolean | null;
  title: string;
  body: string;
  verified: boolean;
  buyerType?: string;
  businessName?: string | null;
  verificationState?: string;
  sourceChannel?: string;
  sourceLabel?: string;
  helpfulCount?: number;
  notHelpfulCount?: number;
  createdAt?: string | Date;
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
};

const EMPTY_REVIEW = {
  author: "",
  rating: 5,
  fulfillmentRating: "",
  purchaseExperienceRating: "",
  title: "",
  body: "",
  buyerType: "INDIVIDUAL",
  businessName: "",
  orderNumber: "",
  purchaseEmail: "",
};

export function ProductDetailClient({
  product,
  reviews,
}: {
  product: Product;
  reviews: Review[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [liveReviews, setLiveReviews] = useState<Review[]>(reviews);
  const [reviewForm, setReviewForm] = useState(EMPTY_REVIEW);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const { addItem } = useCart();
  const isAffiliate = product.commerceModel === "AFFILIATE_REFERRAL";
  const imageRightsOk = [
    "OWNED",
    "BRAND_AUTHORIZED",
    "SUPPLIER_AUTHORIZED",
    "AFFILIATE_FEED_AUTHORIZED",
  ].includes(product.imageRightsState || "");
  const displayImage = imageRightsOk ? product.images?.[0] : null;

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch(
          "/api/reviews?productId=" + product.id,
          { cache: "no-store" }
        );
        if (!response.ok) return;
        const data = (await response.json()) as { reviews?: Review[] };
        if (!cancelled && Array.isArray(data.reviews)) {
          setLiveReviews(data.reviews);
        }
      } catch {
        // Keep the last known reviews if refresh is temporarily unavailable.
      }
    };

    const timer = window.setInterval(refresh, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [product.id]);

  const reviewSummary = useMemo(() => {
    if (liveReviews.length === 0) return { count: 0, rating: 0 };
    return {
      count: liveReviews.length,
      rating:
        liveReviews.reduce((sum, review) => sum + review.rating, 0) /
        liveReviews.length,
    };
  }, [liveReviews]);

  const handleAddToCart = () => {
    addItem(
      { id: product.id, name: product.name, price: product.price, slug: product.slug },
      quantity
    );
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setReviewError("");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reviewForm, productId: product.id }),
      });
      const data = (await response.json()) as {
        review?: Review;
        error?: string;
        verification?: { verified?: boolean };
      };

      if (!response.ok || !data.review) {
        setReviewError(data.error || "We could not submit the review.");
        return;
      }

      setLiveReviews((current) => [
        data.review as Review,
        ...current.filter((review) => review.id !== data.review?.id),
      ]);
      setReviewForm(EMPTY_REVIEW);
      setSubmitMessage(
        data.verification?.verified
          ? "Published — verified Acre Era purchase."
          : "Published. Purchase verification was not claimed."
      );
    } catch {
      setReviewError("We could not submit the review.");
    } finally {
      setSubmitting(false);
    }
  };

  const reactToReview = async (
    reviewId: number,
    reaction: "HELPFUL" | "NOT_HELPFUL"
  ) => {
    try {
      const response = await fetch(
        "/api/reviews/" + reviewId + "/reactions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reaction }),
        }
      );
      if (!response.ok) return;
      const result = (await response.json()) as {
        helpfulCount: number;
        notHelpfulCount: number;
      };
      setLiveReviews((current) =>
        current.map((review) =>
          review.id === reviewId
            ? {
                ...review,
                helpfulCount: result.helpfulCount,
                notHelpfulCount: result.notHelpfulCount,
              }
            : review
        )
      );
    } catch {
      // Reaction failure does not alter the review.
    }
  };

  return (
    <>
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-muted mb-8">
            <Link href="/shop" className="hover:text-obsidian transition-colors">Goods</Link>
            <span>/</span>
            <span className="text-obsidian">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="aspect-square overflow-hidden bg-surface rounded-2xl border border-border flex items-center justify-center text-8xl"
            >
              {displayImage ? (
                // Feed/supplier imagery is rendered only when rights are explicitly recorded.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImage}
                  alt={product.name}
                  className="h-full w-full object-contain bg-white"
                  referrerPolicy="no-referrer"
                />
              ) : (
                PRODUCT_EMOJIS[product.niche] || "🎁"
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="md:sticky md:top-24 md:self-start"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={
                        i <= Math.round(reviewSummary.rating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-muted">
                  ({reviewSummary.count} reviews)
                </span>
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-bold">{product.name}</h1>

              <div className="flex items-center gap-3 mt-4">
                <span className="text-2xl font-bold">{"$"}{product.price.toFixed(2)}</span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-lg text-muted line-through">{"$"}{product.compareAtPrice.toFixed(2)}</span>
                    <span className="badge bg-red-50 text-error">
                      Save {"$"}{(product.compareAtPrice - product.price).toFixed(0)}
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

              {isAffiliate ? (
                <div className="mt-8 rounded-2xl border border-wheat/50 bg-wheat/15 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">
                    Partner checkout
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    This item is showcased by Acre Era, but checkout happens with{" "}
                    <strong className="text-soil">{product.externalSellerName || "the partner retailer"}</strong>.
                    Acre Era may earn a commission if you buy through the link.
                  </p>
                  <a
                    href={"/api/outbound/" + product.slug}
                    className="btn-primary mt-5 w-full py-4 text-base"
                    rel="sponsored nofollow"
                  >
                    View at {product.externalSellerName || "partner"} →
                  </a>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    Price, stock, shipping, returns, warranty, and final checkout terms are controlled by the partner and should be confirmed there.
                  </p>
                </div>
              ) : (
                <>
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
                    Add to Cart — {"$"}{(product.price * quantity).toFixed(2)}
                  </button>

                  <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs text-muted">
                    <div className="p-3 bg-surface-hover rounded-lg">
                      <p className="text-lg mb-1">🚚</p>
                      <p>Shipping shown before checkout</p>
                    </div>
                    <div className="p-3 bg-surface-hover rounded-lg">
                      <p className="text-lg mb-1">↩️</p>
                      <p>Return terms by source</p>
                    </div>
                    <div className="p-3 bg-surface-hover rounded-lg">
                      <p className="text-lg mb-1">✨</p>
                      <p>Source disclosed</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>

          <ProductTrustPanel product={product} reviews={liveReviews} />

          <section className="mt-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
              <div>
                <h2 className="font-display text-2xl font-bold">Customer Voice</h2>
                <p className="text-sm text-muted mt-1">
                  Reviews refresh automatically. Positive and negative opinions use the same publication path.
                </p>
              </div>
              <span className="text-xs text-muted">Near-live refresh: about 4 seconds</span>
            </div>

            {liveReviews.length === 0 ? (
              <p className="text-muted text-sm mb-12">No reviews yet. Be the first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {liveReviews.map((review) => (
                  <div key={review.id} className="card">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span
                            key={i}
                            className={
                              "text-sm " +
                              (i <= review.rating ? "text-yellow-400" : "text-gray-300")
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      {review.verified && (
                        <span className="badge bg-green-50 text-success text-xs">✓ Verified purchase</span>
                      )}
                      {review.buyerType === "BUSINESS" && (
                        <span className="badge bg-surface-hover text-xs">Business buyer</span>
                      )}
                      {review.verified && review.purchaseQuantityBand && (
                        <span className="badge bg-surface-hover text-xs">
                          {review.purchaseQuantityBand}
                        </span>
                      )}
                      {review.verified && review.repeatBuyer && (
                        <span className="badge bg-surface-hover text-xs">Repeat buyer</span>
                      )}
                    </div>
                    <h4 className="font-semibold mt-2">{review.title}</h4>
                    <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{review.body}</p>
                    {(review.fulfillmentRating || review.purchaseExperienceRating) && (
                      <div className="text-xs text-muted mt-3 flex flex-wrap gap-3">
                        {review.fulfillmentRating && (
                          <span>Fulfillment: {review.fulfillmentRating}/5</span>
                        )}
                        {review.purchaseExperienceRating && (
                          <span>Buying experience: {review.purchaseExperienceRating}/5</span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-muted mt-3 space-y-1">
                      <p>
                        — {review.author}
                        {review.businessName ? " · " + review.businessName : ""}
                      </p>
                      <p>
                        {review.sourceLabel || "Acre Era"}
                        {review.verified
                          ? " · purchase verified"
                          : " · opinion not purchase-verified"}
                      </p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        type="button"
                        className="text-xs border border-border rounded-full px-3 py-1.5 hover:bg-surface-hover"
                        onClick={() => reactToReview(review.id, "HELPFUL")}
                      >
                        Helpful {review.helpfulCount ?? 0}
                      </button>
                      <button
                        type="button"
                        className="text-xs border border-border rounded-full px-3 py-1.5 hover:bg-surface-hover"
                        onClick={() => reactToReview(review.id, "NOT_HELPFUL")}
                      >
                        Not helpful {review.notHelpfulCount ?? 0}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="card max-w-2xl">
              <h3 className="font-display text-lg font-semibold mb-2">Share your experience</h3>
              <p className="text-sm text-muted mb-5">
                Order number + purchase email are optional. When both match a paid Acre Era order containing this product,
                the review receives a verified purchase badge. The email is used for the check and is not stored on the review.
              </p>

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Display name"
                  className="input"
                  value={reviewForm.author}
                  onChange={(e) => setReviewForm({ ...reviewForm, author: e.target.value })}
                  required
                />

                <select
                  className="input"
                  value={reviewForm.buyerType}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      buyerType: e.target.value,
                      businessName: e.target.value === "BUSINESS" ? reviewForm.businessName : "",
                    })
                  }
                >
                  <option value="INDIVIDUAL">Individual buyer</option>
                  <option value="BUSINESS">Business / organization buyer</option>
                </select>

                {reviewForm.buyerType === "BUSINESS" && (
                  <input
                    type="text"
                    placeholder="Business or organization name"
                    className="input"
                    value={reviewForm.businessName}
                    onChange={(e) => setReviewForm({ ...reviewForm, businessName: e.target.value })}
                    required
                  />
                )}

                <div>
                  <label className="text-sm text-muted block mb-1">Product rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: s })}
                        className={
                          "text-2xl " +
                          (s <= reviewForm.rating ? "text-yellow-400" : "text-gray-300")
                        }
                        aria-label={s + " star rating"}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-sm text-muted">
                    Fulfillment / delivery (optional)
                    <select
                      className="input mt-1"
                      value={reviewForm.fulfillmentRating}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          fulfillmentRating: e.target.value,
                        })
                      }
                    >
                      <option value="">Not rated</option>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}/5
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-muted">
                    Buying experience (optional)
                    <select
                      className="input mt-1"
                      value={reviewForm.purchaseExperienceRating}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          purchaseExperienceRating: e.target.value,
                        })
                      }
                    >
                      <option value="">Not rated</option>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating}/5
                        </option>
                      ))}
                    </select>
                  </label>
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
                  placeholder="What was your experience with the product?"
                  className="input min-h-[120px]"
                  value={reviewForm.body}
                  onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Acre Era order # (optional)"
                    className="input"
                    value={reviewForm.orderNumber}
                    onChange={(e) => setReviewForm({ ...reviewForm, orderNumber: e.target.value })}
                  />
                  <input
                    type="email"
                    placeholder="Purchase email (optional)"
                    className="input"
                    value={reviewForm.purchaseEmail}
                    onChange={(e) => setReviewForm({ ...reviewForm, purchaseEmail: e.target.value })}
                  />
                </div>

                {reviewError && <p className="text-sm text-error" role="alert">{reviewError}</p>}
                {submitMessage && <p className="text-sm text-success" role="status">{submitMessage}</p>}

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish review"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
