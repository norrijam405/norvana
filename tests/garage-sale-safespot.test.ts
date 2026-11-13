import { CLAIM_CONTEXTS, reviewSyntheticAcreClaims } from "../src/lib/acre-era/claim-review.ts";
import { consumeIgniAquaSafeSpotR11 } from "../src/lib/garage-sale/safespot-r11-contract.ts";
import { getGarageSaleSafeSpotR11Demo } from "../src/lib/garage-sale/safespot-fixtures.ts";
import { ACRE_SAFETY_CONTEXTS, ACRE_SAFETY_DOMAINS, coverageByContext, evaluateSyntheticAcreSafety } from "../src/lib/acre-era/safety-coverage.ts";
import { buildGarageSaleReviewManifest } from "../src/lib/garage-sale/review-manifest.ts";
import test from "node:test";
import { DEMO_MESSAGE_TEMPLATES, demoMessageFromTemplate, messagePreviewGuard } from "../src/lib/garage-sale/message-preview.ts";
import { photoMetadataError, photoSignatureMatches, MAX_DEMO_PHOTOS, MAX_DEMO_PHOTO_BYTES, changePhotoApproval, eligiblePhotoCount, assignPhotoToDraftItem, approveAssignedPhoto, revokeStalePhotoAssignments, canPublishDemoPhotos } from "../src/lib/garage-sale/photo-review.ts";
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

test("messaging preview allows only known fictional templates and never sends", () => {
  assert.ok(DEMO_MESSAGE_TEMPLATES.length >= 3);
  assert.equal(new Set(DEMO_MESSAGE_TEMPLATES.map(x => x.id)).size, DEMO_MESSAGE_TEMPLATES.length);
  for (const template of DEMO_MESSAGE_TEMPLATES) {
    const message = demoMessageFromTemplate(template.id);
    assert.ok(message);
    assert.equal(message.sent, false);
    assert.equal(message.role, "BUYER");
    assert.equal(message.text, template.text);
  }
  assert.equal(demoMessageFromTemplate("not-a-real-message"), null);
  assert.deepEqual(messagePreviewGuard(), { permitted: false, code: "NO_REAL_MESSAGING_AUTHORIZED" });
});

test("message templates never include precise location or sensitive buyer details", () => {
  for (const template of DEMO_MESSAGE_TEMPLATES) {
    for (const forbidden of ["@", "http://", "https://", "my address", "my phone", "cash app", "venmo"]) {
      assert.equal(template.text.toLowerCase().includes(forbidden), false, forbidden);
    }
  }
});

test("photo association requires approved seller item and re-approval on relinking", () => {
  const items = [{ id: "draft-1", approved: true }, { id: "draft-2", approved: false }];
  const photos = [{ id: "photo-1", name: "mock.png", type: "image/png", size: 900, approved: false, itemId: null }];
  const unapproved = assignPhotoToDraftItem(photos, "photo-1", "draft-2", items);
  assert.equal(unapproved[0].itemId, null);
  const linked = assignPhotoToDraftItem(photos, "photo-1", "draft-1", items);
  assert.equal(linked[0].itemId, "draft-1");
  assert.equal(linked[0].approved, false);
  const approved = approveAssignedPhoto(linked, "photo-1", true, items);
  assert.equal(approved[0].approved, true);
  assert.equal(eligiblePhotoCount(approved, items), 1);
  const relinked = assignPhotoToDraftItem(approved, "photo-1", null, items);
  assert.equal(relinked[0].approved, false);
  assert.equal(eligiblePhotoCount(relinked, items), 0);
  assert.equal(canPublishDemoPhotos(approved), false);
});

test("revoking seller item approval immediately invalidates linked-photo eligibility", () => {
  const photo = { id: "photo-1", name: "mock.png", type: "image/png", size: 900, approved: true, itemId: "draft-1" };
  assert.equal(eligiblePhotoCount([photo], [{ id: "draft-1", approved: true }]), 1);
  assert.equal(eligiblePhotoCount([photo], [{ id: "draft-1", approved: false }]), 0);
  assert.equal(eligiblePhotoCount([photo], []), 0);
  assert.equal(approveAssignedPhoto([photo], "photo-1", true, [])[0].approved, false);
});

test("editing or revoking draft items clears stale linked photo approval", () => {
  const photos = [{ id: "demo-photo", name: "fixture.png", type: "image/png", size: 100, approved: true, itemId: "draft-1" }];
  const retained = revokeStalePhotoAssignments(photos, [{ id: "draft-1", approved: true }]);
  assert.equal(retained[0].approved, true);
  assert.equal(retained[0].itemId, "draft-1");
  for (const items of [[], [{ id: "draft-1", approved: false }], [{ id: "draft-2", approved: true }]]) {
    const cleared = revokeStalePhotoAssignments(photos, items);
    assert.equal(cleared[0].approved, false);
    assert.equal(cleared[0].itemId, null);
    assert.equal(eligiblePhotoCount(cleared, items), 0);
  }
  assert.equal(photos[0].approved, true, "pure operation must not mutate original objects");
});

test("seller review export includes approved items and linked approved photo counts only", () => {
  const items = [
    { id: "a", name: "Demo lamp", category: "Home", condition: "Used - good", price: 19.95, approved: true },
    { id: "b", name: "Rejected", category: "Home", condition: "Used - fair", price: 5, approved: false },
  ];
  const photos = [
    { id: "photo-1", name: "seller-home-location.jpg", size: 123, type: "image/jpeg", approved: true, itemId: "a", url: "blob:private" },
    { id: "photo-2", name: "unapproved.jpg", size: 123, type: "image/jpeg", approved: false, itemId: "a" },
    { id: "photo-3", name: "rejected-item.jpg", size: 123, type: "image/jpeg", approved: true, itemId: "b" },
  ];
  const result = buildGarageSaleReviewManifest(items, photos);
  assert.equal(result.state, "LOCAL_REVIEW_ONLY");
  assert.equal(result.publishAuthorized, false);
  assert.equal(result.itemCount, 2);
  assert.equal(result.approvedItemCount, 1);
  assert.equal(result.approvedPhotoCount, 1);
  assert.equal(result.subtotal, 19.95);
  assert.deepEqual(result.items.map(item => item.name), ["Demo lamp"]);
  const output = JSON.stringify(result);
  for (const forbidden of ["seller-home-location", "blob:private", "rejected-item", "unapproved.jpg", '"url"', '"name":"Rejected"']) {
    assert.equal(output.includes(forbidden), false, forbidden);
  }
});

test("seller review manifest remains nonpublishable for empty or revoked drafts", () => {
  const approved = { id: "a", name: "Sample", category: "Home", condition: "New", price: 10, approved: true };
  const photo = { id: "p", name: "private.png", size: 100, type: "image/png", approved: true, itemId: "a" };
  const active = buildGarageSaleReviewManifest([approved], [photo]);
  assert.equal(active.approvedPhotoCount, 1);
  const revoked = buildGarageSaleReviewManifest([{ ...approved, approved: false }], [photo]);
  assert.equal(revoked.approvedPhotoCount, 0);
  assert.equal(revoked.items.length, 0);
  assert.equal(revoked.publishAuthorized, false);
  assert.equal(buildGarageSaleReviewManifest([], []).approvedItemCount, 0);
});

test("every Acre Era experience has meaningful safety coverage with explicit owners", () => {
  assert.equal(ACRE_SAFETY_CONTEXTS.length, 7);
  assert.equal(new Set(ACRE_SAFETY_DOMAINS.map(domain => domain.id)).size, ACRE_SAFETY_DOMAINS.length);
  for (const context of ACRE_SAFETY_CONTEXTS) {
    const coverage = coverageByContext(context);
    assert.ok(coverage.length >= 3, context);
    assert.ok(coverage.some(domain => domain.id === "privacy"));
    assert.ok(coverage.some(domain => domain.id === "incidents"));
    assert.ok(coverage.every(domain => domain.releaseGate && domain.customerAdvice && ["ACRE_ERA","IGNIAQUA","SHARED"].includes(domain.accountableOwner)));
  }
});

test("food and affiliate safety requirements are scoped to relevant customer journeys", () => {
  assert.ok(coverageByContext("MARKET_FARM").some(domain => domain.id === "food"));
  assert.ok(!coverageByContext("GARAGE_SALE").some(domain => domain.id === "food"));
  assert.ok(coverageByContext("FINDS_AFFILIATE").some(domain => domain.id === "affiliates"));
  assert.ok(!coverageByContext("BUYER_SELLER_CHAT").some(domain => domain.id === "affiliates"));
});

test("synthetic Acre Era safety assessment always fails closed even with green inputs", () => {
  for (const context of ACRE_SAFETY_CONTEXTS) {
    const assessment = evaluateSyntheticAcreSafety({
      context, vendorVerified:true, productClaimsVerified:true,
      paymentConfirmedByProvider:true, meetupEvidenceVerified:true,
      foodHandlingDocumentationReviewed:true,
      requestingOffPlatformPayment:false, containsPrivateAddress:false,
    });
    assert.equal(assessment.mode, "SYNTHETIC_ONLY");
    assert.equal(assessment.outcome, "REVIEW_REQUIRED");
    assert.equal(assessment.safeToProceed, false);
    assert.equal(assessment.safeToPublish, false);
  }
});

test("specific fraud, privacy and food safety flags are surfaced without individual scoring", () => {
  const risk = evaluateSyntheticAcreSafety({ context:"MARKET_FARM", containsPrivateAddress:true, requestingOffPlatformPayment:true });
  assert.ok(risk.flags.includes("Sensitive address exposure"));
  assert.ok(risk.flags.includes("Unapproved off-platform payment request"));
  assert.ok(risk.flags.includes("Food-handling evidence not reviewed"));
  assert.equal(risk.safeToProceed, false);
  const meetup = evaluateSyntheticAcreSafety({ context:"GARAGE_SALE" });
  assert.ok(meetup.flags.includes("Meetup evidence unverified"));
});

test("exact R1.1-shaped offline demo matches contract and never verifies a location", () => {
  const result = getGarageSaleSafeSpotR11Demo(new Date("2026-11-12T18:00:00Z"));
  assert.equal(result.state, "FICTIONAL_CONTRACT_MATCH");
  assert.equal(result.display.integration, "FIXTURE_ONLY");
  assert.equal(result.display.provider, "FICTIONAL_FIXTURE");
  assert.equal(result.display.options.length, 2);
  assert.ok(result.display.options.every(option =>
    option.attributes.designatedExchangeZone.state === "UNKNOWN" &&
    option.attributes.accessHours.state === "UNKNOWN" &&
    option.addressVisibility === "REDACTED"));
});

test("IgniAqua R1.1 consumer fails closed for wrong producer, client and stale feed", () => {
  const now = new Date("2026-11-12T18:00:00Z");
  const claim = { status:"UNKNOWN", value:null, sourceUrl:null, checkedAt:null, needsReview:false };
  const feed = {
    schemaVersion:"igniaqua-safespot-public-venues-r1", provider:"IGNIAQUA_SAFESPOT",
    integration:"OFFLINE_DRAFT", client:"ACRE_ERA", generatedAt:now.toISOString(),
    places:[{ id:"sample_venue",label:"Fixture",attributes:{
      officialExchangeZone:claim,lighting:claim,cameras:claim,publicAccess:claim,operatingHours:claim,
    }}],
  };
  assert.equal(consumeIgniAquaSafeSpotR11(feed,now).state, "FICTIONAL_CONTRACT_MATCH");
  for (const malformed of [
    { ...feed, client:"NOR_AUTO_MATCH" },
    { ...feed, provider:"IMPERSONATOR" },
    { ...feed, integration:"VERIFIED" },
    { ...feed, schemaVersion:"safespot-public-v99" },
    { ...feed, generatedAt:"2026-11-10T00:00:00Z" },
    { ...feed, generatedAt:"2026-11-14T00:00:00Z" },
    { ...feed, places:null },
  ]) {
    const outcome = consumeIgniAquaSafeSpotR11(malformed, now);
    assert.equal(outcome.state, "REJECTED_UNTRUSTED_FEED");
    assert.deepEqual(outcome.display.options, []);
  }
});

test("R1.1 contract blocks forged VERIFIED and strips all sensitive venue fields", () => {
  const now = new Date("2026-11-12T18:00:00Z");
  const base = { status:"REPORTED", value:true, sourceUrl:"https://example.org/sample",checkedAt:now.toISOString(),needsReview:false };
  const place = {
    id:"fixture_venue", label:"Fictional point",
    location:{lat:35.3,lng:-97.2,privateAddress:"Secret address"},
    person:{email:"secret@invalid.test"},
    incidents:[{narrative:"Confidential"}],
    attributes:{officialExchangeZone:base,lighting:base,cameras:base,publicAccess:base,operatingHours:base},
  };
  const envelope = {
    schemaVersion:"igniaqua-safespot-public-venues-r1", provider:"IGNIAQUA_SAFESPOT",
    integration:"OFFLINE_DRAFT", client:"ACRE_ERA", generatedAt:now.toISOString(), places:[place],
  };
  const valid = consumeIgniAquaSafeSpotR11(envelope,now);
  assert.equal(valid.state,"FICTIONAL_CONTRACT_MATCH");
  assert.equal(valid.display.options[0].attributes.designatedExchangeZone.state,"REPORTED");
  const serialized=JSON.stringify(valid.display);
  for(const secret of ["Secret address","secret@invalid.test","Confidential","35.3","-97.2","incidents","person"])
    assert.ok(!serialized.includes(secret),secret);
  const forged = { ...envelope, places:[{...place,attributes:{...place.attributes,officialExchangeZone:{...base,status:"VERIFIED"}}}] };
  const blocked=consumeIgniAquaSafeSpotR11(forged,now);
  assert.equal(blocked.state,"REJECTED_UNTRUSTED_FEED");
  assert.deepEqual(blocked.display.options,[]);
});

test("R1.1 consumer rejects missing evidence and invalid place IDs before rendering any venue", () => {
  const now = new Date("2026-11-12T18:00:00Z");
  const envelope = {
    schemaVersion:"igniaqua-safespot-public-venues-r1", provider:"IGNIAQUA_SAFESPOT",
    integration:"OFFLINE_DRAFT", client:"ACRE_ERA", generatedAt:now.toISOString(),
    places:[{id:"../../bad",label:"Bad",attributes:{}}],
  };
  assert.deepEqual(consumeIgniAquaSafeSpotR11(envelope,now).display.options,[]);
});

test("every claim provenance category is linked to an Acre Era customer journey", () => {
  assert.equal(Object.keys(CLAIM_CONTEXTS).length, 10);
  for (const [type, contexts] of Object.entries(CLAIM_CONTEXTS)) {
    assert.ok(contexts.length >= 1, type);
    assert.ok(contexts.every(context => ACRE_SAFETY_CONTEXTS.includes(context)));
  }
});

test("claim review never certifies caller-supplied evidence or marks publish authorized", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  const claims = [
    { id:"seller_1", context:"GARAGE_SALE", type:"SELLER_IDENTITY", evidence:[{kind:"THIRD_PARTY_DOCUMENT",sourceUrl:"https://example.org/id",checkedAt:now.toISOString(),reviewerAttested:true}] },
    { id:"payment_1", context:"GARAGE_SALE", type:"PAYMENT_SETTLEMENT", evidence:[{kind:"PROVIDER_RECEIPT",providerAuthenticated:true,sourceUrl:"https://example.org/receipt",checkedAt:now.toISOString()}] },
  ] as const;
  const r = reviewSyntheticAcreClaims(claims.map(x=>({...x,evidence:x.evidence.map(y=>({...y}))})),now);
  assert.equal(r.publishAuthorized,false);
  assert.equal(r.outcome,"REVIEW_REQUIRED");
  assert.equal(r.mode,"SYNTHETIC_ONLY");
  assert.ok(r.findings.every(x=>x.status!=="VERIFIED" && x.blockers.length>0));
  assert.ok(r.findings.some(x=>x.blockers.some(reason=>reason.includes("Caller-provided"))));
});

test("payment screenshots cannot become settlement confirmation", () => {
  const r = reviewSyntheticAcreClaims([{id:"payment_2",context:"GOODS",type:"PAYMENT_SETTLEMENT",evidence:[{kind:"SELLER_ASSERTION"}]}],new Date("2026-11-13T12:00:00Z"));
  assert.ok(r.findings[0].blockers.includes("No authenticated payment-provider receipt"));
  assert.equal(r.publishAuthorized,false);
});

test("claim review identifies invalid, stale and potentially unsafe sources", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  const result = reviewSyntheticAcreClaims([
    {id:"bad/id",context:"GARAGE_SALE",type:"PICKUP_DESIGNATION",evidence:[{kind:"THIRD_PARTY_DOCUMENT",sourceUrl:"http://localhost/claim",checkedAt:"2023-01-01T00:00:00Z"}]},
    {id:"food_1",context:"MARKET_FARM",type:"FOOD_HANDLING",evidence:[{kind:"SELLER_ASSERTION"}]},
  ],now);
  assert.ok(result.findings[0].blockers.some(s=>s.includes("Invalid fictional claim ID")));
  assert.ok(result.findings[0].blockers.some(s=>s.includes("source link")));
  assert.ok(result.findings[0].blockers.some(s=>s.includes("timestamp")));
  assert.ok(result.findings[0].blockers.some(s=>s.includes("IgniAqua")));
  assert.ok(result.findings[1].blockers.some(s=>s.includes("Regulatory")));
});
