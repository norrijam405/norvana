import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SUPPLIER_ACT_CAPABILITIES,
  SUPPLIER_READ_CAPABILITIES,
} from "../src/lib/supplier-gateway/types.ts";
import {
  getSupplierQualificationQueue,
  getSupplierRegistryProfile,
  SUPPLIER_REGISTRY_R0,
} from "../src/lib/supplier-gateway/registry.ts";
import {
  calculateLandedCostCents,
  evaluateSupplierR0Authority,
  evaluateSupplierReadiness,
} from "../src/lib/supplier-gateway/policy.ts";
import {
  createSupplierReadOnlyScaffold,
  FIRST_WAVE_READ_ONLY_ADAPTERS,
} from "../src/lib/supplier-gateway/adapters.ts";

test("all consequential supplier capabilities are locked in R0", () => {
  for (const capability of SUPPLIER_ACT_CAPABILITIES) {
    const result = evaluateSupplierR0Authority(capability);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "NORVANA_SUPPLIER_ACT_LOCKED_R0");
  }
});

test("declared supplier read capabilities remain read-only", () => {
  for (const capability of SUPPLIER_READ_CAPABILITIES) {
    assert.deepEqual(evaluateSupplierR0Authority(capability), {
      ok: true,
      mode: "READ_ONLY_R0",
    });
  }
});

test("registry never grants execution authority", () => {
  assert.ok(SUPPLIER_REGISTRY_R0.length >= 9);
  for (const profile of SUPPLIER_REGISTRY_R0) {
    assert.equal(profile.executionAuthority, "LOCKED_R0");
    assert.notEqual(profile.qualificationState, "FULFILLMENT_APPROVED");
  }
});

test("general merchandise qualification order is CJ then Banggood then EPROLO", () => {
  assert.deepEqual(
    getSupplierQualificationQueue("GENERAL_MERCHANDISE")
      .slice(0, 3)
      .map((profile) => profile.providerId),
    ["cjdropshipping", "banggood", "eprolo"]
  );
});

test("POD order keeps Printify on entitlement hold", () => {
  const queue = getSupplierQualificationQueue("POD");
  assert.deepEqual(
    queue.map((profile) => profile.providerId),
    ["gelato", "prodigi", "printful", "printify"]
  );

  const printify = getSupplierRegistryProfile("printify");
  assert.ok(printify);
  assert.equal(printify.disposition, "HOLD");
  assert.equal(printify.apiEntitlementState, "NEEDS_ACCOUNT_VERIFICATION");
  assert.equal(printify.readCapabilities.length, 0);
});

test("Spocket and AppScenic remain excluded from free fulfillment pool", () => {
  for (const providerId of ["spocket", "appscenic"]) {
    const profile = getSupplierRegistryProfile(providerId);
    assert.ok(profile);
    assert.equal(profile.disposition, "EXCLUDE");
    assert.equal(profile.apiEntitlementState, "NOT_FREE_FOR_FULFILLMENT");
  }
});

test("source research does not become account-level entitlement proof", () => {
  for (const profile of SUPPLIER_REGISTRY_R0) {
    assert.notEqual(profile.qualificationState, "API_ENTITLEMENT_VERIFIED");
    for (const evidence of profile.evidence) {
      assert.equal(evidence.independentlyVerifiedByBuilder, false);
    }
  }
});

test("read-only adapter scaffolds expose no action methods and make no network claim", async () => {
  assert.deepEqual(FIRST_WAVE_READ_ONLY_ADAPTERS, [
    "cjdropshipping",
    "banggood",
    "eprolo",
    "gelato",
    "prodigi",
    "printful",
  ]);

  const adapter = createSupplierReadOnlyScaffold("cjdropshipping") as unknown as Record<string, unknown>;
  assert.equal(adapter.mode, "READ_ONLY_R0");
  for (const forbidden of [
    "submitOrder",
    "createOrder",
    "cancelOrder",
    "refund",
    "fulfill",
    "publishProduct",
  ]) {
    assert.equal(forbidden in adapter, false);
  }

  const result = await createSupplierReadOnlyScaffold("cjdropshipping").searchCatalog("test");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "SUPPLIER_CREDENTIAL_NOT_BOUND");
});

test("Printify read proving fails closed until entitlement is verified", () => {
  const profile = getSupplierRegistryProfile("printify");
  assert.ok(profile);
  const result = evaluateSupplierReadiness(profile, "catalog.search");
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.code, "NORVANA_SUPPLIER_API_ENTITLEMENT_NOT_VERIFIED");
  }
});

test("landed cost remains unknown when item or shipping is unknown", () => {
  assert.equal(
    calculateLandedCostCents({
      itemCostCents: null,
      shippingCostCents: 500,
    }),
    null
  );
  assert.equal(
    calculateLandedCostCents({
      itemCostCents: 1000,
      shippingCostCents: null,
    }),
    null
  );
  assert.equal(
    calculateLandedCostCents({
      itemCostCents: 1000,
      shippingCostCents: 500,
      knownFeesCents: 100,
    }),
    1600
  );
});

test("legacy fulfillment route is hard locked before supplier execution", async () => {
  const source = await readFile(
    new URL("../src/app/api/orders/[id]/fulfill/route.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /NORVANA_SUPPLIER_ACT_LOCKED_R0/);
  assert.doesNotMatch(source, /submitOrder/);
  assert.doesNotMatch(source, /supplierCredentials/);
});

test("legacy supplier product publication route is hard locked in R0", async () => {
  const source = await readFile(
    new URL("../src/app/api/suppliers/[id]/products/route.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /NORVANA_SUPPLIER_PUBLICATION_LOCKED_R0/);
  assert.doesNotMatch(source, /status: "active"/);
});

test("legacy supplier create/update cannot enable auto fulfillment or activate a supplier", async () => {
  const collection = await readFile(
    new URL("../src/app/api/suppliers/route.ts", import.meta.url),
    "utf8"
  );
  const item = await readFile(
    new URL("../src/app/api/suppliers/[id]/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(collection, /isActive: false/);
  assert.match(collection, /autoFulfill: false/);
  assert.match(item, /NORVANA_SUPPLIER_ACTIVATION_LOCKED_R0/);
  assert.match(item, /NORVANA_SUPPLIER_AUTO_FULFILL_LOCKED_R0/);
});


test("supplier lab candidates never assert live sale or supplier binding", async () => {
  const { SUPPLIER_LAB_CANDIDATES } = await import(
    "../src/lib/supplier-gateway/demo-products.ts"
  );

  assert.ok(SUPPLIER_LAB_CANDIDATES.length >= 8);
  for (const candidate of SUPPLIER_LAB_CANDIDATES) {
    assert.equal(candidate.truthState, "SIMULATED_CANDIDATE");
    assert.equal(candidate.availability, "NOT_FOR_SALE");
    assert.equal(candidate.supplierBinding, "UNBOUND");
    assert.ok(candidate.targetRetailCents.min > 0);
    assert.ok(candidate.targetRetailCents.max >= candidate.targetRetailCents.min);
    assert.ok(candidate.riskFlags.length > 0);
  }
});

test("supplier lab page exposes no checkout or add-to-cart action", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../src/app/supplier-lab/page.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /NOT FOR SALE/);
  assert.match(source, /Live supplier SKUs/);
  assert.doesNotMatch(source, /addToCart/);
  assert.doesNotMatch(source, /href=["']\/checkout/);
  assert.doesNotMatch(source, /checkout\s*\(/);
  assert.doesNotMatch(source, /Buy now/i);
});


test("synthetic routing fixtures are explicitly non-live and non-executable", async () => {
  const {
    buildSyntheticOrderSimulation,
    getSyntheticSupplierScenarios,
  } = await import("../src/lib/supplier-gateway/simulation.ts");

  const scenarios = getSyntheticSupplierScenarios("travel-tech-organizer");
  assert.equal(scenarios.length, 3);
  assert.deepEqual(
    scenarios.map((scenario) => scenario.rank),
    [1, 2, 3]
  );

  for (const scenario of scenarios) {
    assert.equal(scenario.fixtureClass, "LOCAL_SYNTHETIC_FIXTURE");
    assert.equal(scenario.liveSupplierFact, false);
    assert.equal(scenario.supplierSku, null);
    assert.equal(scenario.stockState, "UNKNOWN");
    assert.equal(scenario.evidenceTimestamp, null);
    assert.ok(scenario.landedCostCents > 0);
  }

  const simulation = buildSyntheticOrderSimulation("travel-tech-organizer");
  assert.ok(simulation);
  assert.equal(simulation.simulationClass, "LOCAL_SYNTHETIC_ORDER_OBJECT");
  assert.equal(simulation.liveSupplierFact, false);
  assert.equal(simulation.externalSubmissionPermitted, false);
  assert.equal(simulation.supplierSku, null);
  assert.equal(simulation.executionAuthority, "LOCKED_R0");
  assert.equal(simulation.finalState, "SIMULATION_ONLY");
});

test("supplier candidate detail page contains no execution action", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(
    new URL("../src/app/supplier-lab/[id]/page.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /Synthetic scenario boundary/);
  assert.match(source, /External submission/);
  assert.match(source, /FORBIDDEN/);
  assert.doesNotMatch(source, /submitOrder/);
  assert.doesNotMatch(source, /createOrder/);
  assert.doesNotMatch(source, /addToCart/);
  assert.doesNotMatch(source, /href=["']\/checkout/);
});


test("Supplier Lab removes global storefront commerce affordances", async () => {
  const { readFile } = await import("node:fs/promises");
  const navbar = await readFile(
    new URL("../src/components/navbar.tsx", import.meta.url),
    "utf8"
  );
  const drawer = await readFile(
    new URL("../src/components/cart-drawer.tsx", import.meta.url),
    "utf8"
  );

  assert.match(
    navbar,
    /pathname\.startsWith\("\/supplier-lab"\)/
  );
  assert.match(
    drawer,
    /pathname\.startsWith\("\/supplier-lab"\)/
  );
  assert.match(drawer, /return null/);
});


test("CJ R0 capability map covers the exact read-only proving sequence without action authority", async () => {
  const {
    CJ_READONLY_CAPABILITY_MAP_R0,
    evaluateCjLiveBindingGate,
  } = await import("../src/lib/supplier-gateway/cj.ts");

  assert.deepEqual(Object.keys(CJ_READONLY_CAPABILITY_MAP_R0), [
    "catalog.search",
    "product.read",
    "variant.read",
    "inventory.read",
    "warehouse.read",
    "shipping.quote",
    "delivery.estimate",
    "webhook.verify",
    "order.simulate",
  ]);

  const missing = evaluateCjLiveBindingGate({
    credentialState: "MISSING",
    entitlementVerified: true,
  });
  assert.equal(missing.ok, false);
  if (!missing.ok) assert.equal(missing.code, "SUPPLIER_CREDENTIAL_NOT_BOUND");

  const invalid = evaluateCjLiveBindingGate({
    credentialState: "INVALID",
    entitlementVerified: true,
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.code, "SUPPLIER_CREDENTIAL_INVALID");

  const entitlement = evaluateCjLiveBindingGate({
    credentialState: "BOUND",
    entitlementVerified: false,
  });
  assert.equal(entitlement.ok, false);
  if (!entitlement.ok) {
    assert.equal(entitlement.code, "SUPPLIER_API_ENTITLEMENT_NOT_VERIFIED");
  }
});

test("CJ local fixtures normalize into provider-neutral product, stock, warehouse, freight and delivery models", async () => {
  const {
    createCjFixtureQualificationAdapter,
  } = await import("../src/lib/supplier-gateway/cj.ts");
  const { CJ_R0_FIXTURES } = await import(
    "../src/lib/supplier-gateway/cj-fixtures.ts"
  );

  const adapter = createCjFixtureQualificationAdapter(CJ_R0_FIXTURES);
  assert.equal(adapter.transport, "LOCAL_FIXTURE_ONLY");

  const catalog = await adapter.searchCatalog("travel organizer");
  assert.equal(catalog.ok, true);
  if (catalog.ok) {
    assert.equal(catalog.data.length, 1);
    assert.equal(catalog.data[0]?.providerId, "cjdropshipping");
    assert.equal(catalog.data[0]?.currency, "USD");
  }

  const inventory = await adapter.readInventory("CJ-R0-TRAVEL-001-BLK");
  assert.equal(inventory.ok, true);
  if (inventory.ok) {
    assert.equal(inventory.data.stockQuantity, 27);
    assert.equal(inventory.data.stockState, "IN_STOCK");
  }

  const warehouse = await adapter.readWarehouse("CJ-R0-US-WH-001");
  assert.equal(warehouse.ok, true);
  if (warehouse.ok) assert.equal(warehouse.data.country, "US");

  const freight = await adapter.quoteShipping({
    supplierSku: "CJ-R0-TRAVEL-001-BLK",
    quantity: 1,
    destinationCountry: "US",
    destinationPostalCode: "75201",
  });
  assert.equal(freight.ok, true);
  if (freight.ok) assert.equal(freight.data[0]?.shippingCostCents, 499);

  const delivery = await adapter.estimateDelivery({
    supplierSku: "CJ-R0-TRAVEL-001-BLK",
    destinationCountry: "US",
    destinationPostalCode: "75201",
  });
  assert.equal(delivery.ok, true);
  if (delivery.ok) assert.deepEqual(delivery.data.deliveryWindowDays, { min: 6, max: 10 });

  const simulation = await adapter.simulateOrder({
    supplierSku: "CJ-R0-TRAVEL-001-BLK",
    quantity: 1,
    destinationCountry: "US",
    destinationPostalCode: "75201",
  });
  assert.equal(simulation.ok, true);
  if (simulation.ok) {
    assert.equal(simulation.data.externalSubmissionPermitted, false);
    assert.equal(simulation.data.executionAuthority, "LOCKED_R0");
    assert.equal(simulation.data.finalState, "SIMULATION_ONLY");
    assert.equal(simulation.data.landedCostCents, 1324);
  }

  const adapterShape = adapter as unknown as Record<string, unknown>;
  for (const forbidden of [
    "createOrder",
    "submitOrder",
    "cancelOrder",
    "activateSupplier",
    "publishProduct",
    "fulfill",
    "refund",
    "changePrice",
  ]) {
    assert.equal(forbidden in adapterShape, false);
  }
});

test("CJ R0 fixtures fail closed for rate limit, malformed response, missing stock, missing freight and unknown currency", async () => {
  const {
    mapCjProviderError,
    normalizeCjFreightQuote,
    normalizeCjInventory,
  } = await import("../src/lib/supplier-gateway/cj.ts");
  const {
    CJ_R0_RATE_LIMIT_FIXTURE,
    CJ_R0_MALFORMED_FIXTURE,
    CJ_R0_MISSING_STOCK_FIXTURE,
    CJ_R0_MISSING_FREIGHT_FIXTURE,
    CJ_R0_UNKNOWN_CURRENCY_FIXTURE,
  } = await import("../src/lib/supplier-gateway/cj-fixtures.ts");

  const limited = mapCjProviderError("catalog.search", CJ_R0_RATE_LIMIT_FIXTURE);
  assert.equal(limited.ok, false);
  if (!limited.ok) assert.equal(limited.code, "SUPPLIER_RATE_LIMITED");

  const malformed = normalizeCjInventory(CJ_R0_MALFORMED_FIXTURE);
  assert.equal(malformed.ok, false);
  if (!malformed.ok) assert.equal(malformed.code, "SUPPLIER_RESPONSE_MALFORMED");

  const stock = normalizeCjInventory(CJ_R0_MISSING_STOCK_FIXTURE);
  assert.equal(stock.ok, false);
  if (!stock.ok) assert.equal(stock.code, "SUPPLIER_STOCK_UNKNOWN");

  const freight = normalizeCjFreightQuote(CJ_R0_MISSING_FREIGHT_FIXTURE);
  assert.equal(freight.ok, false);
  if (!freight.ok) assert.equal(freight.code, "SUPPLIER_FREIGHT_UNKNOWN");

  const currency = normalizeCjFreightQuote(CJ_R0_UNKNOWN_CURRENCY_FIXTURE);
  assert.equal(currency.ok, false);
  if (!currency.ok) assert.equal(currency.code, "SUPPLIER_CURRENCY_UNSUPPORTED");
});

test("CJ registry admits warehouse read but no consequential authority", () => {
  const cj = getSupplierRegistryProfile("cjdropshipping");
  assert.ok(cj);
  assert.ok(cj.readCapabilities.includes("warehouse.read"));
  assert.equal(cj.executionAuthority, "LOCKED_R0");
  for (const capability of SUPPLIER_ACT_CAPABILITIES) {
    assert.equal(cj.readCapabilities.includes(capability as never), false);
  }
});
