import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Structural regression guard. Full HTTP + database integration remains an independent gate.
const source = readFileSync(new URL("../src/app/api/admin/merchandising/place/route.ts", import.meta.url), "utf8");

test("supplier SKU lookups must include provider identity", () => {
  assert.match(source, /and\(eq\(products\.supplierSku, supplierSku\), eq\(products\.sourceProviderSlug, sourceProviderSlug!\)\)/);
  assert.doesNotMatch(source, /where\(eq\(products\.supplierSku, supplierSku\)\)/);
});

test("external product IDs must be scoped to provider identity", () => {
  assert.match(source, /and\(eq\(products\.externalProductId, sourceKey\), eq\(products\.sourceProviderSlug, sourceProviderSlug!\)\)/);
});

test("unknown provider identities fail closed when carrying remote product identity", () => {
  assert.match(source, /\(supplierSku \|\| sourceKey\) && !sourceProviderSlug/);
  assert.match(source, /Provider identity is required for supplier SKU or source key placement/);
});

test("re-staging an existing non-staged product is rejected", () => {
  assert.match(source, /existing && existing\.status !== "staged"/);
  assert.match(source, /Existing non-staged product requires separate publication-aware review/);
});

test("staged product remains non-public and non-purchasable", () => {
  assert.match(source, /authority: "MERCHANDISING_STAGE_ONLY_NO_PUBLICATION"/);
  assert.match(source, /commerceModel: "PREVIEW_ONLY"/);
  assert.match(source, /price: 0/);
});
