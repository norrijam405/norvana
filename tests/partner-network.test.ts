import test from "node:test";
import assert from "node:assert/strict";
import {
  assertR2RecommendOnly,
  qualifyPartnerCandidate,
} from "../src/lib/partner-network/policy.ts";
import {
  buildProposedFulfillmentPlan,
} from "../src/lib/partner-network/routing.ts";
import {
  PARTNER_DISCOVERY_SOURCES,
} from "../src/lib/partner-network/sources.ts";
import type {
  PartnerCandidate,
} from "../src/lib/partner-network/types.ts";

const NOW = new Date("2026-10-01T20:00:00.000Z");

function candidate(overrides: Partial<PartnerCandidate> = {}): PartnerCandidate {
  return {
    id: "farm-a",
    name: "Farm A",
    type: "FARM",
    stage: "EVIDENCE_VERIFIED",
    location: {
      city: "Example",
      region: "KS",
      country: "US",
      state: "VERIFIED",
    },
    categories: ["produce"],
    capabilities: {
      pickup: "VERIFIED",
      delivery: "CLAIMED",
      wholesale: "VERIFIED",
      directToConsumer: "VERIFIED",
      aggregation: "UNKNOWN",
      coldChain: "UNKNOWN",
    },
    identityState: "VERIFIED",
    productState: "VERIFIED",
    serviceAreaState: "CLAIMED",
    pricingState: "UNKNOWN",
    inventoryState: "UNKNOWN",
    minimumOrderState: "UNKNOWN",
    leadTimeState: "UNKNOWN",
    certificationsState: "UNKNOWN",
    evidence: [
      {
        id: "ev-1",
        sourceId: "usda-ams-local-food-directories",
        sourceUrl: "https://example.test/farm-a",
        observedAt: "2026-09-20T00:00:00.000Z",
        claimKinds: ["identity", "location", "products"],
      },
    ],
    ...overrides,
  };
}

test("R2 is recommend-only and has no execution authority", () => {
  assert.deepEqual(assertR2RecommendOnly(), {
    authority: "RECOMMEND_ONLY",
    canActivateSupplier: false,
    canCreateCredentials: false,
    canPlaceOrder: false,
    canChargeCustomer: false,
    canPublishInventory: false,
    canSubmitFulfillment: false,
    canContactPartnerAutonomously: false,
  });
});

test("official discovery registry is discovery-only and contains no credential integration", () => {
  assert.ok(PARTNER_DISCOVERY_SOURCES.length >= 4);
  assert.equal(
    PARTNER_DISCOVERY_SOURCES.every((source) => source.discoveryOnly === true),
    true
  );
  assert.equal(
    PARTNER_DISCOVERY_SOURCES.some((source) => source.id.includes("supplier-credentials")),
    false
  );
});

test("fresh verified partner evidence may become RECOMMENDED but unknown commerce claims stay warnings", () => {
  const result = qualifyPartnerCandidate(candidate(), NOW);

  assert.equal(result.eligibleForRecommendation, true);
  assert.equal(result.stage, "RECOMMENDED");
  assert.ok(result.score >= 65);
  assert.ok(result.warnings.some((warning) => warning.includes("inventory")));
  assert.ok(result.warnings.some((warning) => warning.includes("pricing")));
});

test("stale evidence fails recommendation closed", () => {
  const result = qualifyPartnerCandidate(
    candidate({
      evidence: [
        {
          id: "old",
          sourceId: "usda-ams-local-food-directories",
          sourceUrl: "https://example.test/old",
          observedAt: "2025-01-01T00:00:00.000Z",
          claimKinds: ["identity"],
        },
      ],
    }),
    NOW
  );

  assert.equal(result.eligibleForRecommendation, false);
  assert.equal(result.stage, "STALE");
});

test("unverified identity cannot be recommended even with other good-looking fields", () => {
  const result = qualifyPartnerCandidate(
    candidate({ identityState: "CLAIMED" }),
    NOW
  );

  assert.equal(result.eligibleForRecommendation, false);
  assert.ok(result.reasons.some((reason) => reason.includes("identity")));
});

test("routing can split one demand line across multiple recommended partners without executing", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [
      {
        id: "ev-b",
        sourceId: "usda-ams-local-food-directories",
        sourceUrl: "https://example.test/farm-b",
        observedAt: "2026-09-21T00:00:00.000Z",
        claimKinds: ["identity", "location", "products"],
      },
    ],
  });

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [farmA, farmB],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 10, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 6,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-09-20T00:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 8,
        unitPriceCents: 275,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "LOCAL_DELIVERY",
        evidenceObservedAt: "2026-09-21T00:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.canExecute, false);
  assert.equal(plan.authority, "RECOMMEND_ONLY");
  assert.equal(plan.allocations.length, 2);
  assert.equal(
    plan.allocations.reduce((sum, allocation) => sum + allocation.quantity, 0),
    10
  );
  assert.equal(plan.uncovered.length, 0);
  assert.equal(plan.knownCostCents, 2600);
});

test("unknown quantity is never silently treated as available inventory", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate({ categories: ["eggs"] })],
    demand: [
      { id: "eggs", category: "eggs", quantity: 12, unit: "dozen" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "eggs",
        category: "eggs",
        unit: "dozen",
        availableQuantity: null,
        unitPriceCents: 500,
        availabilityState: "CLAIMED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-09-20T00:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered[0]?.remainingQuantity, 12);
  assert.ok(plan.alternates.some((alternate) => alternate.reason.includes("unknown")));
});

test("no-match service area cannot be allocated", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate({ categories: ["meat"] })],
    demand: [
      { id: "beef", category: "meat", quantity: 20, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "beef",
        category: "meat",
        unit: "lb",
        availableQuantity: 20,
        unitPriceCents: 800,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "NO_MATCH",
        fulfillmentMode: "LOCAL_DELIVERY",
        evidenceObservedAt: "2026-09-20T00:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered.length, 1);
});

test("claimed availability or unknown price forces human verification", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate({ categories: ["bakery"] })],
    demand: [
      { id: "bread", category: "bakery", quantity: 5, unit: "loaf" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "bread",
        category: "bakery",
        unit: "loaf",
        availableQuantity: 5,
        unitPriceCents: null,
        availabilityState: "CLAIMED",
        priceState: "UNKNOWN",
        serviceAreaState: "CLAIMED_MATCH",
        fulfillmentMode: "COURIER",
        evidenceObservedAt: "2026-09-20T00:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
  assert.equal(plan.knownCostCents, 0);
});


test("offer category and unit must match demand before allocation", () => {
  const partner = candidate({ categories: ["produce"] });
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [partner],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 10, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "case",
        availableQuantity: 10,
        unitPriceCents: 200,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-09-30T00:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "meat",
        unit: "lb",
        availableQuantity: 10,
        unitPriceCents: 200,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-09-30T00:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered[0]?.remainingQuantity, 10);
});

test("stale offer evidence cannot allocate current demand", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 10, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 10,
        unitPriceCents: 200,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-07-01T00:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 0);
  assert.ok(plan.alternates.some((alternate) => alternate.reason.includes("too old")));
});

test("duplicate same-partner offers cannot double-count one partner's availability", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 10, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 6,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-09-30T00:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 6,
        unitPriceCents: 240,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-09-30T00:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.quantity, 6);
  assert.equal(plan.uncovered[0]?.remainingQuantity, 4);
});
