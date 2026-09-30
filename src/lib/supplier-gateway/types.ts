export const SUPPLIER_QUALIFICATION_STATES = [
  "DISCOVERED",
  "EVIDENCE_COLLECTED",
  "TERMS_VERIFIED",
  "API_ENTITLEMENT_VERIFIED",
  "CATALOG_READ_PROVEN",
  "STOCK_READ_PROVEN",
  "FREIGHT_QUOTE_PROVEN",
  "WEBHOOK_PROVEN",
  "ORDER_SIMULATION_PROVEN",
  "READ_ONLY_SHADOW_VERIFIED",
  "AWAITING_FOUNDER_ACT_AUTHORITY",
  "FULFILLMENT_APPROVED",
] as const;

export type SupplierQualificationState =
  (typeof SUPPLIER_QUALIFICATION_STATES)[number];

export type SupplierLane = "GENERAL_MERCHANDISE" | "POD";

export type SupplierDisposition = "QUALIFY" | "HOLD" | "EXCLUDE";

export type ApiEntitlementState =
  | "SOURCE_REPORTED_FREE"
  | "NEEDS_ACCOUNT_VERIFICATION"
  | "NOT_FREE_FOR_FULFILLMENT"
  | "UNKNOWN";

export const SUPPLIER_READ_CAPABILITIES = [
  "catalog.search",
  "product.read",
  "variant.read",
  "inventory.read",
  "shipping.quote",
  "delivery.estimate",
  "returns.policy.read",
  "branding.options.read",
  "webhook.verify",
  "order.simulate",
] as const;

export type SupplierReadCapability =
  (typeof SUPPLIER_READ_CAPABILITIES)[number];

export const SUPPLIER_ACT_CAPABILITIES = [
  "order.create",
  "order.cancel",
  "refund.request",
  "fulfillment.execute",
  "product.publish",
  "supplier.activate",
  "price.change",
] as const;

export type SupplierActCapability =
  (typeof SUPPLIER_ACT_CAPABILITIES)[number];

export type SupplierCapability =
  | SupplierReadCapability
  | SupplierActCapability;

export type SupplierEvidenceRef = {
  label: string;
  url?: string;
  observedAt: string;
  sourceClass: "FOUNDER_SUPPLIED_RESEARCH";
  independentlyVerifiedByBuilder: false;
};

export type SupplierRegistryProfile = {
  providerId: string;
  displayName: string;
  lane: SupplierLane;
  priority: number | null;
  disposition: SupplierDisposition;
  qualificationState: SupplierQualificationState;
  apiEntitlementState: ApiEntitlementState;
  monthlyPlatformCostClaimCents: number | null;
  noInventoryClaim: boolean | null;
  noMoqClaim: boolean | null;
  customStoreApiClaim: boolean | null;
  readCapabilities: SupplierReadCapability[];
  executionAuthority: "LOCKED_R0";
  riskFlags: string[];
  evidence: SupplierEvidenceRef[];
  notes: string[];
};

export type NormalizedSupplierVariant = {
  supplierVariantId: string;
  supplierSku: string;
  title: string;
  itemCostCents: number | null;
  stockState: "IN_STOCK" | "OUT_OF_STOCK" | "LIMITED" | "UNKNOWN";
  stockQuantity: number | null;
  options: Record<string, string>;
};

export type NormalizedSupplierProduct = {
  providerId: string;
  supplierProductId: string;
  supplierSku: string;
  title: string;
  description: string;
  productFamily: string;
  itemCostCents: number | null;
  currency: string | null;
  warehouse: string | null;
  stockState: "IN_STOCK" | "OUT_OF_STOCK" | "LIMITED" | "UNKNOWN";
  stockQuantity: number | null;
  productionTimeDays: { min: number | null; max: number | null };
  images: string[];
  variants: NormalizedSupplierVariant[];
  evidenceTimestamp: string | null;
};

export type NormalizedShippingQuote = {
  providerId: string;
  supplierSku: string;
  destinationCountry: string;
  destinationPostalCode: string | null;
  shippingMethod: string;
  shippingCostCents: number | null;
  currency: string | null;
  deliveryWindowDays: { min: number | null; max: number | null };
  warehouse: string | null;
  evidenceTimestamp: string | null;
};

export type NormalizedReturnPolicy = {
  providerId: string;
  supplierSku: string | null;
  buyerRemorseSupported: boolean | null;
  defectReplacementSupported: boolean | null;
  defectRefundSupported: boolean | null;
  returnWindowDays: number | null;
  returnShippingLiability: "SUPPLIER" | "NORVANA" | "CUSTOMER" | "MIXED" | "UNKNOWN";
  notes: string[];
  evidenceTimestamp: string | null;
};

export type SupplierReadFailureCode =
  | "SUPPLIER_CREDENTIAL_NOT_BOUND"
  | "SUPPLIER_API_ENTITLEMENT_NOT_VERIFIED"
  | "SUPPLIER_EXCLUDED"
  | "SUPPLIER_CAPABILITY_NOT_PROVEN";

export type SupplierReadResult<T> =
  | { ok: true; data: T; providerId: string; capability: SupplierReadCapability }
  | {
      ok: false;
      code: SupplierReadFailureCode;
      providerId: string;
      capability: SupplierReadCapability;
      message: string;
    };

export interface NorvanaReadOnlySupplierAdapter {
  readonly providerId: string;
  readonly mode: "READ_ONLY_R0";
  readonly capabilities: readonly SupplierReadCapability[];
  searchCatalog(query: string): Promise<SupplierReadResult<NormalizedSupplierProduct[]>>;
  readProduct(supplierProductId: string): Promise<SupplierReadResult<NormalizedSupplierProduct>>;
  readInventory(supplierSku: string): Promise<SupplierReadResult<NormalizedSupplierVariant>>;
  quoteShipping(input: {
    supplierSku: string;
    quantity: number;
    destinationCountry: string;
    destinationPostalCode?: string;
  }): Promise<SupplierReadResult<NormalizedShippingQuote[]>>;
  readReturnPolicy(supplierSku?: string): Promise<SupplierReadResult<NormalizedReturnPolicy>>;
}
