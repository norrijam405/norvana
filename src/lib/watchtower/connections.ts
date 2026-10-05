export type ConnectionAuthority = "WATCH" | "RECOMMEND" | "ACT";
export type ConnectionCategory =
  | "PAYMENTS"
  | "MEDIA"
  | "PARCEL"
  | "LOCAL_DELIVERY"
  | "COMMERCE"
  | "MESSAGING"
  | "HOSTING"
  | "DATA";

export type ConnectionEntry = {
  slug: string;
  name: string;
  category: ConnectionCategory;
  purpose: string;
  officialUrl: string;
  developerUrl?: string;
  envKeys: string[];
  authority: ConnectionAuthority;
  notes: string;
};

export const WATCHTOWER_CONNECTIONS: ConnectionEntry[] = [
  {
    slug: "stripe",
    name: "Stripe",
    category: "PAYMENTS",
    purpose: "Payments, refunds, payouts, and revenue events.",
    officialUrl: "https://dashboard.stripe.com/",
    developerUrl: "https://docs.stripe.com/keys",
    envKeys: ["STRIPE_SECRET_KEY"],
    authority: "ACT",
    notes: "Keep refunds, captures, subscription changes, and payout-affecting actions approval-gated.",
  },
  {
    slug: "pixabay",
    name: "Pixabay",
    category: "MEDIA",
    purpose: "Hero video and visual discovery.",
    officialUrl: "https://pixabay.com/",
    developerUrl: "https://pixabay.com/api/docs/",
    envKeys: ["PIXABAY_API_KEY"],
    authority: "WATCH",
    notes: "Search is safe to automate; media still requires source/rights/creative review before use.",
  },
  {
    slug: "shippo",
    name: "Shippo",
    category: "PARCEL",
    purpose: "Parcel rates, labels, tracking, and returns.",
    officialUrl: "https://goshippo.com/",
    developerUrl: "https://docs.goshippo.com/",
    envKeys: ["SHIPPO_API_TOKEN"],
    authority: "RECOMMEND",
    notes: "Quote/rate shopping can be automated before label purchasing is unlocked.",
  },
  {
    slug: "easypost",
    name: "EasyPost",
    category: "PARCEL",
    purpose: "Alternative parcel-rate, tracking, and label layer.",
    officialUrl: "https://www.easypost.com/",
    developerUrl: "https://docs.easypost.com/",
    envKeys: ["EASYPOST_API_KEY"],
    authority: "RECOMMEND",
    notes: "Choose one parcel aggregator first; do not pay for redundant integrations without a reason.",
  },
  {
    slug: "uber-direct",
    name: "Uber Direct",
    category: "LOCAL_DELIVERY",
    purpose: "Local delivery quotes, ETAs, and courier fulfillment.",
    officialUrl: "https://www.uber.com/us/en/b/delivery/",
    developerUrl: "https://developer.uber.com/docs/deliveries/direct/overview",
    envKeys: ["UBER_DIRECT_CLIENT_ID", "UBER_DIRECT_CLIENT_SECRET"],
    authority: "RECOMMEND",
    notes: "Quote and ETA comparison may be automated; delivery creation remains locked until explicitly authorized.",
  },
  {
    slug: "doordash-drive",
    name: "DoorDash Drive",
    category: "LOCAL_DELIVERY",
    purpose: "Same-day/local delivery option where access is available.",
    officialUrl: "https://www.doordash.com/drive/",
    developerUrl: "https://developer.doordash.com/en-US/docs/drive/overview/about_drive/",
    envKeys: ["DOORDASH_DRIVE_CLIENT_ID", "DOORDASH_DRIVE_CLIENT_SECRET"],
    authority: "RECOMMEND",
    notes: "Treat production access as optional until account approval is confirmed.",
  },
  {
    slug: "roadie",
    name: "Roadie",
    category: "LOCAL_DELIVERY",
    purpose: "Alternative same-day and oversized/local delivery.",
    officialUrl: "https://www.roadie.com/",
    developerUrl: "https://developer.roadie.com/",
    envKeys: ["ROADIE_API_KEY"],
    authority: "RECOMMEND",
    notes: "Use as a route option, not a hard-coded dependency.",
  },
  {
    slug: "shopify",
    name: "Shopify",
    category: "COMMERCE",
    purpose: "Partner-store catalog, inventory, and order integrations where approved.",
    officialUrl: "https://www.shopify.com/",
    developerUrl: "https://shopify.dev/docs/api/admin-graphql",
    envKeys: ["SHOPIFY_ADMIN_ACCESS_TOKEN"],
    authority: "RECOMMEND",
    notes: "Prefer GraphQL Admin API for new integrations. Store-specific access remains separately scoped.",
  },
  {
    slug: "resend",
    name: "Resend",
    category: "MESSAGING",
    purpose: "Transactional email for orders, account notices, and producer follow-up.",
    officialUrl: "https://resend.com/",
    developerUrl: "https://resend.com/docs",
    envKeys: ["RESEND_API_KEY"],
    authority: "RECOMMEND",
    notes: "Drafting and event preparation can be automatic; outbound campaigns remain approval-gated.",
  },
  {
    slug: "twilio",
    name: "Twilio",
    category: "MESSAGING",
    purpose: "SMS and delivery notifications when needed.",
    officialUrl: "https://www.twilio.com/",
    developerUrl: "https://www.twilio.com/docs",
    envKeys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
    authority: "RECOMMEND",
    notes: "Do not send marketing SMS without the required consent and messaging configuration.",
  },
  {
    slug: "vercel",
    name: "Vercel",
    category: "HOSTING",
    purpose: "Preview and web application hosting.",
    officialUrl: "https://vercel.com/dashboard",
    developerUrl: "https://vercel.com/docs",
    envKeys: [],
    authority: "WATCH",
    notes: "Deployment/promotion remains a separate release decision.",
  },
  {
    slug: "supabase",
    name: "Supabase",
    category: "DATA",
    purpose: "Database and application data services where configured.",
    officialUrl: "https://supabase.com/dashboard",
    developerUrl: "https://supabase.com/docs",
    envKeys: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    authority: "WATCH",
    notes: "Never expose service-role credentials to the browser.",
  },
  {
    slug: "render",
    name: "Render",
    category: "HOSTING",
    purpose: "Supporting services and protected runtime secrets where used.",
    officialUrl: "https://dashboard.render.com/",
    developerUrl: "https://render.com/docs",
    envKeys: [],
    authority: "WATCH",
    notes: "Keep service/environment changes separately approval-gated.",
  },
];

export function connectionStatus(entry: ConnectionEntry) {
  if (entry.envKeys.length === 0) {
    return {
      state: "ACCOUNT_OR_PLATFORM" as const,
      ready: true,
      presentKeys: 0,
      totalKeys: 0,
    };
  }

  const presentKeys = entry.envKeys.filter((key) => Boolean(process.env[key])).length;
  return {
    state:
      presentKeys === entry.envKeys.length
        ? ("CONNECTED" as const)
        : presentKeys > 0
          ? ("PARTIAL" as const)
          : ("NEEDS_SETUP" as const),
    ready: presentKeys === entry.envKeys.length,
    presentKeys,
    totalKeys: entry.envKeys.length,
  };
}
