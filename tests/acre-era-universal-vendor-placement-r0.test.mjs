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


test("new product slugs include the vendor namespace, not just the product SKU", () => {
  assert.match(source, /\[sourceProviderSlug \|\| sourceType\.toLowerCase\(\), supplierSku \|\| sourceKey \|\| Date\.now\(\)\.toString\(\)\]\.join\("-"\)/);
});


test("negative or nonfinite supplier economics fail closed", () => {
  assert.match(source, /productCost === null \|\| productCost < 0/);
  assert.match(source, /shippingCost === null \|\| shippingCost < 0/);
  assert.match(source, /Product and shipping costs must be finite nonnegative numbers/);
});

const identityMigration = readFileSync(new URL("../drizzle/0021_acre_era_provider_unique_identity_r0.sql", import.meta.url), "utf8");
test("database rejects duplicate SKU within a provider while allowing separate providers", () => {
  assert.match(identityMigration, /UNIQUE INDEX IF NOT EXISTS products_provider_supplier_sku_unique/);
  assert.match(identityMigration, /\(source_provider_slug, supplier_sku\)/);
  assert.match(identityMigration, /WHERE source_provider_slug IS NOT NULL AND supplier_sku IS NOT NULL/);
});
test("database rejects duplicate external product identity within a provider", () => {
  assert.match(identityMigration, /UNIQUE INDEX IF NOT EXISTS products_provider_external_id_unique/);
  assert.match(identityMigration, /\(source_provider_slug, external_product_id\)/);
});
