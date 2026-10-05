import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";

export const dynamic = "force-dynamic";

export default async function MoneyPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  let rows: (typeof orders.$inferSelect)[] = [];
  try {
    rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(250);
  } catch {}

  const paid = rows.filter((row) => row.paymentStatus === "paid");
  const revenue = paid.reduce((sum, row) => sum + Number(row.total || 0), 0);
  const shipping = paid.reduce((sum, row) => sum + Number(row.shipping || 0), 0);
  const outstanding = rows.filter((row) => row.paymentStatus !== "paid").reduce((sum, row) => sum + Number(row.total || 0), 0);
  const refunds = rows.filter((row) => /refund/i.test(row.status)).length;

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/money" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_85%_15%,rgba(232,198,138,.12),transparent_25rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Money</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">Know where the money is going.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Start with customer order truth. As Stripe, delivery, supplier cost, and margin evidence mature, this room becomes the owner view for revenue, fees, delivery cost, refunds, and contribution.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Paid revenue", "$" + revenue.toFixed(2)],
            ["Paid orders", String(paid.length)],
            ["Shipping charged", "$" + shipping.toFixed(2)],
            ["Outstanding", "$" + outstanding.toFixed(2)],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className="mt-2 font-display text-3xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Recent order money</p>
            <div className="mt-5 space-y-3">
              {rows.slice(0, 12).map((order) => (
                <div key={order.id} className="grid grid-cols-[1fr_auto] gap-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="mt-1 text-xs text-white/40">{order.paymentStatus} · {order.status}</p>
                  </div>
                  <p className="font-display text-lg font-bold">{"$"}{Number(order.total || 0).toFixed(2)}</p>
                </div>
              ))}
              {rows.length === 0 ? <p className="text-sm text-white/45">No orders available yet.</p> : null}
            </div>
          </div>

          <div className="space-y-5">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Owner read</p>
              <h2 className="mt-2 font-display text-2xl font-bold">What this room should become</h2>
              <div className="mt-5 space-y-3 text-sm leading-6 text-white/55">
                <p>Revenue after refunds and payment fees.</p>
                <p>Supplier/product cost and delivery cost by order.</p>
                <p>Contribution margin by product, supplier, route, and Era.</p>
                <p>Cash coming in versus obligations going out.</p>
              </div>
            </article>
            <article className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Refund signals</p>
              <p className="mt-2 font-display text-3xl font-bold">{refunds}</p>
              <p className="mt-2 text-sm text-white/45">Orders with refund-like status in the current order table.</p>
            </article>
            <Link href="/admin/connections" className="inline-flex text-sm font-semibold text-indigo-200 underline underline-offset-4">
              Review payment connections →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
