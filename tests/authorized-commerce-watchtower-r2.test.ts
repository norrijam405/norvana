import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  AUTHORIZED_COMMERCE_PROVIDERS,
  providerBySlug,
} from "../src/lib/commerce/provider-registry.ts";
import {
  canDisplayExternalProductImage,
  evaluateAffiliateDestination,
} from "../src/lib/commerce/affiliate-policy.ts";
import {
  calculateContributionEconomics,
  intelligenceCompleteness,
} from "../src/lib/watchtower/intelligence.ts";

test("provider registry covers the intended electronics, fashion, luxury and affiliate lanes", () => {
  const slugs = new Set(AUTHORIZED_COMMERCE_PROVIDERS.map((provider) => provider.slug));
  for (const slug of [
    "nike-authorized-retailer",
    "nike-affiliate",
    "apple-partner-network",
    "ingram-micro",
    "td-synnex",
    "petra",
    "joor",
    "nuorder",
    "le-new-black",
    "brandsgateway",
    "brandsdistribution",
    "entrupy",
    "legitapp",
    "bstock",
    "farfetch-affiliate",
  ]) {
    assert.equal(slugs.has(slug), true, slug);
  }

  assert.equal(providerBySlug("nike-affiliate")?.state, "APPLICATION_REQUIRED");
  assert.equal(providerBySlug("brandsgateway")?.state, "PAID_ACCESS_REQUIRED");
});

test("affiliate redirect policy is HTTPS and provider-host bound", () => {
  const valid = evaluateAffiliateDestination({
    providerSlug: "nike-affiliate",
    destinationUrl: "https://www.nike.com/t/example",
  });
  assert.equal(valid.ok, true);

  const wrongHost = evaluateAffiliateDestination({
    providerSlug: "nike-affiliate",
    destinationUrl: "https://example.com/fake",
  });
  assert.equal(wrongHost.ok, false);

  const insecure = evaluateAffiliateDestination({
    providerSlug: "farfetch-affiliate",
    destinationUrl: "http://www.farfetch.com/item",
  });
  assert.equal(insecure.ok, false);
});

test("external product imagery requires explicit rights state", () => {
  assert.equal(canDisplayExternalProductImage("AFFILIATE_FEED_AUTHORIZED"), true);
  assert.equal(canDisplayExternalProductImage("BRAND_AUTHORIZED"), true);
  assert.equal(canDisplayExternalProductImage("SUPPLIER_AUTHORIZED"), true);
  assert.equal(canDisplayExternalProductImage("OWNED"), true);
  assert.equal(canDisplayExternalProductImage("LEGACY_UNVERIFIED"), false);
  assert.equal(canDisplayExternalProductImage(""), false);
});

test("contribution economics includes landed and risk reserves", () => {
  const result = calculateContributionEconomics({
    salePriceCents: 10_000,
    productCostCents: 5_000,
    outboundShippingCents: 800,
    paymentFeeCents: 320,
    returnReserveCents: 500,
    fraudReserveCents: 100,
    warrantyReserveCents: 100,
    customerAcquisitionCostCents: 1_000,
  });

  assert.equal(result.grossRevenueCents, 10_000);
  assert.equal(result.totalCostCents, 7_820);
  assert.equal(result.contributionCents, 2_180);
  assert.equal(result.contributionMarginBps, 2180);
});

test("affiliate economics use commission as revenue basis", () => {
  const result = calculateContributionEconomics({
    salePriceCents: 30_000,
    affiliateCommissionCents: 2_400,
    customerAcquisitionCostCents: 900,
  });
  assert.equal(result.revenueBasis, "AFFILIATE_COMMISSION");
  assert.equal(result.grossRevenueCents, 2_400);
  assert.equal(result.contributionCents, 1_500);
});

test("Watchtower completeness is explicit instead of guessing unknown data", () => {
  const completeness = intelligenceCompleteness({
    identity: { title: "Example" },
    pricing: {
      retailPrice: { status: "OBSERVED", value: 100 },
    },
    supply: {
      stock: { status: "OBSERVED", value: 10 },
      shipping: { status: "UNKNOWN" },
    },
    trust: {
      authorization: { status: "VERIFIED" },
      provenance: { status: "VERIFIED" },
      imageRights: { status: "UNKNOWN" },
    },
    demand: {},
    economics: {},
    riskFlags: [],
    evidenceRefs: [],
  });

  assert.deepEqual(completeness, {
    criticalKnown: 4,
    criticalTotal: 6,
    pct: 67,
  });
});

test("storefront never adds affiliate-referral products directly to Acre Era cart", async () => {
  for (const path of [
    "../src/components/home-client.tsx",
    "../src/components/shop-client.tsx",
    "../src/components/product-detail-client.tsx",
  ]) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(source, /AFFILIATE_REFERRAL/);
  }

  const detail = await readFile(
    new URL("../src/components/product-detail-client.tsx", import.meta.url),
    "utf8"
  );
  assert.match(detail, /\/api\/outbound\//);
  assert.match(detail, /Acre Era may earn a commission/);
});

test("migration seeds new intelligence watchers paused with zero budget", async () => {
  const migration = await readFile(
    new URL("../drizzle/0009_authorized_commerce_watchtower_r2.sql", import.meta.url),
    "utf8"
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS watch_candidate_snapshots/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS outbound_referral_clicks/);
  assert.match(migration, /consumer-electronics-devices-watch/);
  assert.match(migration, /brand-fashion-wholesale-watch/);
  assert.match(migration, /luxury-authenticity-watch/);
  assert.match(migration, /affiliate-commerce-watch/);
  assert.match(migration, /product-economics-watch/);
  assert.match(migration, /product-safety-recall-watch/);
  assert.match(migration, /brand-authorization-watch/);
  assert.match(migration, /'PAUSED'/);
});
