import assert from "node:assert/strict";
import { test } from "node:test";
import { previewAwinProductFeed } from "../src/lib/awin/product-feed.ts";
const header = "aw_product_id,merchant_id,merchant_name,product_name,price,currency,aw_deep_link,aw_image_url,in_stock,is_for_sale,category_name,delivery_cost,delivery_time,description";
test("accepts identified USD in-stock affiliate product for human review", () => {
  const csv = header + '\n123,77,Good Home,Oak Storage Basket,29.99,USD,https://awin.example/track,https://cdn.example/basket.jpg,1,1,Home Decor,4.99,2-4 days,"Handwoven, natural finish"';
  const result = previewAwinProductFeed(csv);
  assert.equal(result.totalRows, 1); assert.equal(result.candidateCount, 1);
  assert.equal(result.candidates[0].eligibleForReview, true);
  assert.equal(result.candidates[0].description, "Handwoven, natural finish");
  assert.equal(result.candidates[0].availability, "IN_STOCK");
});
test("accepts Awin publisher search_price column alias", () => {
  const publisherHeader = header.replace(",price,", ",search_price,");
  const csv = publisherHeader + '\n123,77,Good Home,Oak Basket,29.99,USD,https://awin.example/track,https://cdn.example/basket.jpg,1,1,Home Decor,,,';
  const result = previewAwinProductFeed(csv);
  assert.equal(result.candidates[0].price, 29.99);
  assert.equal(result.candidates[0].eligibleForReview, true);
});
test("missing stock evidence remains unknown", () => {
  const csv = header + '\n123,77,Good Home,Oak Basket,29.99,USD,https://awin.example/track,https://cdn.example/basket.jpg,,,,Home Decor,,,';
  const result = previewAwinProductFeed(csv);
  assert.equal(result.candidates[0].availability, "UNKNOWN"); assert.equal(result.candidates[0].eligibleForReview, false);
});
test("non-USD feeds are not eligible for US-first review", () => {
  const csv = header + '\n123,77,Good Home,Oak Basket,29.99,GBP,https://awin.example/track,https://cdn.example/basket.jpg,1,1,Home Decor,,,';
  assert.ok(resultNotEligible(previewAwinProductFeed(csv)));
});
function resultNotEligible(result) { return result.candidates[0].eligibleForReview === false && result.candidates[0].reviewReasons.includes("Only USD product feeds are eligible for this US-first review"); }
test("restricted categories are held even when stock and links are present", () => {
  const csv = header + '\n123,77,Good Home,Herbal Supplement,19.99,USD,https://awin.example/track,https://cdn.example/item.jpg,1,1,Supplements,,,';
  const result = previewAwinProductFeed(csv);
  assert.equal(result.candidates[0].eligibleForReview, false); assert.ok(result.candidates[0].reviewReasons.some((v) => v.includes("restricted")));
});
test("unsafe tracking URLs are not eligible", () => {
  const csv = header + '\n123,77,Good Home,Oak Basket,29.99,USD,http://awin.example/track,https://cdn.example/item.jpg,1,1,Home Decor,,,';
  const result = previewAwinProductFeed(csv);
  assert.equal(result.candidateCount, 0);
  assert.equal(result.rejectedCount, 1);
});
test("handles BOM, quoted commas, and duplicate product identity", () => {
  const row = '123,77,Good Home,"Basket, Large",29.99,USD,https://awin.example/track,https://cdn.example/item.jpg,1,1,Home Decor,,,';
  const result = previewAwinProductFeed("\uFEFF" + header + "\n" + row + "\n" + row);
  assert.equal(result.candidates.length, 2); assert.equal(result.candidates[1].eligibleForReview, false);
  assert.ok(result.candidates[1].reviewReasons.includes("Duplicate product identity in this feed"));
});
test("fails closed on oversized, malformed, and wrong-schema feeds", () => {
  assert.throws(() => previewAwinProductFeed(""), /non-empty/);
  assert.throws(() => previewAwinProductFeed("x".repeat(2_000_001)), /too large/);
  assert.throws(() => previewAwinProductFeed('"broken,1,USD,https://awin.example'), /unclosed/);
  assert.throws(() => previewAwinProductFeed("wrong,headers\na,b"), /missing required columns/);
});
