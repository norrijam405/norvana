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


test("UNKNOWN numeric price remains unknown cost and requires verification", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 1, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "UNKNOWN",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.authority, "RECOMMEND_ONLY");
  assert.equal(plan.canExecute, false);
  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.unitPriceCents, null);
  assert.equal(plan.allocations[0]?.knownCostCents, null);
  assert.equal(plan.allocations[0]?.verificationRequired, true);
  assert.equal(plan.knownCostCents, 0);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
});

test("STALE numeric price remains unknown cost and requires verification", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 1, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 275,
        availabilityState: "VERIFIED",
        priceState: "STALE",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.unitPriceCents, null);
  assert.equal(plan.allocations[0]?.knownCostCents, null);
  assert.equal(plan.allocations[0]?.verificationRequired, true);
  assert.equal(plan.knownCostCents, 0);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
});

test("CLAIMED numeric price is not promoted to known cost", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 1, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 300,
        availabilityState: "VERIFIED",
        priceState: "CLAIMED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations[0]?.knownCostCents, null);
  assert.equal(plan.allocations[0]?.verificationRequired, true);
  assert.equal(plan.knownCostCents, 0);
  assert.equal(plan.hasUnknownCosts, true);
});

test("mixed plan sums only VERIFIED known costs and preserves unknown-cost state", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [
      {
        id: "ev-b-price-state",
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
      { id: "tomatoes", category: "produce", quantity: 2, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 999,
        availabilityState: "VERIFIED",
        priceState: "UNKNOWN",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "LOCAL_DELIVERY",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  const verifiedAllocation = plan.allocations.find(
    (allocation) => allocation.partnerCandidateId === "farm-a"
  );
  const unknownAllocation = plan.allocations.find(
    (allocation) => allocation.partnerCandidateId === "farm-b"
  );

  assert.equal(plan.authority, "RECOMMEND_ONLY");
  assert.equal(plan.canExecute, false);
  assert.equal(plan.allocations.length, 2);
  assert.equal(verifiedAllocation?.unitPriceCents, 250);
  assert.equal(verifiedAllocation?.knownCostCents, 250);
  assert.equal(unknownAllocation?.unitPriceCents, null);
  assert.equal(unknownAllocation?.knownCostCents, null);
  assert.equal(unknownAllocation?.verificationRequired, true);
  assert.equal(plan.knownCostCents, 250);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
});


test("VERIFIED price state with missing numeric amount requires human verification", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 1, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: null,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.unitPriceCents, null);
  assert.equal(plan.allocations[0]?.knownCostCents, null);
  assert.equal(plan.allocations[0]?.verificationRequired, true);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
  assert.ok(
    plan.allocations[0]?.warnings.some((warning) =>
      warning.includes("missing a numeric current amount")
    )
  );
});

test("VERIFIED numeric price can remain verification-complete when all other routing evidence is current", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 1, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations[0]?.knownCostCents, 250);
  assert.equal(plan.allocations[0]?.verificationRequired, false);
  assert.equal(plan.hasUnknownCosts, false);
  assert.equal(plan.requiresHumanVerification, false);
});

test("mixed plan propagates human verification when one VERIFIED price lacks a numeric amount", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [
      {
        id: "ev-b-null-price",
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
      { id: "tomatoes", category: "produce", quantity: 2, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: null,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "LOCAL_DELIVERY",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 2);
  assert.equal(plan.knownCostCents, 250);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
  assert.equal(
    plan.allocations.find((a) => a.partnerCandidateId === "farm-b")
      ?.verificationRequired,
    true
  );
});

test("VERIFIED price with no numeric amount does not outrank a known VERIFIED numeric price", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [
      { id: "tomatoes", category: "produce", quantity: 1, unit: "lb" },
    ],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: null,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 275,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.unitPriceCents, 275);
  assert.equal(plan.allocations[0]?.knownCostCents, 275);
  assert.equal(plan.allocations[0]?.verificationRequired, false);
});


test("VERIFIED negative numeric price is not authoritative and forces verification", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "lb",
      availableQuantity: 1,
      unitPriceCents: -1,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations[0]?.unitPriceCents, null);
  assert.equal(plan.allocations[0]?.knownCostCents, null);
  assert.equal(plan.allocations[0]?.verificationRequired, true);
  assert.equal(plan.knownCostCents, 0);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
  assert.ok(
    plan.allocations[0]?.warnings.some((warning) =>
      warning.includes("invalid")
    )
  );
});

test("VERIFIED NaN and infinities are not authoritative prices", () => {
  for (const unitPriceCents of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    const plan = buildProposedFulfillmentPlan({
      now: NOW,
      partners: [candidate()],
      demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
      offers: [{
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      }],
    });

    assert.equal(plan.allocations[0]?.unitPriceCents, null);
    assert.equal(plan.allocations[0]?.knownCostCents, null);
    assert.equal(plan.allocations[0]?.verificationRequired, true);
    assert.equal(plan.hasUnknownCosts, true);
    assert.equal(plan.requiresHumanVerification, true);
  }
});

test("VERIFIED fractional-cent and unsafe-integer prices are not authoritative", () => {
  for (const unitPriceCents of [1.5, Number.MAX_SAFE_INTEGER + 1]) {
    const plan = buildProposedFulfillmentPlan({
      now: NOW,
      partners: [candidate()],
      demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
      offers: [{
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      }],
    });

    assert.equal(plan.allocations[0]?.unitPriceCents, null);
    assert.equal(plan.allocations[0]?.knownCostCents, null);
    assert.equal(plan.allocations[0]?.verificationRequired, true);
    assert.equal(plan.hasUnknownCosts, true);
  }
});

test("VERIFIED zero-cent price may remain authoritative", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "lb",
      availableQuantity: 1,
      unitPriceCents: 0,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations[0]?.unitPriceCents, 0);
  assert.equal(plan.allocations[0]?.knownCostCents, 0);
  assert.equal(plan.allocations[0]?.verificationRequired, false);
  assert.equal(plan.hasUnknownCosts, false);
  assert.equal(plan.requiresHumanVerification, false);
});

test("invalid VERIFIED negative price cannot beat a valid positive duplicate offer", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: -1,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.unitPriceCents, 250);
  assert.equal(plan.allocations[0]?.knownCostCents, 250);
  assert.equal(plan.allocations[0]?.verificationRequired, false);
});

test("invalid VERIFIED price never reduces mixed-plan known cost totals", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [{
      id: "ev-b-invalid-price",
      sourceId: "usda-ams-local-food-directories",
      sourceUrl: "https://example.test/farm-b",
      observedAt: "2026-09-21T00:00:00.000Z",
      claimKinds: ["identity", "location", "products"],
    }],
  });

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [farmA, farmB],
    demand: [{ id: "tomatoes", category: "produce", quantity: 2, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: -999,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "LOCAL_DELIVERY",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  const invalid = plan.allocations.find(
    (allocation) => allocation.partnerCandidateId === "farm-b"
  );

  assert.equal(plan.allocations.length, 2);
  assert.equal(plan.knownCostCents, 250);
  assert.equal(invalid?.unitPriceCents, null);
  assert.equal(invalid?.knownCostCents, null);
  assert.equal(invalid?.verificationRequired, true);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
});

test("non-integer calculated cents fail closed even with a valid unit price", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 0.5, unit: "lb" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "lb",
      availableQuantity: 0.5,
      unitPriceCents: 251,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations[0]?.unitPriceCents, 251);
  assert.equal(plan.allocations[0]?.knownCostCents, null);
  assert.equal(plan.allocations[0]?.verificationRequired, true);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
});


test("plan-level known-cost aggregation fails closed above MAX_SAFE_INTEGER", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [{
      id: "ev-b-aggregate-overflow",
      sourceId: "usda-ams-local-food-directories",
      sourceUrl: "https://example.test/farm-b",
      observedAt: "2026-09-21T00:00:00.000Z",
      claimKinds: ["identity", "location", "products"],
    }],
  });

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [farmA, farmB],
    demand: [{ id: "tomatoes", category: "produce", quantity: 2, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: Number.MAX_SAFE_INTEGER,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 1,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "LOCAL_DELIVERY",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(
    plan.allocations.map((allocation) => allocation.knownCostCents).sort((a, b) => Number(a) - Number(b)),
    [1, Number.MAX_SAFE_INTEGER]
  );
  assert.equal(plan.knownCostCents, null);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
  assert.ok(
    plan.warnings.some((warning) => warning.includes("safe-integer cents boundary"))
  );
});

test("plan aggregate remains unknown after overflow even when later known allocations are safe", () => {
  const partners = [
    candidate(),
    candidate({
      id: "farm-b",
      name: "Farm B",
      evidence: [{
        id: "ev-b-overflow-sticky",
        sourceId: "usda-ams-local-food-directories",
        sourceUrl: "https://example.test/farm-b",
        observedAt: "2026-09-21T00:00:00.000Z",
        claimKinds: ["identity", "location", "products"],
      }],
    }),
    candidate({
      id: "farm-c",
      name: "Farm C",
      evidence: [{
        id: "ev-c-overflow-sticky",
        sourceId: "usda-ams-local-food-directories",
        sourceUrl: "https://example.test/farm-c",
        observedAt: "2026-09-22T00:00:00.000Z",
        claimKinds: ["identity", "location", "products"],
      }],
    }),
  ];

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners,
    demand: [{ id: "tomatoes", category: "produce", quantity: 3, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: Number.MAX_SAFE_INTEGER,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 1,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-c",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 0,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 3);
  assert.equal(plan.knownCostCents, null);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
});

test("plan aggregate may equal MAX_SAFE_INTEGER exactly", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "lb",
      availableQuantity: 1,
      unitPriceCents: Number.MAX_SAFE_INTEGER,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.knownCostCents, Number.MAX_SAFE_INTEGER);
  assert.equal(plan.hasUnknownCosts, false);
  assert.equal(plan.requiresHumanVerification, false);
});

test("unknown allocation preserves safe known subtotal without claiming a full known total", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [{
      id: "ev-b-unknown-subtotal",
      sourceId: "usda-ams-local-food-directories",
      sourceUrl: "https://example.test/farm-b",
      observedAt: "2026-09-21T00:00:00.000Z",
      claimKinds: ["identity", "location", "products"],
    }],
  });

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [farmA, farmB],
    demand: [{ id: "tomatoes", category: "produce", quantity: 2, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: null,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.knownCostCents, 250);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
});

test("zero-cost allocations do not destabilize plan-level known-cost aggregation", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [{
      id: "ev-b-zero-aggregate",
      sourceId: "usda-ams-local-food-directories",
      sourceUrl: "https://example.test/farm-b",
      observedAt: "2026-09-21T00:00:00.000Z",
      claimKinds: ["identity", "location", "products"],
    }],
  });

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [farmA, farmB],
    demand: [{ id: "tomatoes", category: "produce", quantity: 2, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 0,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 1,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.knownCostCents, 1);
  assert.equal(plan.hasUnknownCosts, false);
  assert.equal(plan.requiresHumanVerification, false);
});

test("aggregate overflow fails closed regardless of allocation ordering", () => {
  const makePartner = (id: string) =>
    candidate({
      id,
      name: id,
      evidence: [{
        id: `ev-${id}`,
        sourceId: "usda-ams-local-food-directories",
        sourceUrl: `https://example.test/${id}`,
        observedAt: "2026-09-21T00:00:00.000Z",
        claimKinds: ["identity", "location", "products"],
      }],
    });

  const partners = [makePartner("farm-a"), makePartner("farm-b")];
  const prices = [Number.MAX_SAFE_INTEGER, 1];

  for (const orderedPrices of [prices, [...prices].reverse()]) {
    const plan = buildProposedFulfillmentPlan({
      now: NOW,
      partners,
      demand: [{ id: "tomatoes", category: "produce", quantity: 2, unit: "lb" }],
      offers: orderedPrices.map((price, index) => ({
        partnerCandidateId: index === 0 ? "farm-a" : "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: price,
        availabilityState: "VERIFIED" as const,
        priceState: "VERIFIED" as const,
        serviceAreaState: "VERIFIED_MATCH" as const,
        fulfillmentMode: "PICKUP" as const,
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      })),
    });

    assert.equal(plan.knownCostCents, null);
    assert.equal(plan.hasUnknownCosts, true);
    assert.equal(plan.requiresHumanVerification, true);
  }
});


test("NaN available quantity cannot allocate or suppress uncovered demand", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "lb",
      availableQuantity: Number.NaN,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered.length, 1);
  assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
  assert.equal(Number.isFinite(plan.uncovered[0]?.remainingQuantity), true);
  assert.ok(
    plan.alternates.some((alternate) =>
      alternate.reason.includes("finite positive number")
    )
  );
  assert.equal(plan.requiresHumanVerification, true);
});

test("non-finite and non-positive available quantities cannot allocate", () => {
  for (const availableQuantity of [
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    0,
    -1,
  ]) {
    const plan = buildProposedFulfillmentPlan({
      now: NOW,
      partners: [candidate()],
      demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
      offers: [{
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      }],
    });

    assert.equal(plan.allocations.length, 0);
    assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
    assert.equal(Number.isFinite(plan.uncovered[0]?.remainingQuantity), true);
  }
});

test("positive fractional available quantity remains routable", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "lb",
      availableQuantity: 0.5,
      unitPriceCents: 200,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.quantity, 0.5);
  assert.equal(plan.uncovered[0]?.remainingQuantity, 0.5);
  assert.equal(plan.allocations[0]?.knownCostCents, 100);
});

test("invalid demand quantities are unrouteable and never enter allocation arithmetic", () => {
  for (const quantity of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    0,
    -1,
  ]) {
    const plan = buildProposedFulfillmentPlan({
      now: NOW,
      partners: [candidate()],
      demand: [{ id: "tomatoes", category: "produce", quantity, unit: "lb" }],
      offers: [{
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 10,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      }],
    });

    assert.equal(plan.allocations.length, 0);
    assert.equal(plan.uncovered.length, 1);
    assert.equal(plan.uncovered[0]?.remainingQuantity, null);
    assert.ok(plan.uncovered[0]?.reason.includes("Demand quantity is invalid"));
    assert.equal(plan.requiresHumanVerification, true);
  }
});

test("valid allocation followed by invalid availability preserves finite uncovered remainder", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [{
      id: "ev-b-invalid-after-valid",
      sourceId: "usda-ams-local-food-directories",
      sourceUrl: "https://example.test/farm-b",
      observedAt: "2026-09-21T00:00:00.000Z",
      claimKinds: ["identity", "location", "products"],
    }],
  });

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [farmA, farmB],
    demand: [{ id: "tomatoes", category: "produce", quantity: 2, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: Number.NaN,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.quantity, 1);
  assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
  assert.equal(Number.isFinite(plan.uncovered[0]?.remainingQuantity), true);
});

test("invalid availability followed by valid allocation cannot poison remaining coverage", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [{
      id: "ev-b-valid-after-invalid",
      sourceId: "usda-ams-local-food-directories",
      sourceUrl: "https://example.test/farm-b",
      observedAt: "2026-09-21T00:00:00.000Z",
      claimKinds: ["identity", "location", "products"],
    }],
  });

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [farmA, farmB],
    demand: [{ id: "tomatoes", category: "produce", quantity: 2, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: Number.NaN,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.partnerCandidateId, "farm-b");
  assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
  assert.equal(Number.isFinite(plan.uncovered[0]?.remainingQuantity), true);
});


test("blank demand and offer units cannot establish verified coverage", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "",
      availableQuantity: 1,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered.length, 1);
  assert.equal(plan.uncovered[0]?.remainingQuantity, null);
  assert.ok(plan.uncovered[0]?.reason.includes("unit is invalid"));
  assert.equal(plan.requiresHumanVerification, true);
});

test("blank offer unit cannot allocate valid demand", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "",
      availableQuantity: 1,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
  assert.equal(plan.uncovered[0]?.unit, "lb");
  assert.ok(
    plan.alternates.some((alternate) =>
      alternate.reason.includes("unit is invalid")
    )
  );
});

test("whitespace-only demand unit is unrouteable", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "   " }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "   ",
      availableQuantity: 1,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered[0]?.remainingQuantity, null);
  assert.ok(plan.uncovered[0]?.reason.includes("unit is invalid"));
});

test("whitespace-only offer unit cannot allocate valid demand", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "   ",
      availableQuantity: 1,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
});

test("leading and trailing whitespace is normalized before exact unit comparison", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: " lb " }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "lb",
      availableQuantity: 1,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.unit, "lb");
  assert.equal(plan.uncovered.length, 0);
});

test("distinct normalized units remain incompatible", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "kg",
      availableQuantity: 1,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
  assert.ok(
    plan.alternates.some((alternate) =>
      alternate.reason.includes("does not match demand unit")
    )
  );
});

test("invalid unit before a valid offer cannot poison coverage", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [{
      id: "ev-b-valid-unit",
      sourceId: "usda-ams-local-food-directories",
      sourceUrl: "https://example.test/farm-b",
      observedAt: "2026-09-21T00:00:00.000Z",
      claimKinds: ["identity", "location", "products"],
    }],
  });

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [farmA, farmB],
    demand: [{ id: "tomatoes", category: "produce", quantity: 2, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "",
        availableQuantity: 2,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.partnerCandidateId, "farm-b");
  assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
});

test("valid allocation followed by invalid unit preserves uncovered remainder", () => {
  const farmA = candidate();
  const farmB = candidate({
    id: "farm-b",
    name: "Farm B",
    evidence: [{
      id: "ev-b-invalid-unit",
      sourceId: "usda-ams-local-food-directories",
      sourceUrl: "https://example.test/farm-b",
      observedAt: "2026-09-21T00:00:00.000Z",
      claimKinds: ["identity", "location", "products"],
    }],
  });

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [farmA, farmB],
    demand: [{ id: "tomatoes", category: "produce", quantity: 2, unit: "lb" }],
    offers: [
      {
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "lb",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
      {
        partnerCandidateId: "farm-b",
        demandLineId: "tomatoes",
        category: "produce",
        unit: "   ",
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.quantity, 1);
  assert.equal(plan.allocations[0]?.unit, "lb");
  assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
});


test("format-only demand units are unrouteable and force verification", () => {
  for (const unit of ["\u200B", "\u200C", "\u2060"]) {
    const plan = buildProposedFulfillmentPlan({
      now: NOW,
      partners: [candidate()],
      demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit }],
      offers: [{
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit,
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      }],
    });

    assert.equal(plan.allocations.length, 0);
    assert.equal(plan.uncovered.length, 1);
    assert.equal(plan.uncovered[0]?.remainingQuantity, null);
    assert.ok(plan.uncovered[0]?.reason.includes("unit is invalid"));
    assert.equal(plan.requiresHumanVerification, true);
  }
});

test("format-only offer units cannot allocate valid demand", () => {
  for (const unit of ["\u200B", "\u200C", "\u2060"]) {
    const plan = buildProposedFulfillmentPlan({
      now: NOW,
      partners: [candidate()],
      demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: "lb" }],
      offers: [{
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit,
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      }],
    });

    assert.equal(plan.allocations.length, 0);
    assert.equal(plan.uncovered.length, 1);
    assert.equal(plan.uncovered[0]?.remainingQuantity, 1);
    assert.equal(plan.uncovered[0]?.unit, "lb");
    assert.ok(
      plan.alternates.some((alternate) =>
        alternate.reason.includes("unit is invalid")
      )
    );
    assert.equal(plan.requiresHumanVerification, true);
  }
});

test("embedded Unicode format characters cannot create visually deceptive compatible units", () => {
  const deceptive = "l\u200Bb";
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: deceptive }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: deceptive,
      availableQuantity: 1,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered[0]?.remainingQuantity, null);
  assert.equal(plan.requiresHumanVerification, true);
});

test("embedded control characters cannot create compatible units", () => {
  const deceptive = "l\tb";
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: deceptive }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: deceptive,
      availableQuantity: 1,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 0);
  assert.equal(plan.uncovered[0]?.remainingQuantity, null);
  assert.equal(plan.requiresHumanVerification, true);
});

test("visible multi-token units remain valid after outer whitespace normalization", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit: " fl oz " }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: "fl oz",
      availableQuantity: 1,
      unitPriceCents: 250,
      availabilityState: "VERIFIED",
      priceState: "VERIFIED",
      serviceAreaState: "VERIFIED_MATCH",
      fulfillmentMode: "PICKUP",
      evidenceObservedAt: "2026-10-01T20:00:00.000Z",
    }],
  });

  assert.equal(plan.allocations.length, 1);
  assert.equal(plan.allocations[0]?.unit, "fl oz");
  assert.equal(plan.uncovered.length, 0);
});

test("default-ignorable unit-only demand tokens are unrouteable and force verification", () => {
  for (const unit of ["\u034F", "\uFE0F", "\u{E0100}"]) {
    const plan = buildProposedFulfillmentPlan({
      now: NOW,
      partners: [candidate()],
      demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit }],
      offers: [{
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit,
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      }],
    });

    assert.equal(plan.allocations.length, 0);
    assert.equal(plan.uncovered.length, 1);
    assert.equal(plan.uncovered[0]?.remainingQuantity, null);
    assert.ok(plan.uncovered[0]?.reason.includes("unit is invalid"));
    assert.equal(plan.requiresHumanVerification, true);
  }
});

test("embedded default-ignorable marks cannot create visually deceptive compatible units", () => {
  for (const unit of ["l\u034Fb", "l\uFE0Fb"]) {
    const plan = buildProposedFulfillmentPlan({
      now: NOW,
      partners: [candidate()],
      demand: [{ id: "tomatoes", category: "produce", quantity: 1, unit }],
      offers: [{
        partnerCandidateId: "farm-a",
        demandLineId: "tomatoes",
        category: "produce",
        unit,
        availableQuantity: 1,
        unitPriceCents: 250,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T20:00:00.000Z",
      }],
    });

    assert.equal(plan.allocations.length, 0);
    assert.equal(plan.uncovered.length, 1);
    assert.equal(plan.uncovered[0]?.remainingQuantity, null);
    assert.equal(plan.requiresHumanVerification, true);
  }
});

