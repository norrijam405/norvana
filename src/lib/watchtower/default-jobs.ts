export type WatchtowerAuthority = "OBSERVE" | "RECOMMEND" | "ACT";

export type WatchtowerJobTemplate = {
  slug: string;
  name: string;
  category: string;
  description: string;
  instructions: string;
  authority: WatchtowerAuthority;
  cadenceMinutes: number;
  budgetCents: number;
  sourcePolicy: Record<string, unknown>;
};

export const WATCHTOWER_JOB_TEMPLATES: WatchtowerJobTemplate[] = [
  {
    slug: "free-supplier-watch",
    name: "Free Supplier Watch",
    category: "sourcing",
    description: "Find $0/month, pay-per-order, and low-fixed-cost supplier/fulfillment options.",
    instructions:
      "Find genuine free-to-sign-up or usable $0/month suppliers and fulfillment partners. Verify product cost, shipping, fees, MOQ, returns, integration options, and whether the free tier is actually usable for fulfillment. Prefer supplier-direct fulfillment and no prepaid inventory. Save only material candidates.",
    authority: "RECOMMEND",
    cadenceMinutes: 1440,
    budgetCents: 0,
    sourcePolicy: {
      preferOfficialSources: true,
      rejectTrialsPresentedAsFree: true,
      requireCostBreakdown: true,
    },
  },
  {
    slug: "global-resale-sourcing-watch",
    name: "Global & Resale Sourcing Watch",
    category: "sourcing",
    description: "Find lawful overseas, liquidation, overstock, thrift, auction, and branded resale opportunities.",
    instructions:
      "Research legal, authentic, profitable sourcing opportunities. For brand-name products require meaningful provenance/authenticity evidence and flag gray-market/import risks. Never recommend counterfeit, replica, stolen, or materially unverifiable branded goods. Calculate expected landed contribution, not headline purchase price.",
    authority: "RECOMMEND",
    cadenceMinutes: 1440,
    budgetCents: 0,
    sourcePolicy: {
      requireBrandProvenance: true,
      rejectCounterfeitRisk: true,
      requireLandedEconomics: true,
    },
  },
  {
    slug: "local-producer-watch",
    name: "Local Producer Watch",
    category: "local",
    description: "Discover farms, producers, and local makers for Norvana Local.",
    instructions:
      "Find local producers suitable for Norvana Local. Discovery is not approval. Gather producer identity, product categories, service area, pickup/delivery options, seasonality, contact path, and evidence needed for qualification.",
    authority: "OBSERVE",
    cadenceMinutes: 10080,
    budgetCents: 0,
    sourcePolicy: {
      discoveryOnly: true,
      noAutoOnboarding: true,
    },
  },
  {
    slug: "operating-cost-watch",
    name: "Closest-to-$0 Operations Watch",
    category: "operations",
    description: "Continuously look for legitimate ways to lower Norvana's fixed and variable operating cost.",
    instructions:
      "Compare hosting, databases, email, analytics, storage, model usage, supplier subscriptions, fulfillment, and other operating services. Prefer free/low-cost options only when reliability, security, and total cost remain acceptable. Recommend paid services when evidence shows they save more or materially reduce risk.",
    authority: "RECOMMEND",
    cadenceMinutes: 10080,
    budgetCents: 0,
    sourcePolicy: {
      optimizeTotalCost: true,
      preserveReliability: true,
      preserveSecurity: true,
    },
  },
  {
    slug: "drop-opportunity-watch",
    name: "Drop Opportunity Watch",
    category: "merchandising",
    description: "Research candidate themes and products for future rotating Norvana Drops.",
    instructions:
      "Identify evidence-backed product themes and candidate items for future Norvana Drops. Compare demand signal, landed cost, fulfillment reliability, margin, competition density, quality evidence, and fit with Norvana's brand. Recommendations never publish automatically.",
    authority: "RECOMMEND",
    cadenceMinutes: 10080,
    budgetCents: 0,
    sourcePolicy: {
      noAutoPublish: true,
      requireMarginEstimate: true,
    },
  },
];
