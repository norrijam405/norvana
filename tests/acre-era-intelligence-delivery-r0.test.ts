import test from "node:test";
import assert from "node:assert/strict";

import { scoreDemand, demandBand } from "../src/lib/intelligence/demand";
import { predictDelivery, shipmentRiskState, allocatedRouteDeliveryCostCents } from "../src/lib/logistics/delivery-intelligence";
import { evaluateDarwinCandidate, rankDarwinCandidates } from "../src/lib/intelligence/darwin";
import { validateProducerIntake } from "../src/lib/local-food/producer-intake";
import { compareLocalDeliveryModes, breakEvenRouteStops } from "../src/lib/logistics/local-delivery-economics";
import { validateDeliveryQuote } from "../src/lib/logistics/delivery-provider";
import { gradeScoutForecast, postLaunchDecision } from "../src/lib/watchtower/scout-accuracy";

test("demand scoring rewards observed velocity, repeat purchase, and sell-through", () => {
  const now = new Date("2026-10-04T18:00:00Z");
  const strong = scoreDemand({
    internalRequests: 45,
    sellThroughRate: 0.82,
    repeatPurchaseRate: 0.58,
    searchTrendIndex: 78,
    customerVoiceScore: 86,
    velocityIndex: 91,
    sampleSize: 220,
    observedAt: "2026-10-04T12:00:00Z",
  }, now);

  const weak = scoreDemand({
    internalRequests: 1,
    sellThroughRate: 0.12,
    repeatPurchaseRate: 0.03,
    searchTrendIndex: 18,
    customerVoiceScore: 40,
    velocityIndex: 12,
    sampleSize: 8,
    observedAt: "2026-07-01T12:00:00Z",
  }, now);

  assert.ok(strong.score > weak.score);
  assert.ok(strong.confidence > weak.confidence);
  assert.equal(demandBand(strong.score), "HIGH");
});

test("delivery prediction learns a conservative customer promise window", () => {
  const result = predictDelivery([
    { handlingDays: 1, transitDays: 2, deliveredOnTime: true },
    { handlingDays: 1, transitDays: 3, deliveredOnTime: true },
    { handlingDays: 2, transitDays: 3, deliveredOnTime: true },
    { handlingDays: 1, transitDays: 4, deliveredOnTime: false, trackingGapHours: 40 },
    { handlingDays: 2, transitDays: 4, deliveredOnTime: true },
  ]);

  assert.equal(result.sampleSize, 5);
  assert.ok(result.promiseMaxDays! >= result.promiseMinDays!);
  assert.ok(result.reliabilityScore > 50);
});

test("delivery route density lowers per-stop allocation", () => {
  assert.equal(allocatedRouteDeliveryCostCents({ routeCostCents: 4200, completedStops: 12 }), 350);
  assert.equal(allocatedRouteDeliveryCostCents({ routeCostCents: 4200, completedStops: 2 }), 2100);
});

test("shipment state becomes late after the customer promise expires", () => {
  const state = shipmentRiskState({
    promisedBy: "2026-10-04T17:00:00Z",
    lastTrackingEventAt: "2026-10-03T10:00:00Z",
    carrierAcceptedAt: "2026-10-02T10:00:00Z",
    now: new Date("2026-10-04T18:00:00Z"),
  });
  assert.equal(state, "LATE");
});

test("Darwin rejects cheap routes that destroy delivery reliability", () => {
  const demand = scoreDemand({
    internalRequests: 30,
    sellThroughRate: 0.7,
    repeatPurchaseRate: 0.4,
    searchTrendIndex: 70,
    customerVoiceScore: 80,
    velocityIndex: 75,
    sampleSize: 100,
    observedAt: "2026-10-04T12:00:00Z",
  }, new Date("2026-10-04T18:00:00Z"));

  const reliableDelivery = predictDelivery([
    { handlingDays: 1, transitDays: 2, deliveredOnTime: true },
    { handlingDays: 1, transitDays: 2, deliveredOnTime: true },
    { handlingDays: 1, transitDays: 3, deliveredOnTime: true },
  ]);

  const unreliableDelivery = predictDelivery([
    { handlingDays: 3, transitDays: 7, deliveredOnTime: false, lost: true, trackingGapHours: 90 },
    { handlingDays: 4, transitDays: 8, deliveredOnTime: false, trackingGapHours: 72 },
    { handlingDays: 3, transitDays: 9, deliveredOnTime: false, damaged: true, trackingGapHours: 80 },
  ]);

  const good = evaluateDarwinCandidate({
    id: "reliable",
    economics: { salePriceCents: 4000, productCostCents: 2200, outboundShippingCents: 500, paymentFeeCents: 150, returnReserveCents: 100 },
    demand,
    delivery: reliableDelivery,
    sourceTrustScore: 90,
    returnRisk: 10,
    spoilageRisk: 10,
    supportBurden: 10,
  });

  const cheapButBad = evaluateDarwinCandidate({
    id: "cheap-bad",
    economics: { salePriceCents: 4000, productCostCents: 1600, outboundShippingCents: 300, paymentFeeCents: 150, returnReserveCents: 100 },
    demand,
    delivery: unreliableDelivery,
    sourceTrustScore: 90,
    returnRisk: 35,
    spoilageRisk: 25,
    supportBurden: 45,
  });

  assert.equal(good.eligible, true);
  assert.equal(cheapButBad.eligible, false);
  assert.ok(cheapButBad.rejectionCodes.includes("DELIVERY_RELIABILITY_TOO_LOW"));
});

test("Darwin ranks viable routes ahead of rejected routes", () => {
  const demand = scoreDemand({
    internalRequests: 50,
    sellThroughRate: 0.8,
    repeatPurchaseRate: 0.55,
    searchTrendIndex: 80,
    customerVoiceScore: 80,
    velocityIndex: 80,
    sampleSize: 300,
    observedAt: "2026-10-04T17:00:00Z",
  }, new Date("2026-10-04T18:00:00Z"));

  const delivery = predictDelivery([
    { handlingDays: 1, transitDays: 2, deliveredOnTime: true },
    { handlingDays: 1, transitDays: 2, deliveredOnTime: true },
    { handlingDays: 1, transitDays: 3, deliveredOnTime: true },
  ]);

  const ranked = rankDarwinCandidates([
    {
      id: "thin-margin",
      economics: { salePriceCents: 2000, productCostCents: 1850, outboundShippingCents: 100 },
      demand,
      delivery,
      sourceTrustScore: 90,
      returnRisk: 5,
      spoilageRisk: 5,
      supportBurden: 5,
    },
    {
      id: "healthy",
      economics: { salePriceCents: 4000, productCostCents: 2300, outboundShippingCents: 500, paymentFeeCents: 150 },
      demand,
      delivery,
      sourceTrustScore: 90,
      returnRisk: 5,
      spoilageRisk: 5,
      supportBurden: 5,
    },
  ]);

  assert.equal(ranked[0].id, "healthy");
  assert.equal(ranked[0].eligible, true);
  assert.equal(ranked[1].eligible, false);
});

test("producer intake catches unsupported national cold-chain claims", () => {
  const result = validateProducerIntake({
    name: "Example Farm",
    channel: "FARM",
    serviceAreas: ["Oklahoma City"],
    productCategories: ["produce"],
    wholesaleAvailable: true,
    fulfillmentModes: ["CUSTOMER_PICKUP"],
    shipsNationally: true,
    coldChainRequired: true,
    mediaPermissionStatus: "DISCUSS",
    pilotInterest: "YES",
  });

  assert.equal(result.valid, false);
  assert.ok(result.issues.includes("NATIONAL_SHIPPING_MODE_MISSING"));
  assert.ok(result.issues.includes("COLD_CHAIN_FULFILLMENT_PATH_MISSING"));
});


test("scheduled delivery wins once route density spreads the cost", () => {
  const result = compareLocalDeliveryModes({
    stops: Array.from({ length: 10 }, (_, index) => ({
      orderKey: `order-${index + 1}`,
      contributionBeforeDeliveryCents: 1200,
    })),
    scheduledRouteCostCents: 4200,
    thirdPartyPerOrderCents: 699,
    minimumContributionPerOrderCents: 300,
  });

  assert.equal(result.recommendedMode, "SCHEDULED_ROUTE");
  assert.equal(result.scheduled?.deliveryCostPerOrderCents, 420);
  assert.ok(result.savingsCents > 0);
  assert.equal(breakEvenRouteStops({ scheduledRouteCostCents: 4200, thirdPartyPerOrderCents: 699 }), 7);
});

test("provider-neutral quote validation rejects impossible quotes", () => {
  const result = validateDeliveryQuote({
    provider: "example",
    serviceLevel: "same-day",
    quotedCostCents: -1,
    currency: "USD",
  });
  assert.equal(result.valid, false);
  assert.ok(result.issues.includes("DELIVERY_QUOTED_COST_INVALID"));
});


test("producer prospect capture preserves unresolved cold-chain gaps as warnings", () => {
  const result = validateProducerIntake({
    name: "Cold Prospect Farm",
    channel: "FARM",
    serviceAreas: ["Oklahoma City"],
    productCategories: ["produce"],
    wholesaleAvailable: true,
    fulfillmentModes: ["CUSTOMER_PICKUP"],
    shipsNationally: false,
    coldChainRequired: true,
    mediaPermissionStatus: "DISCUSS",
    pilotInterest: "MAYBE",
  }, { operational: false });

  assert.equal(result.valid, true);
  assert.equal(result.operationallyQualified, false);
  assert.ok(result.warnings.includes("COLD_CHAIN_FULFILLMENT_PATH_MISSING"));
});


test("Scout accuracy refuses to grade tiny samples", () => {
  const result = gradeScoutForecast({
    projectedContributionPerOrderCents: 840,
    actualContributionCents: 2100,
    settledOrders: 3,
  });
  assert.equal(result.state, "INSUFFICIENT_DATA");
  assert.equal(result.accuracyPct, null);
});

test("Scout accuracy measures forecast error and bias after five settled orders", () => {
  const result = gradeScoutForecast({
    projectedContributionPerOrderCents: 840,
    actualContributionCents: 3500,
    settledOrders: 5,
  });
  assert.equal(result.state, "MEASURED");
  assert.equal(result.actualContributionPerOrderCents, 700);
  assert.equal(result.accuracyPct, 83);
  assert.equal(result.bias, "OVER_ESTIMATED");
});

test("post-launch policy removes negative contribution products", () => {
  const result = postLaunchDecision({
    projectedContributionPerOrderCents: 800,
    actualContributionCents: -500,
    settledOrders: 8,
    outboundClicks: 100,
    convertedOrders: 8,
    returnRate: 0.05,
  });
  assert.equal(result.decision, "REMOVE");
});

test("post-launch policy can push products beating forecast with healthy conversion and returns", () => {
  const result = postLaunchDecision({
    projectedContributionPerOrderCents: 800,
    actualContributionCents: 7600,
    settledOrders: 8,
    outboundClicks: 200,
    convertedOrders: 8,
    returnRate: 0.04,
  });
  assert.equal(result.decision, "PUSH");
});
