import test from "node:test";
import assert from "node:assert/strict";
import { GARAGE_SALE_FIXTURES, bundleTotal } from "../src/lib/garage-sale/fixtures.ts";
import { getGarageSaleSafeSpotAdapter } from "../src/lib/garage-sale/safespot-fixtures.ts";
import { SAMPLE_BULK_ITEMS, GARAGE_SALE_EVENTS, parseGarageSaleDraft, markDraftItem, approvedDraftItems } from "../src/lib/garage-sale/drafts.ts";

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

test("bulk draft review accepts well-formed sample items without approving automatically", () => {
  const result = parseGarageSaleDraft(SAMPLE_BULK_ITEMS);
  assert.equal(result.errors.length, 0);
  assert.equal(result.items.length, 3);
  assert.ok(result.items.every(item => item.approved === false));
  const selected = markDraftItem(result.items, result.items[0].id, true);
  assert.equal(approvedDraftItems(selected).length, 1);
  assert.equal(approvedDraftItems(result.items).length, 0);
});

test("bulk draft parser rejects malformed, duplicate and unsafe amounts", () => {
  const input = [
    "Lamp|Home|15|Used - good",
    "lamp|Home|16|Used - good",
    "Bad item|Home|-10|Used - good",
    "Too precise|Home|1.234|New",
    "Unknown condition|Home|10|Unlisted",
    "Good item|Books|10.50|Used - fair",
  ].join("\n");
  const review = parseGarageSaleDraft(input);
  assert.equal(review.items.length, 2);
  assert.equal(review.rejected, 4);
  assert.equal(review.errors.length, 4);
});

test("bulk drafts reject oversized input and enforce 40 items", () => {
  assert.ok(parseGarageSaleDraft("x".repeat(15001)).errors.length > 0);
  const sample = Array.from({ length: 42 }, (_, index) => `Item ${index}|Home|2|New`).join("\n");
  const review = parseGarageSaleDraft(sample);
  assert.equal(review.items.length, 40);
  assert.equal(review.rejected, 2);
});

test("community sale event fixtures have no real coordinates or booking details", () => {
  assert.ok(GARAGE_SALE_EVENTS.length > 0);
  const ids = new Set(GARAGE_SALE_FIXTURES.map(sale => sale.id));
  for (const event of GARAGE_SALE_EVENTS) {
    assert.equal(event.fictional, true);
    assert.ok(event.saleIds.every(id => ids.has(id)));
    assert.ok(!("location" in event) && !("coordinates" in event) && !("bookingUrl" in event));
  }
});
