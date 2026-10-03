export type CommerceModel =
  | "DIRECT_RETAIL"
  | "AUTHORIZED_DISTRIBUTOR"
  | "BRAND_DIRECT"
  | "AFFILIATE_REFERRAL"
  | "WHOLESALE_FASHION"
  | "LUXURY_DROPSHIP"
  | "LIQUIDATION_RESALE"
  | "AUTHENTICATION_SERVICE"
  | "LOCAL_PARTNER"
  | "POD"
  | "QUALIFIED_SUPPLIER";

export type ProviderState =
  | "APPLICATION_REQUIRED"
  | "BUYER_ACCOUNT_AVAILABLE"
  | "ACCOUNT_REQUIRED"
  | "PAID_ACCESS_REQUIRED"
  | "BUSINESS_VERIFICATION_REQUIRED"
  | "PREREQUISITE_REQUIRED"
  | "QUALIFICATION_REQUIRED"
  | "CONNECTED_READ_ONLY"
  | "HOLD";

export type ProviderRegistryEntry = {
  slug: string;
  name: string;
  lane: "electronics" | "fashion" | "luxury" | "affiliate" | "liquidation" | "authentication";
  models: CommerceModel[];
  state: ProviderState;
  officialUrl: string;
  capabilities: string[];
  prerequisites: string[];
  notes: string[];
  checkoutHosts?: string[];
};

export const AUTHORIZED_COMMERCE_PROVIDERS: ProviderRegistryEntry[] = [
  {
    slug: "nike-authorized-retailer",
    name: "Nike — Authorized Retailer",
    lane: "fashion",
    models: ["BRAND_DIRECT"],
    state: "APPLICATION_REQUIRED",
    officialUrl: "https://www.nike.com/help/a/new-account.",
    capabilities: ["authorized-retail relationship", "online retail if approved"],
    prerequisites: ["valid business license", "Nike approval"],
    notes: [
      "Nike states that online retailers use the same authorized-retailer application process.",
      "Do not represent Acre Era as Nike-authorized until approval is documented.",
    ],
    checkoutHosts: ["nike.com"],
  },
  {
    slug: "nike-affiliate",
    name: "Nike — Affiliate",
    lane: "affiliate",
    models: ["AFFILIATE_REFERRAL"],
    state: "APPLICATION_REQUIRED",
    officialUrl: "https://www.nike.com/help/a/nike-affiliate-program",
    capabilities: ["affiliate referral", "approved creative/feed use subject to program terms"],
    prerequisites: ["affiliate approval", "program terms accepted"],
    notes: [
      "Checkout remains with Nike.",
      "Acre Era must disclose the referral relationship and only use imagery/creative authorized by the program.",
    ],
    checkoutHosts: ["nike.com"],
  },
  {
    slug: "apple-partner-network",
    name: "Apple Partner Network",
    lane: "electronics",
    models: ["BRAND_DIRECT", "AUTHORIZED_DISTRIBUTOR"],
    state: "PREREQUISITE_REQUIRED",
    officialUrl: "https://partnernetwork.apple.com/us/",
    capabilities: ["Apple reseller/partner ecosystem"],
    prerequisites: ["qualifying partner or distributor relationship"],
    notes: [
      "Do not treat ordinary Apple consumer-store purchases as resale authorization.",
      "Apple device sourcing remains a separate authorization lane.",
    ],
    checkoutHosts: ["apple.com"],
  },
  {
    slug: "ingram-micro",
    name: "Ingram Micro",
    lane: "electronics",
    models: ["AUTHORIZED_DISTRIBUTOR"],
    state: "PREREQUISITE_REQUIRED",
    officialUrl: "https://developer.ingrammicro.com/reseller",
    capabilities: [
      "catalog",
      "price and availability",
      "warehouse stock",
      "freight estimate",
      "orders",
      "returns",
      "invoices",
    ],
    prerequisites: ["active Ingram Micro reseller account", "API application approval"],
    notes: ["Keep order endpoints disabled until a separate ACT-authorized lane exists."],
  },
  {
    slug: "td-synnex",
    name: "TD SYNNEX",
    lane: "electronics",
    models: ["AUTHORIZED_DISTRIBUTOR"],
    state: "APPLICATION_REQUIRED",
    officialUrl: "https://www.tdsynnex.com/na/us/consumer/",
    capabilities: [
      "consumer electronics distribution",
      "online-retailer support",
      "catalog and order automation",
      "bundling and logistics",
    ],
    prerequisites: ["reseller/customer approval", "API credentials where applicable"],
    notes: ["Use only the retail/ecommerce-compatible program approved for Acre Era."],
  },
  {
    slug: "petra",
    name: "Petra Industries",
    lane: "electronics",
    models: ["AUTHORIZED_DISTRIBUTOR"],
    state: "APPLICATION_REQUIRED",
    officialUrl: "https://www.petra.com/",
    capabilities: ["consumer electronics catalog", "virtual warehousing", "fulfillment options"],
    prerequisites: ["reseller customer approval"],
    notes: ["Treat brand availability and channel rights as product-specific evidence."],
  },
  {
    slug: "joor",
    name: "JOOR",
    lane: "fashion",
    models: ["WHOLESALE_FASHION"],
    state: "BUYER_ACCOUNT_AVAILABLE",
    officialUrl: "https://www.joor.com/retailers",
    capabilities: ["brand discovery", "wholesale buying", "assortment planning", "orders"],
    prerequisites: ["retailer/buyer account", "brand connection approval where required"],
    notes: ["Brand acceptance controls whether Acre Era may actually buy a label."],
  },
  {
    slug: "nuorder",
    name: "NuORDER by Lightspeed",
    lane: "fashion",
    models: ["WHOLESALE_FASHION"],
    state: "APPLICATION_REQUIRED",
    officialUrl: "https://www.nuorder.com/start/buy/",
    capabilities: ["wholesale brand discovery", "live inventory", "ordering", "media library"],
    prerequisites: ["retailer marketplace approval"],
    notes: ["Do not import brand media unless access and usage rights are documented."],
  },
  {
    slug: "le-new-black",
    name: "LE NEW BLACK",
    lane: "fashion",
    models: ["WHOLESALE_FASHION"],
    state: "APPLICATION_REQUIRED",
    officialUrl: "https://www.lenewblack.com/en/register/retailer/",
    capabilities: ["fashion wholesale showrooms", "brand discovery", "orders"],
    prerequisites: ["retailer access approval"],
    notes: ["Wholesale access is not equivalent to permission to use every brand logo in marketing."],
  },
  {
    slug: "brandsgateway",
    name: "BrandsGateway",
    lane: "luxury",
    models: ["LUXURY_DROPSHIP"],
    state: "PAID_ACCESS_REQUIRED",
    officialUrl: "https://brandsgateway.com/dropshipping/",
    capabilities: ["luxury catalog", "stock sync", "custom-store REST API", "dropship fulfillment"],
    prerequisites: ["paid dropshipping plan for live selling", "API credentials for custom integration"],
    notes: [
      "Provider authenticity/reseller claims must be independently preserved as evidence.",
      "Provider warns that reseller certificates are not direct brand-authorization letters.",
    ],
  },
  {
    slug: "brandsdistribution",
    name: "Brandsdistribution",
    lane: "luxury",
    models: ["LUXURY_DROPSHIP"],
    state: "PAID_ACCESS_REQUIRED",
    officialUrl: "https://www.brandsdistribution.com/en/cms/developers",
    capabilities: ["catalog", "availability updates", "API", "dropship order workflows"],
    prerequisites: ["dropshipping subscription"],
    notes: ["Keep order-booking API methods locked during qualification."],
  },
  {
    slug: "entrupy",
    name: "Entrupy",
    lane: "authentication",
    models: ["AUTHENTICATION_SERVICE"],
    state: "ACCOUNT_REQUIRED",
    officialUrl: "https://developer.entrupy.com/",
    capabilities: ["luxury authentication", "sneaker/apparel authentication", "certificates", "API/SDK"],
    prerequisites: ["Entrupy partner account/API access"],
    notes: ["Authentication results are evidence inputs, not blanket guarantees for unrelated inventory."],
  },
  {
    slug: "legitapp",
    name: "LegitApp Authentication",
    lane: "authentication",
    models: ["AUTHENTICATION_SERVICE"],
    state: "BUSINESS_VERIFICATION_REQUIRED",
    officialUrl: "https://dev.legitapp.com/products/api-authentication",
    capabilities: ["enterprise authentication API", "sandbox", "webhook results"],
    prerequisites: ["business verification", "commercial API eligibility"],
    notes: ["Keep authentication cost in per-item contribution-margin calculations."],
  },
  {
    slug: "bstock",
    name: "B-Stock",
    lane: "liquidation",
    models: ["LIQUIDATION_RESALE"],
    state: "APPLICATION_REQUIRED",
    officialUrl: "https://bstock.com/",
    capabilities: ["returns", "excess inventory", "trade-in inventory", "mobile devices", "apparel"],
    prerequisites: ["buyer registration", "lot-specific resale economics"],
    notes: [
      "Condition and manifest quality must remain explicit.",
      "Calculate sellable-yield-adjusted cost rather than dividing lot cost by headline unit count.",
    ],
  },
  {
    slug: "farfetch-affiliate",
    name: "FARFETCH — Affiliate",
    lane: "affiliate",
    models: ["AFFILIATE_REFERRAL"],
    state: "APPLICATION_REQUIRED",
    officialUrl: "https://www.farfetch.com/dk/pag1987.aspx",
    capabilities: ["affiliate referral", "daily product feeds", "luxury discovery"],
    prerequisites: ["affiliate approval"],
    notes: [
      "Checkout remains with FARFETCH.",
      "Product-feed images and links may only be used within the affiliate-program rights granted to Acre Era.",
    ],
    checkoutHosts: ["farfetch.com"],
  },
];

export function providerBySlug(slug: string) {
  return AUTHORIZED_COMMERCE_PROVIDERS.find((provider) => provider.slug === slug) ?? null;
}
