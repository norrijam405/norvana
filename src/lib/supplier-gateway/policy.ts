import {
  SUPPLIER_ACT_CAPABILITIES,
  SUPPLIER_READ_CAPABILITIES,
  type SupplierCapability,
  type SupplierRegistryProfile,
} from "./types";

export type SupplierGateDecision =
  | { ok: true; mode: "READ_ONLY_R0" }
  | { ok: false; code: string; reason: string };

const actCapabilities = new Set<string>(SUPPLIER_ACT_CAPABILITIES);
const readCapabilities = new Set<string>(SUPPLIER_READ_CAPABILITIES);

export function evaluateSupplierR0Authority(
  capability: SupplierCapability
): SupplierGateDecision {
  if (actCapabilities.has(capability)) {
    return {
      ok: false,
      code: "NORVANA_SUPPLIER_ACT_LOCKED_R0",
      reason:
        "Norvana Supplier Gateway R0 permits read/proving work only. Supplier activation, publication, ordering, fulfillment, refund, cancellation, and price-change authority remain locked.",
    };
  }

  if (readCapabilities.has(capability)) {
    return { ok: true, mode: "READ_ONLY_R0" };
  }

  return {
    ok: false,
    code: "NORVANA_SUPPLIER_CAPABILITY_UNKNOWN",
    reason: "Unknown supplier capability.",
  };
}

export function evaluateSupplierReadiness(
  profile: SupplierRegistryProfile,
  capability: SupplierCapability
): SupplierGateDecision {
  const authority = evaluateSupplierR0Authority(capability);
  if (!authority.ok) return authority;

  if (profile.disposition === "EXCLUDE") {
    return {
      ok: false,
      code: "NORVANA_SUPPLIER_EXCLUDED",
      reason: "Supplier is excluded from the current qualification pool.",
    };
  }

  if (profile.apiEntitlementState === "NEEDS_ACCOUNT_VERIFICATION") {
    return {
      ok: false,
      code: "NORVANA_SUPPLIER_API_ENTITLEMENT_NOT_VERIFIED",
      reason: "Supplier API entitlement requires account-level verification before connector proving.",
    };
  }

  if (!profile.readCapabilities.includes(capability as never)) {
    return {
      ok: false,
      code: "NORVANA_SUPPLIER_CAPABILITY_NOT_PROVEN",
      reason: "The requested read capability has not been admitted to this supplier's R0 proving profile.",
    };
  }

  return authority;
}

export function calculateLandedCostCents(input: {
  itemCostCents: number | null;
  shippingCostCents: number | null;
  knownFeesCents?: number | null;
}) {
  if (input.itemCostCents === null || input.shippingCostCents === null) {
    return null;
  }

  return (
    input.itemCostCents +
    input.shippingCostCents +
    (input.knownFeesCents ?? 0)
  );
}
