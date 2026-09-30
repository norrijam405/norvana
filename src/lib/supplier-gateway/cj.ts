import { calculateLandedCostCents } from "./policy.ts";
import type {
  LocalSupplierOrderSimulation,
  NorvanaReadOnlySupplierAdapter,
  NormalizedDeliveryEstimate,
  NormalizedReturnPolicy,
  NormalizedShippingQuote,
  NormalizedSupplierProduct,
  NormalizedSupplierVariant,
  NormalizedSupplierWarehouse,
  NormalizedWebhookVerification,
  SupplierReadCapability,
  SupplierReadFailureCode,
  SupplierReadResult,
} from "./types.ts";

export const CJ_PROVIDER_ID = "cjdropshipping" as const;
export const CJ_R0_FIXTURE_CLASS = "LOCAL_CJ_SYNTHETIC_R0" as const;
export const CJ_R0_SUPPORTED_CURRENCIES = ["USD"] as const;

export const CJ_READONLY_CAPABILITY_MAP_R0 = {
  "catalog.search": "LOCAL_FIXTURE_READY",
  "product.read": "LOCAL_FIXTURE_READY",
  "variant.read": "LOCAL_FIXTURE_READY",
  "inventory.read": "LOCAL_FIXTURE_READY",
  "warehouse.read": "LOCAL_FIXTURE_READY",
  "shipping.quote": "LOCAL_FIXTURE_READY",
  "delivery.estimate": "LOCAL_FIXTURE_READY",
  "webhook.verify": "LOCAL_FIXTURE_READY_PROVIDER_LIVE_SCHEME_UNVERIFIED",
  "order.simulate": "LOCAL_ONLY_NEVER_SUBMIT",
} as const satisfies Partial<Record<SupplierReadCapability, string>>;

export type CjCredentialStateR0 = "MISSING" | "INVALID" | "BOUND";

export type CjVariantDtoR0 = {
  fixtureClass: typeof CJ_R0_FIXTURE_CLASS;
  variantId: string;
  sku: string;
  title: string;
  itemCostMinor: number | null;
  currency: string | null;
  stockQuantity: number | null;
  warehouseId: string | null;
  options: Record<string, string>;
  observedAt: string;
};

export type CjProductDtoR0 = {
  fixtureClass: typeof CJ_R0_FIXTURE_CLASS;
  productId: string;
  sku: string;
  title: string;
  description: string;
  productFamily: string;
  itemCostMinor: number | null;
  currency: string | null;
  warehouseId: string | null;
  stockQuantity: number | null;
  productionDays: { min: number | null; max: number | null };
  images: string[];
  variants: CjVariantDtoR0[];
  observedAt: string;
};

export type CjInventoryDtoR0 = {
  fixtureClass: typeof CJ_R0_FIXTURE_CLASS;
  sku: string;
  variantId: string;
  title: string;
  warehouseId: string | null;
  quantity: number | null;
  observedAt: string;
};

export type CjWarehouseDtoR0 = {
  fixtureClass: typeof CJ_R0_FIXTURE_CLASS;
  warehouseId: string;
  name: string;
  country: string;
  region: string | null;
  observedAt: string;
};

export type CjFreightQuoteDtoR0 = {
  fixtureClass: typeof CJ_R0_FIXTURE_CLASS;
  sku: string;
  destinationCountry: string;
  destinationPostalCode: string | null;
  shippingMethod: string;
  shippingCostMinor: number | null;
  currency: string | null;
  deliveryDays: { min: number | null; max: number | null };
  warehouseId: string | null;
  observedAt: string;
};

export type CjDeliveryEstimateDtoR0 = {
  fixtureClass: typeof CJ_R0_FIXTURE_CLASS;
  sku: string;
  destinationCountry: string;
  destinationPostalCode: string | null;
  deliveryDays: { min: number | null; max: number | null };
  warehouseId: string | null;
  observedAt: string;
};

export type CjProviderErrorDtoR0 = {
  fixtureClass: typeof CJ_R0_FIXTURE_CLASS;
  errorCode: "AUTH_INVALID" | "RATE_LIMITED" | "UNKNOWN";
  message: string;
  retryAfterSeconds?: number;
};

export type CjWebhookFixtureDtoR0 = {
  fixtureClass: typeof CJ_R0_FIXTURE_CLASS;
  payload: string;
  signature: string;
  signatureValid: boolean;
  observedAt: string;
};

export type CjFixtureBundleR0 = {
  product: CjProductDtoR0;
  variant: CjVariantDtoR0;
  inventory: CjInventoryDtoR0;
  warehouse: CjWarehouseDtoR0;
  freight: CjFreightQuoteDtoR0;
  delivery: CjDeliveryEstimateDtoR0;
  webhook: CjWebhookFixtureDtoR0;
};

function ok<T>(
  capability: SupplierReadCapability,
  data: T
): SupplierReadResult<T> {
  return { ok: true, data, providerId: CJ_PROVIDER_ID, capability };
}

function fail<T>(
  capability: SupplierReadCapability,
  code: SupplierReadFailureCode,
  message: string
): SupplierReadResult<T> {
  return { ok: false, code, providerId: CJ_PROVIDER_ID, capability, message };
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function supportedCurrency(currency: unknown): currency is string {
  return (
    typeof currency === "string" &&
    (CJ_R0_SUPPORTED_CURRENCIES as readonly string[]).includes(currency)
  );
}

function stockState(quantity: number | null) {
  if (quantity === null) return "UNKNOWN" as const;
  if (quantity <= 0) return "OUT_OF_STOCK" as const;
  if (quantity <= 5) return "LIMITED" as const;
  return "IN_STOCK" as const;
}

export function evaluateCjLiveBindingGate(input: {
  credentialState: CjCredentialStateR0;
  entitlementVerified: boolean;
}): SupplierReadResult<true> {
  if (!input.entitlementVerified) {
    return fail(
      "catalog.search",
      "SUPPLIER_API_ENTITLEMENT_NOT_VERIFIED",
      "CJ account-level API entitlement must be verified before any authenticated provider request."
    );
  }
  if (input.credentialState === "MISSING") {
    return fail(
      "catalog.search",
      "SUPPLIER_CREDENTIAL_NOT_BOUND",
      "CJ credential is not bound. Offline qualification may continue, but no live request is permitted."
    );
  }
  if (input.credentialState === "INVALID") {
    return fail(
      "catalog.search",
      "SUPPLIER_CREDENTIAL_INVALID",
      "CJ credential failed validation. Do not retry blindly or downgrade authentication."
    );
  }
  return ok("catalog.search", true);
}

export function mapCjProviderError(
  capability: SupplierReadCapability,
  value: unknown
): SupplierReadResult<never> {
  if (!record(value) || value.fixtureClass !== CJ_R0_FIXTURE_CLASS) {
    return fail(
      capability,
      "SUPPLIER_RESPONSE_MALFORMED",
      "CJ provider response does not match the admitted R0 DTO contract."
    );
  }
  if (value.errorCode === "AUTH_INVALID") {
    return fail(
      capability,
      "SUPPLIER_CREDENTIAL_INVALID",
      "CJ provider rejected the credential."
    );
  }
  if (value.errorCode === "RATE_LIMITED") {
    return fail(
      capability,
      "SUPPLIER_RATE_LIMITED",
      "CJ provider rate limit reached. Preserve the response and retry only under a bounded policy."
    );
  }
  return fail(
    capability,
    "SUPPLIER_RESPONSE_MALFORMED",
    "CJ provider returned an unrecognized error response."
  );
}

function validateFixtureEnvelope(
  capability: SupplierReadCapability,
  value: unknown
): SupplierReadResult<Record<string, unknown>> {
  if (!record(value) || value.fixtureClass !== CJ_R0_FIXTURE_CLASS) {
    return fail(
      capability,
      "SUPPLIER_RESPONSE_MALFORMED",
      "CJ response is malformed or is not an admitted local R0 fixture."
    );
  }
  return ok(capability, value);
}

export function normalizeCjVariant(value: unknown): SupplierReadResult<NormalizedSupplierVariant> {
  const envelope = validateFixtureEnvelope("variant.read", value);
  if (!envelope.ok) return envelope;
  const v = envelope.data;
  if (
    typeof v.variantId !== "string" ||
    typeof v.sku !== "string" ||
    typeof v.title !== "string" ||
    !record(v.options)
  ) {
    return fail("variant.read", "SUPPLIER_RESPONSE_MALFORMED", "CJ variant fixture is malformed.");
  }
  if (v.itemCostMinor !== null && typeof v.itemCostMinor !== "number") {
    return fail("variant.read", "SUPPLIER_RESPONSE_MALFORMED", "CJ variant cost is malformed.");
  }
  if (v.itemCostMinor !== null && !supportedCurrency(v.currency)) {
    return fail("variant.read", "SUPPLIER_CURRENCY_UNSUPPORTED", "CJ variant currency is not admitted in R0.");
  }
  const quantity = typeof v.stockQuantity === "number" ? v.stockQuantity : null;
  return ok("variant.read", {
    supplierVariantId: v.variantId,
    supplierSku: v.sku,
    title: v.title,
    itemCostCents: v.itemCostMinor as number | null,
    stockState: stockState(quantity),
    stockQuantity: quantity,
    options: Object.fromEntries(
      Object.entries(v.options).filter((entry): entry is [string, string] => typeof entry[1] === "string")
    ),
  });
}

export function normalizeCjProduct(value: unknown): SupplierReadResult<NormalizedSupplierProduct> {
  const envelope = validateFixtureEnvelope("product.read", value);
  if (!envelope.ok) return envelope;
  const v = envelope.data;
  if (
    typeof v.productId !== "string" ||
    typeof v.sku !== "string" ||
    typeof v.title !== "string" ||
    typeof v.description !== "string" ||
    typeof v.productFamily !== "string" ||
    !Array.isArray(v.images) ||
    !Array.isArray(v.variants) ||
    !record(v.productionDays)
  ) {
    return fail("product.read", "SUPPLIER_RESPONSE_MALFORMED", "CJ product fixture is malformed.");
  }
  if (v.itemCostMinor !== null && typeof v.itemCostMinor !== "number") {
    return fail("product.read", "SUPPLIER_RESPONSE_MALFORMED", "CJ product cost is malformed.");
  }
  if (v.itemCostMinor !== null && !supportedCurrency(v.currency)) {
    return fail("product.read", "SUPPLIER_CURRENCY_UNSUPPORTED", "CJ product currency is not admitted in R0.");
  }
  const normalizedVariants: NormalizedSupplierVariant[] = [];
  for (const variant of v.variants) {
    const normalized = normalizeCjVariant(variant);
    if (!normalized.ok) {
      return fail("product.read", normalized.code, normalized.message);
    }
    normalizedVariants.push(normalized.data);
  }
  const quantity = typeof v.stockQuantity === "number" ? v.stockQuantity : null;
  const productionMin = typeof v.productionDays.min === "number" ? v.productionDays.min : null;
  const productionMax = typeof v.productionDays.max === "number" ? v.productionDays.max : null;
  return ok("product.read", {
    providerId: CJ_PROVIDER_ID,
    supplierProductId: v.productId,
    supplierSku: v.sku,
    title: v.title,
    description: v.description,
    productFamily: v.productFamily,
    itemCostCents: v.itemCostMinor as number | null,
    currency: typeof v.currency === "string" ? v.currency : null,
    warehouse: typeof v.warehouseId === "string" ? v.warehouseId : null,
    stockState: stockState(quantity),
    stockQuantity: quantity,
    productionTimeDays: { min: productionMin, max: productionMax },
    images: v.images.filter((image): image is string => typeof image === "string"),
    variants: normalizedVariants,
    evidenceTimestamp: typeof v.observedAt === "string" ? v.observedAt : null,
  });
}

export function normalizeCjInventory(value: unknown): SupplierReadResult<NormalizedSupplierVariant> {
  const envelope = validateFixtureEnvelope("inventory.read", value);
  if (!envelope.ok) return envelope;
  const v = envelope.data;
  if (
    typeof v.sku !== "string" ||
    typeof v.variantId !== "string" ||
    typeof v.title !== "string"
  ) {
    return fail("inventory.read", "SUPPLIER_RESPONSE_MALFORMED", "CJ inventory fixture is malformed.");
  }
  if (typeof v.quantity !== "number") {
    return fail(
      "inventory.read",
      "SUPPLIER_STOCK_UNKNOWN",
      "CJ stock quantity is missing. Norvana must not invent availability."
    );
  }
  return ok("inventory.read", {
    supplierVariantId: v.variantId,
    supplierSku: v.sku,
    title: v.title,
    itemCostCents: null,
    stockState: stockState(v.quantity),
    stockQuantity: v.quantity,
    options: typeof v.warehouseId === "string" ? { warehouseId: v.warehouseId } : {},
  });
}

export function normalizeCjWarehouse(value: unknown): SupplierReadResult<NormalizedSupplierWarehouse> {
  const envelope = validateFixtureEnvelope("warehouse.read", value);
  if (!envelope.ok) return envelope;
  const v = envelope.data;
  if (
    typeof v.warehouseId !== "string" ||
    typeof v.name !== "string" ||
    typeof v.country !== "string"
  ) {
    return fail("warehouse.read", "SUPPLIER_RESPONSE_MALFORMED", "CJ warehouse fixture is malformed.");
  }
  return ok("warehouse.read", {
    providerId: CJ_PROVIDER_ID,
    supplierWarehouseId: v.warehouseId,
    name: v.name,
    country: v.country,
    region: typeof v.region === "string" ? v.region : null,
    evidenceTimestamp: typeof v.observedAt === "string" ? v.observedAt : null,
  });
}

export function normalizeCjFreightQuote(value: unknown): SupplierReadResult<NormalizedShippingQuote> {
  const envelope = validateFixtureEnvelope("shipping.quote", value);
  if (!envelope.ok) return envelope;
  const v = envelope.data;
  if (
    typeof v.sku !== "string" ||
    typeof v.destinationCountry !== "string" ||
    typeof v.shippingMethod !== "string" ||
    !record(v.deliveryDays)
  ) {
    return fail("shipping.quote", "SUPPLIER_RESPONSE_MALFORMED", "CJ freight fixture is malformed.");
  }
  if (typeof v.shippingCostMinor !== "number") {
    return fail(
      "shipping.quote",
      "SUPPLIER_FREIGHT_UNKNOWN",
      "CJ freight cost is missing. Landed cost must remain unknown."
    );
  }
  if (!supportedCurrency(v.currency)) {
    return fail(
      "shipping.quote",
      "SUPPLIER_CURRENCY_UNSUPPORTED",
      "CJ freight currency is not admitted in R0."
    );
  }
  return ok("shipping.quote", {
    providerId: CJ_PROVIDER_ID,
    supplierSku: v.sku,
    destinationCountry: v.destinationCountry,
    destinationPostalCode:
      typeof v.destinationPostalCode === "string" ? v.destinationPostalCode : null,
    shippingMethod: v.shippingMethod,
    shippingCostCents: v.shippingCostMinor,
    currency: v.currency,
    deliveryWindowDays: {
      min: typeof v.deliveryDays.min === "number" ? v.deliveryDays.min : null,
      max: typeof v.deliveryDays.max === "number" ? v.deliveryDays.max : null,
    },
    warehouse: typeof v.warehouseId === "string" ? v.warehouseId : null,
    evidenceTimestamp: typeof v.observedAt === "string" ? v.observedAt : null,
  });
}

export function normalizeCjDeliveryEstimate(value: unknown): SupplierReadResult<NormalizedDeliveryEstimate> {
  const envelope = validateFixtureEnvelope("delivery.estimate", value);
  if (!envelope.ok) return envelope;
  const v = envelope.data;
  if (
    typeof v.sku !== "string" ||
    typeof v.destinationCountry !== "string" ||
    !record(v.deliveryDays)
  ) {
    return fail("delivery.estimate", "SUPPLIER_RESPONSE_MALFORMED", "CJ delivery fixture is malformed.");
  }
  const min = typeof v.deliveryDays.min === "number" ? v.deliveryDays.min : null;
  const max = typeof v.deliveryDays.max === "number" ? v.deliveryDays.max : null;
  if (min === null || max === null) {
    return fail("delivery.estimate", "SUPPLIER_RESPONSE_MALFORMED", "CJ delivery window is incomplete.");
  }
  return ok("delivery.estimate", {
    providerId: CJ_PROVIDER_ID,
    supplierSku: v.sku,
    destinationCountry: v.destinationCountry,
    destinationPostalCode:
      typeof v.destinationPostalCode === "string" ? v.destinationPostalCode : null,
    deliveryWindowDays: { min, max },
    warehouse: typeof v.warehouseId === "string" ? v.warehouseId : null,
    evidenceTimestamp: typeof v.observedAt === "string" ? v.observedAt : null,
  });
}

export class CjFixtureReadOnlyQualificationAdapter implements NorvanaReadOnlySupplierAdapter {
  readonly providerId = CJ_PROVIDER_ID;
  readonly mode = "READ_ONLY_R0" as const;
  readonly transport = "LOCAL_FIXTURE_ONLY" as const;
  readonly capabilities = Object.keys(CJ_READONLY_CAPABILITY_MAP_R0) as SupplierReadCapability[];

  constructor(private readonly fixtures: CjFixtureBundleR0) {}

  async searchCatalog(_query: string): Promise<SupplierReadResult<NormalizedSupplierProduct[]>> {
    const result = normalizeCjProduct(this.fixtures.product);
    if (!result.ok) return fail("catalog.search", result.code, result.message);
    return ok("catalog.search", [result.data]);
  }

  async readProduct(_supplierProductId: string): Promise<SupplierReadResult<NormalizedSupplierProduct>> {
    return normalizeCjProduct(this.fixtures.product);
  }

  async readVariant(_supplierVariantId: string): Promise<SupplierReadResult<NormalizedSupplierVariant>> {
    return normalizeCjVariant(this.fixtures.variant);
  }

  async readInventory(_supplierSku: string): Promise<SupplierReadResult<NormalizedSupplierVariant>> {
    return normalizeCjInventory(this.fixtures.inventory);
  }

  async readWarehouse(_supplierWarehouseId: string): Promise<SupplierReadResult<NormalizedSupplierWarehouse>> {
    return normalizeCjWarehouse(this.fixtures.warehouse);
  }

  async quoteShipping(_input: {
    supplierSku: string;
    quantity: number;
    destinationCountry: string;
    destinationPostalCode?: string;
  }): Promise<SupplierReadResult<NormalizedShippingQuote[]>> {
    const result = normalizeCjFreightQuote(this.fixtures.freight);
    if (!result.ok) return result;
    return ok("shipping.quote", [result.data]);
  }

  async estimateDelivery(_input: {
    supplierSku: string;
    destinationCountry: string;
    destinationPostalCode?: string;
  }): Promise<SupplierReadResult<NormalizedDeliveryEstimate>> {
    return normalizeCjDeliveryEstimate(this.fixtures.delivery);
  }

  async readReturnPolicy(_supplierSku?: string): Promise<SupplierReadResult<NormalizedReturnPolicy>> {
    return fail(
      "returns.policy.read",
      "SUPPLIER_CAPABILITY_NOT_PROVEN",
      "CJ return-policy normalization is not admitted to the R0 live-read capability map."
    );
  }

  async verifyWebhook(input: {
    payload: string;
    signature: string;
  }): Promise<SupplierReadResult<NormalizedWebhookVerification>> {
    const fixture = this.fixtures.webhook;
    if (input.payload !== fixture.payload || input.signature !== fixture.signature) {
      return fail(
        "webhook.verify",
        "SUPPLIER_RESPONSE_MALFORMED",
        "Local CJ webhook fixture did not match the deterministic proving input."
      );
    }
    return ok("webhook.verify", {
      providerId: CJ_PROVIDER_ID,
      verified: fixture.signatureValid,
      verificationClass: "LOCAL_FIXTURE_ONLY",
      evidenceTimestamp: fixture.observedAt,
    });
  }

  async simulateOrder(input: {
    supplierSku: string;
    quantity: number;
    destinationCountry: string;
    destinationPostalCode?: string;
  }): Promise<SupplierReadResult<LocalSupplierOrderSimulation>> {
    const product = normalizeCjProduct(this.fixtures.product);
    if (!product.ok) return fail("order.simulate", product.code, product.message);
    const freight = normalizeCjFreightQuote(this.fixtures.freight);
    if (!freight.ok) return fail("order.simulate", freight.code, freight.message);
    return ok("order.simulate", {
      providerId: CJ_PROVIDER_ID,
      supplierSku: input.supplierSku,
      quantity: input.quantity,
      destinationCountry: input.destinationCountry,
      destinationPostalCode: input.destinationPostalCode ?? null,
      itemCostCents: product.data.itemCostCents,
      shippingCostCents: freight.data.shippingCostCents,
      landedCostCents: calculateLandedCostCents({
        itemCostCents: product.data.itemCostCents,
        shippingCostCents: freight.data.shippingCostCents,
      }),
      externalSubmissionPermitted: false,
      executionAuthority: "LOCKED_R0",
      finalState: "SIMULATION_ONLY",
    });
  }
}

export function createCjFixtureQualificationAdapter(fixtures: CjFixtureBundleR0) {
  return new CjFixtureReadOnlyQualificationAdapter(fixtures);
}
