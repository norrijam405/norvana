"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { Footer } from "@/components/footer";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") || "N/A";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card max-w-lg mx-auto text-center"
    >
      <div className="text-6xl mb-6">✅</div>
      <h1 className="font-display text-3xl font-bold">Order Confirmed!</h1>
      <p className="text-muted mt-3">
        Thank you for your purchase. Your order has been placed successfully.
      </p>
      <div className="mt-6 p-4 bg-surface-hover rounded-lg">
        <p className="text-sm text-muted">Order Number</p>
        <p className="font-mono text-xl font-bold text-indigo-accent mt-1">{orderNumber}</p>
      </div>
      <p className="text-sm text-muted mt-6">
        A confirmation email will be sent to your email address.
      </p>
      <div className="mt-8 flex gap-4 justify-center">
        <Link href="/shop" className="btn-primary">
          Continue Shopping
        </Link>
        <Link href="/" className="btn-secondary">
          Back to Home
        </Link>
      </div>
    </motion.div>
  );
}

export default function ConfirmationPage() {
  return (
    <>
      <main className="min-h-screen py-20 px-4">
        <Suspense fallback={<div className="text-center text-muted">Loading...</div>}>
          <ConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
