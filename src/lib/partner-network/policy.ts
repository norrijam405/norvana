import type {
  ClaimState,
  PartnerCandidate,
  PartnerQualification,
  PartnerStage,
} from "./types.ts";

export const R2_AUTHORITY = "RECOMMEND_ONLY" as const;
export const MAX_EVIDENCE_AGE_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

function isFresh(observedAt: string, now: Date) {
  const ts = new Date(observedAt).getTime();
  if (!Number.isFinite(ts)) return false;
  const ageMs = now.getTime() - ts;
  return ageMs >= 0 && ageMs <= MAX_EVIDENCE_AGE_DAYS * DAY_MS;
}

function claimPoints(state: ClaimState, verified: number, claimed: number) {
  if (state === "VERIFIED") return verified;
  if (state === "CLAIMED") return claimed;
  return 0;
}

export function qualifyPartnerCandidate(
  candidate: PartnerCandidate,
  now: Date
): PartnerQualification {
  const warnings: string[] = [];
  const reasons: string[] = [];
  const components: Record<string, number> = {};

  const freshEvidence = candidate.evidence.filter((e) => isFresh(e.observedAt, now));
  const hasFreshEvidence = freshEvidence.length > 0;

  components.identity = claimPoints(candidate.identityState, 20, 8);
  components.location = claimPoints(candidate.location.state, 15, 6);
  components.products = claimPoints(candidate.productState, 20, 8);
  components.serviceArea = claimPoints(candidate.serviceAreaState, 10, 4);
  components.wholesale = claimPoints(candidate.capabilities.wholesale, 10, 4);
  components.fulfillment =
    Math.max(
      claimPoints(candidate.capabilities.pickup, 8, 3),
      claimPoints(candidate.capabilities.delivery, 8, 3),
      claimPoints(candidate.capabilities.aggregation, 8, 3)
    );
  components.evidenceFreshness = hasFreshEvidence ? 12 : 0;
  components.categoryCoverage = candidate.categories.length > 0 ? 5 : 0;

  const score = Math.min(
    100,
    Object.values(components).reduce((sum, value) => sum + value, 0)
  );

  if (!hasFreshEvidence) warnings.push("No fresh evidence within the allowed evidence window.");
  if (candidate.inventoryState !== "VERIFIED") warnings.push("Current inventory is not verified.");
  if (candidate.pricingState !== "VERIFIED") warnings.push("Current pricing is not verified.");
  if (candidate.minimumOrderState !== "VERIFIED") warnings.push("Minimum-order terms are not verified.");
  if (candidate.leadTimeState !== "VERIFIED") warnings.push("Lead time is not verified.");
  if (candidate.certificationsState === "UNKNOWN") warnings.push("Certification/licensing evidence is unknown.");

  const hardBlockers = [
    candidate.stage === "REJECTED",
    candidate.stage === "STALE",
    candidate.identityState !== "VERIFIED",
    candidate.location.state === "UNKNOWN" || candidate.location.state === "STALE",
    candidate.productState === "UNKNOWN" || candidate.productState === "STALE",
    candidate.categories.length === 0,
    candidate.evidence.length === 0,
    !hasFreshEvidence,
  ];

  if (candidate.stage === "REJECTED") reasons.push("Candidate is explicitly rejected.");
  if (candidate.stage === "STALE") reasons.push("Candidate is marked stale.");
  if (candidate.identityState !== "VERIFIED") reasons.push("Business identity is not verified.");
  if (candidate.categories.length === 0) reasons.push("No product/category coverage is evidenced.");
  if (!hasFreshEvidence) reasons.push("Evidence is stale or invalid.");

  const eligibleForRecommendation = !hardBlockers.some(Boolean) && score >= 65;

  let stage: PartnerStage = candidate.stage;
  if (candidate.stage !== "REJECTED") {
    if (!hasFreshEvidence) stage = "STALE";
    else if (eligibleForRecommendation) stage = "RECOMMENDED";
    else if (
      candidate.identityState === "VERIFIED" &&
      candidate.location.state !== "UNKNOWN" &&
      candidate.productState !== "UNKNOWN"
    ) {
      stage = "EVIDENCE_VERIFIED";
    } else {
      stage = "DISCOVERED";
    }
  }

  if (eligibleForRecommendation) {
    reasons.push("Candidate meets the evidence threshold for human onboarding review.");
  }

  return {
    candidateId: candidate.id,
    score,
    stage,
    eligibleForRecommendation,
    components,
    warnings,
    reasons,
  };
}

export function assertR2RecommendOnly() {
  return {
    authority: R2_AUTHORITY,
    canActivateSupplier: false,
    canCreateCredentials: false,
    canPlaceOrder: false,
    canChargeCustomer: false,
    canPublishInventory: false,
    canSubmitFulfillment: false,
    canContactPartnerAutonomously: false,
  } as const;
}
