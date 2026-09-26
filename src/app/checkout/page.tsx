"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/components/cart-context";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Footer } from "@/components/footer";
import { Suspense } from "react";
import Link from "next/link";

function CheckoutContent() {
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const cancelled = searchParams.get("cancelled");
  const [error, setError] = useState(() => cancelled ? "Payment was cancelled. Please try again." : "");
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });


  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = freeShipping ? 0 : 5;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          shippingAddress: `${form.address}, ${form.city}, ${form.state} ${form.zip}`,
          items: items.map((i) => ({
            productId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          subtotal,
          shipping,
          total,
        }),
      });

      const data = await response.json();

      if (data.sessionUrl) {
        // Redirect to Stripe checkout
        clearCart();
        window.location.href = data.sessionUrl;
      } else if (data.fallback) {
        // No Stripe configured, direct order
        clearCart();
        router.push(`/confirmation?order=${data.orderNumber}`);
      } else {
        setError("Failed to create checkout session");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  if (items.length === 0) {
    return (
      <>
        <main className="min-h-screen py-20">
          <div className="max-w-md mx-auto text-center card">
            <p className="text-4xl mb-4">🛒</p>
            <h2 className="font-display text-xl font-bold">Your cart is empty</h2>
            <p className="text-sm text-muted mt-2">Add some products before checking out.</p>
            <Link href="/shop" className="btn-primary mt-6 inline-flex">Browse Shop</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
              <div className="card">
                <h2 className="font-display text-lg font-semibold mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    className="input"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="input"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="card">
                <h2 className="font-display text-lg font-semibold mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    className="input"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      className="input"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      className="input"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      required
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code"
                      className="input"
                      value={form.zip}
                      onChange={(e) => setForm({ ...form, zip: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="card bg-indigo-accent/5 border-indigo-accent/20">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔒</span>
                  <div>
                    <p className="font-medium text-sm">Secure Payment</p>
                    <p className="text-xs text-muted">You&apos;ll be redirected to Stripe for secure payment processing</p>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-4 text-base" disabled={loading}>
                {loading ? "Processing..." : `Continue to Payment — $${total.toFixed(2)}`}
              </button>
            </form>

            {/* Order Summary */}
            <div className="card h-fit lg:sticky lg:top-24">
              <h2 className="font-display text-lg font-semibold mb-4">Order Summary</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted">
                      {item.name} × {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Shipping</span>
                  <span>{freeShipping ? <span className="text-success font-medium">FREE</span> : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              {!freeShipping && (
                <p className="text-xs text-muted mt-4">
                  Add ${(FREE_SHIPPING_THRESHOLD - subtotal).toFixed(2)} more for free shipping!
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
