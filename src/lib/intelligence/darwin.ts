import { calculateContributionEconomics, type OpportunityEconomicsInput } from "../watchtower/intelligence";
import type { DemandScore } from "./demand";
import type { DeliveryPrediction } from "../logistics/delivery-intelligence";

export type DarwinCandidateInput = {
  id: string;
  economics: OpportunityEconomicsInput;
  demand: DemandScore;
  delivery: DeliveryPrediction;
  sourceTrustScore: number;
  returnRisk: number;
  spoilageRisk: number;
  supportBurden: number;
};

export type DarwinPolicy = {
  minContributionCents: number;
  minContributionMarginBps: number;
  minDemandConfidence: number;
  minDeliveryReliability: number;
  minSourceTrust: number;
  maxSpoilageRisk: number;
};

export const DEFAULT_DARWIN_POLICY: DarwinPolicy = {
  minContributionCents: 250,
  minContributionMarginBps: 800,
  minDemandConfidence: 35,
  minDeliveryReliability: 55,
  minSourceTrust: 60,
  maxSpoilageRisk: 75,
};

const clamp100 = (value: number) => Math.min(100, Math.max(0, value));
const risk = (value: number) => clamp100(value) / 100;

export function evaluateDarwinCandidate(
  input: DarwinCandidateInput,
  policy: DarwinPolicy = DEFAULT_DARWIN_POLICY
) {
  const economics = calculateContributionEconomics(input.economics);
  const rejectionCodes: string[] = [];

  if (economics.contributionCents < policy.minContributionCents) {
    rejectionCodes.push("CONTRIBUTION_DOLLARS_TOO_LOW");
  }
  if (
    economics.contributionMarginBps === null ||
    economics.contributionMarginBps < policy.minContributionMarginBps
  ) {
    rejectionCodes.push("CONTRIBUTION_MARGIN_TOO_LOW");
  }
  if (input.demand.confidence < policy.minDemandConfidence) {
    rejectionCodes.push("DEMAND_CONFIDENCE_TOO_LOW");
  }
  if (input.delivery.reliabilityScore < policy.minDeliveryReliability) {
    rejectionCodes.push("DELIVERY_RELIABILITY_TOO_LOW");
  }
  if (clamp100(input.sourceTrustScore) < policy.minSourceTrust) {
    rejectionCodes.push("SOURCE_TRUST_TOO_LOW");
  }
  if (clamp100(input.spoilageRisk) > policy.maxSpoilageRisk) {
    rejectionCodes.push("SPOILAGE_RISK_TOO_HIGH");
  }

  const marginScore =
    economics.contributionMarginBps === null
      ? 0
      : clamp100(economics.contributionMarginBps / 100);
  const contributionScore = clamp100(economics.contributionCents / 20);

  const penalty =
    risk(input.returnRisk) * 10 +
    risk(input.spoilageRisk) * 15 +
    risk(input.supportBurden) * 8;

  const fitness = clamp100(
    input.demand.score * 0.25 +
      input.delivery.reliabilityScore * 0.2 +
      clamp100(input.sourceTrustScore) * 0.15 +
      marginScore * 0.17 +
      contributionScore * 0.13 +
      input.demand.confidence * 0.1 -
      penalty
  );

  return {
    id: input.id,
    eligible: rejectionCodes.length === 0,
    rejectionCodes,
    fitnessScore: Math.round(fitness),
    economics,
    demandScore: input.demand.score,
    demandConfidence: input.demand.confidence,
    deliveryReliabilityScore: input.delivery.reliabilityScore,
    deliveryConfidence: input.delivery.confidence,
    sourceTrustScore: clamp100(input.sourceTrustScore),
    risks: {
      returnRisk: clamp100(input.returnRisk),
      spoilageRisk: clamp100(input.spoilageRisk),
      supportBurden: clamp100(input.supportBurden),
    },
  };
}

export function rankDarwinCandidates(
  candidates: DarwinCandidateInput[],
  policy: DarwinPolicy = DEFAULT_DARWIN_POLICY
) {
  return candidates
    .map((candidate) => evaluateDarwinCandidate(candidate, policy))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      if (b.fitnessScore !== a.fitnessScore) return b.fitnessScore - a.fitnessScore;
      return b.economics.contributionCents - a.economics.contributionCents;
    });
}
