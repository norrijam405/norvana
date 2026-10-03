import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  canTransitionMarketRequest,
  marketRequestTransitionNeedsEvidence,
  parseWatchItemInput,
} from "../src/lib/customer-intent/policy.ts";
import {
  commercialEligibility,
  findDominantCustomerRoute,
  safePartnerCheckoutUrl,
} from "../src/lib/commerce/route-engine.ts";

test("Bring It Here lifecycle allows only explicit forward/hold transitions", () => {
  assert.equal(canTransitionMarketRequest("REQUESTED", "RESEARCHING"), true);
  assert.equal(canTransitionMarketRequest("RESEARCHING", "SOURCE_FOUND"), true);
  assert.equal(canTransitionMarketRequest("APPROVED", "ENTERING_ERA"), true);
  assert.equal(canTransitionMarketRequest("REQUESTED", "APPROVED"), false);
  assert.equal(canTransitionMarketRequest("DECLINED", "APPROVED"), false);
  assert.equal(marketRequestTransitionNeedsEvidence("APPROVED"), true);
  assert.equal(marketRequestTransitionNeedsEvidence("GAINING_SUPPORT"), false);
});

test("watchlist input is bounded and price threshold is product-only", () => {
  const parsed = parseWatchItemInput({
    targetType: "product",
    targetKey: "example-phone",
    alertTypes: ["price_drop", "back_in_stock"],
    priceThresholdCents: 49900,
  });
  assert.deepEqual(parsed.alertTypes, ["PRICE_DROP", "BACK_IN_STOCK"]);
  assert.equal(parsed.targetType, "PRODUCT");
  assert.throws(
    () =>
      parseWatchItemInput({
        targetType: "BRAND",
        targetKey: "nike",
        alertTypes: ["PRICE_DROP"],
        priceThresholdCents: 10000,
      }),
    /WATCH_PRICE_THRESHOLD_PRODUCT_ONLY/
  );
});

test("customer route dominance uses customer price delivery and trust", () => {
  const now = new Date("2026-10-03T16:00:00Z");
  const routes = [
    {
      id: 1,
      currency: "USD",
      productCondition: "NEW",
      totalCustomerPriceCents: 10000,
      deliveryMaxDays: 5,
      authorizationState: "AUTHORIZED_DISTRIBUTOR_VERIFIED",
      provenanceState: "SOURCE_DOCUMENTED",
      lastVerifiedAt: "2026-10-03T15:30:00Z",
      status: "ACTIVE",
    },
    {
      id: 2,
      currency: "USD",
      productCondition: "NEW",
      totalCustomerPriceCents: 11000,
      deliveryMaxDays: 7,
      authorizationState: "AUTHORIZED_DISTRIBUTOR_VERIFIED",
      provenanceState: "SOURCE_DOCUMENTED",
      lastVerifiedAt: "2026-10-03T15:30:00Z",
      status: "ACTIVE",
    },
  ];

  assert.equal(findDominantCustomerRoute(routes, now), 1);
});

test("no dominant route is invented when tradeoffs conflict", () => {
  const now = new Date("2026-10-03T16:00:00Z");
  const routes = [
    {
      id: 1,
      currency: "USD",
      productCondition: "NEW",
      totalCustomerPriceCents: 9000,
      deliveryMaxDays: 10,
      authorizationState: "AUTHORIZED_DISTRIBUTOR_VERIFIED",
      provenanceState: "SOURCE_DOCUMENTED",
      lastVerifiedAt: "2026-10-03T15:30:00Z",
      status: "ACTIVE",
    },
    {
      id: 2,
      currency: "USD",
      productCondition: "NEW",
      totalCustomerPriceCents: 10000,
      deliveryMaxDays: 2,
      authorizationState: "AUTHORIZED_DISTRIBUTOR_VERIFIED",
      provenanceState: "SOURCE_DOCUMENTED",
      lastVerifiedAt: "2026-10-03T15:30:00Z",
      status: "ACTIVE",
    },
  ];

  assert.equal(findDominantCustomerRoute(routes, now), null);
});

test("commercial eligibility is separate from customer route ranking", () => {
  assert.deepEqual(
    commercialEligibility(
      { internalContributionCents: 2500, internalContributionMarginBps: 1800 },
      { minContributionCents: 1000, minContributionMarginBps: 1000 }
    ),
    { eligible: true }
  );

  assert.equal(
    commercialEligibility(
      { internalContributionCents: 500, internalContributionMarginBps: 1800 },
      { minContributionCents: 1000, minContributionMarginBps: 1000 }
    ).eligible,
    false
  );
});

test("partner handoff accepts HTTPS only", () => {
  assert.equal(safePartnerCheckoutUrl("https://example.com/item")?.hostname, "example.com");
  assert.equal(safePartnerCheckoutUrl("http://example.com/item"), null);
  assert.equal(safePartnerCheckoutUrl("javascript:alert(1)"), null);
});

test("public route API never selects or returns private contribution fields", async () => {
  const source = await readFile(
    new URL("../src/app/api/products/[slug]/routes/route.ts", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /internalContributionCents/);
  assert.doesNotMatch(source, /internalContributionMarginBps/);
  assert.match(source, /CUSTOMER_PRICE_DELIVERY_TRUST_ONLY/);
  assert.match(source, /privateEconomicsUsedForRanking: false/);
});

test("route creation remains qualifying-only and request status cannot mutate catalog", async () => {
  const [routeAdmin, requestStatus] = await Promise.all([
    readFile(
      new URL("../src/app/api/admin/products/[id]/routes/route.ts", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../src/app/api/admin/market-requests/[id]/status/route.ts", import.meta.url),
      "utf8"
    ),
  ]);

  assert.match(routeAdmin, /status: "QUALIFYING"/);
  assert.match(routeAdmin, /ROUTE_QUALIFICATION_ONLY/);
  assert.doesNotMatch(routeAdmin, /status: "ACTIVE"/);
  assert.match(requestStatus, /REQUEST_STATUS_ONLY_NO_CATALOG_ACT/);
  assert.doesNotMatch(requestStatus, /products\)/);
});

test("intent schema stores actor hash, not raw browser identity or contact fields", async () => {
  const migration = await readFile(
    new URL("../drizzle/0012_customer_intent_route_engine_r0.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /actor_key_hash varchar\(64\)/);
  assert.doesNotMatch(migration, /customer_watch_items[\s\S]{0,800}email/i);
  assert.doesNotMatch(migration, /customer_watch_items[\s\S]{0,800}phone/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS product_routes/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS product_route_observations/);
});

test("watchlist route uses opaque cookie helper and does not return raw cookie value", async () => {
  const source = await readFile(
    new URL("../src/app/api/watchlist/route.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /attachIntentActorCookie/);
  assert.match(source, /actorKeyHash/);
  assert.doesNotMatch(source, /newCookieValue[,\s]*\}/);
});
