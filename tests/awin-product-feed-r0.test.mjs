import assert from "node:assert/strict";
import { test } from "node:test";
import { previewAwinProductFeed } from "../src/lib/awin/product-feed.ts";
const header = "product_id,product_name,price,currency,deep_link,image_url,in_stock,is_for_sale,merchant_category,delivery_cost,delivery_time,description";
const advertiser = { advertiserId: "77", advertiserName: "Good Home" };
test("accepts documented Awin publisher columns with advertiser context", () => {
  const csv = header + '\n123,Oak Storage Basket,29.99,USD,https://awin.example/track,https://cdn.example/basket.jpg,1,1,Home Decor,4.99,2-4 days,"Handwoven, natural finish"';
  const result = previewAwinProductFeed(csv, 100, advertiser);
  assert.equal(result.totalRows, 1); assert.equal(result.candidateCount, 1);
  assert.equal(result.candidates[0].eligibleForReview, true);
  assert.equal(result.candidates[0].merchantId, "77");
  assert.equal(result.candidates[0].merchantName, "Good Home");
  assert.equal(result.candidates[0].description, "Handwoven, natural finish");
  assert.equal(result.candidates[0].availability, "IN_STOCK");
});
test("accepts publisher stock_status and stock_quantity aliases", () => {
  const csv = header.replace("in_stock", "stock_status").replace("is_for_sale", "stock_quantity") + '\n123,Oak Basket,29.99,USD,https://awin.example/track,https://cdn.example/basket.jpg,available,14,Home Decor,,,';
  const result = previewAwinProductFeed(csv, 100, advertiser);
  assert.equal(result.candidates[0].availability, "IN_STOCK");
});
test("accepts documented legacy awin XML-mapped CSV column names", () => {
  const csv = "product_id,product_name,price,currency,deep_link,large_image,instock,forsale,merchant_category\n123,Oak Basket,29.99,USD,https://awin.example/track,https://cdn.example/item.jpg,1,1,Home";
  const result = previewAwinProductFeed(csv, 100, advertiser);
  assert.equal(result.candidates[0].eligibleForReview, true);
});
test("does not invent advertiser identity when feed and operator context omit it", () => {
  const csv = header + '\n123,Oak Basket,29.99,USD,https://awin.example/track,https://cdn.example/item.jpg,1,1,Home,,,,';
  const result = previewAwinProductFeed(csv);
  assert.equal(result.candidateCount, 0);
  assert.equal(result.rejectedCount, 1);
});
test("missing stock evidence remains unknown and held", () => {
  const csv = header + '\n123,Oak Basket,29.99,USD,https://awin.example/track,https://cdn.example/item.jpg,,,,,,,';
  const result = previewAwinProductFeed(csv, 100, advertiser);
  assert.equal(result.candidates[0].availability, "UNKNOWN"); assert.equal(result.candidates[0].eligibleForReview, false);
});
test("non-USD feeds are not eligible for US-first review", () => {
  const csv = header + '\n123,Oak Basket,29.99,GBP,https://awin.example/track,https://cdn.example/item.jpg,1,1,Home,,,,';
  const result = previewAwinProductFeed(csv, 100, advertiser);
  assert.equal(result.candidates[0].eligibleForReview, false);
  assert.ok(result.candidates[0].reviewReasons.includes("Only USD product feeds are eligible for this US-first review"));
});
test("restricted categories are held even when stock and links are present", () => {
  const csv = header + '\n123,Herbal Supplement,19.99,USD,https://awin.example/track,https://cdn.example/item.jpg,1,1,Supplements,,,,';
  const result = previewAwinProductFeed(csv, 100, advertiser);
  assert.equal(result.candidates[0].eligibleForReview, false); assert.ok(result.candidates[0].reviewReasons.some((v) => v.includes("restricted")));
});
test("unsafe tracking URLs are not eligible", () => {
  const csv = header + '\n123,Oak Basket,29.99,USD,http://awin.example/track,https://cdn.example/item.jpg,1,1,Home,,,,';
  const result = previewAwinProductFeed(csv, 100, advertiser);
  assert.equal(result.candidateCount, 0); assert.equal(result.rejectedCount, 1);
});
test("handles BOM, quoted commas, and duplicate product identity", () => {
  const row = '123,"Basket, Large",29.99,USD,https://awin.example/track,https://cdn.example/item.jpg,1,1,Home,,,,';
  const result = previewAwinProductFeed("\uFEFF" + header + "\n" + row + "\n" + row, 100, advertiser);
  assert.equal(result.candidates.length, 2); assert.equal(result.candidates[1].eligibleForReview, false);
  assert.ok(result.candidates[1].reviewReasons.includes("Duplicate product identity in this feed"));
});
test("fails closed on oversized, malformed, duplicate-header, and wrong-schema feeds", () => {
  assert.throws(() => previewAwinProductFeed(""), /non-empty/);
  assert.throws(() => previewAwinProductFeed("x".repeat(2_000_001)), /too large/);
  assert.throws(() => previewAwinProductFeed('"broken,1,USD,https://awin.example'), /unclosed/);
  assert.throws(() => previewAwinProductFeed("product_id,product_id\na,b"), /duplicate column headers/);
  assert.throws(() => previewAwinProductFeed("wrong,headers\na,b"), /missing required columns/);
});
