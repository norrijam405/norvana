/** Garage Sale R6 consumer journey configuration: UI-only, fictional Preview. */
export const GARAGE_SALE_JOURNEYS = [
  { id: "BUY", label: "Find a treasure", eyebrow: "For shoppers", description: "Browse whole sales, bundle finds, and explore an example exchange.", action: "Browse fictional sales" },
  { id: "SELL", label: "Host a sale", eyebrow: "For neighbors", description: "Draft your items, review photos and export a private sample list.", action: "Open seller studio" },
] as const;
export type GarageSaleJourney = typeof GARAGE_SALE_JOURNEYS[number]["id"];
export function isGarageSaleJourney(value: unknown): value is GarageSaleJourney {
  return value === "BUY" || value === "SELL";
}
export function getGarageSaleJourney(value: unknown) {
  return GARAGE_SALE_JOURNEYS.find(journey => journey.id === value) ?? GARAGE_SALE_JOURNEYS[0];
}
