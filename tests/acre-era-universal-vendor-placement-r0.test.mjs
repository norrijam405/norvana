import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Structural regression guard. Full HTTP + database integration remains an independent gate.
const source = readFileSync(new URL("../src/app/api/admin/merchandising/place/route.ts", import.meta.url), "utf8");

test("supplier SKU lookups must include provider identity", () => {
  assert.match(source, /eq\(products\.supplierSku, supplierSku\)/);
  assert.doesNotMatch(source, /where\(eq\(products\.supplierSku, supplierSku\)\)/);
});

test("external product IDs must be scoped to provider identity", () => {
  assert.match(source, /eq\(products\.externalProductId, sourceKey\)/);
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

test("database unique violations return conflict rather than server failure", () => {
  assert.match(source, /candidate\.code === "23505"/);
  assert.match(source, /code: "VENDOR_PRODUCT_CONFLICT"/);
  assert.match(source, /status: 409/);
});

test("unexpected staging persistence failures return controlled unavailable response", () => {
  assert.match(source, /code: "PLACEMENT_PERSISTENCE_FAILED"/);
  assert.match(source, /Placement persistence failed:/);
});

test("contradictory supplier identifiers are rejected before product update", () => {
  assert.match(source, /existing\.externalProductId !== sourceKey/);
  assert.match(source, /existing\.supplierSku !== supplierSku/);
  assert.match(source, /code: "VENDOR_IDENTITY_MISMATCH"/);
  assert.ok(source.indexOf('code: "VENDOR_IDENTITY_MISMATCH"') < source.indexOf('if (existing && existing.status !== "staged")'));
});

test("farms remain in Market Era and malformed pickup windows fail closed", () => {
  assert.match(source, /sourceType === "FARM"/);
  assert.match(source, /code: "FARM_ERA_MISMATCH"/);
  assert.match(source, /end <= start/);
  assert.match(source, /code: "FARM_PICKUP_WINDOW_INVALID"/);
});

test("wholesale quantities reject malformed or nonpositive values", () => {
  assert.match(source, /sourceType === "WHOLESALE"/);
  assert.match(source, /Number\.isInteger\(casePack\)/);
  assert.match(source, /Number\.isInteger\(minimumOrder\)/);
  assert.match(source, /code: "WHOLESALE_QUANTITY_INVALID"/);
});

test("supplied farm and wholesale qualification facts are retained as staging evidence", () => {
  assert.match(source, /qualificationFacts:/);
  assert.match(source, /pickupStart: sourceType === "FARM"/);
  assert.match(source, /casePack: sourceType === "WHOLESALE"/);
});

test("blank or null economics cannot masquerade as a valid zero", () => {
  assert.match(source, /typeof value === "string" && !value\.trim\(\)/);
  assert.match(source, /body\.productCost !== undefined && \(productCost === null/);
  assert.match(source, /body\.shippingCost !== undefined && \(shippingCost === null/);
});

test("farm pickup windows that have already expired fail closed", () => {
  assert.match(source, /end <= Date\.now\(\)/);
});

test("explicit empty wholesale quantities cannot bypass validation", () => {
  assert.match(source, /body\.casePack !== undefined && \(!Number\.isInteger\(casePack\)/);
  assert.match(source, /body\.minimumOrder !== undefined && \(!Number\.isInteger\(minimumOrder\)/);
});

test("boolean vendor economics and quantities are not parsed as numeric one or zero", () => {
  assert.match(source, /typeof value === "boolean"/);
});

test("both supplier identifiers must reconcile against a single catalog row", () => {
  assert.match(source, /skuMatch && externalMatch && skuMatch\.id !== externalMatch\.id/);
  assert.match(source, /existing = skuMatch \?\? externalMatch/);
});
test("missing stable product identity fails closed before persistence", () => {
  assert.match(source, /!supplierSku && !sourceKey/);
  assert.match(source, /code: "VENDOR_IDENTITY_REQUIRED"/);
});

test("era assignment insert conflicts never claim successful placement", () => {
  assert.match(source, /eraAssignment = assignment \?\? null;\s*if \(!eraAssignment\) assignmentPending = true;/);
  assert.match(source, /assignmentPending \? `STAGED_FOR_\$\{target\}_ERA_ASSIGNMENT_PENDING`/);
});

test("already-routed products cannot be silently assigned to another Era", () => {
  assert.match(source, /else if \(existingAssignment\) \{[\s\S]*?assignmentPending = true;/);
  assert.match(source, /if \(existingAssignment\?\.eraId === era\.id\)/);
  assert.match(source, /if \(!eraAssignment\) assignmentPending = true/);
});
