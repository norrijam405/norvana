import { calculateLandedCostCents } from "./policy.ts";
import { SUPPLIER_LAB_CANDIDATES } from "./demo-products.ts";

export type SyntheticSupplierScenario = {
  candidateId: string;
  providerId: string;
  fixtureClass: "LOCAL_SYNTHETIC_FIXTURE";
  liveSupplierFact: false;
  supplierSku: null;
  itemCostCents: number;
  shippingCostCents: number;
  knownFeesCents: number;
  deliveryWindowDays: { min: number; max: number };
  stockState: "UNKNOWN";
  evidenceTimestamp: null;
};

export type RankedSyntheticScenario = SyntheticSupplierScenario & {
  landedCostCents: number;
  rank: number;
};

const SCENARIOS: readonly SyntheticSupplierScenario[] = [
  { candidateId: "travel-tech-organizer", providerId: "cjdropshipping", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 820, shippingCostCents: 580, knownFeesCents: 0, deliveryWindowDays: { min: 8, max: 15 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "travel-tech-organizer", providerId: "banggood", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 910, shippingCostCents: 440, knownFeesCents: 0, deliveryWindowDays: { min: 7, max: 14 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "travel-tech-organizer", providerId: "eprolo", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 870, shippingCostCents: 510, knownFeesCents: 0, deliveryWindowDays: { min: 8, max: 16 }, stockState: "UNKNOWN", evidenceTimestamp: null },

  { candidateId: "magnetic-car-mount", providerId: "cjdropshipping", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 520, shippingCostCents: 430, knownFeesCents: 0, deliveryWindowDays: { min: 8, max: 15 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "magnetic-car-mount", providerId: "banggood", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 610, shippingCostCents: 310, knownFeesCents: 0, deliveryWindowDays: { min: 7, max: 13 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "magnetic-car-mount", providerId: "eprolo", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 560, shippingCostCents: 390, knownFeesCents: 0, deliveryWindowDays: { min: 8, max: 16 }, stockState: "UNKNOWN", evidenceTimestamp: null },

  { candidateId: "portable-fabric-shaver", providerId: "cjdropshipping", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 840, shippingCostCents: 520, knownFeesCents: 0, deliveryWindowDays: { min: 8, max: 16 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "portable-fabric-shaver", providerId: "banggood", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 930, shippingCostCents: 410, knownFeesCents: 0, deliveryWindowDays: { min: 7, max: 14 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "portable-fabric-shaver", providerId: "eprolo", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 890, shippingCostCents: 470, knownFeesCents: 0, deliveryWindowDays: { min: 9, max: 17 }, stockState: "UNKNOWN", evidenceTimestamp: null },

  { candidateId: "pet-travel-bottle", providerId: "cjdropshipping", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 640, shippingCostCents: 500, knownFeesCents: 0, deliveryWindowDays: { min: 8, max: 15 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "pet-travel-bottle", providerId: "banggood", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 710, shippingCostCents: 410, knownFeesCents: 0, deliveryWindowDays: { min: 7, max: 14 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "pet-travel-bottle", providerId: "eprolo", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 660, shippingCostCents: 450, knownFeesCents: 0, deliveryWindowDays: { min: 8, max: 16 }, stockState: "UNKNOWN", evidenceTimestamp: null },

  { candidateId: "norvana-heavyweight-tee", providerId: "gelato", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 1450, shippingCostCents: 520, knownFeesCents: 0, deliveryWindowDays: { min: 4, max: 10 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "norvana-heavyweight-tee", providerId: "prodigi", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 1390, shippingCostCents: 590, knownFeesCents: 0, deliveryWindowDays: { min: 5, max: 11 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "norvana-heavyweight-tee", providerId: "printful", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 1520, shippingCostCents: 480, knownFeesCents: 0, deliveryWindowDays: { min: 4, max: 9 }, stockState: "UNKNOWN", evidenceTimestamp: null },

  { candidateId: "norvana-tote", providerId: "gelato", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 980, shippingCostCents: 490, knownFeesCents: 0, deliveryWindowDays: { min: 4, max: 10 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "norvana-tote", providerId: "prodigi", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 920, shippingCostCents: 540, knownFeesCents: 0, deliveryWindowDays: { min: 5, max: 11 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "norvana-tote", providerId: "printful", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 1010, shippingCostCents: 460, knownFeesCents: 0, deliveryWindowDays: { min: 4, max: 9 }, stockState: "UNKNOWN", evidenceTimestamp: null },

  { candidateId: "norvana-studio-mug", providerId: "gelato", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 760, shippingCostCents: 510, knownFeesCents: 0, deliveryWindowDays: { min: 4, max: 10 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "norvana-studio-mug", providerId: "prodigi", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 710, shippingCostCents: 550, knownFeesCents: 0, deliveryWindowDays: { min: 5, max: 11 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "norvana-studio-mug", providerId: "printful", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 820, shippingCostCents: 450, knownFeesCents: 0, deliveryWindowDays: { min: 4, max: 9 }, stockState: "UNKNOWN", evidenceTimestamp: null },

  { candidateId: "norvana-travel-hoodie", providerId: "gelato", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 2480, shippingCostCents: 650, knownFeesCents: 0, deliveryWindowDays: { min: 5, max: 11 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "norvana-travel-hoodie", providerId: "prodigi", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 2380, shippingCostCents: 720, knownFeesCents: 0, deliveryWindowDays: { min: 6, max: 12 }, stockState: "UNKNOWN", evidenceTimestamp: null },
  { candidateId: "norvana-travel-hoodie", providerId: "printful", fixtureClass: "LOCAL_SYNTHETIC_FIXTURE", liveSupplierFact: false, supplierSku: null, itemCostCents: 2590, shippingCostCents: 590, knownFeesCents: 0, deliveryWindowDays: { min: 5, max: 10 }, stockState: "UNKNOWN", evidenceTimestamp: null },
] as const;

export function getSupplierLabCandidate(candidateId: string) {
  return SUPPLIER_LAB_CANDIDATES.find((candidate) => candidate.id === candidateId) ?? null;
}

export function getSyntheticSupplierScenarios(candidateId: string): RankedSyntheticScenario[] {
  return SCENARIOS
    .filter((scenario) => scenario.candidateId === candidateId)
    .map((scenario) => {
      const landedCostCents = calculateLandedCostCents({
        itemCostCents: scenario.itemCostCents,
        shippingCostCents: scenario.shippingCostCents,
        knownFeesCents: scenario.knownFeesCents,
      });

      if (landedCostCents === null) {
        throw new Error("Synthetic fixture is incomplete.");
      }

      return { ...scenario, landedCostCents, rank: 0 };
    })
    .sort((a, b) => a.landedCostCents - b.landedCostCents)
    .map((scenario, index) => ({ ...scenario, rank: index + 1 }));
}

export function buildSyntheticOrderSimulation(candidateId: string) {
  const candidate = getSupplierLabCandidate(candidateId);
  if (!candidate) return null;

  const scenarios = getSyntheticSupplierScenarios(candidateId);
  const selected = scenarios[0] ?? null;

  return {
    simulationClass: "LOCAL_SYNTHETIC_ORDER_OBJECT" as const,
    liveSupplierFact: false as const,
    externalSubmissionPermitted: false as const,
    candidateId,
    selectedProviderId: selected?.providerId ?? null,
    supplierSku: null,
    quantity: 1,
    simulatedLandedCostCents: selected?.landedCostCents ?? null,
    targetRetailCents: candidate.targetRetailCents,
    executionAuthority: "LOCKED_R0" as const,
    finalState: "SIMULATION_ONLY" as const,
  };
}
