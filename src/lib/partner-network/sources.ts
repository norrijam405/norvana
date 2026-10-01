export type PartnerDiscoverySource = {
  id: string;
  name: string;
  authority: "OFFICIAL_PUBLIC" | "PUBLIC";
  integrationMode: "PUBLIC_API" | "PUBLIC_DIRECTORY" | "MANUAL_REVIEW";
  discoveryOnly: true;
  url: string;
  candidateTypes: string[];
};

export const PARTNER_DISCOVERY_SOURCES: PartnerDiscoverySource[] = [
  {
    id: "usda-ams-local-food-directories",
    name: "USDA AMS Local Food Directories",
    authority: "OFFICIAL_PUBLIC",
    integrationMode: "PUBLIC_DIRECTORY",
    discoveryOnly: true,
    url: "https://www.ams.usda.gov/services/local-regional/food-directories",
    candidateTypes: ["FARM", "CSA", "FOOD_HUB", "FARMERS_MARKET"],
  },
  {
    id: "usda-ams-farmers-market-directory",
    name: "USDA AMS Farmers Market Directory",
    authority: "OFFICIAL_PUBLIC",
    integrationMode: "PUBLIC_API",
    discoveryOnly: true,
    url: "https://www.ams.usda.gov/local-food-directories/farmersmarkets",
    candidateTypes: ["FARMERS_MARKET", "FARM"],
  },
  {
    id: "usda-ams-csa-directory",
    name: "USDA AMS CSA Directory",
    authority: "OFFICIAL_PUBLIC",
    integrationMode: "PUBLIC_DIRECTORY",
    discoveryOnly: true,
    url: "https://www.ams.usda.gov/local-food-directories/csas",
    candidateTypes: ["CSA", "FARM"],
  },
  {
    id: "usda-ams-on-farm-directory",
    name: "USDA AMS On-Farm Market Directory",
    authority: "OFFICIAL_PUBLIC",
    integrationMode: "PUBLIC_DIRECTORY",
    discoveryOnly: true,
    url: "https://www.ams.usda.gov/local-food-directories/onfarm",
    candidateTypes: ["FARM"],
  },
  {
    id: "state-agriculture-directory",
    name: "State Department of Agriculture Directory",
    authority: "OFFICIAL_PUBLIC",
    integrationMode: "MANUAL_REVIEW",
    discoveryOnly: true,
    url: "https://www.ams.usda.gov/services/local-regional/food-sector",
    candidateTypes: ["FARM", "RANCH", "FOOD_HUB", "LOCAL_MANUFACTURER", "WHOLESALER"],
  },
  {
    id: "cooperative-extension-directory",
    name: "Cooperative Extension Directory",
    authority: "OFFICIAL_PUBLIC",
    integrationMode: "MANUAL_REVIEW",
    discoveryOnly: true,
    url: "https://www.ams.usda.gov/services/local-regional/food-sector/aggregating-and-distribution",
    candidateTypes: ["FARM", "RANCH", "FOOD_HUB", "COOP"],
  },
];
