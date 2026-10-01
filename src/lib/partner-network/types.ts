export const PARTNER_TYPES = [
  "FARM",
  "RANCH",
  "CSA",
  "FOOD_HUB",
  "FARMERS_MARKET",
  "BAKERY",
  "COOP",
  "LOCAL_MANUFACTURER",
  "WHOLESALER",
  "PACKER",
  "COLD_STORAGE",
  "COURIER",
  "OTHER_LOCAL_BUSINESS",
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export const PARTNER_STAGES = [
  "DISCOVERED",
  "EVIDENCE_VERIFIED",
  "RECOMMENDED",
  "REJECTED",
  "STALE",
] as const;

export type PartnerStage = (typeof PARTNER_STAGES)[number];

export const CLAIM_STATES = [
  "UNKNOWN",
  "CLAIMED",
  "VERIFIED",
  "STALE",
] as const;

export type ClaimState = (typeof CLAIM_STATES)[number];

export type PartnerEvidence = {
  id: string;
  sourceId: string;
  sourceUrl: string;
  observedAt: string;
  claimKinds: string[];
};

export type PartnerLocation = {
  city?: string;
  region?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  state: ClaimState;
};

export type PartnerCapability = {
  pickup: ClaimState;
  delivery: ClaimState;
  wholesale: ClaimState;
  directToConsumer: ClaimState;
  aggregation: ClaimState;
  coldChain: ClaimState;
};

export type PartnerCandidate = {
  id: string;
  name: string;
  type: PartnerType;
  stage: PartnerStage;
  website?: string;
  publicContact?: {
    email?: string;
    phone?: string;
  };
  location: PartnerLocation;
  categories: string[];
  seasonality?: string[];
  capabilities: PartnerCapability;
  identityState: ClaimState;
  productState: ClaimState;
  serviceAreaState: ClaimState;
  pricingState: ClaimState;
  inventoryState: ClaimState;
  minimumOrderState: ClaimState;
  leadTimeState: ClaimState;
  certificationsState: ClaimState;
  evidence: PartnerEvidence[];
  notes?: string[];
};

export type PartnerQualification = {
  candidateId: string;
  score: number;
  stage: PartnerStage;
  eligibleForRecommendation: boolean;
  components: Record<string, number>;
  warnings: string[];
  reasons: string[];
};

export type DemandLine = {
  id: string;
  category: string;
  quantity: number;
  unit: string;
};

export type PartnerOffer = {
  partnerCandidateId: string;
  demandLineId: string;
  availableQuantity: number | null;
  unitPriceCents: number | null;
  availabilityState: ClaimState;
  priceState: ClaimState;
  serviceAreaState: "VERIFIED_MATCH" | "CLAIMED_MATCH" | "UNKNOWN" | "NO_MATCH";
  fulfillmentMode: "PICKUP" | "LOCAL_DELIVERY" | "COURIER" | "FOOD_HUB";
  evidenceObservedAt: string;
};

export type ProposedAllocation = {
  demandLineId: string;
  partnerCandidateId: string;
  quantity: number;
  unit: string;
  unitPriceCents: number | null;
  knownCostCents: number | null;
  fulfillmentMode: PartnerOffer["fulfillmentMode"];
  verificationRequired: boolean;
  warnings: string[];
};

export type ProposedFulfillmentPlan = {
  authority: "RECOMMEND_ONLY";
  canExecute: false;
  allocations: ProposedAllocation[];
  uncovered: Array<{
    demandLineId: string;
    remainingQuantity: number;
    unit: string;
    reason: string;
  }>;
  alternates: Array<{
    demandLineId: string;
    partnerCandidateId: string;
    reason: string;
  }>;
  knownCostCents: number;
  hasUnknownCosts: boolean;
  requiresHumanVerification: boolean;
  warnings: string[];
};
