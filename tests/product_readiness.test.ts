import test from "node:test";
import assert from "node:assert/strict";
import { evaluateProductReadiness } from "../src/lib/watchtower/product-readiness.ts";

test("affiliate product becomes ready only with documented partner truth", () => {
  const result = evaluateProductReadiness({
    commerceModel: "AFFILIATE_REFERRAL",
    sourceProviderSlug: "awin",
    externalSellerName: "Example Merchant",
    externalCheckoutUrl: "https://merchant.example/product",
    affiliateNetwork: "Awin",
    affiliateProgram: "Example US",
    authorizationState: "AFFILIATE_APPROVED",
    imageRightsState: "AFFILIATE_FEED_AUTHORIZED",
    evidenceRef: "program:123",
    returnSummary: "Returns handled by merchant.",
  });
  assert.equal(result.state, "READY_AFFILIATE");
  assert.deepEqual(result.blockers, []);
});

test("affiliate product holds when program or image rights are missing", () => {
  const result = evaluateProductReadiness({
    commerceModel: "AFFILIATE_REFERRAL",
    sourceProviderSlug: "awin",
    externalSellerName: "Example Merchant",
    externalCheckoutUrl: "https://merchant.example/product",
    authorizationState: "AFFILIATE_APPROVED",
    imageRightsState: "UNVERIFIED",
    evidenceRef: "program:123",
  });
  assert.equal(result.state, "HOLD");
  assert.ok(result.blockers.some((x) => x.includes("Image rights")));
  assert.ok(result.blockers.some((x) => x.includes("affiliate network")));
});

test("supplier product holds until price delivery returns stock and provenance are verified", () => {
  const result = evaluateProductReadiness({
    commerceModel: "QUALIFIED_SUPPLIER",
    sourceProviderSlug: "cjdropshipping",
    authorizationState: "SUPPLIER_APPROVED",
    imageRightsState: "SUPPLIER_AUTHORIZED",
    evidenceRef: "supplier:sku-1",
    provenanceState: "SUPPLIER_VERIFIED",
    totalCustomerPriceCents: 3499,
    deliveryMinDays: 5,
    deliveryMaxDays: 9,
    returnSummary: "30-day return path.",
    stockState: "IN_STOCK",
  });
  assert.equal(result.state, "READY_SUPPLIER");
  assert.deepEqual(result.blockers, []);
});
