import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path: string) {
  return readFile(new URL("../" + path, import.meta.url), "utf8");
}

test("Acre Era brand preserves broad market architecture", async () => {
  const brand = await source("src/lib/acre-era/brand.ts");
  assert.match(brand, /name:\s*"Acre Era"/);
  assert.match(brand, /slug:\s*"market"/);
  assert.match(brand, /slug:\s*"goods"/);
  assert.match(brand, /slug:\s*"local"/);
  assert.match(brand, /slug:\s*"finds"/);
});

test("Bring It Here remains demand evidence, not supplier execution", async () => {
  const route = await source("src/app/api/market-requests/route.ts");
  assert.match(route, /OBSERVE_RECOMMEND_ONLY/);
  assert.match(route, /MARKET_REQUEST/);
  assert.doesNotMatch(route, /createSupplierConnector/);
  assert.doesNotMatch(route, /submitOrder/);
  assert.doesNotMatch(route, /shopping\/order/);
  assert.doesNotMatch(route, /supplier\.activate/);
  assert.doesNotMatch(route, /fulfillment\.execute/);
});

test("Market UI does not silently claim all inventory is local", async () => {
  const market = await source("src/app/market/page.tsx");
  assert.match(market, /Local-source claims require separate evidence/);
  assert.match(market, /does not auto-activate sellers/);
});

test("Product detail exposes the Acre Era Passport", async () => {
  const detail = await source("src/components/product-detail-client.tsx");
  const passport = await source("src/components/acre-era/product-trust-panel.tsx");
  assert.match(detail, /ProductTrustPanel/);
  assert.match(passport, /Acre Era Passport/);
  assert.match(passport, /Why it’s here/);
  assert.match(passport, /fulfillmentRating/);
  assert.match(passport, /purchaseExperienceRating/);
});

test("Acre Era public writes have a migration and quota hook", async () => {
  const migration = await source("drizzle/0008_acre_era_marketplace_r0.sql");
  const throttle = await source("src/lib/customer-voice/throttle.ts");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS market_requests/);
  assert.match(migration, /market_requests_request_key_idx/);
  assert.match(throttle, /MARKET_REQUEST/);
});
