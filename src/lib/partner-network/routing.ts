import type {
  DemandLine,
  PartnerCandidate,
  PartnerOffer,
  ProposedAllocation,
  ProposedFulfillmentPlan,
} from "./types.ts";
import { qualifyPartnerCandidate } from "./policy.ts";

export const MAX_OFFER_EVIDENCE_AGE_DAYS = 30;
export const OFFER_REVERIFY_AFTER_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function normalizeCategory(value: string) {
  return value.trim().toLowerCase();
}

function verifiedUnitPriceCents(offer: PartnerOffer) {
  return offer.priceState === "VERIFIED" ? offer.unitPriceCents : null;
}

function offerAgeDays(offer: PartnerOffer, now: Date) {
  const observed = new Date(offer.evidenceObservedAt).getTime();
  if (!Number.isFinite(observed)) return Number.POSITIVE_INFINITY;
  const ageMs = now.getTime() - observed;
  if (ageMs < 0) return Number.POSITIVE_INFINITY;
  return ageMs / DAY_MS;
}

function offerTrustScore(offer: PartnerOffer, now: Date) {
  let score = 0;
  if (offer.availabilityState === "VERIFIED") score += 35;
  else if (offer.availabilityState === "CLAIMED") score += 15;

  const authoritativePrice = verifiedUnitPriceCents(offer);
  if (authoritativePrice !== null) score += 20;
  else if (offer.priceState === "CLAIMED" && offer.unitPriceCents !== null) score += 8;

  if (offer.serviceAreaState === "VERIFIED_MATCH") score += 30;
  else if (offer.serviceAreaState === "CLAIMED_MATCH") score += 15;
  else if (offer.serviceAreaState === "UNKNOWN") score += 2;

  const age = offerAgeDays(offer, now);
  if (age <= 1) score += 8;
  else if (age <= OFFER_REVERIFY_AFTER_DAYS) score += 5;
  else if (age <= MAX_OFFER_EVIDENCE_AGE_DAYS) score += 1;

  return score;
}

function selectOneOfferPerPartner(
  offers: PartnerOffer[],
  now: Date
) {
  const selected = new Map<string, PartnerOffer>();

  for (const offer of offers) {
    const current = selected.get(offer.partnerCandidateId);
    if (!current) {
      selected.set(offer.partnerCandidateId, offer);
      continue;
    }

    const currentScore = offerTrustScore(current, now);
    const nextScore = offerTrustScore(offer, now);

    if (nextScore > currentScore) {
      selected.set(offer.partnerCandidateId, offer);
      continue;
    }

    if (nextScore === currentScore) {
      const currentPrice =
        verifiedUnitPriceCents(current) ?? Number.MAX_SAFE_INTEGER;
      const nextPrice =
        verifiedUnitPriceCents(offer) ?? Number.MAX_SAFE_INTEGER;
      if (nextPrice < currentPrice) {
        selected.set(offer.partnerCandidateId, offer);
      }
    }
  }

  return [...selected.values()];
}

export function buildProposedFulfillmentPlan(input: {
  demand: DemandLine[];
  partners: PartnerCandidate[];
  offers: PartnerOffer[];
  now: Date;
}): ProposedFulfillmentPlan {
  const partnerMap = new Map(input.partners.map((p) => [p.id, p]));
  const qualifications = new Map(
    input.partners.map((partner) => [
      partner.id,
      qualifyPartnerCandidate(partner, input.now),
    ])
  );

  const allocations: ProposedAllocation[] = [];
  const uncovered: ProposedFulfillmentPlan["uncovered"] = [];
  const alternates: ProposedFulfillmentPlan["alternates"] = [];
  const planWarnings: string[] = [];
  let knownCostCents = 0;
  let hasUnknownCosts = false;
  let requiresHumanVerification = false;

  for (const line of input.demand) {
    let remaining = line.quantity;

    const rawLineOffers = input.offers.filter(
      (offer) => offer.demandLineId === line.id
    );

    const eligibleOffers = rawLineOffers.filter((offer) => {
      const partner = partnerMap.get(offer.partnerCandidateId);
      const qualification = qualifications.get(offer.partnerCandidateId);

      if (!partner || !qualification?.eligibleForRecommendation) return false;
      if (normalizeCategory(offer.category) !== normalizeCategory(line.category)) return false;
      if (offer.unit !== line.unit) return false;
      if (offer.serviceAreaState === "NO_MATCH") return false;
      if (offer.availabilityState === "UNKNOWN" || offer.availabilityState === "STALE") return false;
      if (offer.availableQuantity === null || offer.availableQuantity <= 0) return false;
      if (offerAgeDays(offer, input.now) > MAX_OFFER_EVIDENCE_AGE_DAYS) return false;

      const partnerCategories = new Set(partner.categories.map(normalizeCategory));
      if (!partnerCategories.has(normalizeCategory(line.category))) return false;

      return true;
    });

    const lineOffers = selectOneOfferPerPartner(
      eligibleOffers,
      input.now
    ).sort((a, b) => {
      const trustDelta =
        offerTrustScore(b, input.now) - offerTrustScore(a, input.now);
      if (trustDelta !== 0) return trustDelta;

      const aPrice =
        verifiedUnitPriceCents(a) ?? Number.MAX_SAFE_INTEGER;
      const bPrice =
        verifiedUnitPriceCents(b) ?? Number.MAX_SAFE_INTEGER;
      if (aPrice !== bPrice) return aPrice - bPrice;

      return a.partnerCandidateId.localeCompare(b.partnerCandidateId);
    });

    for (const offer of lineOffers) {
      if (remaining <= 0) {
        alternates.push({
          demandLineId: line.id,
          partnerCandidateId: offer.partnerCandidateId,
          reason: "Qualified alternate after the demand line was already covered.",
        });
        continue;
      }

      const quantity = Math.min(remaining, offer.availableQuantity ?? 0);
      if (quantity <= 0) continue;

      const warnings: string[] = [];
      const ageDays = offerAgeDays(offer, input.now);
      const unitPriceCents = verifiedUnitPriceCents(offer);
      const knownCost =
        unitPriceCents === null ? null : quantity * unitPriceCents;

      const verificationRequired =
        offer.availabilityState !== "VERIFIED" ||
        offer.priceState !== "VERIFIED" ||
        unitPriceCents === null ||
        offer.serviceAreaState !== "VERIFIED_MATCH" ||
        ageDays > OFFER_REVERIFY_AFTER_DAYS;

      if (offer.availabilityState !== "VERIFIED") warnings.push("Availability is claimed, not verified.");
      if (offer.priceState !== "VERIFIED") {
        warnings.push("Price is not verified.");
      } else if (unitPriceCents === null) {
        warnings.push("Verified price state is missing a numeric current amount.");
      }
      if (offer.serviceAreaState !== "VERIFIED_MATCH") warnings.push("Service-area match requires verification.");
      if (ageDays > OFFER_REVERIFY_AFTER_DAYS) warnings.push("Offer evidence should be reverified before human approval.");

      if (knownCost === null) hasUnknownCosts = true;
      else knownCostCents += knownCost;

      if (verificationRequired) requiresHumanVerification = true;

      allocations.push({
        demandLineId: line.id,
        partnerCandidateId: offer.partnerCandidateId,
        quantity,
        unit: line.unit,
        unitPriceCents,
        knownCostCents: knownCost,
        fulfillmentMode: offer.fulfillmentMode,
        verificationRequired,
        warnings,
      });

      remaining -= quantity;
    }

    const allocatedPartnerIds = new Set(
      allocations
        .filter((allocation) => allocation.demandLineId === line.id)
        .map((allocation) => allocation.partnerCandidateId)
    );

    const alternateKeys = new Set(
      alternates
        .filter((alternate) => alternate.demandLineId === line.id)
        .map((alternate) => alternate.partnerCandidateId)
    );

    for (const offer of rawLineOffers) {
      if (
        allocatedPartnerIds.has(offer.partnerCandidateId) ||
        alternateKeys.has(offer.partnerCandidateId)
      ) {
        continue;
      }

      const partner = partnerMap.get(offer.partnerCandidateId);
      const qualification = qualifications.get(offer.partnerCandidateId);

      let reason = "Offer is not currently eligible for allocation.";
      if (!partner || !qualification?.eligibleForRecommendation) reason = "Partner is not recommendation-eligible.";
      else if (normalizeCategory(offer.category) !== normalizeCategory(line.category)) reason = "Offer category does not match demand.";
      else if (!partner.categories.map(normalizeCategory).includes(normalizeCategory(line.category))) reason = "Partner evidence does not cover the demanded category.";
      else if (offer.unit !== line.unit) reason = "Offer quantity unit does not match demand unit.";
      else if (offer.serviceAreaState === "NO_MATCH") reason = "Service area does not match.";
      else if (offer.availableQuantity === null) reason = "Available quantity is unknown.";
      else if (offer.availabilityState === "STALE") reason = "Availability evidence is stale.";
      else if (offer.availabilityState === "UNKNOWN") reason = "Availability is unknown.";
      else if (offerAgeDays(offer, input.now) > MAX_OFFER_EVIDENCE_AGE_DAYS) reason = "Offer evidence is too old for allocation.";

      alternates.push({
        demandLineId: line.id,
        partnerCandidateId: offer.partnerCandidateId,
        reason,
      });
      alternateKeys.add(offer.partnerCandidateId);
    }

    if (remaining > 0) {
      uncovered.push({
        demandLineId: line.id,
        remainingQuantity: remaining,
        unit: line.unit,
        reason: "Verified/recommendable partner evidence does not cover the full requested quantity.",
      });
      requiresHumanVerification = true;
    }
  }

  if (hasUnknownCosts) {
    planWarnings.push("At least one proposed allocation has unknown current cost.");
  }
  if (uncovered.length > 0) {
    planWarnings.push("The proposed network does not fully cover all demand.");
  }
  planWarnings.push("Proposal is RECOMMEND-only and cannot execute an order.");

  return {
    authority: "RECOMMEND_ONLY",
    canExecute: false,
    allocations,
    uncovered,
    alternates,
    knownCostCents,
    hasUnknownCosts,
    requiresHumanVerification,
    warnings: planWarnings,
  };
}
