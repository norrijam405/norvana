import type {
  NormalizedShippingQuote,
  NormalizedSupplierProduct,
  NormalizedSupplierVariant,
  NormalizedSupplierWarehouse,
} from "../types.ts";
import type {
  CJFreightQuoteDto,
  CJProductDetailDto,
  CJProductListItem,
  CJStockDto,
  CJVariantDto,
  CJWarehouseDto,
} from "./types.ts";

function decimalUsdToCents(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round((numeric + Number.EPSILON) * 100);
}

export function parseCJDeliveryWindow(value: string | null | undefined) {
  if (!value) return { min: null, max: null };
  const nums = value.match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return { min: null, max: null };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: Math.min(nums[0], nums[1]), max: Math.max(nums[0], nums[1]) };
}

function stockSummary(stocks: CJStockDto[] | undefined) {
  if (!stocks) return { state: "UNKNOWN" as const, quantity: null };
  const values = stocks
    .map((item) => item.storageNum ?? item.totalInventoryNum)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!values.length) return { state: "UNKNOWN" as const, quantity: null };
  const quantity = values.reduce((sum, value) => sum + Math.max(0, value), 0);
  return {
    state: quantity > 0 ? ("IN_STOCK" as const) : ("OUT_OF_STOCK" as const),
    quantity,
  };
}

export function normalizeCJVariant(
  input: CJVariantDto,
  stocks?: CJStockDto[]
): NormalizedSupplierVariant {
  const stock = stockSummary(stocks);
  const sku = input.variantSku?.trim();
  if (!input.vid || !sku) throw new Error("CJ_VARIANT_REQUIRED_ID_OR_SKU_MISSING");

  return {
    supplierVariantId: input.vid,
    supplierSku: sku,
    title: input.variantNameEn?.trim() || sku,
    itemCostCents: decimalUsdToCents(input.variantSellPrice),
    stockState: stock.state,
    stockQuantity: stock.quantity,
    options: input.variantKey ? { raw: input.variantKey } : {},
  };
}

export function normalizeCJProduct(
  input: CJProductDetailDto | CJProductListItem,
  stocksByVid: Record<string, CJStockDto[]> = {}
): NormalizedSupplierProduct {
  const productSku = input.productSku?.trim();
  if (!input.pid || !productSku) throw new Error("CJ_PRODUCT_REQUIRED_ID_OR_SKU_MISSING");

  const variants =
    "variants" in input && Array.isArray(input.variants)
      ? input.variants.map((variant) => normalizeCJVariant(variant, stocksByVid[variant.vid]))
      : [];

  const aggregateKnown = variants.filter((variant) => variant.stockQuantity !== null);
  const aggregateQuantity = aggregateKnown.length
    ? aggregateKnown.reduce((sum, variant) => sum + (variant.stockQuantity ?? 0), 0)
    : null;

  const image = ("bigImage" in input ? input.bigImage : null) || input.productImage || null;

  return {
    providerId: "cjdropshipping",
    supplierProductId: input.pid,
    supplierSku: productSku,
    title: input.productNameEn?.trim() || productSku,
    description:
      "description" in input && typeof input.description === "string"
        ? input.description
        : "",
    productFamily: "CJ_PRODUCT",
    itemCostCents: decimalUsdToCents(input.sellPrice),
    currency: "USD",
    warehouse: null,
    stockState:
      aggregateQuantity === null ? "UNKNOWN" : aggregateQuantity > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
    stockQuantity: aggregateQuantity,
    productionTimeDays: { min: null, max: null },
    images: image ? [image] : [],
    variants,
    evidenceTimestamp: null,
  };
}

export function normalizeCJWarehouse(input: CJWarehouseDto): NormalizedSupplierWarehouse {
  if (!input.id) throw new Error("CJ_WAREHOUSE_ID_MISSING");
  const parts = [input.address1, input.address2]
    .map((value) => value?.trim())
    .filter(Boolean);

  return {
    providerId: "cjdropshipping",
    supplierWarehouseId: input.id,
    name: input.name?.trim() || input.id,
    countryCode: input.areaCountryCode?.trim() || null,
    city: input.city?.trim() || null,
    address: parts.length ? parts.join(", ") : null,
    evidenceTimestamp: null,
  };
}

export function normalizeCJFreightQuote(
  input: CJFreightQuoteDto,
  context: {
    supplierSku: string;
    destinationCountry: string;
    destinationPostalCode?: string;
    warehouse?: string | null;
  }
): NormalizedShippingQuote {
  const name = input.logisticName?.trim();
  if (!name) throw new Error("CJ_FREIGHT_METHOD_MISSING");

  const shippingCostCents = decimalUsdToCents(input.totalPostageFee ?? input.logisticPrice);
  if (shippingCostCents === null) throw new Error("CJ_FREIGHT_PRICE_MISSING");

  return {
    providerId: "cjdropshipping",
    supplierSku: context.supplierSku,
    destinationCountry: context.destinationCountry,
    destinationPostalCode: context.destinationPostalCode ?? null,
    shippingMethod: name,
    shippingCostCents,
    currency: "USD",
    deliveryWindowDays: parseCJDeliveryWindow(input.logisticAging),
    warehouse: context.warehouse ?? null,
    evidenceTimestamp: null,
  };
}
