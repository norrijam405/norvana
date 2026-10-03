import {
  PUBLIC_MEDIA_RIGHTS,
  isSafePublicMediaUrl,
} from "@/lib/era-engine/policy";
import {
  commercialEligibility,
  isRouteFresh,
  safePartnerCheckoutUrl,
} from "@/lib/commerce/route-engine";
import { evaluateAffiliateDestination } from "@/lib/commerce/affiliate-policy";

export function evaluateMediaApprovalReadiness(input: {
  assetType: string;
  mediaUrl: string;
  posterUrl?: string | null;
  rightsState: string;
  rightsEvidenceRef?: string | null;
  rightsStartsAt?: Date | string | null;
  rightsEndsAt?: Date | string | null;
  altText?: string | null;
}, now = new Date()) {
  const blockers: string[] = [];

  if (!PUBLIC_MEDIA_RIGHTS.has(input.rightsState)) {
    blockers.push("MEDIA_PUBLIC_RIGHTS_NOT_PROVEN");
  }
  if (!input.rightsEvidenceRef?.trim()) blockers.push("MEDIA_RIGHTS_EVIDENCE_MISSING");
  if (!isSafePublicMediaUrl(input.mediaUrl)) blockers.push("MEDIA_URL_INVALID");
  if (input.posterUrl && !isSafePublicMediaUrl(input.posterUrl)) {
    blockers.push("MEDIA_POSTER_URL_INVALID");
  }

  const starts = input.rightsStartsAt ? new Date(input.rightsStartsAt) : null;
  const ends = input.rightsEndsAt ? new Date(input.rightsEndsAt) : null;
  if (starts && Number.isFinite(starts.getTime()) && now < starts) {
    blockers.push("MEDIA_RIGHTS_NOT_STARTED");
  }
  if (ends && Number.isFinite(ends.getTime()) && now >= ends) {
    blockers.push("MEDIA_RIGHTS_EXPIRED");
  }

  if (
    ["HERO_VIDEO", "HERO_IMAGE", "CARD_IMAGE", "EDITORIAL_VIDEO"].includes(
      input.assetType
    ) &&
    !input.altText?.trim()
  ) {
    blockers.push("MEDIA_ACCESSIBILITY_TEXT_MISSING");
  }

  return { ready: blockers.length === 0, blockers };
}

export function routeActivationThresholdsFromEnv() {
  const contribution = process.env.NORVANA_ROUTE_MIN_CONTRIBUTION_CENTS;
  const margin = process.env.NORVANA_ROUTE_MIN_MARGIN_BPS;

  if (contribution === undefined || margin === undefined) {
    return {
      ok: false as const,
      code: "ROUTE_ACTIVATION_POLICY_NOT_CONFIGURED",
    };
  }

  const minContributionCents = Number(contribution);
  const minContributionMarginBps = Number(margin);

  if (
    !Number.isInteger(minContributionCents) ||
    !Number.isInteger(minContributionMarginBps)
  ) {
    return {
      ok: false as const,
      code: "ROUTE_ACTIVATION_POLICY_INVALID",
    };
  }

  return {
    ok: true as const,
    policy: { minContributionCents, minContributionMarginBps },
  };
}

export function evaluateRouteActivationReadiness(
  route: {
    status: string;
    routeType: string;
    providerSlug: string | null;
    checkoutOwner: string;
    checkoutUrl: string | null;
    sellerName: string;
    authorizationState: string;
    provenanceState: string;
    evidenceRef: string | null;
    lastVerifiedAt: Date | string | null;
    internalContributionCents: number | null;
    internalContributionMarginBps: number | null;
  },
  policy: { minContributionCents: number; minContributionMarginBps: number },
  now = new Date()
) {
  const blockers: string[] = [];

  if (route.status !== "QUALIFYING") blockers.push("ROUTE_NOT_QUALIFYING");
  if (!route.sellerName.trim()) blockers.push("ROUTE_SELLER_MISSING");
  if (!route.evidenceRef?.trim()) blockers.push("ROUTE_EVIDENCE_MISSING");
  if (!isRouteFresh(route, now)) blockers.push("ROUTE_VERIFICATION_STALE");

  if (route.authorizationState === "UNVERIFIED") {
    blockers.push("ROUTE_AUTHORIZATION_UNVERIFIED");
  }
  if (route.provenanceState === "UNVERIFIED") {
    blockers.push("ROUTE_PROVENANCE_UNVERIFIED");
  }

  if (route.checkoutOwner === "PARTNER" && !safePartnerCheckoutUrl(route.checkoutUrl)) {
    blockers.push("ROUTE_PARTNER_DESTINATION_INVALID");
  }
  if (route.checkoutOwner === "ACRE_ERA" && route.checkoutUrl) {
    blockers.push("ROUTE_INTERNAL_CHECKOUT_HAS_EXTERNAL_URL");
  }

  if (route.routeType === "AFFILIATE_REFERRAL") {
    const affiliate = evaluateAffiliateDestination({
      providerSlug: route.providerSlug,
      destinationUrl: route.checkoutUrl,
    });
    if (!affiliate.ok) blockers.push(affiliate.code);
  }

  const economics = commercialEligibility(route, policy);
  if (!economics.eligible) blockers.push(economics.code);

  return { ready: blockers.length === 0, blockers };
}
