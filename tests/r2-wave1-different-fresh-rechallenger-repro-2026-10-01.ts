import test from "node:test";
import assert from "node:assert/strict";

import { buildProposedFulfillmentPlan } from "../src/lib/partner-network/routing.ts";

const NOW = new Date("2026-10-01T21:00:00.000Z");

function candidate() {
  return {
    id: "farm-a",
    name: "Farm A",
    type: "FARM" as const,
    stage: "EVIDENCE_VERIFIED" as const,
    location: { country: "US", state: "VERIFIED" as const },
    categories: ["produce"],
    capabilities: {
      pickup: "VERIFIED" as const,
      delivery: "UNKNOWN" as const,
      wholesale: "VERIFIED" as const,
      directToConsumer: "UNKNOWN" as const,
      aggregation: "UNKNOWN" as const,
      coldChain: "UNKNOWN" as const,
    },
    identityState: "VERIFIED" as const,
    productState: "VERIFIED" as const,
    serviceAreaState: "VERIFIED" as const,
    pricingState: "UNKNOWN" as const,
    inventoryState: "UNKNOWN" as const,
    minimumOrderState: "UNKNOWN" as const,
    leadTimeState: "UNKNOWN" as const,
    certificationsState: "UNKNOWN" as const,
    evidence: [
      {
        id: "ev-a",
        sourceId: "usda-ams-local-food-directories",
        sourceUrl: "https://example.test/farm-a",
        observedAt: "2026-09-20T00:00:00.000Z",
        claimKinds: ["identity", "location", "products"],
      },
    ],
  };
}

test("VERIFIED price state with no numeric amount must not report verification complete", () => {
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

  // Cost truth state correctly remains unknown.
  assert.equal(plan.allocations[0]?.unitPriceCents, null);
  assert.equal(plan.allocations[0]?.knownCostCents, null);
  assert.equal(plan.hasUnknownCosts, true);

  // FAIL on exact candidate 37eabcea...:
  // allocation.verificationRequired is false and plan.requiresHumanVerification is false.
  assert.equal(plan.allocations[0]?.verificationRequired, true);
  assert.equal(plan.requiresHumanVerification, true);
});
