import test from "node:test";
import assert from "node:assert/strict";
import { GARAGE_SALE_FIXTURES, bundleTotal } from "../src/lib/garage-sale/fixtures.ts";
import { getGarageSaleSafeSpotAdapter } from "../src/lib/garage-sale/safespot-fixtures.ts";

test("fictional sales use unique IDs and item IDs", () => {
  assert.equal(new Set(GARAGE_SALE_FIXTURES.map((sale) => sale.id)).size, GARAGE_SALE_FIXTURES.length);
  for (const sale of GARAGE_SALE_FIXTURES) {
    assert.equal(sale.status, "FICTIONAL_DEMO");
    assert.ok(sale.items.length > 1);
    assert.equal(new Set(sale.items.map((item) => item.id)).size, sale.items.length);
    assert.ok(sale.items.every((item) => item.price > 0 && Number.isFinite(item.price)));
  }
});

test("bundles charge only the selected fixtures with no duplication", () => {
  const sale = GARAGE_SALE_FIXTURES[0];
  assert.equal(bundleTotal(sale, []), 0);
  assert.equal(bundleTotal(sale, [sale.items[0].id]), sale.items[0].price);
  assert.equal(bundleTotal(sale, [sale.items[0].id, sale.items[0].id]), sale.items[0].price);
  assert.equal(bundleTotal(sale, ["unknown-item-id"]), 0);
});

test("SafeSpot adapter stays fixture-only and exposes no official verified safety attributes", () => {
  const response = getGarageSaleSafeSpotAdapter();
  assert.equal(response.schemaVersion, "safespot-venue-r0");
  assert.equal(response.integration, "FIXTURE_ONLY");
  assert.equal(response.provider, "FICTIONAL_FIXTURE");
  assert.ok(response.options.length > 0);
  for (const venue of response.options) {
    assert.equal(venue.addressVisibility, "REDACTED");
    assert.equal(venue.officialSourceUrl, null);
    for (const entry of Object.values(venue.attributes)) {
      assert.equal(entry.state, "UNKNOWN");
      assert.equal(entry.sourceUrl, null);
      assert.equal(entry.checkedAt, null);
    }
    assert.equal(venue.accessHoursLabel, null);
  }
});

test("fictional adapter contains no private personal identity or location fields", () => {
  const raw = JSON.stringify(getGarageSaleSafeSpotAdapter());
  for (const banned of ["sellerAddress", "buyerAddress", "latitude", "longitude", "incidentReport", "email", "phoneNumber", "userId"]) {
    assert.equal(raw.includes('"' + banned + '"'), false, banned);
  }
});
