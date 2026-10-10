export type SupplierAccessKind =
  | "DIRECT_API"
  | "APPROVAL_API"
  | "PLATFORM_ACCOUNT"
  | "MANUAL_OR_PARTNER";

export type SupplierAccessEntry = {
  slug: string;
  name: string;
  purpose: string;
  website: string;
  setupUrl?: string;
  accessKind: SupplierAccessKind;
  costSignal: "FREE_API" | "FREE_BROWSE" | "PAID_OR_APPROVAL" | "UNKNOWN";
  credentialLabel: string;
  whatYouNeed: string[];
  recommendation: "DO_NOW" | "DO_LATER" | "RESEARCH_ONLY";
  note: string;
};

export const SUPPLIER_ACCESS_BOARD: SupplierAccessEntry[] = [
  {
    slug: "cj-dropshipping",
    name: "CJ Dropshipping",
    purpose: "Broad dropshipping catalog, product data, freight quotes, orders, warehousing, and tracking.",
    website: "https://www.cjdropshipping.com/",
    setupUrl: "https://developers.cjdropshipping.com/en/summary/course.html",
    accessKind: "DIRECT_API",
    costSignal: "FREE_API",
    credentialLabel: "CJ API key / access token",
    whatYouNeed: [
      "Create or use a CJ account",
      "Open My CJ → Authorization → API",
      "Generate the API key",
      "Keep order/payment actions locked until test orders pass",
    ],
    recommendation: "DO_NOW",
    note: "CJ documents its developer API as free and exposes product, logistics, warehouse, order, payment, webhook, and shop interfaces.",
  },
  {
    slug: "printful",
    name: "Printful",
    purpose: "Print-on-demand apparel, accessories, home goods, custom products, and automated fulfillment.",
    website: "https://www.printful.com/",
    setupUrl: "https://developers.printful.com/docs/",
    accessKind: "DIRECT_API",
    costSignal: "FREE_API",
    credentialLabel: "Private API token",
    whatYouNeed: [
      "Create a Printful account/store",
      "Open the Printful Developer Portal",
      "Create a private token for our own store",
      "Start with read/order test scopes before live fulfillment",
    ],
    recommendation: "DO_NOW",
    note: "Private tokens are the documented path for a single merchant account. Scope only what Watchtower actually needs.",
  },
  {
    slug: "shopify-partner-store",
    name: "Shopify supplier stores",
    purpose: "Connect directly to a brand/supplier that runs Shopify when they authorize Acre Era access.",
    website: "https://www.shopify.com/",
    setupUrl: "https://shopify.dev/docs/apps/build/authentication-authorization",
    accessKind: "APPROVAL_API",
    costSignal: "UNKNOWN",
    credentialLabel: "Installed app access token",
    whatYouNeed: [
      "Supplier/store owner agrees to connect",
      "Create the app in Shopify Dev Dashboard/CLI",
      "Request only required GraphQL Admin scopes",
      "Supplier authorizes installation",
    ],
    recommendation: "DO_LATER",
    note: "This is not one universal Shopify catalog key. Access belongs to each merchant store and should be scoped per supplier.",
  },
  {
    slug: "faire",
    name: "Faire",
    purpose: "Wholesale discovery and buying from independent brands.",
    website: "https://www.faire.com/",
    setupUrl: "https://developers.faire.com/",
    accessKind: "PLATFORM_ACCOUNT",
    costSignal: "FREE_BROWSE",
    credentialLabel: "Retailer account; API not available for retailer use",
    whatYouNeed: [
      "Create a Faire retailer/business buyer account",
      "Use Faire manually for sourcing/wholesale discovery",
      "Do not wait on a retailer API that Faire does not currently offer",
    ],
    recommendation: "DO_NOW",
    note: "Faire states its developer API supports brands, not retailer-focused integrations. Treat this as a sourcing account, not a direct Acre Era catalog API.",
  },
  {
    slug: "syncee",
    name: "Syncee",
    purpose: "Supplier discovery across dropshipping and wholesale catalogs.",
    website: "https://www.syncee.com/",
    setupUrl: "https://www.syncee.com/pricing",
    accessKind: "PLATFORM_ACCOUNT",
    costSignal: "FREE_BROWSE",
    credentialLabel: "Retailer account / supported-store integration",
    whatYouNeed: [
      "Create a Syncee retailer account",
      "Use the free tier to browse suppliers/products",
      "Treat import automation as optional because Acre Era is a custom-built store",
    ],
    recommendation: "RESEARCH_ONLY",
    note: "Syncee offers free product exploration, but its standard retailer integrations target supported commerce platforms rather than custom-built stores.",
  },
  {
    slug: "autods",
    name: "AutoDS",
    purpose: "Product sourcing, price/stock monitoring, product import, and automated fulfillment across many suppliers.",
    website: "https://www.autods.com/",
    setupUrl: "https://www.autods.com/api/",
    accessKind: "APPROVAL_API",
    costSignal: "PAID_OR_APPROVAL",
    credentialLabel: "Approved AutoDS API access",
    whatYouNeed: [
      "Create an AutoDS account",
      "Apply for API access with our use case",
      "Review activation fee and subscription before paying",
      "Do not pay until the API economics beat direct supplier connections",
    ],
    recommendation: "DO_LATER",
    note: "Useful capability, but current AutoDS API access requires qualification plus paid activation/subscription. Not a $0-first integration.",
  },
  {
    slug: "salehoo",
    name: "SaleHoo",
    purpose: "Supplier directory and wholesale/dropshipping research.",
    website: "https://www.salehoo.com/",
    setupUrl: "https://www.salehoo.com/api",
    accessKind: "APPROVAL_API",
    costSignal: "PAID_OR_APPROVAL",
    credentialLabel: "Approved SaleHoo developer/API access",
    whatYouNeed: [
      "Create/register a SaleHoo developer profile",
      "Submit API access request",
      "Wait for approval before planning an integration",
    ],
    recommendation: "DO_LATER",
    note: "SaleHoo exposes a developer/API program, but access requires approval.",
  },
  {
    slug: "inventory-source",
    name: "Inventory Source / Flxpoint",
    purpose: "Supplier data automation and catalog/order infrastructure.",
    website: "https://www.inventorysource.com/",
    setupUrl: "https://www.inventorysource.com/api/",
    accessKind: "APPROVAL_API",
    costSignal: "PAID_OR_APPROVAL",
    credentialLabel: "Flxpoint/API account",
    whatYouNeed: [
      "Review Inventory Source supplier coverage",
      "Request API access through Flxpoint",
      "Compare cost against direct CJ/Printful/manual supplier integrations first",
    ],
    recommendation: "DO_LATER",
    note: "Inventory Source currently directs API access requests through Flxpoint rather than exposing a simple free key.",
  },
  {
    slug: "spocket",
    name: "Spocket",
    purpose: "US/EU-oriented dropshipping supplier discovery.",
    website: "https://www.spocket.co/",
    accessKind: "PLATFORM_ACCOUNT",
    costSignal: "UNKNOWN",
    credentialLabel: "Spocket account",
    whatYouNeed: [
      "Create a Spocket account only if its supplier catalog fits Acre Era",
      "Do not assume the old code's accessToken field means a public retailer API exists",
    ],
    recommendation: "RESEARCH_ONLY",
    note: "Keep as a sourcing candidate until we verify a supported public integration path for our custom store.",
  },
  {
    slug: "modalyst",
    name: "Modalyst",
    purpose: "Curated fashion, beauty, home, and independent-brand sourcing.",
    website: "https://www.modalyst.co/",
    setupUrl: "https://support.modalyst.co/",
    accessKind: "PLATFORM_ACCOUNT",
    costSignal: "UNKNOWN",
    credentialLabel: "Modalyst retailer account",
    whatYouNeed: [
      "Create a retailer account if the catalog fits our premium/partner lanes",
      "Use the platform workflow unless Modalyst grants a supported custom integration",
    ],
    recommendation: "RESEARCH_ONLY",
    note: "Modalyst remains useful for curated sourcing, but our old generic apiKey assumption is not enough to call it production-integrated.",
  },
  {
    slug: "dsers-aliexpress",
    name: "DSers + AliExpress",
    purpose: "AliExpress sourcing, supplier/variant mapping, batch ordering, and tracking synchronization.",
    website: "https://www.dsers.com/",
    setupUrl: "https://www.dsers.com/en/integration/aliexpress-dropshipping-service",
    accessKind: "PLATFORM_ACCOUNT",
    costSignal: "UNKNOWN",
    credentialLabel: "DSers / AliExpress connected account",
    whatYouNeed: [
      "Create DSers account",
      "Connect an AliExpress account",
      "Use as a managed sourcing channel rather than pretending we have a direct universal AliExpress API key",
    ],
    recommendation: "DO_LATER",
    note: "DSers documents an official AliExpress integration. Good option if we decide AliExpress quality/lead-time controls meet Acre Era standards.",
  },
  {
    slug: "manual-direct-supplier",
    name: "Direct supplier / farm",
    purpose: "Any real brand, farm, wholesaler, distributor, or manufacturer willing to work directly with Acre Era.",
    website: "/growers",
    accessKind: "MANUAL_OR_PARTNER",
    costSignal: "FREE_API",
    credentialLabel: "Wholesale sheet, feed, API, CSV, email, or agreed manual process",
    whatYouNeed: [
      "Get permission to resell or refer",
      "Get current catalog/pricing/inventory source",
      "Get shipping/fulfillment terms",
      "Document returns and customer responsibility",
      "Ask for API/datafeed only if they have one",
    ],
    recommendation: "DO_NOW",
    note: "This is likely the highest-value lane for farms and independent brands. Watchtower should accept API, CSV/XLSX/JSON feeds, or well-defined manual fulfillment.",
  },
];
