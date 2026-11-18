/**
 * CJ observation quality checks, deliberately not a retail price or approval.
 * Reject ambiguous/malformed supplier numbers instead of silently treating
 * missing, fractional, negative or infinite inventory as trustworthy.
 */
export type CjQuoteQuality = {
  status: "HOLD" | "NEEDS_PROCESSING_AND_APPROVAL";
  stock: number | null;
  productCost: number | null;
  shippingCost: number | null;
  baseLandedCost: number | null;
  transitDays: { min: number | null; max: number | null };
  reason: string;
};
const finiteMoney = (v: unknown, allowZero: boolean): number | null => {
  if (typeof v !== "string" && typeof v !== "number") return null;
  if (typeof v === "string" && !/^\d+(?:\.\d{1,4})?$/.test(v.trim())) return null;
  const n = Number(v);
  return Number.isFinite(n) && n <= 1_000_000 && (allowZero ? n >= 0 : n > 0) ? n : null;
};
export function evaluateCjQuoteQuality(input: {
  variantPrice: unknown;
  methodFreight: unknown;
  hasShippingMethod: boolean;
  inventoryUnits: unknown;
  transit: unknown;
}): CjQuoteQuality {
  const productCost = finiteMoney(input.variantPrice, false);
  const shippingCost = input.hasShippingMethod ? finiteMoney(input.methodFreight, true) : null;
  let stock: number | null = null;
  if (Array.isArray(input.inventoryUnits) && input.inventoryUnits.length > 0 && input.inventoryUnits.length <= 200) {
    const quantities = input.inventoryUnits.map(x => typeof x === "number" || (typeof x === "string" && /^\d+$/.test(x.trim())) ? Number(x) : NaN);
    if (quantities.every(x => Number.isSafeInteger(x) && x >= 0 && x <= 1_000_000)) stock = quantities.reduce((a,b)=>a+b,0);
  }
  const t = input.transit && typeof input.transit === "object" && !Array.isArray(input.transit)
    ? input.transit as Record<string, unknown> : {};
  const min = typeof t.min === "number" && Number.isSafeInteger(t.min) && t.min >= 0 ? t.min : null;
  const max = typeof t.max === "number" && Number.isSafeInteger(t.max) && t.max >= 0 ? t.max : null;
  const transitDays = {min,max};
  const transitValid = min !== null && max !== null && min <= max && max <= 21;
  const baseLandedCost = productCost !== null && shippingCost !== null
    ? Math.round((productCost + shippingCost) * 10000) / 10000 : null;
  const complete = stock !== null && stock > 0 && baseLandedCost !== null && transitValid;
  return {
    status: complete ? "NEEDS_PROCESSING_AND_APPROVAL" : "HOLD",
    stock, productCost, shippingCost, baseLandedCost, transitDays,
    reason: complete
      ? "Supplier stock and freight are present; processing, fees, returns, product rights, pricing floor and safety remain unverified."
      : "Supplier inventory, price, freight, or transit evidence is incomplete or malformed. No qualification approval.",
  };
}
