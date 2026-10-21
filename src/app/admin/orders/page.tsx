import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders, supplierOrders } from "@/db/schema";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; payment?: string }> }) {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  let customerOrders: (typeof orders.$inferSelect)[] = [];
  let supplierRows: (typeof supplierOrders.$inferSelect)[] = [];
  let ordersLoadFailed = false;
  try {
    [customerOrders, supplierRows] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(250),
      db.select().from(supplierOrders).orderBy(desc(supplierOrders.createdAt)).limit(250),
    ]);
  } catch (error) {
    ordersLoadFailed = true;
    console.error("Watchtower orders database read failed", error);
  }

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100).toLowerCase() : "";
  const paymentFilter = ["all", "pending", "paid", "failed", "refunded"].includes(params.payment || "")
    ? params.payment!
    : "all";
  const visibleOrders = customerOrders.filter((order) => {
    const matchesSearch = !query ||
      [order.orderNumber, order.customerName, order.customerEmail, order.status]
        .some((value) => String(value || "").toLowerCase().includes(query));
    const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
    return matchesSearch && matchesPayment;
  });

  const open = customerOrders.filter((row) => !/delivered|complete|cancel/i.test(row.status)).length;
  const unpaid = customerOrders.filter((row) => row.paymentStatus !== "paid").length;
  const supplierIssues = supplierRows.filter((row) => /failed|error/i.test(row.status) || Boolean(row.errorMessage)).length;
  const shipped = supplierRows.filter((row) => /shipped|delivered/i.test(row.status)).length;

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/orders" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,.18),transparent_25rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">Orders + Delivery</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">What has to move today?</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Customer orders, supplier handoff, tracking, and delivery exceptions belong in one room. Consequential shipment creation stays locked until a qualified route is explicitly approved.
          </p>
        </section>

        {ordersLoadFailed ? (
          <section role="alert" className="mt-6 rounded-2xl border border-rose-400/40 bg-rose-950/30 p-5 text-sm text-rose-100">
            Order data could not be loaded. The counters below are unavailable, not confirmed zero.
            Check the database connection and server logs before acting on order or fulfillment status.
          </section>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Open customer orders", ordersLoadFailed ? "—" : String(open)],
            ["Unpaid / unresolved", ordersLoadFailed ? "—" : String(unpaid)],
            ["Supplier issues", ordersLoadFailed ? "—" : String(supplierIssues)],
            ["Supplier shipped", ordersLoadFailed ? "—" : String(shipped)],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className="mt-2 font-display text-3xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <form method="GET" action="/admin/orders" className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <label className="min-w-[220px] flex-1 text-sm text-white/60">Find an order
            <input type="search" name="q" defaultValue={typeof params.q === "string" ? params.q.slice(0, 100) : ""} placeholder="Order number, customer or email" maxLength={100} className="mt-2 w-full rounded-xl border border-white/15 bg-[#191b18] px-4 py-3 text-white placeholder:text-white/30" />
          </label>
          <label className="text-sm text-white/60">Payment
            <select name="payment" defaultValue={paymentFilter} className="mt-2 block rounded-xl border border-white/15 bg-[#191b18] px-4 py-3 text-white">
              <option value="all">All payments</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
            </select>
          </label>
          <button type="submit" className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400">Filter orders</button>
          <a href="/admin/orders" className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white/70 hover:bg-white/10">Clear</a>
          <p className="w-full text-xs text-white/40">Search covers the latest 250 records, not the entire order history. For full historical lookup, pagination is required.</p>
        </form>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Customer orders</p>
            <div className="mt-5 space-y-3">
              {visibleOrders.slice(0, 50).map((order) => (
                <article key={order.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="mt-1 text-xs text-white/40">{order.customerName} · {order.status}</p>
                    </div>
                    <p className="font-display text-lg font-bold">{"$"}{Number(order.total || 0).toFixed(2)}</p>
                  </div>
                  <p className="mt-3 text-xs text-white/40">{Array.isArray(order.items) ? order.items.length : 0} line item(s) · payment {order.paymentStatus}</p>
                </article>
              ))}
              {!ordersLoadFailed && visibleOrders.length === 0 ? <p className="text-sm text-white/45">{customerOrders.length === 0 ? "No customer orders available yet." : "No matching orders in the most recent 250 records."}</p> : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Supplier fulfillment</p>
            <div className="mt-5 space-y-3">
              {supplierRows.slice(0, 20).map((row) => (
                <article key={row.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">Supplier order #{row.id}</p>
                      <p className="mt-1 text-xs text-white/40">Customer order {row.orderId} · supplier {row.supplierId}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/55">{row.status}</span>
                  </div>
                  <p className="mt-3 text-xs text-white/40">
                    {row.shippingCarrier || "Carrier not assigned"} · {row.trackingNumber || "No tracking yet"}
                  </p>
                  {row.errorMessage ? <p className="mt-2 text-xs text-rose-200">{row.errorMessage}</p> : null}
                </article>
              ))}
              {!ordersLoadFailed && supplierRows.length === 0 ? <p className="text-sm text-white/45">No supplier fulfillment records available yet.</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
