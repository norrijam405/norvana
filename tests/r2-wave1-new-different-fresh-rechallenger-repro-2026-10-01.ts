import test from "node:test";
import assert from "node:assert/strict";

import { buildProposedFulfillmentPlan } from "../src/lib/partner-network/routing.ts";

const NOW = new Date("2026-10-01T20:00:00.000Z");

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

test("VERIFIED negative current price must not become verification-complete authoritative cost", () => {
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
        unitPriceCents: -1,
        availabilityState: "VERIFIED",
        priceState: "VERIFIED",
        serviceAreaState: "VERIFIED_MATCH",
        fulfillmentMode: "PICKUP",
        evidenceObservedAt: "2026-10-01T19:00:00.000Z",
      },
    ],
  });

  assert.equal(plan.allocations.length, 1);

  // A negative current price is not a valid authoritative price amount.
  // Exact candidate b7d8d6b6... currently returns:
  // unitPriceCents=-1, knownCostCents=-1,
  // verificationRequired=false, hasUnknownCosts=false,
  // requiresHumanVerification=false.
  assert.equal(plan.allocations[0]?.unitPriceCents, null);
  assert.equal(plan.allocations[0]?.knownCostCents, null);
  assert.equal(plan.allocations[0]?.verificationRequired, true);
  assert.equal(plan.hasUnknownCosts, true);
  assert.equal(plan.requiresHumanVerification, true);
});
