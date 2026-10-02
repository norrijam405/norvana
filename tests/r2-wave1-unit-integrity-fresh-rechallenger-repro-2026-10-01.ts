import test from "node:test";
import assert from "node:assert/strict";
import { buildProposedFulfillmentPlan } from "../src/lib/partner-network/routing.ts";
import type { PartnerCandidate } from "../src/lib/partner-network/types.ts";

const NOW = new Date("2026-10-01T20:00:00.000Z");

function candidate(): PartnerCandidate {
  return {
    id: "farm-a",
    name: "Farm A",
    type: "FARM",
    stage: "EVIDENCE_VERIFIED",
    location: { city: "Example", region: "KS", country: "US", state: "VERIFIED" },
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

test("invisible U+200B units cannot establish verified coverage", () => {
  const invisibleUnit = "\u200B";
  assert.equal(invisibleUnit.trim().length, 1);

  const plan = buildProposedFulfillmentPlan({
    now: NOW,
    partners: [candidate()],
    demand: [{
      id: "tomatoes",
      category: "produce",
      quantity: 1,
      unit: invisibleUnit,
    }],
    offers: [{
      partnerCandidateId: "farm-a",
      demandLineId: "tomatoes",
      category: "produce",
      unit: invisibleUnit,
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
});
