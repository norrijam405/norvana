import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, supplierOrders } from "@/db/schema";
import { ADMIN_SESSION_COOKIE, adminSessionConfigured, verifyCurrentAdminSessionToken } from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!adminSessionConfigured()) redirect("/admin");
  const session = await verifyCurrentAdminSessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const { id } = await params;
  if (!/^\d{1,10}$/.test(id)) notFound();
  const orderId = Number(id);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) notFound();

  let order: typeof orders.$inferSelect | undefined;
  let fulfillment: (typeof supplierOrders.$inferSelect)[] = [];
  try {
    [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) notFound();
    fulfillment = await db.select().from(supplierOrders).where(eq(supplierOrders.orderId, orderId));
  } catch (error) {
    // Do not turn a database failure into a false order-not-found result.
    if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_HTTP_ERROR_FALLBACK;404")) throw error;
    console.error("Watchtower order detail failed to load", error);
    return <main className="min-h-screen bg-[#0d0f0c] text-white"><WatchtowerNav current="/admin/orders"/><div role="alert" className="mx-auto max-w-5xl p-8"><h1 className="text-2xl font-bold">Order data unavailable</h1><p className="mt-3 text-rose-200">Could not load this order. Check the database and retry; this does not mean the order is missing.</p><Link href="/admin/orders" className="mt-6 inline-block underline">Back to orders</Link></div></main>;
  }
  if (!order) notFound();

  return <main className="min-h-screen bg-[#0d0f0c] pb-20 text-white">
    <WatchtowerNav current="/admin/orders"/>
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/admin/orders" className="text-sm text-indigo-200 hover:underline">← All orders</Link>
      <header className="mt-5 rounded-3xl border border-white/10 bg-white/[.04] p-6">
        <p className="text-xs uppercase tracking-widest text-indigo-200">Customer order · internal</p>
        <h1 className="mt-2 break-words text-3xl font-bold">{order.orderNumber}</h1>
        <p className="mt-3 text-sm text-white/60">Placed {order.createdAt.toLocaleString("en-US")} · Order: {order.status} · Payment: {order.paymentStatus}</p>
        <p className="mt-3 text-2xl font-bold">${Number(order.total).toFixed(2)}</p>
      </header>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[.035] p-6">
          <h2 className="text-lg font-semibold">Customer & delivery</h2>
          <p className="mt-4 text-sm">{order.customerName}</p>
          <p className="mt-1 break-all text-sm text-white/60">{order.customerEmail}</p>
          <p className="mt-4 whitespace-pre-wrap text-sm text-white/65">{order.shippingAddress}</p>
          <p className="mt-4 text-xs text-white/40">Private customer information; do not share this page publicly.</p>
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[.035] p-6">
          <h2 className="text-lg font-semibold">Amounts & payment</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-white/60">Subtotal</dt><dd>${Number(order.subtotal).toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/60">Shipping</dt><dd>${Number(order.shipping).toFixed(2)}</dd></div>
            <div className="flex justify-between border-t border-white/10 pt-3 font-semibold"><dt>Total</dt><dd>${Number(order.total).toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-white/60">Payment state</dt><dd>{order.paymentStatus}</dd></div>
          </dl>
          <p className="mt-4 break-all text-xs text-white/40">Stripe payment reference: {order.stripePaymentIntentId || "Not yet recorded"}</p>
        </section>
      </div>
      <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-6">
        <h2 className="text-lg font-semibold">Order items</h2>
        <div className="mt-4 space-y-3">
          {order.items.map((item, index) => <div key={index} className="flex flex-wrap justify-between gap-3 border-b border-white/10 pb-3 text-sm"><div><p>{item.name}</p><p className="mt-1 text-xs text-white/50">Product #{item.productId} · Qty {item.quantity}{item.supplierSku ? ` · Supplier SKU ${item.supplierSku}` : ""}</p></div><p>${(Number(item.price) * Number(item.quantity)).toFixed(2)}</p></div>)}
          {order.items.length === 0 ? <p className="text-sm text-white/50">No items found; investigate before fulfillment.</p> : null}
        </div>
      </section>
      <section className="mt-5 rounded-2xl border border-white/10 bg-white/[.035] p-6">
        <h2 className="text-lg font-semibold">Supplier handoff & tracking</h2>
        <p className="mt-2 text-xs text-white/50">Read only. Never assume an order is shipped because its payment is paid.</p>
        <div className="mt-4 space-y-3">{fulfillment.map(row => <div key={row.id} className="rounded-xl border border-white/10 p-4 text-sm"><p className="font-semibold">Supplier #{row.supplierId} · {row.status}</p><p className="mt-2 text-white/65">{row.shippingCarrier || "Carrier pending"} · {row.trackingNumber || "Tracking pending"}</p>{row.errorMessage ? <p className="mt-2 text-rose-200">{row.errorMessage}</p> : null}</div>)}{fulfillment.length===0 ? <p className="text-sm text-amber-200">No supplier handoff record. Check fulfillment before promising delivery.</p> : null}</div>
      </section>
    </div>
  </main>;
}
