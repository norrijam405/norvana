import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CJ_FORBIDDEN_R0_PATH_FRAGMENTS,
  CJ_READ_ONLY_ENDPOINTS,
} from "../src/lib/supplier-gateway/cj/types.ts";
import {
  normalizeCJFreightQuote,
  normalizeCJProduct,
  normalizeCJVariant,
  normalizeCJWarehouse,
  parseCJDeliveryWindow,
} from "../src/lib/supplier-gateway/cj/normalize.ts";
import {
  CJ_FIXTURE_ERROR_AUTH,
  CJ_FIXTURE_ERROR_RATE_LIMIT,
  CJ_FIXTURE_FREIGHT,
  CJ_FIXTURE_PRODUCT,
  CJ_FIXTURE_STOCK_BY_VID,
  CJ_FIXTURE_VARIANTS,
  CJ_FIXTURE_WAREHOUSE,
} from "../src/lib/supplier-gateway/cj/fixtures.ts";
import {
  createCJOfflineQualificationAdapter,
} from "../src/lib/supplier-gateway/cj/adapter.ts";
import {
  CJ_CREDENTIAL_ENV_KEYS,
  evaluateCJCredentialState,
  evaluateCJEndpointR0,
  mapCJProviderFailure,
} from "../src/lib/supplier-gateway/cj/policy.ts";

test("CJ endpoint allowlist contains read-only product, stock, warehouse and freight only", () => {
  for (const endpoint of Object.values(CJ_READ_ONLY_ENDPOINTS)) {
    assert.equal(evaluateCJEndpointR0(endpoint).ok, true);
  }

  for (const fragment of CJ_FORBIDDEN_R0_PATH_FRAGMENTS) {
    const decision = evaluateCJEndpointR0(fragment);
    assert.equal(decision.ok, false);
    if (!decision.ok) {
      assert.equal(decision.code, "NORVANA_CJ_ACT_ENDPOINT_LOCKED_R0");
    }
  }
});

test("CJ credential gate refuses proving before entitlement and binding", () => {
  const noEntitlement = evaluateCJCredentialState({
    accountEntitlementVerified: false,
    apiKeyPresent: false,
    accessTokenPresent: false,
  });
  assert.equal(noEntitlement.ok, false);

  const noCredential = evaluateCJCredentialState({
    accountEntitlementVerified: true,
    apiKeyPresent: false,
    accessTokenPresent: false,
  });
  assert.equal(noCredential.ok, false);
  if (!noCredential.ok) {
    assert.equal(noCredential.code, "NORVANA_CJ_CREDENTIAL_NOT_BOUND");
  }

  const ready = evaluateCJCredentialState({
    accountEntitlementVerified: true,
    apiKeyPresent: true,
    accessTokenPresent: false,
  });
  assert.equal(ready.ok, true);
});

test("CJ product fixture normalizes USD price and known stock without inventing warehouse", () => {
  const product = normalizeCJProduct(CJ_FIXTURE_PRODUCT, CJ_FIXTURE_STOCK_BY_VID);
  assert.equal(product.providerId, "cjdropshipping");
  assert.equal(product.supplierSku, "CJFIX-ORG-001");
  assert.equal(product.itemCostCents, 825);
  assert.equal(product.currency, "USD");
  assert.equal(product.variants.length, 2);
  assert.equal(product.variants[0].stockState, "IN_STOCK");
  assert.equal(product.variants[0].stockQuantity, 31);
  assert.equal(product.variants[1].stockState, "OUT_OF_STOCK");
  assert.equal(product.stockQuantity, 31);
  assert.equal(product.warehouse, null);
  assert.equal(product.evidenceTimestamp, null);
});

test("CJ variant without stock evidence remains UNKNOWN", () => {
  const variant = normalizeCJVariant(CJ_FIXTURE_VARIANTS[0]);
  assert.equal(variant.stockState, "UNKNOWN");
  assert.equal(variant.stockQuantity, null);
});

test("CJ warehouse fixture normalizes only provided warehouse facts", () => {
  const warehouse = normalizeCJWarehouse(CJ_FIXTURE_WAREHOUSE);
  assert.equal(warehouse.providerId, "cjdropshipping");
  assert.equal(warehouse.countryCode, "US");
  assert.equal(warehouse.city, "Fixture City");
  assert.match(warehouse.address ?? "", /Fixture Way/);
  assert.equal(warehouse.evidenceTimestamp, null);
});

test("CJ freight fixture parses USD cost and delivery window", () => {
  const quote = normalizeCJFreightQuote(CJ_FIXTURE_FREIGHT[0], {
    supplierSku: "CJFIX-ORG-001-BLK",
    destinationCountry: "US",
    destinationPostalCode: "75001",
    warehouse: "Fixture US Warehouse",
  });
  assert.equal(quote.shippingCostCents, 471);
  assert.equal(quote.currency, "USD");
  assert.deepEqual(quote.deliveryWindowDays, { min: 5, max: 9 });
  assert.equal(quote.evidenceTimestamp, null);
  assert.deepEqual(parseCJDeliveryWindow("13"), { min: 13, max: 13 });
});

test("CJ malformed required product or freight facts fail closed", () => {
  assert.throws(
    () => normalizeCJProduct({ pid: "p", productSku: null }),
    /CJ_PRODUCT_REQUIRED_ID_OR_SKU_MISSING/
  );
  assert.throws(
    () =>
      normalizeCJFreightQuote(
        { logisticAging: "5-9", logisticName: "Fixture", logisticPrice: null },
        { supplierSku: "sku", destinationCountry: "US" }
      ),
    /CJ_FREIGHT_PRICE_MISSING/
  );
});

test("CJ provider errors map to no-blind-retry auth/rate-limit failures", () => {
  const rate = mapCJProviderFailure({
    code: CJ_FIXTURE_ERROR_RATE_LIMIT.code,
    message: CJ_FIXTURE_ERROR_RATE_LIMIT.message,
  });
  assert.equal(rate.code, "SUPPLIER_RATE_LIMITED");
  assert.equal(rate.retryBlindly, false);

  const auth = mapCJProviderFailure({
    code: CJ_FIXTURE_ERROR_AUTH.code,
    message: CJ_FIXTURE_ERROR_AUTH.message,
  });
  assert.equal(auth.code, "SUPPLIER_AUTH_INVALID");
  assert.equal(auth.retryBlindly, false);
});

test("CJ offline adapter proves normalization without network or credentials", async () => {
  const adapter = createCJOfflineQualificationAdapter();
  assert.equal(adapter.mode, "READ_ONLY_R0");
  assert.equal(adapter.qualificationMode, "LOCAL_FIXTURE_ONLY");

  const catalog = await adapter.searchCatalog("organizer");
  assert.equal(catalog.ok, true);

  const product = await adapter.readProduct(CJ_FIXTURE_PRODUCT.pid);
  assert.equal(product.ok, true);

  const stock = await adapter.readInventory("CJFIX-ORG-001-BLK");
  assert.equal(stock.ok, true);

  const warehouse = await adapter.readWarehouse(CJ_FIXTURE_WAREHOUSE.id);
  assert.equal(warehouse.ok, true);

  const freight = await adapter.quoteShipping({
    supplierSku: "CJFIX-ORG-001-BLK",
    quantity: 1,
    destinationCountry: "US",
    destinationPostalCode: "75001",
  });
  assert.equal(freight.ok, true);

  const returns = await adapter.readReturnPolicy();
  assert.equal(returns.ok, false);

  for (const forbidden of [
    "submitOrder",
    "createOrder",
    "cancelOrder",
    "refund",
    "fulfill",
    "publishProduct",
    "activateSupplier",
    "changePrice",
  ]) {
    assert.equal(forbidden in (adapter as unknown as Record<string, unknown>), false);
  }
});

test("CJ qualification source contains no fetch/network implementation or client credential namespace", async () => {
  const files = [
    "../src/lib/supplier-gateway/cj/adapter.ts",
    "../src/lib/supplier-gateway/cj/normalize.ts",
    "../src/lib/supplier-gateway/cj/fixtures.ts",
    "../src/lib/supplier-gateway/cj/policy.ts",
    "../src/lib/supplier-gateway/cj/types.ts",
  ];

  for (const file of files) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/);
    assert.doesNotMatch(source, /axios/i);
    assert.doesNotMatch(source, /NEXT_PUBLIC_NORVANA_CJ_/);
  }

  assert.deepEqual(CJ_CREDENTIAL_ENV_KEYS, {
    apiKey: "NORVANA_CJ_API_KEY",
    accessToken: "NORVANA_CJ_ACCESS_TOKEN",
    refreshToken: "NORVANA_CJ_REFRESH_TOKEN",
  });
});

test("CJ qualification source never admits shopping/order or payment endpoint calls", async () => {
  const source = await readFile(
    new URL("../src/lib/supplier-gateway/cj/types.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /createOrderV?\d?/);
  assert.doesNotMatch(source, /payBalance/);
  assert.doesNotMatch(source, /confirmOrder/);
});
