/**
 * Acre Era consumer boundary for IgniAqua Cost Layer 2.0.
 * Cost Layer is the ONLY authority for the final price floor.
 * A supplier's product+freight quote is never a retail-price recommendation.
 * This module does not calculate/replace the authoritative floor.
 */
export type CostFloorGate = {
  status: "BLOCKED_PENDING_COST_LAYER_2";
  canQuote: false;
  canPublish: false;
  minimumPrice: null;
  examplePrices: [];
  requires: readonly [
    "AUTHORITATIVE_FLOOR_ATTESTATION",
    "REAL_FEES_AND_SUPPORT_RESERVE",
    "APPROVED_PRICE_AND_DISCOUNT_POLICY"
  ];
};
export function blockUnverifiedRetailPricing(): CostFloorGate {
  return {
    status: "BLOCKED_PENDING_COST_LAYER_2",
    canQuote: false,
    canPublish: false,
    minimumPrice: null,
    examplePrices: [],
    requires: [
      "AUTHORITATIVE_FLOOR_ATTESTATION",
      "REAL_FEES_AND_SUPPORT_RESERVE",
      "APPROVED_PRICE_AND_DISCOUNT_POLICY",
    ],
  };
}
