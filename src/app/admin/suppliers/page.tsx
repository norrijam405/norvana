import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { products, supplierProducts, suppliers } from "@/db/schema";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";
import { SUPPLIER_ACCESS_BOARD } from "@/lib/watchtower/supplier-access";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  let supplierRows: (typeof suppliers.$inferSelect)[] = [];
  let supplierProductRows: (typeof supplierProducts.$inferSelect)[] = [];
  let catalog: (typeof products.$inferSelect)[] = [];

  try {
    [supplierRows, supplierProductRows, catalog] = await Promise.all([
      db.select().from(suppliers).orderBy(desc(suppliers.createdAt)).limit(250),
      db.select().from(supplierProducts).orderBy(desc(supplierProducts.createdAt)).limit(500),
      db.select().from(products).orderBy(desc(products.createdAt)).limit(500),
    ]);
  } catch {}

  const active = supplierRows.filter((row) => row.isActive).length;
  const apiSuppliers = supplierRows.filter((row) => row.type === "api").length;
  const autoFulfill = supplierRows.filter((row) => row.autoFulfill).length;
  const imported = supplierProductRows.filter((row) => row.isImported).length;

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/suppliers" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_18%,rgba(232,198,138,.11),transparent_25rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Brands + Suppliers</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">Who can actually supply what we want to sell?</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Keep farms, wholesale suppliers, brands, dropship partners, and catalog sources in one place. Connection does not equal approval, and active does not mean auto-fulfill.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Suppliers", String(supplierRows.length)],
            ["Active", String(active)],
            ["API suppliers", String(apiSuppliers)],
            ["Auto-fulfill enabled", String(autoFulfill)],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className="mt-2 font-display text-3xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Supplier access board</p>
              <h2 className="mt-2 font-display text-3xl font-black">Where do I go and what do I need?</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
                This board separates real API paths from platform accounts, approval-only programs, and suppliers that are better handled manually.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {SUPPLIER_ACCESS_BOARD.map((source) => (
              <article key={source.slug} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
                      {source.recommendation.replaceAll("_", " ")}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold">{source.name}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    {source.costSignal.replaceAll("_", " ")}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-white/50">{source.purpose}</p>
                <p className="mt-3 text-xs text-white/35">{source.note}</p>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">What you need</p>
                  <p className="mt-2 text-sm font-semibold text-white/75">{source.credentialLabel}</p>
                  <div className="mt-3 space-y-2">
                    {source.whatYouNeed.map((item) => (
                      <p key={item} className="text-xs leading-5 text-white/45">• {item}</p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={source.website}
                    target={source.website.startsWith("http") ? "_blank" : undefined}
                    rel={source.website.startsWith("http") ? "noreferrer" : undefined}
                    className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Open website
                  </a>
                  {source.setupUrl ? (
                    <a
                      href={source.setupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70"
                    >
                      API / setup
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Supplier roster</p>
            <div className="mt-5 space-y-3">
              {supplierRows.map((supplier) => (
                <article key={supplier.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{supplier.name}</p>
                      <p className="mt-1 text-xs text-white/40">
                        {supplier.type} · {supplier.platform || "manual"} · {supplier.isActive ? "active" : "inactive"}
                      </p>
                    </div>
                    <span className={
                      "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] " +
                      (supplier.autoFulfill
                        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                        : "border-white/10 bg-white/5 text-white/45")
                    }>
                      {supplier.autoFulfill ? "AUTO-FULFILL ON" : "MANUAL"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-white/45">{supplier.url || "No supplier website saved"}</p>
                </article>
              ))}
              {supplierRows.length === 0 ? <p className="text-sm text-white/45">No suppliers available yet.</p> : null}
            </div>
          </div>

          <div className="space-y-5">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Catalog coverage</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Supplier products</p>
                  <p className="mt-2 font-display text-3xl font-bold">{supplierProductRows.length}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Imported</p>
                  <p className="mt-2 font-display text-3xl font-bold">{imported}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Acre Era catalog</p>
                  <p className="mt-2 font-display text-3xl font-bold">{catalog.length}</p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Unverified products</p>
                  <p className="mt-2 font-display text-3xl font-bold">{catalog.filter((row) => row.authorizationState === "UNVERIFIED").length}</p>
                </div>
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Owner rule</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Supplier connected ≠ supplier trusted.</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                Connection, authorization, product rights, delivery reliability, margin, and customer experience should remain separate decisions.
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
