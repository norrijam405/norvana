import {
  normalizeCJFreightQuote,
  normalizeCJProduct,
  normalizeCJVariant,
} from "./normalize.ts";
import { evaluateCJEndpointR0, mapCJProviderFailure } from "./policy.ts";
import type {
  CJApiEnvelope,
  CJFreightQuoteDto,
  CJProductDetailDto,
  CJProductListData,
  CJStockDto,
  CJVariantDto,
} from "./types.ts";

const CJ_ORIGIN = "https://developers.cjdropshipping.com";
const TOKEN_PATH = "/api2.0/v1/authentication/getAccessToken";
const GLOBAL_WAREHOUSE_PATH = "/api2.0/v1/product/globalWarehouseList";

type TokenData = {
  accessToken?: string;
  accessTokenExpiryDate?: string;
  refreshToken?: string;
  refreshTokenExpiryDate?: string;
};

type WarehouseListItem = {
  areaEn?: string | null;
  areaId?: string | number | null;
  countryCode?: string | null;
  nameEn?: string | null;
  en?: string | null;
  disabled?: boolean | null;
};

type VariantWithInventories = CJVariantDto & {
  inventories?: Array<{
    countryCode?: string | null;
    totalInventory?: number | null;
    cjInventory?: number | null;
    factoryInventory?: number | null;
    stock?: Array<{
      stockId?: string | null;
      inventory?: number | null;
      factoryInventory?: number | null;
    }> | null;
  }> | null;
};

function ensureCJUrl(url: URL, allowToken = false) {
  if (url.origin !== CJ_ORIGIN) {
    throw new Error("CJ_HOST_NOT_ALLOWED");
  }

  if (allowToken && url.pathname === TOKEN_PATH) return;

  if (url.pathname === GLOBAL_WAREHOUSE_PATH) return;

  const decision = evaluateCJEndpointR0(url.pathname);
  if (!decision.ok) {
    throw new Error(decision.code);
  }
}

async function readJson<T>(
  url: URL,
  init: RequestInit,
  options?: { allowToken?: boolean }
): Promise<CJApiEnvelope<T>> {
  ensureCJUrl(url, options?.allowToken);

  const response = await fetch(url, {
    ...init,
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("CJ_NON_JSON_RESPONSE");
  }

  if (!body || typeof body !== "object") {
    throw new Error("CJ_RESPONSE_INVALID");
  }

  const envelope = body as CJApiEnvelope<T>;
  if (!response.ok || envelope.code !== 200 || envelope.result === false || envelope.success === false) {
    const mapped = mapCJProviderFailure({
      httpStatus: response.status,
      code: typeof envelope.code === "number" ? envelope.code : null,
      message: typeof envelope.message === "string" ? envelope.message : null,
    });
    throw new Error(mapped.code);
  }

  return envelope;
}

async function getAccessToken(apiKey: string) {
  const url = new URL(TOKEN_PATH, CJ_ORIGIN);
  const envelope = await readJson<TokenData>(
    url,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ apiKey }),
    },
    { allowToken: true }
  );

  const token = envelope.data?.accessToken;
  if (!token) throw new Error("CJ_ACCESS_TOKEN_MISSING");

  return {
    accessToken: token,
    accessTokenExpiryDate: envelope.data?.accessTokenExpiryDate ?? null,
  };
}

async function cjGet<T>(
  path: string,
  accessToken: string,
  params?: Record<string, string>
) {
  const url = new URL(path, CJ_ORIGIN);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, value);
  }
  return readJson<T>(url, {
    method: "GET",
    headers: {
      "CJ-Access-Token": accessToken,
      accept: "application/json",
    },
  });
}

async function cjPost<T>(
  path: string,
  accessToken: string,
  body: unknown
) {
  const url = new URL(path, CJ_ORIGIN);
  return readJson<T>(url, {
    method: "POST",
    headers: {
      "CJ-Access-Token": accessToken,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });
}

function chooseOriginCountry(stocks: CJStockDto[]) {
  const positive = stocks.find(
    (row) => (row.storageNum ?? row.totalInventoryNum ?? 0) > 0 && row.countryCode
  );
  return positive?.countryCode ?? stocks.find((row) => row.countryCode)?.countryCode ?? null;
}

function summarizeWarehouse(
  warehouses: WarehouseListItem[],
  countryCode: string | null
) {
  const matching = countryCode
    ? warehouses.filter((row) => row.countryCode === countryCode && row.disabled !== true)
    : [];

  return {
    originCountryCode: countryCode,
    availableWarehouseCount: warehouses.filter((row) => row.disabled !== true).length,
    matchingOriginWarehouses: matching.slice(0, 5).map((row) => ({
      areaId: row.areaId ?? null,
      countryCode: row.countryCode ?? null,
      name: row.areaEn ?? row.nameEn ?? row.en ?? null,
    })),
  };
}

export async function runCJLiveReadOnlyProbe(apiKey: string) {
  if (!apiKey.trim()) throw new Error("NORVANA_CJ_CREDENTIAL_NOT_BOUND");

  const token = await getAccessToken(apiKey);

  const catalog = await cjGet<CJProductListData>(
    "/api2.0/v1/product/listV2",
    token.accessToken,
    { page: "1", size: "1" }
  );
  const first = catalog.data?.list?.[0];
  if (!first?.pid) throw new Error("CJ_CATALOG_EMPTY");

  const detail = await cjGet<CJProductDetailDto>(
    "/api2.0/v1/product/query",
    token.accessToken,
    { pid: first.pid }
  );
  if (!detail.data?.pid) throw new Error("CJ_PRODUCT_DETAIL_MISSING");

  const firstVariant = detail.data.variants?.[0];
  if (!firstVariant?.vid) throw new Error("CJ_PRODUCT_VARIANT_MISSING");

  const variantEnvelope = await cjGet<VariantWithInventories>(
    "/api2.0/v1/product/variant/queryByVid",
    token.accessToken,
    { vid: firstVariant.vid, features: "enable_inventory" }
  );
  if (!variantEnvelope.data?.vid) throw new Error("CJ_VARIANT_DETAIL_MISSING");

  const stockEnvelope = await cjGet<CJStockDto[]>(
    "/api2.0/v1/product/stock/queryByVid",
    token.accessToken,
    { vid: firstVariant.vid }
  );
  const stocks = Array.isArray(stockEnvelope.data) ? stockEnvelope.data : [];
  const originCountry = chooseOriginCountry(stocks);

  const warehousesEnvelope = await cjGet<WarehouseListItem[]>(
    GLOBAL_WAREHOUSE_PATH,
    token.accessToken
  );
  const warehouses = Array.isArray(warehousesEnvelope.data)
    ? warehousesEnvelope.data
    : [];

  let freight:
    | {
        quoteCount: number;
        cheapest: ReturnType<typeof normalizeCJFreightQuote> | null;
      }
    | { quoteCount: 0; cheapest: null; skippedReason: string };

  if (originCountry) {
    const freightEnvelope = await cjPost<CJFreightQuoteDto[]>(
      "/api2.0/v1/logistic/freightCalculate",
      token.accessToken,
      {
        startCountryCode: originCountry,
        endCountryCode: "US",
        products: [{ quantity: 1, vid: firstVariant.vid }],
      }
    );
    const quotes = Array.isArray(freightEnvelope.data)
      ? freightEnvelope.data.map((quote) =>
          normalizeCJFreightQuote(quote, {
            supplierSku: firstVariant.variantSku ?? firstVariant.vid,
            destinationCountry: "US",
          })
        )
      : [];
    quotes.sort(
      (a, b) =>
        (a.shippingCostCents ?? Number.MAX_SAFE_INTEGER) -
        (b.shippingCostCents ?? Number.MAX_SAFE_INTEGER)
    );
    freight = { quoteCount: quotes.length, cheapest: quotes[0] ?? null };
  } else {
    freight = {
      quoteCount: 0,
      cheapest: null,
      skippedReason: "NO_STOCK_ORIGIN_COUNTRY_RETURNED",
    };
  }

  const normalizedVariant = normalizeCJVariant(
    variantEnvelope.data,
    stocks
  );
  const normalizedProduct = normalizeCJProduct(detail.data, {
    [firstVariant.vid]: stocks,
  });

  return {
    result: "PASS" as const,
    mode: "CJ_LIVE_READ_ONLY_PROBE" as const,
    authority: "READ_ONLY_R0" as const,
    authentication: {
      apiKeyPresent: true,
      accessTokenObtained: true,
      tokenReturnedToClient: false,
      tokenPersistedByProbe: false,
      accessTokenExpiryDate: token.accessTokenExpiryDate,
    },
    catalog: {
      firstProductId: normalizedProduct.supplierProductId,
      firstProductSku: normalizedProduct.supplierSku,
      title: normalizedProduct.title,
      itemCostCents: normalizedProduct.itemCostCents,
      currency: normalizedProduct.currency,
    },
    variant: {
      id: normalizedVariant.supplierVariantId,
      sku: normalizedVariant.supplierSku,
      itemCostCents: normalizedVariant.itemCostCents,
      stockState: normalizedVariant.stockState,
      stockQuantity: normalizedVariant.stockQuantity,
    },
    warehouse: summarizeWarehouse(warehouses, originCountry),
    freight,
    finalState: "STOP_BEFORE_ORDER_OR_PUBLICATION" as const,
    forbiddenActions: [
      "order.create",
      "order.confirm",
      "payment",
      "product.publish",
      "supplier.activate",
      "fulfillment.execute",
      "refund",
      "price.change",
    ] as const,
  };
}
