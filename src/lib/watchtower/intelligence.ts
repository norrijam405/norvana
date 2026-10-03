export type OpportunityEconomicsInput = {
  salePriceCents: number;
  productCostCents?: number | null;
  inboundFreightCents?: number | null;
  outboundShippingCents?: number | null;
  paymentFeeCents?: number | null;
  marketplaceFeeCents?: number | null;
  affiliateCommissionCents?: number | null;
  returnReserveCents?: number | null;
  fraudReserveCents?: number | null;
  warrantyReserveCents?: number | null;
  authenticationCostCents?: number | null;
  customerAcquisitionCostCents?: number | null;
};

const n = (value: number | null | undefined) =>
  Number.isFinite(value) ? Math.max(0, Math.round(value as number)) : 0;

export function calculateContributionEconomics(input: OpportunityEconomicsInput) {
  const revenue = n(input.salePriceCents);
  const affiliateRevenue = n(input.affiliateCommissionCents);

  // Affiliate-referral opportunities generally have commission revenue and no inventory cost.
  const grossRevenue = affiliateRevenue > 0 ? affiliateRevenue : revenue;

  const costs = {
    productCostCents: n(input.productCostCents),
    inboundFreightCents: n(input.inboundFreightCents),
    outboundShippingCents: n(input.outboundShippingCents),
    paymentFeeCents: n(input.paymentFeeCents),
    marketplaceFeeCents: n(input.marketplaceFeeCents),
    returnReserveCents: n(input.returnReserveCents),
    fraudReserveCents: n(input.fraudReserveCents),
    warrantyReserveCents: n(input.warrantyReserveCents),
    authenticationCostCents: n(input.authenticationCostCents),
    customerAcquisitionCostCents: n(input.customerAcquisitionCostCents),
  };

  const totalCostCents = Object.values(costs).reduce((sum, value) => sum + value, 0);
  const contributionCents = grossRevenue - totalCostCents;
  const contributionMarginBps =
    grossRevenue > 0 ? Math.round((contributionCents / grossRevenue) * 10_000) : null;

  return {
    revenueBasis: affiliateRevenue > 0 ? "AFFILIATE_COMMISSION" : "RETAIL_SALE",
    grossRevenueCents: grossRevenue,
    totalCostCents,
    contributionCents,
    contributionMarginBps,
    costs,
  };
}

export type WatchtowerIntelligenceFacet = {
  status: "UNKNOWN" | "OBSERVED" | "VERIFIED" | "CONFLICT" | "STALE";
  observedAt?: string | null;
  source?: string | null;
  value?: unknown;
  evidenceRef?: string | null;
};

export type WatchtowerOpportunitySnapshot = {
  identity: {
    brand?: string | null;
    title: string;
    gtin?: string | null;
    upc?: string | null;
    mpn?: string | null;
    sku?: string | null;
    condition?: string | null;
    sourceModel?: string | null;
  };
  pricing: {
    retailPrice?: WatchtowerIntelligenceFacet;
    sourceCost?: WatchtowerIntelligenceFacet;
    competitorPrices?: WatchtowerIntelligenceFacet;
    historicalPrice?: WatchtowerIntelligenceFacet;
  };
  supply: {
    stock?: WatchtowerIntelligenceFacet;
    shipping?: WatchtowerIntelligenceFacet;
    warehouse?: WatchtowerIntelligenceFacet;
    leadTime?: WatchtowerIntelligenceFacet;
    returnPolicy?: WatchtowerIntelligenceFacet;
  };
  trust: {
    authorization?: WatchtowerIntelligenceFacet;
    provenance?: WatchtowerIntelligenceFacet;
    authenticity?: WatchtowerIntelligenceFacet;
    imageRights?: WatchtowerIntelligenceFacet;
    warranty?: WatchtowerIntelligenceFacet;
    recallSafety?: WatchtowerIntelligenceFacet;
  };
  demand: {
    internalRequests?: WatchtowerIntelligenceFacet;
    customerVoice?: WatchtowerIntelligenceFacet;
    searchTrend?: WatchtowerIntelligenceFacet;
    sellThrough?: WatchtowerIntelligenceFacet;
    competitionDensity?: WatchtowerIntelligenceFacet;
  };
  economics: ReturnType<typeof calculateContributionEconomics> | Record<string, never>;
  riskFlags: string[];
  evidenceRefs: Array<{
    type: string;
    source: string;
    url?: string;
    observedAt?: string;
    digest?: string;
  }>;
};

export function intelligenceCompleteness(snapshot: WatchtowerOpportunitySnapshot) {
  const critical = [
    snapshot.pricing.retailPrice,
    snapshot.trust.provenance,
    snapshot.trust.authorization,
    snapshot.trust.imageRights,
    snapshot.supply.stock,
    snapshot.supply.shipping,
  ];
  const known = critical.filter(
    (facet) => facet && facet.status !== "UNKNOWN" && facet.status !== "STALE"
  ).length;

  return {
    criticalKnown: known,
    criticalTotal: critical.length,
    pct: Math.round((known / critical.length) * 100),
  };
}
