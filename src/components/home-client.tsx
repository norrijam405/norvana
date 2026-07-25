"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
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

const HERO_SLIDES = [
  { title: "Volume III", subtitle: "Garden & Wellness", cta: "Explore the Collection" },
  { title: "Curated Objects", subtitle: "For Intentional Living", cta: "Shop Now" },
  { title: "Artisan Made", subtitle: "Globally Sourced", cta: "Discover More" },
];

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = endDate.getTime() - now;
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-4">
      {Object.entries(timeLeft).map(([label, value]) => (
        <div key={label} className="text-center">
          <div className="w-16 h-16 bg-surface rounded-lg flex items-center justify-center border border-border">
            <span className="font-display text-2xl font-bold text-obsidian">{value}</span>
          </div>
          <span className="text-xs text-muted mt-1 block capitalize">{label}</span>
        </div>
      ))}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

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
  const [slideIndex, setSlideIndex] = useState(0);
  const { addItem } = useCart();
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSeed = async () => {
    await fetch("/api/seed", { method: "POST" });
    setSeeded(true);
    window.location.reload();
  };

  const slide = HERO_SLIDES[slideIndex];

  return (
    <>
      <main className="min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-obsidian via-gray-900 to-obsidian text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: "radial-gradient(circle at 25% 25%, #6366F1 0%, transparent 50%), radial-gradient(circle at 75% 75%, #6366F1 0%, transparent 50%)"
            }} />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
            <motion.div
              key={slideIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-indigo-light text-sm font-medium tracking-widest uppercase mb-4">
                {slide.subtitle}
              </p>
              <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight">
                {slide.title}
              </h1>
              <p className="mt-6 text-white/60 text-lg max-w-xl">
                Handpicked artisan goods from the world&apos;s best makers. New volumes drop quarterly.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/shop" className="btn-primary text-base px-8 py-4">
                  {slide.cta}
                </Link>
                <Link href="/archive" className="btn-secondary border-white/20 text-white hover:bg-white/10 text-base px-8 py-4">
                  View Archive
                </Link>
              </div>
            </motion.div>

            {/* Slide indicators */}
            <div className="flex gap-2 mt-12">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i === slideIndex ? "w-8 bg-indigo-accent" : "w-4 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Countdown Timer */}
        {activeVolume && (
          <section className="py-12 bg-surface border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm text-muted uppercase tracking-wider">Current Volume Ends In</p>
                <h3 className="font-display text-xl font-semibold mt-1">
                  Vol. {activeVolume.volumeNumber} — {activeVolume.niche}
                </h3>
              </div>
              <CountdownTimer />
            </div>
          </section>
        )}

        {/* Seed Data CTA (shows when no products) */}
        {featuredProducts.length === 0 && !seeded && (
          <section className="py-16">
            <div className="max-w-md mx-auto text-center card">
              <h2 className="font-display text-2xl font-bold">Welcome to NORVANA</h2>
              <p className="mt-3 text-muted text-sm">Seed the database with sample products, suppliers, and volumes to get started.</p>
              <button onClick={handleSeed} className="btn-primary mt-6">
                🌱 Seed Database
              </button>
            </div>
          </section>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <p className="text-sm text-indigo-accent font-medium tracking-widest uppercase">Handpicked</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Featured Products</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="card group hover:shadow-md transition-all duration-300"
                  >
                    <Link href={`/shop/${product.slug}`}>
                      <div className="aspect-square bg-surface-hover rounded-xl flex items-center justify-center text-5xl group-hover:scale-105 transition-transform duration-300">
                        {PRODUCT_EMOJIS[product.niche] || "🎁"}
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center gap-2">
                          <StarRating rating={product.rating} />
                          <span className="text-xs text-muted">({product.reviewCount})</span>
                        </div>
                        <h3 className="font-display text-lg font-semibold mt-2 group-hover:text-indigo-accent transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-semibold">${product.price.toFixed(2)}</span>
                          {product.compareAtPrice && (
                            <span className="text-sm text-muted line-through">
                              ${product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1.5 mt-3 flex-wrap">
                          {product.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="badge bg-surface-hover text-muted">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={() => addItem({ id: product.id, name: product.name, price: product.price, slug: product.slug })}
                      className="btn-primary w-full mt-4 text-sm"
                    >
                      Add to Cart
                    </button>
                  </motion.div>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link href="/shop" className="btn-secondary">
                  View All Products →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Review Carousel */}
        {recentReviews.length > 0 && (
          <section className="py-20 bg-surface border-y border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <p className="text-sm text-indigo-accent font-medium tracking-widest uppercase">Testimonials</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">What People Say</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentReviews.slice(0, 3).map((review, i) => (
                  <motion.div
                    key={review.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-bone p-6 rounded-2xl"
                  >
                    <StarRating rating={review.rating} />
                    <h4 className="font-semibold mt-3">{review.title}</h4>
                    <p className="text-sm text-muted mt-2 line-clamp-3">{review.body}</p>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="w-8 h-8 bg-indigo-accent/10 rounded-full flex items-center justify-center text-indigo-accent text-sm font-bold">
                        {review.author.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{review.author}</span>
                      {review.verified && <span className="badge bg-green-50 text-success text-xs">✓ Verified</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Archive Teaser */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-obsidian to-gray-800 rounded-3xl p-10 md:p-16 text-white text-center">
              <p className="text-indigo-light text-sm font-medium tracking-widest uppercase">The Archive</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">
                Explore Past Volumes
              </h2>
              <p className="mt-4 text-white/60 max-w-xl mx-auto">
                Revisit previous collections and discover the objects that defined each season.
              </p>
              <Link href="/archive" className="btn-primary mt-8 inline-flex">
                Browse Archive →
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Curated Products", value: stats.products || "12+" },
                { label: "Happy Customers", value: "500+" },
                { label: "Artisan Makers", value: "15+" },
                { label: "Countries Shipped", value: "12+" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-3xl md:text-4xl font-bold text-indigo-accent">{stat.value}</p>
                  <p className="text-sm text-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
