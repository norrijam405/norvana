export const PRODUCER_CHANNELS = [
  "FARM",
  "FOOD_HUB",
  "COOPERATIVE",
  "MARKET",
  "DISTRIBUTOR",
  "MAKER",
] as const;

export const PRODUCER_FULFILLMENT_MODES = [
  "CUSTOMER_PICKUP",
  "ACRE_SCHEDULED_ROUTE",
  "COMMUNITY_BULK_DROP",
  "PRODUCER_DELIVERY",
  "THIRD_PARTY_COURIER",
  "PARCEL_SHIPPING",
  "REFRIGERATED_FREIGHT",
] as const;

export type ProducerIntake = {
  name: string;
  channel: (typeof PRODUCER_CHANNELS)[number];
  contactName?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  serviceAreas: string[];
  productCategories: string[];
  seasonalNotes?: string | null;
  wholesaleAvailable: boolean;
  minimumOrderCents?: number | null;
  leadTimeHours?: number | null;
  fulfillmentModes: Array<(typeof PRODUCER_FULFILLMENT_MODES)[number]>;
  shipsNationally: boolean;
  coldChainRequired: boolean;
  currentDeliveryDays?: string[];
  packagingNotes?: string | null;
  insuranceNotes?: string | null;
  foodSafetyNotes?: string | null;
  mediaPermissionStatus: "UNKNOWN" | "DISCUSS" | "GRANTED" | "DECLINED";
  pilotInterest: "UNKNOWN" | "YES" | "NO" | "MAYBE";
  capacityNotes?: string | null;
  paymentPreference?: string | null;
  biggestPainPoint?: string | null;
};

export function validateProducerIntake(
  input: ProducerIntake,
  options: { operational?: boolean } = { operational: true }
) {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!input.name.trim()) issues.push("PRODUCER_NAME_REQUIRED");
  if (!input.serviceAreas.length) issues.push("SERVICE_AREA_REQUIRED");
  if (!input.productCategories.length) issues.push("PRODUCT_CATEGORY_REQUIRED");
  if (!input.fulfillmentModes.length) issues.push("FULFILLMENT_MODE_REQUIRED");

  if (
    input.minimumOrderCents !== null &&
    input.minimumOrderCents !== undefined &&
    (!Number.isFinite(input.minimumOrderCents) || input.minimumOrderCents < 0)
  ) {
    issues.push("MINIMUM_ORDER_INVALID");
  }

  if (
    input.leadTimeHours !== null &&
    input.leadTimeHours !== undefined &&
    (!Number.isFinite(input.leadTimeHours) || input.leadTimeHours < 0)
  ) {
    issues.push("LEAD_TIME_INVALID");
  }

  if (input.shipsNationally && !input.fulfillmentModes.includes("PARCEL_SHIPPING") &&
      !input.fulfillmentModes.includes("REFRIGERATED_FREIGHT")) {
    (options.operational === false ? warnings : issues).push("NATIONAL_SHIPPING_MODE_MISSING");
  }

  if (input.coldChainRequired &&
      !input.fulfillmentModes.some((mode) =>
        ["ACRE_SCHEDULED_ROUTE", "PRODUCER_DELIVERY", "THIRD_PARTY_COURIER", "REFRIGERATED_FREIGHT"].includes(mode)
      )) {
    (options.operational === false ? warnings : issues).push("COLD_CHAIN_FULFILLMENT_PATH_MISSING");
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
    operationallyQualified: issues.length === 0 && warnings.length === 0,
  };
}

export const PRODUCER_OUTREACH_QUESTIONS = [
  "What do you grow or produce throughout the year, and what is seasonal?",
  "Do you currently sell retail, wholesale, or both?",
  "Would you be open to Acre Era bringing you additional customers through an online marketplace?",
  "What order volume could you comfortably handle without hurting quality?",
  "Do you have wholesale, case, or volume pricing?",
  "Do you have a minimum order?",
  "How often does inventory change, and how do you track what is available?",
  "How much notice do you need before an order is ready for pickup?",
  "Do you already deliver? If so, where and on which days?",
  "Would you be open to scheduled pickup of multiple customer orders for a grouped delivery route?",
  "How are products currently packed for retail or wholesale customers?",
  "Which products are hardest to transport or have the shortest shelf life?",
  "What food-safety, insurance, licensing, or inspection records do buyers usually request from you?",
  "Are there products you prefer to keep local rather than ship farther away?",
  "Do you currently ship any products, and through which carriers or methods?",
  "Would you eventually be interested in selling outside your current region if Acre Era handled customer acquisition and technology?",
  "Would you allow Acre Era to use your farm or business name, story, photos, or video when selling your products?",
  "Would you be open to Acre Era creating original photos or short video at your location?",
  "How do you prefer to be paid?",
  "What would make a partnership like this valuable to you?",
  "What is the biggest pain point in selling and delivering what you produce today?",
  "Would you be open to a small pilot before either side commits to anything larger?",
] as const;
