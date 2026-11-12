import test from "node:test";
import { photoMetadataError, photoSignatureMatches, MAX_DEMO_PHOTOS, MAX_DEMO_PHOTO_BYTES, changePhotoApproval, canPublishDemoPhotos } from "../src/lib/garage-sale/photo-review.ts";
import assert from "node:assert/strict";
import { GARAGE_SALE_FIXTURES, bundleTotal } from "../src/lib/garage-sale/fixtures.ts";
import { getGarageSaleSafeSpotAdapter } from "../src/lib/garage-sale/safespot-fixtures.ts";
import { normalizeSafeSpotForAcreEra } from "../src/lib/garage-sale/safespot-adapter.ts";
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

test("SafeSpot R0 officialExchangeZone/operatingHours mapping preserves uncertainty", () => {
  const mapped = normalizeSafeSpotForAcreEra({ places: [{
    id: "fake-zone-01", label: "Fictional exchange point",
    location: { precision: "exact", authorized: true, lat: 35.2, lng: -97.3 },
    safetyGuarantee: true,
    attributes: {
      officialExchangeZone: { status: "VERIFIED", value: true, sourceUrl: "https://example.org/fake", checkedAt: "2026-11-10T12:00:00Z" },
      lighting: { status: "REPORTED", value: "bright", sourceUrl: null, checkedAt: null },
      operatingHours: { status: "UNKNOWN", value: "24 hours" },
    },
    incidentReport: "Never display me", sellerAddress: "Never display me",
  }] });
  assert.equal(mapped.integration, "FIXTURE_ONLY");
  assert.equal(mapped.options.length, 1);
  const option = mapped.options[0];
  assert.equal(option.attributes.designatedExchangeZone.state, "REPORTED"); // NOT upgraded to VERIFIED
  assert.equal(option.attributes.lighting.state, "REPORTED");
  assert.equal(option.attributes.accessHours.state, "UNKNOWN");
  assert.equal(option.accessHoursLabel, null);
  assert.equal(option.addressVisibility, "REDACTED");
  const output = JSON.stringify(mapped);
  for (const secret of ["35.2", "-97.3", "Never display me", "incidentReport", "sellerAddress", "safetyGuarantee"]) assert.ok(!output.includes(secret), secret);
});

test("SafeSpot adapter rejects malformed IDs and duplicate place records", () => {
  const response = normalizeSafeSpotForAcreEra({ places: [
    { id: "ok-zone", label: "First" },
    { id: "ok-zone", label: "Duplicate" },
    { id: "../../bad", label: "Bad" },
    { id: "valid-two", label: "Second" },
  ] });
  assert.deepEqual(response.options.map(x => x.id), ["ok-zone", "valid-two"]);
  assert.equal(response.options[1].attributes.designatedExchangeZone.state, "UNKNOWN");
});

test("SafeSpot adapter never trusts an unreviewed source URL or upstream safety rating", () => {
  const data = normalizeSafeSpotForAcreEra({ places: [{
    id: "unsafe-demo",
    label: "Unsafe fixture",
    attributes: {
      officialExchangeZone: { status: "VERIFIED", sourceUrl: "http://insecure.invalid", checkedAt: "wrong", value: true },
      lighting: { status: "VERIFIED", sourceUrl: "https://u:p@evil.invalid/", checkedAt: "2026-11-12", value: true },
    },
  }] });
  const [venue] = data.options;
  assert.equal(venue.attributes.designatedExchangeZone.state, "REPORTED");
  assert.equal(venue.attributes.designatedExchangeZone.sourceUrl, null);
  assert.equal(venue.attributes.designatedExchangeZone.checkedAt, null);
  assert.equal(venue.attributes.lighting.sourceUrl, null);
  assert.equal(venue.officialSourceUrl, null);
  assert.equal(data.provider, "FICTIONAL_FIXTURE");
});

test("SafeSpot adapter fails closed on missing and malformed payloads", () => {
  for (const value of [null, undefined, 5, "broken", {}, { places: null }]) {
    const data = normalizeSafeSpotForAcreEra(value);
    assert.deepEqual(data.options, []);
    assert.equal(data.integration, "FIXTURE_ONLY");
  }
});

test("photo policy accepts bounded JPEG PNG WEBP metadata and rejects other formats", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.equal(photoMetadataError({ name: "sample-image.jpg", size: 5000, type }), null);
  }
  for (const type of ["image/svg+xml", "image/gif", "text/html", "application/pdf"]) {
    assert.ok(photoMetadataError({ name: "bad-file", size: 5000, type }));
  }
  assert.ok(photoMetadataError({ name: "large.png", size: MAX_DEMO_PHOTO_BYTES + 1, type: "image/png" }));
  assert.ok(photoMetadataError({ name: "too-small", size: 10, type: "image/png" }));
  assert.ok(photoMetadataError({ name: "../private.jpg", size: 5000, type: "image/jpeg" }));
  assert.equal(MAX_DEMO_PHOTOS, 6);
});

test("photo magic bytes prevent SVG/HTML disguised as images", () => {
  assert.equal(photoSignatureMatches(new Uint8Array([255, 216, 255, 224]), "image/jpeg"), true);
  assert.equal(photoSignatureMatches(new Uint8Array([137,80,78,71,13,10,26,10]), "image/png"), true);
  assert.equal(photoSignatureMatches(new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80]), "image/webp"), true);
  assert.equal(photoSignatureMatches(new Uint8Array([60,115,118,103,62]), "image/jpeg"), false);
  assert.equal(photoSignatureMatches(new Uint8Array([60,104,116,109,108,62]), "image/png"), false);
  assert.equal(photoSignatureMatches(new Uint8Array([255,216,255]), "image/svg+xml"), false);
});

test("photo review requires opt-in selection and never grants publish authorization", () => {
  const photos = [{ id: "demo-1", name: "test.png", type: "image/png", size: 300, approved: false }];
  assert.equal(canPublishDemoPhotos(photos), false);
  const changed = changePhotoApproval(photos, "demo-1", true);
  assert.equal(changed[0].approved, true);
  assert.equal(photos[0].approved, false);
  assert.equal(canPublishDemoPhotos(changed), false);
  assert.equal(changePhotoApproval(changed, "unknown", false)[0].approved, true);
});
