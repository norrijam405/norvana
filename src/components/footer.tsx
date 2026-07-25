"use client";

import Link from "next/link";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
      setEmail("");
    } catch {
      // ignore
    }
  };

  return (
    <footer className="bg-obsidian text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <h3 className="font-display text-xl font-bold text-white tracking-wider">NORVANA</h3>
            <p className="mt-4 text-sm leading-relaxed max-w-md">
              Curated objects for intentional living. Each volume brings you handpicked artisan goods 
              from the world&apos;s best makers.
            </p>
            <form onSubmit={handleSubscribe} className="mt-6 flex gap-2">
              {submitted ? (
                <p className="text-success text-sm">Thanks for subscribing! ✨</p>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-accent"
                  />
                  <button type="submit" className="px-5 py-2.5 bg-indigo-accent text-white text-sm font-medium rounded-lg hover:bg-indigo-dark transition-colors">
                    Subscribe
                  </button>
                </>
              )}
            </form>
          </div>
          <div>
            <h4 className="font-medium text-white text-sm uppercase tracking-wider mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/archive" className="hover:text-white transition-colors">Archive</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-white text-sm uppercase tracking-wider mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/admin" className="hover:text-white transition-colors">Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} NORVANA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
