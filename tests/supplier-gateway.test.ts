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
  assert.ok(SUPPLIER_REGISTRY_R0.length >= 14);
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

test("POD order adds Merchize while keeping Printify on entitlement hold", () => {
  const queue = getSupplierQualificationQueue("POD");
  assert.deepEqual(
    queue.map((profile) => profile.providerId),
    ["gelato", "prodigi", "printful", "merchize", "printify"]
  );

  const merchize = getSupplierRegistryProfile("merchize");
  assert.ok(merchize);
  assert.equal(merchize.disposition, "QUALIFY");
  assert.equal(merchize.customStoreApiClaim, true);

  const printify = getSupplierRegistryProfile("printify");
  assert.ok(printify);
  assert.equal(printify.disposition, "HOLD");
  assert.equal(printify.apiEntitlementState, "NEEDS_ACCOUNT_VERIFICATION");
  assert.equal(printify.readCapabilities.length, 0);
});

test("false-free suppliers remain excluded from free fulfillment pool", () => {
  for (const providerId of ["spocket", "appscenic", "syncee", "zendrop", "supliful"]) {
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
    "merchize",
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


test("HyperSKU and Modalyst stay fail-closed until custom-store entitlement is proven", () => {
  for (const providerId of ["hypersku", "modalyst"]) {
    const profile = getSupplierRegistryProfile(providerId);
    assert.ok(profile);
    assert.equal(profile.disposition, "HOLD");
    assert.equal(profile.apiEntitlementState, "NEEDS_ACCOUNT_VERIFICATION");
    assert.equal(profile.readCapabilities.length, 0);

    const result = evaluateSupplierReadiness(profile, "catalog.search");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.code, "NORVANA_SUPPLIER_API_ENTITLEMENT_NOT_VERIFIED");
    }
  }
});

test("Merchize scaffold is read-only and unbound", async () => {
  const result = await createSupplierReadOnlyScaffold("merchize").searchCatalog("shirt");
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, "SUPPLIER_CREDENTIAL_NOT_BOUND");
});
\ntest("Printify read proving fails closed until entitlement is verified", () => {
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
