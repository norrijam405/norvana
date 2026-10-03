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

export const WATCHTOWER_INTELLIGENCE_R2_JOB_TEMPLATES: WatchtowerJobTemplate[] = [
  {
    slug: "consumer-electronics-devices-watch",
    name: "Consumer Electronics & Devices Watch",
    category: "electronics",
    description: "Find authorized electronics/device opportunities with usable distribution, pricing, stock, freight, warranty, and return evidence.",
    instructions:
      "Research legitimate electronics and device opportunities from brand-direct and authorized-distribution channels. Capture brand, MPN/UPC/GTIN, condition, wholesale or referral economics, live stock, warehouse, freight, warranty, return terms, channel restrictions, recall/safety state, and competitor price range. Prefer official manufacturer/distributor evidence. Never treat consumer retail purchasing as resale authorization. Recommendations never order or publish automatically.",
    authority: "RECOMMEND",
    cadenceMinutes: 1440,
    budgetCents: 0,
    sourcePolicy: {
      preferOfficialSources: true,
      requireChannelAuthorization: true,
      requireProductIdentity: true,
      requireContributionEconomics: true,
      noAutoOrder: true,
      noAutoPublish: true,
    },
  },
  {
    slug: "brand-fashion-wholesale-watch",
    name: "Brand Fashion Wholesale Watch",
    category: "fashion",
    description: "Find legitimate brand and wholesale fashion relationships suitable for Acre Era.",
    instructions:
      "Research brand-direct and wholesale fashion opportunities through approved B2B channels. Capture retailer eligibility, brand approval state, season, size/color assortment, MOQ, wholesale cost, suggested retail, returns/cancellations, available media rights, delivery windows, reorder availability, and contribution economics. Wholesale access is not brand authorization unless the evidence says so. Never auto-contact, order, or publish.",
    authority: "RECOMMEND",
    cadenceMinutes: 10080,
    budgetCents: 0,
    sourcePolicy: {
      requireBrandRelationshipEvidence: true,
      requireImageRightsEvidence: true,
      requireContributionEconomics: true,
      noAutoContact: true,
      noAutoOrder: true,
      noAutoPublish: true,
    },
  },
  {
    slug: "luxury-authenticity-watch",
    name: "Luxury & Authenticity Watch",
    category: "luxury",
    description: "Qualify luxury sourcing and authentication evidence without weakening provenance standards.",
    instructions:
      "Research luxury wholesale, dropship, authenticated resale, and referral opportunities. Capture source chain, invoice/reseller evidence, direct brand authorization if any, authentication provider support, condition, identifiers, packaging, return risk, fraud reserve, authentication cost, image/logo rights, fulfillment, and contribution economics. Treat supplier authenticity claims as claims until independently evidenced. Reject counterfeit, replica, stolen, unverifiable, or materially gray provenance.",
    authority: "RECOMMEND",
    cadenceMinutes: 10080,
    budgetCents: 0,
    sourcePolicy: {
      requireProvenance: true,
      requireAuthenticityEvidence: true,
      requireImageRightsEvidence: true,
      requireFraudReserve: true,
      rejectCounterfeitRisk: true,
      noAutoOrder: true,
      noAutoPublish: true,
    },
  },
  {
    slug: "affiliate-commerce-watch",
    name: "Affiliate Commerce Watch",
    category: "affiliate",
    description: "Find approved referral programs, product feeds, creative rights, and commission economics.",
    instructions:
      "Research brand and retailer affiliate programs suitable for Acre Era. Capture approval requirements, allowed channels, product-feed availability, permitted image/creative use, deep-link rules, disclosure requirements, commission basis, exclusions, cookie window, returns/cancellation treatment, payout timing, geographic limits, and official checkout hosts. Do not scrape or reuse product imagery without program rights. Referral recommendations must keep checkout with the partner and disclose Acre Era's commission relationship.",
    authority: "RECOMMEND",
    cadenceMinutes: 1440,
    budgetCents: 0,
    sourcePolicy: {
      preferOfficialProgramTerms: true,
      requireImageRightsEvidence: true,
      requireCheckoutHostAllowlist: true,
      requireCommissionEconomics: true,
      noAutoEnrollment: true,
      noAutoPublish: true,
    },
  },
  {
    slug: "product-economics-watch",
    name: "Product Economics Watch",
    category: "economics",
    description: "Calculate true contribution economics before products earn catalog approval.",
    instructions:
      "For candidate products, calculate contribution using retail or affiliate revenue minus product cost, inbound freight, outbound shipping, payment/platform fees, expected returns, fraud/warranty reserves, authentication cost, and customer acquisition cost. Record missing inputs explicitly. Flag attractive headline margins that collapse after landed and risk-adjusted costs. Never alter live prices automatically.",
    authority: "RECOMMEND",
    cadenceMinutes: 1440,
    budgetCents: 0,
    sourcePolicy: {
      requireCostCompleteness: true,
      preserveUnknowns: true,
      noAutoPriceChange: true,
    },
  },
  {
    slug: "product-safety-recall-watch",
    name: "Product Safety & Recall Watch",
    category: "risk",
    description: "Track recall and safety evidence relevant to proposed or active product categories.",
    instructions:
      "Monitor authoritative recall and product-safety sources for identifiers matching candidate or catalog products. Preserve exact source, identifier, date, affected model/lot scope, and current status. A possible fuzzy match must be flagged for review rather than silently treated as a confirmed recall. Never remove or publish products automatically from this watcher.",
    authority: "OBSERVE",
    cadenceMinutes: 1440,
    budgetCents: 0,
    sourcePolicy: {
      preferGovernmentAndManufacturerSources: true,
      requireExactIdentifierWhenAvailable: true,
      noAutoCatalogMutation: true,
    },
  },
  {
    slug: "brand-authorization-watch",
    name: "Brand Authorization Watch",
    category: "trust",
    description: "Track whether Acre Era has the right relationship to sell, refer, or display each brand.",
    instructions:
      "Track brand-direct authorization, distributor authorization, affiliate approval, reseller certificates, marketplace restrictions, trademark/logo permissions, product-image rights, and expiration or revocation dates. Keep SELL, REFER, DISPLAY_IMAGE, and USE_LOGO permissions separate. Never infer brand authorization merely from possession of inventory or a wholesaler account.",
    authority: "OBSERVE",
    cadenceMinutes: 10080,
    budgetCents: 0,
    sourcePolicy: {
      requireDocumentedAuthority: true,
      separateSellReferImageLogoRights: true,
      noAutoCatalogMutation: true,
    },
  },
];

export const WATCHTOWER_ALL_JOB_TEMPLATES: WatchtowerJobTemplate[] = [
  ...WATCHTOWER_JOB_TEMPLATES,
  ...WATCHTOWER_INTELLIGENCE_R2_JOB_TEMPLATES,
];
