export const PRODUCT_ROUTE_TYPES = [
  "ACRE_ERA_DIRECT",
  "AUTHORIZED_DISTRIBUTOR",
  "BRAND_DIRECT",
  "AFFILIATE_REFERRAL",
  "LOCAL_PARTNER",
  "AUTHENTICATED_RESALE",
  "QUALIFIED_SUPPLIER",
] as const;

export const ROUTE_CHECKOUT_OWNERS = ["ACRE_ERA", "PARTNER"] as const;

export type RouteForComparison = {
  id: number;
  currency: string;
  productCondition: string;
  totalCustomerPriceCents: number;
  deliveryMaxDays: number | null;
  authorizationState: string;
  provenanceState: string;
  lastVerifiedAt: Date | string | null;
  status: string;
};

function trustScore(route: RouteForComparison) {
  let score = 0;
  if (route.authorizationState !== "UNVERIFIED") score += 1;
  if (route.provenanceState !== "UNVERIFIED") score += 1;
  return score;
}

function deliveryScore(route: RouteForComparison) {
  return route.deliveryMaxDays ?? Number.POSITIVE_INFINITY;
}

export function isRouteFresh(
  route: Pick<RouteForComparison, "lastVerifiedAt">,
  now = new Date(),
  maxAgeMs = 24 * 60 * 60 * 1000
) {
  if (!route.lastVerifiedAt) return false;
  const observed = new Date(route.lastVerifiedAt);
  if (!Number.isFinite(observed.getTime())) return false;
  return now.getTime() - observed.getTime() <= maxAgeMs;
}

export function findDominantCustomerRoute(
  routes: RouteForComparison[],
  now = new Date()
) {
  const eligible = routes.filter(
    (route) => route.status === "ACTIVE" && isRouteFresh(route, now)
  );

  for (const candidate of eligible) {
    const peers = eligible.filter(
      (route) =>
        route.id !== candidate.id &&
        route.currency === candidate.currency &&
        route.productCondition === candidate.productCondition
    );

    if (peers.length === 0) continue;

    let strictlyBetter = false;
    const dominates = peers.every((peer) => {
      const priceNoWorse =
        candidate.totalCustomerPriceCents <= peer.totalCustomerPriceCents;
      const trustNoWorse = trustScore(candidate) >= trustScore(peer);
      const deliveryNoWorse = deliveryScore(candidate) <= deliveryScore(peer);

      if (
        candidate.totalCustomerPriceCents < peer.totalCustomerPriceCents ||
        trustScore(candidate) > trustScore(peer) ||
        deliveryScore(candidate) < deliveryScore(peer)
      ) {
        strictlyBetter = true;
      }

      return priceNoWorse && trustNoWorse && deliveryNoWorse;
    });

    if (dominates && strictlyBetter) return candidate.id;
  }

  return null;
}

export function commercialEligibility(
  route: {
    internalContributionCents: number | null;
    internalContributionMarginBps: number | null;
  },
  policy: {
    minContributionCents: number;
    minContributionMarginBps: number;
  }
) {
  if (
    route.internalContributionCents === null ||
    route.internalContributionMarginBps === null
  ) {
    return { eligible: false as const, code: "ROUTE_PRIVATE_ECONOMICS_UNKNOWN" };
  }

  if (route.internalContributionCents < policy.minContributionCents) {
    return { eligible: false as const, code: "ROUTE_CONTRIBUTION_DOLLARS_TOO_LOW" };
  }

  if (route.internalContributionMarginBps < policy.minContributionMarginBps) {
    return { eligible: false as const, code: "ROUTE_CONTRIBUTION_MARGIN_TOO_LOW" };
  }

  return { eligible: true as const };
}

export function safePartnerCheckoutUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export function toPublicRoute<T extends {
  internalContributionCents?: number | null;
  internalContributionMarginBps?: number | null;
}>(route: T) {
  const {
    internalContributionCents: _internalContributionCents,
    internalContributionMarginBps: _internalContributionMarginBps,
    ...publicRoute
  } = route;
  return publicRoute;
}
