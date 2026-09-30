import type {
  CjDeliveryEstimateDtoR0,
  CjFixtureBundleR0,
  CjFreightQuoteDtoR0,
  CjInventoryDtoR0,
  CjProductDtoR0,
  CjProviderErrorDtoR0,
  CjVariantDtoR0,
  CjWarehouseDtoR0,
  CjWebhookFixtureDtoR0,
} from "./cj.ts";
import { CJ_R0_FIXTURE_CLASS } from "./cj.ts";

const observedAt = "2026-09-29T19:50:00Z";

export const CJ_R0_VARIANT_FIXTURE: CjVariantDtoR0 = {
  fixtureClass: CJ_R0_FIXTURE_CLASS,
  variantId: "cj-r0-variant-001",
  sku: "CJ-R0-TRAVEL-001-BLK",
  title: "Local CJ fixture — black variant",
  itemCostMinor: 825,
  currency: "USD",
  stockQuantity: 27,
  warehouseId: "CJ-R0-US-WH-001",
  options: { color: "black" },
  observedAt,
};

export const CJ_R0_PRODUCT_FIXTURE: CjProductDtoR0 = {
  fixtureClass: CJ_R0_FIXTURE_CLASS,
  productId: "cj-r0-product-001",
  sku: "CJ-R0-TRAVEL-001",
  title: "Local CJ fixture — travel organizer",
  description: "Synthetic CJ response used only for Norvana offline qualification.",
  productFamily: "travel-tech-organizer",
  itemCostMinor: 825,
  currency: "USD",
  warehouseId: "CJ-R0-US-WH-001",
  stockQuantity: 27,
  productionDays: { min: 1, max: 2 },
  images: ["https://example.invalid/norvana-cj-r0-fixture.png"],
  variants: [CJ_R0_VARIANT_FIXTURE],
  observedAt,
};

export const CJ_R0_INVENTORY_FIXTURE: CjInventoryDtoR0 = {
  fixtureClass: CJ_R0_FIXTURE_CLASS,
  sku: "CJ-R0-TRAVEL-001-BLK",
  variantId: "cj-r0-variant-001",
  title: "Local CJ fixture inventory",
  warehouseId: "CJ-R0-US-WH-001",
  quantity: 27,
  observedAt,
};

export const CJ_R0_WAREHOUSE_FIXTURE: CjWarehouseDtoR0 = {
  fixtureClass: CJ_R0_FIXTURE_CLASS,
  warehouseId: "CJ-R0-US-WH-001",
  name: "Local CJ fixture warehouse",
  country: "US",
  region: "R0-SYNTHETIC",
  observedAt,
};

export const CJ_R0_FREIGHT_FIXTURE: CjFreightQuoteDtoR0 = {
  fixtureClass: CJ_R0_FIXTURE_CLASS,
  sku: "CJ-R0-TRAVEL-001-BLK",
  destinationCountry: "US",
  destinationPostalCode: "75201",
  shippingMethod: "CJ_R0_SYNTHETIC_STANDARD",
  shippingCostMinor: 499,
  currency: "USD",
  deliveryDays: { min: 6, max: 10 },
  warehouseId: "CJ-R0-US-WH-001",
  observedAt,
};

export const CJ_R0_DELIVERY_FIXTURE: CjDeliveryEstimateDtoR0 = {
  fixtureClass: CJ_R0_FIXTURE_CLASS,
  sku: "CJ-R0-TRAVEL-001-BLK",
  destinationCountry: "US",
  destinationPostalCode: "75201",
  deliveryDays: { min: 6, max: 10 },
  warehouseId: "CJ-R0-US-WH-001",
  observedAt,
};

export const CJ_R0_WEBHOOK_FIXTURE: CjWebhookFixtureDtoR0 = {
  fixtureClass: CJ_R0_FIXTURE_CLASS,
  payload: "{\"fixture\":\"cj-r0\"}",
  signature: "LOCAL_FIXTURE_SIGNATURE_ONLY",
  signatureValid: true,
  observedAt,
};

export const CJ_R0_FIXTURES: CjFixtureBundleR0 = {
  product: CJ_R0_PRODUCT_FIXTURE,
  variant: CJ_R0_VARIANT_FIXTURE,
  inventory: CJ_R0_INVENTORY_FIXTURE,
  warehouse: CJ_R0_WAREHOUSE_FIXTURE,
  freight: CJ_R0_FREIGHT_FIXTURE,
  delivery: CJ_R0_DELIVERY_FIXTURE,
  webhook: CJ_R0_WEBHOOK_FIXTURE,
};

export const CJ_R0_INVALID_CREDENTIAL_FIXTURE: CjProviderErrorDtoR0 = {
  fixtureClass: CJ_R0_FIXTURE_CLASS,
  errorCode: "AUTH_INVALID",
  message: "Synthetic invalid credential response.",
};

export const CJ_R0_RATE_LIMIT_FIXTURE: CjProviderErrorDtoR0 = {
  fixtureClass: CJ_R0_FIXTURE_CLASS,
  errorCode: "RATE_LIMITED",
  message: "Synthetic CJ rate-limit response.",
  retryAfterSeconds: 60,
};

export const CJ_R0_MALFORMED_FIXTURE = {
  unexpected: true,
} as const;

export const CJ_R0_MISSING_STOCK_FIXTURE: CjInventoryDtoR0 = {
  ...CJ_R0_INVENTORY_FIXTURE,
  quantity: null,
};

export const CJ_R0_MISSING_FREIGHT_FIXTURE: CjFreightQuoteDtoR0 = {
  ...CJ_R0_FREIGHT_FIXTURE,
  shippingCostMinor: null,
};

export const CJ_R0_UNKNOWN_CURRENCY_FIXTURE: CjFreightQuoteDtoR0 = {
  ...CJ_R0_FREIGHT_FIXTURE,
  currency: "ZZZ",
};
