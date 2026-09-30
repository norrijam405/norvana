import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runCJLiveReadOnlyProbe } from "../src/lib/supplier-gateway/cj/live-client.ts";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function findRouteFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) return findRouteFiles(fullPath);
      if (entry.isFile() && entry.name === "route.ts") return [fullPath];
      return [];
    })
  );
  return nested.flat();
}

test("CJ live read probe uses only token + admitted read endpoints and returns no secret", async () => {
  const calls: Array<{ url: string; method: string; body: string | null; headers: Headers }> = [];
  const originalFetch = globalThis.fetch;

  const responses = [
    {
      code: 200,
      result: true,
      success: true,
      message: "Success",
      data: {
        accessToken: "TEST_ACCESS_TOKEN_DO_NOT_RETURN",
        refreshToken: "TEST_REFRESH_TOKEN_DO_NOT_RETURN",
        accessTokenExpiryDate: "2027-03-01T00:00:00+00:00",
      },
    },
    {
      code: 200,
      result: true,
      success: true,
      message: "Success",
      data: {
        pageSize: 1,
        pageNumber: 1,
        totalRecords: 1,
        totalPages: 1,
        content: [
          {
            productList: [
              {
                id: "LIVE-TEST-PID",
                nameEn: "Live Test Product",
                sku: "LIVE-TEST-SKU",
                bigImage: "https://example.invalid/product.jpg",
                sellPrice: "8.50",
              },
            ],
          },
        ],
      },
    },
    {
      code: 200,
      result: true,
      success: true,
      message: "Success",
      data: {
        pid: "LIVE-TEST-PID",
        productNameEn: "Live Test Product",
        productSku: "LIVE-TEST-SKU",
        sellPrice: 8.5,
        variants: [
          {
            vid: "LIVE-TEST-VID",
            pid: "LIVE-TEST-PID",
            variantNameEn: "Live Test Product Black",
            variantSku: "LIVE-TEST-SKU-BLK",
            variantSellPrice: 8.75,
          },
        ],
      },
    },
    {
      code: 200,
      result: true,
      success: true,
      message: "Success",
      data: {
        vid: "LIVE-TEST-VID",
        pid: "LIVE-TEST-PID",
        variantNameEn: "Live Test Product Black",
        variantSku: "LIVE-TEST-SKU-BLK",
        variantSellPrice: 8.75,
        inventories: [
          {
            countryCode: "CN",
            totalInventory: 20,
            cjInventory: 5,
            factoryInventory: 15,
            stock: [
              {
                stockId: "WAREHOUSE-ID",
                inventory: 5,
                factoryInventory: 15,
              },
            ],
          },
        ],
      },
    },
    {
      code: 200,
      result: true,
      success: true,
      message: "Success",
      data: [
        {
          vid: "LIVE-TEST-VID",
          areaId: "1",
          areaEn: "China Warehouse",
          countryCode: "CN",
          storageNum: 20,
          totalInventoryNum: 20,
        },
      ],
    },
    {
      code: 200,
      result: true,
      success: true,
      message: "Success",
      data: [
        {
          logisticAging: "5-9",
          logisticPrice: 4.71,
          logisticName: "CJ Test Packet",
        },
      ],
    },
  ];

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);
    const body = typeof init?.body === "string" ? init.body : null;
    calls.push({ url, method, body, headers });

    const next = responses.shift();
    if (!next) throw new Error("UNEXPECTED_FETCH");
    return jsonResponse(next);
  }) as typeof fetch;

  try {
    const result = await runCJLiveReadOnlyProbe("TEST_API_KEY_DO_NOT_RETURN");

    assert.equal(result.result, "PASS");
    assert.equal(result.authority, "READ_ONLY_R0");
    assert.equal(result.authentication.apiKeyPresent, true);
    assert.equal(result.authentication.accessTokenObtained, true);
    assert.equal(result.authentication.tokenReturnedToClient, false);
    assert.equal(result.authentication.tokenPersistedByProbe, false);
    assert.equal(result.finalState, "STOP_BEFORE_ORDER_OR_PUBLICATION");
    assert.equal(result.catalog.firstProductId, "LIVE-TEST-PID");
    assert.equal(result.variant.id, "LIVE-TEST-VID");
    assert.equal(result.variant.stockState, "IN_STOCK");
    assert.equal(result.variant.stockQuantity, 20);
    assert.equal(result.warehouse.originCountryCode, "CN");
    assert.equal(result.warehouse.availableWarehouseCount, 1);
    assert.equal(result.warehouse.evidenceSource, "inventory.read");
    assert.equal(result.freight.quoteCount, 1);

    const serialized = JSON.stringify(result);
    assert.doesNotMatch(serialized, /TEST_API_KEY_DO_NOT_RETURN/);
    assert.doesNotMatch(serialized, /TEST_ACCESS_TOKEN_DO_NOT_RETURN/);
    assert.doesNotMatch(serialized, /TEST_REFRESH_TOKEN_DO_NOT_RETURN/);

    assert.equal(calls.length, 6);
    assert.equal(calls[0].method, "POST");
    assert.match(calls[0].url, /authentication\/getAccessToken$/);

    for (const call of calls.slice(1)) {
      assert.equal(new URL(call.url).origin, "https://developers.cjdropshipping.com");
      assert.doesNotMatch(call.url, /\/shopping\/order\//);
      assert.doesNotMatch(call.url, /\/shopping\/pay\//);
      assert.doesNotMatch(call.url, /saveProduct/);
      assert.doesNotMatch(call.url, /product\/conn\/connection/);
    }

    assert.match(calls[1].url, /product\/listV2/);
    assert.match(calls[2].url, /product\/query/);
    assert.match(calls[3].url, /product\/variant\/queryByVid/);
    assert.match(calls[4].url, /product\/stock\/queryByVid/);
    assert.match(calls[5].url, /logistic\/freightCalculate/);

    assert.equal(calls[5].method, "POST");
    assert.match(calls[5].body ?? "", /"quantity":1/);
    assert.match(calls[5].body ?? "", /"vid":"LIVE-TEST-VID"/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("CJ live client source contains no order/payment endpoint and no token logging", async () => {
  const source = await readFile(
    new URL("../src/lib/supplier-gateway/cj/live-client.ts", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /createOrder/);
  assert.doesNotMatch(source, /confirmOrder/);
  assert.doesNotMatch(source, /payBalance/);
  assert.doesNotMatch(source, /console\.(log|info|warn|error).*accessToken/);
  assert.doesNotMatch(source, /console\.(log|info|warn|error).*apiKey/);
});

test("every CJ runtime live-probe route preserves the deliberate confirmation boundary", async () => {
  const cjRouteRoot = fileURLToPath(
    new URL("../src/app/api/suppliers/cj/", import.meta.url)
  );
  const routeFiles = await findRouteFiles(cjRouteRoot);

  assert.ok(routeFiles.length > 0);
  assert.equal(
    routeFiles.some((routeFile) =>
      routeFile.endsWith(join("live-probe", "run", "route.ts"))
    ),
    false,
    "obsolete alternate /live-probe/run route must remain absent"
  );

  const liveProbeCallers: Array<{ routeFile: string; source: string }> = [];
  for (const routeFile of routeFiles) {
    const source = await readFile(routeFile, "utf8");
    if (source.includes("runCJLiveReadOnlyProbe")) {
      liveProbeCallers.push({ routeFile, source });
    }
  }

  assert.ok(
    liveProbeCallers.length > 0,
    "expected at least one guarded CJ live-probe runtime route"
  );

  for (const { routeFile, source } of liveProbeCallers) {
    assert.match(
      source,
      /VERCEL_ENV\s*!==\s*"preview"/,
      `${routeFile} must remain Preview-only`
    );
    assert.match(
      source,
      /RUN_CJ_READ_ONLY_PROBE/,
      `${routeFile} must require explicit live-probe confirmation`
    );
    assert.match(
      source,
      /NORVANA_EXTERNAL_FULFILLMENT_ENABLED/,
      `${routeFile} must fail closed if external fulfillment is enabled`
    );
    assert.match(
      source,
      /IGNIAQUA_FEDERATION_ENABLED/,
      `${routeFile} must fail closed if federation is enabled`
    );
    assert.doesNotMatch(source, /order\.create/);
    assert.doesNotMatch(source, /publishProduct/);
  }
});
