"use client";

import { useCart } from "./cart-context";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";

export function CartDrawer() {
  const { items, removeItem, updateQuantity, subtotal, isOpen, setIsOpen } = useCart();
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-obsidian z-50"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border p-4 sm:p-6">
              <h2 className="font-display text-lg font-semibold">Your Cart</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 transition-colors hover:bg-surface-hover"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!freeShipping && subtotal > 0 && (
              <div className="border-b border-border bg-indigo-accent/5 px-4 py-3 sm:px-6">
                <p className="text-sm text-muted">
                  Add <span className="font-semibold text-indigo-accent">${remaining.toFixed(2)}</span> more for free shipping!
                </p>
                <div className="mt-2 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted text-sm">Your cart is empty</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 text-indigo-accent text-sm font-medium hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-4 border-b border-border last:border-0">
                    <div className="w-20 h-20 bg-surface-hover rounded-lg flex items-center justify-center text-2xl shrink-0">
                      🛍️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-sm text-indigo-accent font-semibold mt-1">${item.price.toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center rounded border border-border text-sm hover:bg-surface-hover"
                        >
                          −
                        </button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center border border-border rounded text-sm hover:bg-surface-hover"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="ml-auto text-muted hover:text-error text-xs"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-4 border-t border-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted">Shipping</span>
                  <span className="text-sm">{freeShipping ? <span className="text-success font-medium">FREE</span> : "$5.00"}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="btn-primary w-full text-center"
                >
                  Checkout — ${(subtotal + (freeShipping ? 0 : 5)).toFixed(2)}
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
