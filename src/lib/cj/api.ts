const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

type CjEnvelope<T> = {
  code?: number;
  result?: boolean;
  success?: boolean;
  message?: string;
  data?: T;
  requestId?: string;
};

type TokenData = {
  accessToken: string;
  accessTokenExpiryDate?: string;
  refreshToken?: string;
  refreshTokenExpiryDate?: string;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: CachedToken | null = null;
let lastCjRequestAt = 0;

async function cjThrottle() {
  const waitMs = Math.max(0, 1050 - (Date.now() - lastCjRequestAt));
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastCjRequestAt = Date.now();
}

function parseExpiry(value?: string) {
  if (!value) return Date.now() + 23 * 60 * 60 * 1000;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now() + 23 * 60 * 60 * 1000;
}

function isRateLimit(message: string, status: number) {
  return status === 429 || /too many requests|qps limit|rate limit/i.test(message);
}

async function cjJson<T>(url: string, init: RequestInit = {}) {
  let lastMessage = "CJ request failed.";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await cjThrottle();
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      headers: {
        ...(init.headers || {}),
        "content-type": "application/json",
      },
    });
    const payload = (await response.json().catch(() => null)) as CjEnvelope<T> | null;
    const message = payload?.message || `CJ request failed (${response.status}).`;
    lastMessage = message;

    if (response.ok && payload && payload.result !== false && payload.success !== false) {
      return payload;
    }

    if (isRateLimit(message, response.status) && attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 1200 + attempt * 500));
      continue;
    }

    throw new Error(message);
  }
  throw new Error(lastMessage);
}

export async function getCjAccessToken() {
  if (tokenCache && tokenCache.expiresAt - Date.now() > 5 * 60 * 1000) return tokenCache.accessToken;

  const apiKey = process.env.CJ_API_KEY?.trim();
  if (!apiKey) throw new Error("CJ_API_KEY is not configured.");

  const payload = await cjJson<TokenData>(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    body: JSON.stringify({ apiKey }),
  });

  const accessToken = payload.data?.accessToken?.trim();
  if (!accessToken) throw new Error("CJ authentication did not return an access token.");

  tokenCache = {
    accessToken,
    expiresAt: parseExpiry(payload.data?.accessTokenExpiryDate),
  };
  return accessToken;
}

export async function cjAuthed<T>(path: string, init: RequestInit = {}) {
  const token = await getCjAccessToken();
  return cjJson<T>(`${CJ_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "CJ-Access-Token": token,
    },
  });
}

export type CjVariant = {
  vid: string;
  pid?: string;
  variantNameEn?: string | null;
  variantSku?: string;
  variantKey?: string | null;
  variantWeight?: number | string | null;
  variantSellPrice?: number | string | null;
  variantImage?: string | null;
};

export type CjProduct = {
  pid: string;
  productNameEn?: string;
  productSku?: string;
  bigImage?: string;
  productImageSet?: string[];
  sellPrice?: number | string | null;
  suggestSellPrice?: string | null;
  categoryName?: string | null;
  variants?: CjVariant[];
};

export type CjInventoryRow = {
  areaEn?: string;
  areaId?: string | number;
  countryCode?: string;
  countryNameEn?: string;
  totalInventoryNum?: number;
  cjInventoryNum?: number;
  factoryInventoryNum?: number;
};

export type CjFreightRow = {
  logisticAging?: string;
  logisticPrice?: number;
  logisticName?: string;
  taxesFee?: number;
  clearanceOperationFee?: number;
  totalPostageFee?: number;
};

export async function loadCjProductBySku(sku: string) {
  const q = encodeURIComponent(sku);
  let productPayload: CjEnvelope<CjProduct>;
  try {
    productPayload = await cjAuthed<CjProduct>(`/product/query?productSku=${q}`);
  } catch {
    productPayload = await cjAuthed<CjProduct>(`/product/query?variantSku=${q}`);
  }
  const product = productPayload.data;
  if (!product?.pid) throw new Error("CJ did not return a product for that SKU.");

  return {
    product,
    variants: Array.isArray(product.variants) ? product.variants : [],
    requestId: productPayload.requestId || null,
  };
}

export async function quoteCjVariantToUs(vid: string) {
  const q = encodeURIComponent(vid);
  const stockPayload = await cjAuthed<CjInventoryRow[]>(`/product/stock/queryByVid?vid=${q}`);
  const inventory = Array.isArray(stockPayload.data) ? stockPayload.data : [];
  const us = inventory.find((row) => row.countryCode === "US" && Number(row.totalInventoryNum || 0) > 0);
  const cn = inventory.find((row) => row.countryCode === "CN" && Number(row.totalInventoryNum || 0) > 0);
  const origin = us ? "US" : cn ? "CN" : inventory.find((row) => Number(row.totalInventoryNum || 0) > 0)?.countryCode || "CN";

  const freightPayload = await cjAuthed<CjFreightRow[]>("/logistic/freightCalculate", {
    method: "POST",
    body: JSON.stringify({
      startCountryCode: origin,
      endCountryCode: "US",
      products: [{ quantity: 1, vid }],
    }),
  });

  const methods = (Array.isArray(freightPayload.data) ? freightPayload.data : [])
    .filter((row) => Number.isFinite(Number(row.logisticPrice)))
    .sort((a, b) => Number(a.logisticPrice) - Number(b.logisticPrice));

  return {
    originCountryCode: origin,
    inventory,
    methods,
    requestId: freightPayload.requestId || stockPayload.requestId || null,
  };
}

export function parseAging(value?: string | null) {
  if (!value) return { min: null, max: null };
  const matches = value.match(/\d+/g)?.map(Number) || [];
  if (!matches.length) return { min: null, max: null };
  return { min: matches[0], max: matches[matches.length - 1] };
}
