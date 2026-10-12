export type ProductReadinessState =
  | "READY_AFFILIATE"
  | "READY_SUPPLIER"
  | "HOLD"
  | "REJECT";

export type ProductReadinessInput = {
  commerceModel: string;
  sourceProviderSlug?: string | null;
  externalSellerName?: string | null;
  externalCheckoutUrl?: string | null;
  affiliateNetwork?: string | null;
  affiliateProgram?: string | null;
  authorizationState?: string | null;
  imageRightsState?: string | null;
  productCondition?: string | null;
  evidenceRef?: string | null;
  returnSummary?: string | null;
  warrantySummary?: string | null;
  deliveryMinDays?: number | null;
  deliveryMaxDays?: number | null;
  totalCustomerPriceCents?: number | null;
  stockState?: string | null;
  provenanceState?: string | null;
};

export type ProductReadinessResult = {
  state: ProductReadinessState;
  blockers: string[];
  warnings: string[];
};

const IMAGE_OK = new Set([
  "OWNED",
  "BRAND_AUTHORIZED",
  "SUPPLIER_AUTHORIZED",
  "AFFILIATE_FEED_AUTHORIZED",
]);

const AUTH_OK = new Set([
  "APPROVED",
  "AUTHORIZED",
  "AFFILIATE_APPROVED",
  "SUPPLIER_APPROVED",
  "RESELLER_APPROVED",
]);

const PROVENANCE_OK = new Set([
  "VERIFIED",
  "DOCUMENTED",
  "SUPPLIER_VERIFIED",
  "BRAND_VERIFIED",
]);

export function evaluateProductReadiness(input: ProductReadinessInput): ProductReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const model = input.commerceModel || "UNKNOWN";

  if (!input.sourceProviderSlug) blockers.push("Missing source/provider identity.");
  if (!input.externalSellerName && model === "AFFILIATE_REFERRAL") blockers.push("Missing external seller identity.");
  if (!input.evidenceRef) blockers.push("Missing evidence reference.");

  if (!IMAGE_OK.has(input.imageRightsState || "")) {
    blockers.push("Image rights are not documented.");
  }

  if (!AUTH_OK.has(input.authorizationState || "")) {
    blockers.push("Commercial authorization is not documented.");
  }

  if (model === "AFFILIATE_REFERRAL") {
    if (!input.externalCheckoutUrl) blockers.push("Missing partner checkout URL.");
    if (!input.affiliateNetwork) blockers.push("Missing affiliate network.");
    if (!input.affiliateProgram) blockers.push("Missing affiliate program.");
    if (!input.returnSummary) warnings.push("Partner return policy summary is missing.");
    if (!input.warrantySummary) warnings.push("Partner warranty summary is missing.");

    return {
      state: blockers.length ? "HOLD" : "READY_AFFILIATE",
      blockers,
      warnings,
    };
  }

  if (model === "QUALIFIED_SUPPLIER") {
    if (!PROVENANCE_OK.has(input.provenanceState || "")) {
      blockers.push("Supplier/product provenance is not verified.");
    }
    if (input.totalCustomerPriceCents == null) blockers.push("Customer total price is not verified.");
    if (input.deliveryMinDays == null || input.deliveryMaxDays == null) {
      blockers.push("Delivery window is not verified.");
    }
    if (!input.returnSummary) blockers.push("Return policy summary is missing.");
    if (!input.warrantySummary) warnings.push("Warranty summary is missing.");
    if (!input.stockState || input.stockState === "UNKNOWN") blockers.push("Stock state is unknown.");

    return {
      state: blockers.length ? "HOLD" : "READY_SUPPLIER",
      blockers,
      warnings,
    };
  }

  if (model === "PREVIEW_ONLY") {
    return {
      state: "HOLD",
      blockers: ["Preview-only products cannot be sold or referred."],
      warnings,
    };
  }

  return {
    state: "REJECT",
    blockers: ["Unsupported or unknown commerce model."],
    warnings,
  };
}
