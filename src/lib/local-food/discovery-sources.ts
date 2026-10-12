export type FoodNetworkDiscoverySource = {
  slug: string;
  name: string;
  scope: "NATIONAL" | "REGIONAL" | "OKLAHOMA";
  kind: "DIRECTORY" | "PROCUREMENT_PLATFORM" | "FOOD_HUB_NETWORK" | "DISTRIBUTOR" | "FARM_SOFTWARE";
  url: string;
  automationState: "MANUAL_RESEARCH" | "API_CANDIDATE" | "ACCOUNT_REQUIRED";
  notes: string;
};

export const FOOD_NETWORK_DISCOVERY_SOURCES: FoodNetworkDiscoverySource[] = [
  {
    slug: "usda-local-food-directories",
    name: "USDA Local Food Directories",
    scope: "NATIONAL",
    kind: "DIRECTORY",
    url: "https://www.ams.usda.gov/services/local-regional/food-directories-listings",
    automationState: "API_CANDIDATE",
    notes: "National discovery source for farmers markets, CSAs, food hubs, and on-farm markets. API availability varies by directory.",
  },
  {
    slug: "local-line",
    name: "Local Line",
    scope: "NATIONAL",
    kind: "PROCUREMENT_PLATFORM",
    url: "https://www.localline.co/buyers",
    automationState: "ACCOUNT_REQUIRED",
    notes: "Farm-direct procurement, supplier discovery, onboarding, live inventory, ordering, fulfillment, and food-safety workflows.",
  },
  {
    slug: "the-common-market",
    name: "The Common Market",
    scope: "REGIONAL",
    kind: "FOOD_HUB_NETWORK",
    url: "https://www.thecommonmarket.org/",
    automationState: "MANUAL_RESEARCH",
    notes: "Regional food-hub network serving institutions including healthcare and elder-care facilities.",
  },
  {
    slug: "freshpoint-oklahoma",
    name: "FreshPoint Oklahoma",
    scope: "OKLAHOMA",
    kind: "DISTRIBUTOR",
    url: "https://www.freshpoint.com/oklahomacity/",
    automationState: "ACCOUNT_REQUIRED",
    notes: "Oklahoma produce distributor with refrigerated docks, fleet, traceability, food-safety programs, and healthcare customer experience.",
  },
  {
    slug: "barn2door",
    name: "Barn2Door",
    scope: "NATIONAL",
    kind: "FARM_SOFTWARE",
    url: "https://www.barn2door.com/logistics",
    automationState: "ACCOUNT_REQUIRED",
    notes: "Farm commerce and delivery tooling; useful as a producer integration/research path, including delivery and route-optimization workflows.",
  },
];

export function foodDiscoverySourcesByScope(scope: FoodNetworkDiscoverySource["scope"]) {
  return FOOD_NETWORK_DISCOVERY_SOURCES.filter((source) => source.scope === scope);
}
