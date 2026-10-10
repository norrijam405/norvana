"use client";

import { useEffect, useMemo, useState } from "react";
import { SEEDED_SCOUT_PICKS } from "@/lib/watchtower/seeded-scout-picks";
import { MerchandisingPlaceButton } from "@/components/admin/merchandising-place-button";

const ITEMS = SEEDED_SCOUT_PICKS;
const STORAGE_KEY = "acre-era-cj-route-check-r1";

type RouteState = {
  variant: string;
  stock: "UNKNOWN" | "IN_STOCK" | "OUT_OF_STOCK";
  processingDays: string;
  deliveryMinDays: string;
  deliveryMaxDays: string;
  productCost: string;
  shippingCost: string;
  notes: string;
};

const EMPTY_ROUTE: RouteState = {
  variant: "",
  stock: "UNKNOWN",
  processingDays: "",
  deliveryMinDays: "",
  deliveryMaxDays: "",
  productCost: "",
  shippingCost: "",
  notes: "",
};

function numeric(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function qualify(route: RouteState) {
  const processing = numeric(route.processingDays);
  const deliveryMin = numeric(route.deliveryMinDays);
  const deliveryMax = numeric(route.deliveryMaxDays);
  const productCost = numeric(route.productCost);
  const shipping = numeric(route.shippingCost);

  const complete =
    route.variant.trim().length > 0 &&
    route.stock !== "UNKNOWN" &&
    processing !== null &&
    deliveryMin !== null &&
    deliveryMax !== null &&
    productCost !== null &&
    productCost >= 0 &&
    shipping !== null &&
    shipping >= 0;

  if (route.stock === "OUT_OF_STOCK") {
    return { state: "REJECT" as const, reason: "Exact variant is currently out of stock." };
  }

  if (!complete) {
    return { state: "HOLD" as const, reason: "Route evidence is incomplete." };
  }

  if ((deliveryMax ?? 999) > 21) {
    return { state: "HOLD" as const, reason: "Delivery window is longer than 21 days; needs stronger margin/customer-experience justification." };
  }

  return { state: "ROUTE_VERIFIED" as const, reason: "Required CJ route facts are present. Product still needs final landed-economics/readiness review." };
}

export function CjRouteCheckPanel() {
  const [routes, setRoutes] = useState<Record<string, RouteState>>({});

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setRoutes(JSON.parse(saved));
    } catch {}
  }, []);

  function update(sku: string, patch: Partial<RouteState>) {
    setRoutes((current) => {
      const next = {
        ...current,
        [sku]: { ...(current[sku] || EMPTY_ROUTE), ...patch },
      };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const results = useMemo(
    () =>
      ITEMS.map((item) => ({
        item,
        route: routes[item.sku] || EMPTY_ROUTE,
        result: qualify(routes[item.sku] || EMPTY_ROUTE),
      })),
    [routes]
  );

  const verified = results.filter((row) => row.result.state === "ROUTE_VERIFIED").length;
  const rejected = results.filter((row) => row.result.state === "REJECT").length;
  const hold = results.length - verified - rejected;

  return (
    <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">CJ route qualification</p>
          <h2 className="mt-2 font-display text-3xl font-black">Only these five need you.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
            Open CJ while signed in, choose one exact variant, then enter the route facts below.
            Watchtower will not treat a checkbox as qualification anymore.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 text-center">
            <p className="text-[9px] uppercase tracking-[0.12em] text-emerald-100/55">Verified</p>
            <p className="mt-1 font-display text-2xl font-black text-emerald-100">{verified}</p>
          </div>
          <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-center">
            <p className="text-[9px] uppercase tracking-[0.12em] text-amber-100/55">Hold</p>
            <p className="mt-1 font-display text-2xl font-black text-amber-100">{hold}</p>
          </div>
          <div className="rounded-2xl border border-rose-300/15 bg-rose-300/[0.05] px-4 py-3 text-center">
            <p className="text-[9px] uppercase tracking-[0.12em] text-rose-100/55">Reject</p>
            <p className="mt-1 font-display text-2xl font-black text-rose-100">{rejected}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {results.map(({ item, route, result }) => (
          <article key={item.sku} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Priority {item.priority}
                  </span>
                  <code className="text-[11px] text-indigo-200">{item.sku}</code>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold">{item.name}</h3>
                <p className="mt-1 text-xs leading-5 text-white/45">{item.reason}</p>
              </div>
              <span className={
                "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] " +
                (result.state === "ROUTE_VERIFIED"
                  ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                  : result.state === "REJECT"
                    ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
                    : "border-amber-300/20 bg-amber-300/10 text-amber-100")
              }>
                {result.state.replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <label className="xl:col-span-2">
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Exact variant</span>
                <input
                  value={route.variant}
                  onChange={(event) => update(item.sku, { variant: event.target.value })}
                  placeholder="Color / size / pack / variant"
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-indigo-300/40"
                />
              </label>

              <label>
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Stock</span>
                <select
                  value={route.stock}
                  onChange={(event) => update(item.sku, { stock: event.target.value as RouteState["stock"] })}
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-[#151713] px-3 text-sm text-white outline-none focus:border-indigo-300/40"
                >
                  <option value="UNKNOWN">Unknown</option>
                  <option value="IN_STOCK">In stock</option>
                  <option value="OUT_OF_STOCK">Out of stock</option>
                </select>
              </label>

              <label>
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Processing days</span>
                <input
                  inputMode="decimal"
                  value={route.processingDays}
                  onChange={(event) => update(item.sku, { processingDays: event.target.value })}
                  placeholder="e.g. 2"
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-indigo-300/40"
                />
              </label>

              <label>
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Delivery min</span>
                <input
                  inputMode="decimal"
                  value={route.deliveryMinDays}
                  onChange={(event) => update(item.sku, { deliveryMinDays: event.target.value })}
                  placeholder="days"
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-indigo-300/40"
                />
              </label>

              <label>
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Delivery max</span>
                <input
                  inputMode="decimal"
                  value={route.deliveryMaxDays}
                  onChange={(event) => update(item.sku, { deliveryMaxDays: event.target.value })}
                  placeholder="days"
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-indigo-300/40"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[14rem_14rem_1fr]">
              <label>
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Exact product cost USD</span>
                <div className="mt-1 flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.045] px-3">
                  <span className="mr-2 text-white/35">$</span>
                  <input
                    inputMode="decimal"
                    value={route.productCost}
                    onChange={(event) => update(item.sku, { productCost: event.target.value })}
                    placeholder="0.00"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </label>

              <label>
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Calculated shipping USD</span>
                <div className="mt-1 flex min-h-11 items-center rounded-xl border border-white/10 bg-white/[0.045] px-3">
                  <span className="mr-2 text-white/35">$</span>
                  <input
                    inputMode="decimal"
                    value={route.shippingCost}
                    onChange={(event) => update(item.sku, { shippingCost: event.target.value })}
                    placeholder="0.00"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/20"
                  />
                </div>
              </label>

              <label>
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/35">Route note / evidence note</span>
                <input
                  value={route.notes}
                  onChange={(event) => update(item.sku, { notes: event.target.value })}
                  placeholder="Optional note about warehouse, route, or variant"
                  className="mt-1 min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.045] px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-indigo-300/40"
                />
              </label>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="text-xs font-semibold text-white/70">{result.reason}</p>
              <p className="mt-1 text-[10px] text-white/35">
                Supplier price observed earlier: {item.supplierPrice}. ROUTE VERIFIED still does not equal READY SUPPLIER; final landed economics, returns, rights, and readiness checks remain required.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-start gap-3">
              <MerchandisingPlaceButton
                disabled={result.state !== "ROUTE_VERIFIED"}
                payload={{
                  name: item.name,
                  lane: item.lane,
                  sourceType: "SUPPLIER",
                  sourceProviderSlug: "cjdropshipping",
                  sourceName: "CJdropshipping",
                  sourceKey: item.sku,
                  supplierSku: item.sku,
                  productCost: numeric(route.productCost),
                  shippingCost: numeric(route.shippingCost),
                  routeEvidence: {
                    variant: route.variant,
                    stock: route.stock,
                    processingDays: numeric(route.processingDays),
                    deliveryMinDays: numeric(route.deliveryMinDays),
                    deliveryMaxDays: numeric(route.deliveryMaxDays),
                    note: route.notes,
                  },
                }}
              />
              {result.state !== "ROUTE_VERIFIED" ? (
                <p className="max-w-md text-[10px] leading-4 text-white/30">
                  Finish the route evidence first. Placement stays locked until Watchtower can prove the exact variant, stock, processing, delivery, cost, and shipping.
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-semibold text-white/70">What counts as route verified?</p>
        <p className="mt-2 text-xs leading-5 text-white/40">
          One exact variant, ship-to U.S., explicit stock state, processing estimate, delivery estimate, and a calculated shipping cost.
          Do not import, connect the store, place an order, or enable fulfillment just to get this information.
        </p>
      </div>
    </section>
  );
}
