export type DeliveryQuoteRequest = {
  pickupPostalCode: string;
  dropoffPostalCode: string;
  pickupReadyAt?: Date | string | null;
  packageCount: number;
  weightGrams?: number | null;
  requiresColdChain?: boolean;
};

export type DeliveryQuote = {
  provider: string;
  serviceLevel: string;
  quotedCostCents: number;
  currency: "USD";
  estimatedPickupAt?: string | null;
  estimatedDeliveryAt?: string | null;
  quoteExpiresAt?: string | null;
  evidenceRef?: string | null;
};

export type DeliveryProviderAdapter = {
  slug: string;
  supportsColdChain: boolean;
  getQuote(input: DeliveryQuoteRequest): Promise<DeliveryQuote[]>;
};

export function validateDeliveryQuote(quote: DeliveryQuote) {
  const issues: string[] = [];

  if (!quote.provider.trim()) issues.push("DELIVERY_PROVIDER_REQUIRED");
  if (!quote.serviceLevel.trim()) issues.push("DELIVERY_SERVICE_LEVEL_REQUIRED");
  if (!Number.isInteger(quote.quotedCostCents) || quote.quotedCostCents < 0) {
    issues.push("DELIVERY_QUOTED_COST_INVALID");
  }
  if (quote.currency !== "USD") issues.push("DELIVERY_CURRENCY_UNSUPPORTED");

  for (const [label, value] of [
    ["DELIVERY_PICKUP_TIME_INVALID", quote.estimatedPickupAt],
    ["DELIVERY_ARRIVAL_TIME_INVALID", quote.estimatedDeliveryAt],
    ["DELIVERY_QUOTE_EXPIRY_INVALID", quote.quoteExpiresAt],
  ] as const) {
    if (value && !Number.isFinite(new Date(value).getTime())) issues.push(label);
  }

  return { valid: issues.length === 0, issues };
}

export function customerDeliveryWindow(quote: DeliveryQuote) {
  if (!quote.estimatedDeliveryAt) return null;
  const arrival = new Date(quote.estimatedDeliveryAt);
  if (!Number.isFinite(arrival.getTime())) return null;

  return {
    expectedBy: arrival.toISOString(),
    provider: quote.provider,
    serviceLevel: quote.serviceLevel,
  };
}
