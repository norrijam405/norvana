"use client";

import { useState } from "react";

export type PlacementPayload = {
  name: string;
  lane: string;
  sourceType: "SUPPLIER" | "GROCERY" | "FARM" | "AFFILIATE";
  sourceProviderSlug?: string | null;
  sourceName?: string | null;
  sourceKey?: string | null;
  supplierSku?: string | null;
  producerId?: number | null;
  productCost?: number | null;
  shippingCost?: number | null;
  routeEvidence?: Record<string, unknown>;
};

function targetForLane(lane: string) {
  const value = lane.toLowerCase();
  if (/(farm|produce|fresh|grocery|food|market|garden|wellness)/.test(value)) return "Market Era";
  if (/(premium|style|fashion|travel|electronics|computer|luxury|finds)/.test(value)) return "Finds Era";
  return "Goods Era";
}

export function MerchandisingPlaceButton({
  payload,
  disabled = false,
  label,
  onPlaced,
}: {
  payload: PlacementPayload;
  disabled?: boolean;
  label?: string;
  onPlaced?: (result: Record<string, unknown>) => void;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const target = targetForLane(payload.lane);

  async function place() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/merchandising/place", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        setMessage(typeof body.error === "string" ? body.error : "Placement failed.");
        return;
      }
      const state = typeof body.placementState === "string" ? body.placementState.replaceAll("_", " ") : "STAGED";
      setMessage(`${state}. Not published.`);
      onPlaced?.(body);
    } catch {
      setMessage("Could not reach Watchtower.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => void place()}
        className="min-h-11 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Placing…" : label || `▶ Place in ${target}`}
      </button>
      {message ? <p className="mt-2 max-w-md text-[11px] leading-4 text-indigo-200">{message}</p> : null}
    </div>
  );
}
