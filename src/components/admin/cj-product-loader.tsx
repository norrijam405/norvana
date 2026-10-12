"use client";

import { useState } from "react";

type Variant = {
  vid: string;
  variantNameEn?: string | null;
  variantSku?: string;
  variantKey?: string | null;
  variantSellPrice?: number | string | null;
};

type ProductPayload = {
  product?: {
    pid?: string;
    productNameEn?: string;
    productSku?: string;
    bigImage?: string;
  };
  variants?: Variant[];
  requestId?: string | null;
  error?: string;
};

type QuotePayload = {
  originCountryCode?: string;
  inventory?: Array<{
    areaEn?: string;
    countryCode?: string;
    totalInventoryNum?: number;
    cjInventoryNum?: number;
    factoryInventoryNum?: number;
  }>;
  methods?: Array<{
    logisticName?: string;
    logisticAging?: string;
    logisticPrice?: number;
    aging?: { min: number | null; max: number | null };
  }>;
  requestId?: string | null;
  error?: string;
};

export function CjProductLoader({
  sku,
  onRoutePatch,
}: {
  sku: string;
  onRoutePatch: (patch: {
    variant?: string;
    stock?: "UNKNOWN" | "IN_STOCK" | "OUT_OF_STOCK";
    deliveryMinDays?: string;
    deliveryMaxDays?: string;
    productCost?: string;
    shippingCost?: string;
    notes?: string;
  }) => void;
}) {
  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [selectedVid, setSelectedVid] = useState("");
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [message, setMessage] = useState("");

  const variants = product?.variants || [];
  const selected = variants.find((variant) => variant.vid === selectedVid) || null;

  async function load() {
    setLoading(true);
    setMessage("Loading current CJ product data…");
    try {
      const response = await fetch("/api/admin/cj/load", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sku }),
      });
      const body = (await response.json().catch(() => ({}))) as ProductPayload;
      if (!response.ok) {
        setMessage(body.error || "CJ product lookup failed.");
        return;
      }
      setProduct(body);
      const exact =
        (body.variants || []).find((variant) => variant.variantSku === sku) ||
        (body.variants || [])[0] ||
        null;
      if (exact) {
        setSelectedVid(exact.vid);
        onRoutePatch({
          variant: exact.variantNameEn || exact.variantKey || exact.variantSku || exact.vid,
          productCost:
            exact.variantSellPrice !== null && exact.variantSellPrice !== undefined
              ? String(exact.variantSellPrice)
              : undefined,
        });
      }
      setMessage(
        body.variants?.length
          ? `Loaded ${body.variants.length} CJ variant(s). Choose the exact one, then check the U.S. route.`
          : "Product loaded, but CJ returned no variants."
      );
    } catch {
      setMessage("Could not reach the CJ loader.");
    } finally {
      setLoading(false);
    }
  }

  function selectVariant(vid: string) {
    setSelectedVid(vid);
    const variant = variants.find((row) => row.vid === vid);
    if (!variant) return;
    onRoutePatch({
      variant: variant.variantNameEn || variant.variantKey || variant.variantSku || variant.vid,
      productCost:
        variant.variantSellPrice !== null && variant.variantSellPrice !== undefined
          ? String(variant.variantSellPrice)
          : undefined,
    });
    setMessage("Variant selected. Check the U.S. route next.");
  }

  async function quote() {
    if (!selectedVid) {
      setMessage("Choose an exact variant first.");
      return;
    }
    setQuoting(true);
    setMessage("Checking current inventory and U.S. freight…");
    try {
      const response = await fetch("/api/admin/cj/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vid: selectedVid }),
      });
      const body = (await response.json().catch(() => ({}))) as QuotePayload;
      if (!response.ok) {
        setMessage(body.error || "CJ route quote failed.");
        return;
      }

      const inventoryTotal = (body.inventory || []).reduce(
        (sum, row) => sum + Number(row.totalInventoryNum || 0),
        0
      );
      const method = body.methods?.[0] || null;

      onRoutePatch({
        stock: inventoryTotal > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
        productCost:
          selected?.variantSellPrice !== null && selected?.variantSellPrice !== undefined
            ? String(selected.variantSellPrice)
            : undefined,
        shippingCost:
          method?.logisticPrice !== null && method?.logisticPrice !== undefined
            ? String(method.logisticPrice)
            : undefined,
        deliveryMinDays:
          method?.aging?.min !== null && method?.aging?.min !== undefined
            ? String(method.aging.min)
            : undefined,
        deliveryMaxDays:
          method?.aging?.max !== null && method?.aging?.max !== undefined
            ? String(method.aging.max)
            : undefined,
        notes: [
          body.originCountryCode ? `CJ origin ${body.originCountryCode}` : "",
          method?.logisticName ? `carrier ${method.logisticName}` : "",
          method?.logisticAging ? `transit ${method.logisticAging} days` : "",
          body.requestId ? `CJ request ${body.requestId}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      });

      setMessage(
        method
          ? `Loaded stock + cheapest U.S. route (${method.logisticName || "CJ logistics"}). Add processing time to finish qualification.`
          : "Inventory loaded, but CJ returned no U.S. freight method for this variant."
      );
    } catch {
      setMessage("Could not reach the CJ route quote.");
    } finally {
      setQuoting(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-indigo-300/15 bg-indigo-300/[0.04] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || quoting}
          className="min-h-11 rounded-xl border border-indigo-300/20 bg-indigo-300/10 px-4 py-2 text-xs font-semibold text-indigo-100 disabled:opacity-50"
        >
          {loading ? "Loading CJ…" : "↻ Load from CJ"}
        </button>

        {variants.length ? (
          <select
            value={selectedVid}
            onChange={(event) => selectVariant(event.target.value)}
            className="min-h-11 min-w-60 flex-1 rounded-xl border border-white/10 bg-[#151713] px-3 text-xs text-white outline-none"
          >
            <option value="">Choose exact variant</option>
            {variants.map((variant) => (
              <option key={variant.vid} value={variant.vid}>
                {(variant.variantNameEn || variant.variantKey || variant.variantSku || variant.vid) +
                  (variant.variantSellPrice !== null && variant.variantSellPrice !== undefined
                    ? ` · $${variant.variantSellPrice}`
                    : "")}
              </option>
            ))}
          </select>
        ) : null}

        {variants.length ? (
          <button
            type="button"
            onClick={() => void quote()}
            disabled={!selectedVid || loading || quoting}
            className="min-h-11 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold text-emerald-100 disabled:opacity-40"
          >
            {quoting ? "Checking route…" : "Check U.S. route"}
          </button>
        ) : null}
      </div>

      <p className="mt-2 text-[10px] leading-4 text-white/40">
        Read-only CJ API connection. This does not import the product, place an order, connect fulfillment, or publish anything.
      </p>
      {message ? <p className="mt-2 text-[11px] leading-5 text-indigo-100">{message}</p> : null}
    </div>
  );
}
