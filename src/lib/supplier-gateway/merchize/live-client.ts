const ALLOWED_SUFFIX = ".merchize.com";

function safeBaseUrl(raw: string) {
  const value = raw.trim();
  if (!value) throw new Error("MERCHIZE_BASE_URL_MISSING");

  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:") throw new Error("MERCHIZE_BASE_URL_REQUIRES_HTTPS");
  if (host !== "merchize.com" && !host.endsWith(ALLOWED_SUFFIX)) {
    throw new Error("MERCHIZE_BASE_URL_HOST_NOT_ALLOWED");
  }

  url.hash = "";
  url.search = "";
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

function catalogUrl(baseUrl: string) {
  const base = safeBaseUrl(baseUrl);
  const url = new URL("product/catalog", base);
  url.searchParams.set("limit", "1");
  url.searchParams.set("page", "1");
  return url;
}

function keysOf(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? Object.keys(value as Record<string, unknown>).sort().slice(0, 32)
    : [];
}

function findFirstArray(value: unknown, depth = 0): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object" || depth > 4) return null;

  const record = value as Record<string, unknown>;
  const preferred = ["data", "result", "items", "products", "rows", "docs", "catalog"];
  for (const key of preferred) {
    const nested = record[key];
    const found = findFirstArray(nested, depth + 1);
    if (found) return found;
  }
  for (const nested of Object.values(record)) {
    const found = findFirstArray(nested, depth + 1);
    if (found) return found;
  }
  return null;
}

export async function runMerchizeCatalogReadOnlyProbe(input: {
  accessToken: string;
  baseUrl: string;
}) {
  const token = input.accessToken.trim();
  if (!token) throw new Error("NORVANA_MERCHIZE_CREDENTIAL_NOT_BOUND");

  const url = catalogUrl(input.baseUrl);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(`MERCHIZE_NON_JSON_RESPONSE|${response.status}`);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("MERCHIZE_RESPONSE_JSON_PARSE_FAILED");
  }

  if (!response.ok) {
    throw new Error(`MERCHIZE_PROVIDER_HTTP_FAILURE|${response.status}`);
  }

  const catalog = findFirstArray(body);
  const first = catalog?.[0] ?? null;

  return {
    result: "PASS" as const,
    mode: "MERCHIZE_LIVE_READ_ONLY_CATALOG_PROBE" as const,
    authority: "READ_ONLY_R0" as const,
    authentication: {
      accessTokenPresent: true,
      tokenReturnedToClient: false,
      tokenPersistedByProbe: false,
    },
    request: {
      method: "GET" as const,
      path: url.pathname,
      requestedPage: 1,
      requestedLimit: 1,
    },
    response: {
      httpStatus: response.status,
      topLevelKeys: keysOf(body),
      catalogArrayFound: Boolean(catalog),
      catalogItemCountObserved: catalog?.length ?? null,
      firstItemKeys: keysOf(first),
    },
    finalState: "STOP_BEFORE_ORDER_OR_PUBLICATION" as const,
    forbiddenActions: [
      "order.create",
      "order.update",
      "order.cancel",
      "payment",
      "product.publish",
      "supplier.activate",
      "fulfillment.execute",
      "refund",
      "price.change",
    ] as const,
  };
}

export const __merchizeLiveProbeInternals = {
  safeBaseUrl,
  catalogUrl,
  findFirstArray,
};
