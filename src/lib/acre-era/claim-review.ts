/**
 * Acre Era R5: vertical-specific claim provenance review, fictional/offline only.
 *
 * No trust is inherited from source-looking strings, domain names, timestamps,
 * user-provided assertions, or upstream safety indicators. This module cannot
 * issue a publication approval, guarantee safety, or perform a live source check.
 */
import type { AcreSafetyContext } from "./safety-coverage.ts";

export type AcreClaimType =
  | "SELLER_IDENTITY" | "PRODUCT_CONDITION" | "PRODUCT_AUTHENTICITY"
  | "FOOD_HANDLING" | "ALLERGEN_DISCLOSURE" | "PAYMENT_SETTLEMENT"
  | "PICKUP_DESIGNATION" | "DELIVERY_TERMS" | "AFFILIATE_DISCLOSURE"
  | "CUSTOMER_REVIEW";
export type AcreEvidence = {
  kind: "SELLER_ASSERTION" | "THIRD_PARTY_DOCUMENT" | "PROVIDER_RECEIPT";
  sourceUrl?: string | null;
  checkedAt?: string | null;
  reviewerAttested?: boolean;
  providerAuthenticated?: boolean;
};
export type AcreClaim = {
  id: string;
  context: AcreSafetyContext;
  type: AcreClaimType;
  evidence?: AcreEvidence[];
};
export type AcreClaimFinding = {
  id: string;
  type: AcreClaimType;
  status: "UNKNOWN" | "REPORTED";
  blockers: string[];
};
export type AcreClaimsReview = {
  mode: "SYNTHETIC_ONLY";
  outcome: "REVIEW_REQUIRED";
  publishAuthorized: false;
  findings: AcreClaimFinding[];
};

export const CLAIM_CONTEXTS: Record<AcreClaimType, readonly AcreSafetyContext[]> = {
  SELLER_IDENTITY: ["GARAGE_SALE","MARKET_FARM","GOODS","FINDS_AFFILIATE","ERA_DROP"],
  PRODUCT_CONDITION: ["GARAGE_SALE","MARKET_FARM","GOODS","ERA_DROP"],
  PRODUCT_AUTHENTICITY: ["GARAGE_SALE","GOODS","FINDS_AFFILIATE","ERA_DROP"],
  FOOD_HANDLING: ["MARKET_FARM"],
  ALLERGEN_DISCLOSURE: ["MARKET_FARM"],
  PAYMENT_SETTLEMENT: ["GARAGE_SALE","MARKET_FARM","GOODS","FINDS_AFFILIATE","ERA_DROP"],
  PICKUP_DESIGNATION: ["GARAGE_SALE","MARKET_FARM","PICKUP_DELIVERY"],
  DELIVERY_TERMS: ["MARKET_FARM","GOODS","ERA_DROP","PICKUP_DELIVERY"],
  AFFILIATE_DISCLOSURE: ["FINDS_AFFILIATE","GOODS","ERA_DROP"],
  CUSTOMER_REVIEW: ["GARAGE_SALE","MARKET_FARM","GOODS","ERA_DROP"],
};

function validHttpsLink(value: unknown): boolean {
  if (typeof value !== "string" || value.length > 1000) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !!parsed.hostname &&
      !parsed.username && !parsed.password && !parsed.hash &&
      !/^(localhost|127\.|10\.|192\.168\.|172\.)/i.test(parsed.hostname);
  } catch { return false; }
}
function validDate(value: unknown, nowMs: number): boolean {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed <= nowMs && nowMs - parsed <= 30 * 86400000;
}

export function reviewSyntheticAcreClaims(claims: AcreClaim[], now: Date): AcreClaimsReview {
  const nowMs = now.getTime();
  const findings = claims.slice(0, 40).map(claim => {
    const blockers: string[] = [];
    if (!CLAIM_CONTEXTS[claim.type]?.includes(claim.context)) blockers.push("Claim outside its Acre Era context");
    if (!/^[a-z0-9_-]{3,64}$/.test(claim.id)) blockers.push("Invalid fictional claim ID");
    const evidence = (claim.evidence ?? []).slice(0, 10);
    if (!evidence.length) blockers.push("No supporting evidence");
    if (evidence.some(item => item.sourceUrl && !validHttpsLink(item.sourceUrl))) blockers.push("Unusable or potentially unsafe source link");
    if (evidence.some(item => item.checkedAt && !validDate(item.checkedAt, nowMs))) blockers.push("Missing, invalid, stale or future timestamp");
    if (claim.type === "PAYMENT_SETTLEMENT" &&
      !evidence.some(item => item.kind === "PROVIDER_RECEIPT" && item.providerAuthenticated === true))
      blockers.push("No authenticated payment-provider receipt");
    if (claim.type === "PICKUP_DESIGNATION") blockers.push("IgniAqua official-place attestation not connected");
    if (claim.type === "FOOD_HANDLING" || claim.type === "ALLERGEN_DISCLOSURE")
      blockers.push("Regulatory and qualified handling review not connected");
    if (evidence.some(item => item.reviewerAttested || item.providerAuthenticated))
      blockers.push("Caller-provided verification flags do not establish trusted authority");
    if (!blockers.length) blockers.push("Independent source and authorization checks not connected");
    return { id: claim.id, type: claim.type, status: evidence.length ? "REPORTED" as const : "UNKNOWN" as const, blockers };
  });
  return { mode: "SYNTHETIC_ONLY", outcome: "REVIEW_REQUIRED", publishAuthorized: false, findings };
}
