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

export default async function OrdersPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  let customerOrders: (typeof orders.$inferSelect)[] = [];
  let supplierRows: (typeof supplierOrders.$inferSelect)[] = [];
  try {
    [customerOrders, supplierRows] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(250),
      db.select().from(supplierOrders).orderBy(desc(supplierOrders.createdAt)).limit(250),
    ]);
  } catch {}

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

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Open customer orders", String(open)],
            ["Unpaid / unresolved", String(unpaid)],
            ["Supplier issues", String(supplierIssues)],
            ["Supplier shipped", String(shipped)],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className="mt-2 font-display text-3xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Customer orders</p>
            <div className="mt-5 space-y-3">
              {customerOrders.slice(0, 20).map((order) => (
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
              {customerOrders.length === 0 ? <p className="text-sm text-white/45">No customer orders available yet.</p> : null}
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
              {supplierRows.length === 0 ? <p className="text-sm text-white/45">No supplier fulfillment records available yet.</p> : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
