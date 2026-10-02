import test from "node:test";
import assert from "node:assert/strict";
import { buildProposedFulfillmentPlan } from "../src/lib/partner-network/routing.ts";
import type { PartnerCandidate, PartnerOffer } from "../src/lib/partner-network/types.ts";

const NOW = new Date("2026-10-01T20:00:00.000Z");

function candidate(): PartnerCandidate {
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
    evidence: [{
      id: "ev-1",
      sourceId: "usda-ams-local-food-directories",
      sourceUrl: "https://example.test/farm-a",
      observedAt: "2026-09-20T00:00:00.000Z",
      claimKinds: ["identity", "location", "products"],
    }],
  };
}

function offer(demandLineId: string, unitPriceCents: number): PartnerOffer {
  return {
    partnerCandidateId: "farm-a",
    demandLineId,
    category: "produce",
    unit: "lb",
    availableQuantity: 1,
    unitPriceCents,
    availabilityState: "VERIFIED",
    priceState: "VERIFIED",
    serviceAreaState: "VERIFIED_MATCH",
    fulfillmentMode: "PICKUP",
    evidenceObservedAt: "2026-10-01T20:00:00.000Z",
  };
}

test("plan-level known-cost aggregation never emits unsafe authoritative cents", () => {
  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [
      { id: "line-max", category: "produce", quantity: 1, unit: "lb" },
      { id: "line-one", category: "produce", quantity: 1, unit: "lb" },
    ],
    offers: [
      offer("line-max", Number.MAX_SAFE_INTEGER),
      offer("line-one", 1),
    ],
  });

  assert.deepEqual(
    plan.allocations.map((allocation) => allocation.knownCostCents),
    [Number.MAX_SAFE_INTEGER, 1]
  );

  assert.equal(
    Number.isSafeInteger(plan.knownCostCents),
    true,
    `plan knownCostCents must remain a safe integer; observed ${plan.knownCostCents}`
  );
});
