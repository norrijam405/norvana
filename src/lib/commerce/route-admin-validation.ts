import {
  PRODUCT_ROUTE_TYPES,
  ROUTE_AUTHORIZATION_STATES,
  ROUTE_CHECKOUT_OWNERS,
  ROUTE_PROVENANCE_STATES,
  safePartnerCheckoutUrl,
} from "./route-engine";

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function integer(value: unknown, code: string, minimum = 0) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < minimum) throw new Error(code);
  return n;
}

export function parseRouteDraft(body: Record<string, unknown>) {
  const routeType = clean(body.routeType, 50);
  const checkoutOwner = clean(body.checkoutOwner, 30);
  const checkoutUrl = clean(body.checkoutUrl, 1500) || null;
  const itemPriceCents = integer(body.itemPriceCents, "ROUTE_ITEM_PRICE_INVALID");
  const shippingCents = integer(body.shippingCents ?? 0, "ROUTE_SHIPPING_INVALID");
  const estimatedTaxCents =
    body.estimatedTaxCents === null || body.estimatedTaxCents === undefined
      ? null
      : integer(body.estimatedTaxCents, "ROUTE_TAX_INVALID");
  const totalCustomerPriceCents = integer(
    body.totalCustomerPriceCents,
    "ROUTE_TOTAL_PRICE_INVALID"
  );
  const evidenceRef = clean(body.evidenceRef, 1500);

  if (!PRODUCT_ROUTE_TYPES.includes(routeType as (typeof PRODUCT_ROUTE_TYPES)[number])) {
    throw new Error("ROUTE_TYPE_INVALID");
  }
  if (
    !ROUTE_CHECKOUT_OWNERS.includes(
      checkoutOwner as (typeof ROUTE_CHECKOUT_OWNERS)[number]
    )
  ) {
    throw new Error("ROUTE_CHECKOUT_OWNER_INVALID");
  }
  if (!evidenceRef) throw new Error("ROUTE_EVIDENCE_REQUIRED");

  const knownSubtotal =
    itemPriceCents + shippingCents + (estimatedTaxCents ?? 0);
  if (totalCustomerPriceCents !== knownSubtotal) {
    throw new Error("ROUTE_TOTAL_PRICE_MISMATCH");
  }

  if (checkoutOwner === "PARTNER" && !safePartnerCheckoutUrl(checkoutUrl)) {
    throw new Error("ROUTE_PARTNER_CHECKOUT_URL_INVALID");
  }
  if (checkoutOwner === "ACRE_ERA" && checkoutUrl) {
    throw new Error("ROUTE_ACRE_ERA_CHECKOUT_URL_MUST_BE_INTERNAL");
  }

  const deliveryMinDays =
    body.deliveryMinDays === null || body.deliveryMinDays === undefined
      ? null
      : integer(body.deliveryMinDays, "ROUTE_DELIVERY_MIN_INVALID");
  const deliveryMaxDays =
    body.deliveryMaxDays === null || body.deliveryMaxDays === undefined
      ? null
      : integer(body.deliveryMaxDays, "ROUTE_DELIVERY_MAX_INVALID");

  if (
    deliveryMinDays !== null &&
    deliveryMaxDays !== null &&
    deliveryMinDays > deliveryMaxDays
  ) {
    throw new Error("ROUTE_DELIVERY_RANGE_INVALID");
  }

  const contribution =
    body.internalContributionCents === null ||
    body.internalContributionCents === undefined
      ? null
      : Number(body.internalContributionCents);
  const margin =
    body.internalContributionMarginBps === null ||
    body.internalContributionMarginBps === undefined
      ? null
      : Number(body.internalContributionMarginBps);

  if (contribution !== null && !Number.isInteger(contribution)) {
    throw new Error("ROUTE_CONTRIBUTION_INVALID");
  }
  if (margin !== null && !Number.isInteger(margin)) {
    throw new Error("ROUTE_MARGIN_INVALID");
  }

  const authorizationState = clean(body.authorizationState || "UNVERIFIED", 60);
  const provenanceState = clean(body.provenanceState || "UNVERIFIED", 60);

  if (
    !ROUTE_AUTHORIZATION_STATES.includes(
      authorizationState as (typeof ROUTE_AUTHORIZATION_STATES)[number]
    )
  ) {
    throw new Error("ROUTE_AUTHORIZATION_STATE_INVALID");
  }
  if (
    !ROUTE_PROVENANCE_STATES.includes(
      provenanceState as (typeof ROUTE_PROVENANCE_STATES)[number]
    )
  ) {
    throw new Error("ROUTE_PROVENANCE_STATE_INVALID");
  }

  return {
    routeType,
    providerSlug: clean(body.providerSlug, 120) || null,
    sellerName: clean(body.sellerName, 255),
    checkoutOwner,
    checkoutUrl,
    currency: clean(body.currency || "USD", 10).toUpperCase(),
    productCondition: clean(body.productCondition || "NEW", 40).toUpperCase(),
    itemPriceCents,
    shippingCents,
    estimatedTaxCents,
    totalCustomerPriceCents,
    deliveryMinDays,
    deliveryMaxDays,
    warrantySummary: clean(body.warrantySummary, 3000),
    returnSummary: clean(body.returnSummary, 3000),
    authorizationState,
    provenanceState,
    evidenceRef,
    lastVerifiedAt: body.lastVerifiedAt ? new Date(String(body.lastVerifiedAt)) : null,
    internalContributionCents: contribution,
    internalContributionMarginBps: margin,
  };
}
