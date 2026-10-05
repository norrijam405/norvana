"use client";

import Link from "next/link";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      const response = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) return;
      setSubmitted(true);
      setEmail("");
    } catch {
      // Keep the form usable if the network is temporarily unavailable.
    }
  }

  return (
    <footer className="bg-soil text-cream/75">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-cream">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wheat text-sm font-black text-soil">AE</span>
              <h3 className="font-display text-xl font-black tracking-tight">ACRE ERA</h3>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6">
              Groceries, local producers, useful goods, and curious finds—curated with visible reasons and clearer customer signal.
            </p>
            <form onSubmit={handleSubscribe} className="mt-6 flex max-w-lg gap-2">
              {submitted ? (
                <p className="text-sm text-wheat">You’re on the list.</p>
              ) : (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email for new Eras + local drops"
                    className="min-w-0 flex-1 rounded-full border border-cream/15 bg-cream/[0.08] px-4 py-2.5 text-sm text-cream placeholder:text-cream/35 focus:outline-none focus:ring-2 focus:ring-wheat"
                    required
                  />
                  <button type="submit" className="rounded-full bg-wheat px-5 py-2.5 text-sm font-semibold text-soil transition hover:bg-cream">
                    Join
                  </button>
                </>
              )}
            </form>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-wheat">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/market" className="hover:text-cream">Market</Link></li>
              <li><Link href="/shop" className="hover:text-cream">Goods</Link></li>
              <li><Link href="/partners" className="hover:text-cream">Partner Finds</Link></li>
              <li><Link href="/partners/archive" className="hover:text-cream">Partner Archive</Link></li>
              <li><Link href="/era-drops" className="hover:text-cream">Era Drops</Link></li>
              <li><Link href="/archive" className="hover:text-cream">Archive</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-wheat">Grow with Acre Era</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/growers" className="hover:text-cream">For growers + producers</Link></li>
              <li><Link href="/growers#pilot" className="hover:text-cream">Start a pilot</Link></li>
              <li><Link href="/growers#interest" className="hover:text-cream">Producer interest</Link></li>
              <li><Link href="/growers#delivery" className="hover:text-cream">How delivery works</Link></li>
              <li><Link href="/market#farm-facts" className="hover:text-cream">Farm facts</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-cream/10 pt-7 text-xs text-cream/40 md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Acre Era. Working public brand.</span>
          <span>Internal repository codename remains Norvana during controlled migration.</span>
        </div>
      </div>
    </footer>
  );
}
