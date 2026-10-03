export const WATCH_TARGET_TYPES = [
  "PRODUCT",
  "BRAND",
  "ERA",
  "REQUEST",
] as const;

export const WATCH_ALERT_TYPES = [
  "PRICE_DROP",
  "BACK_IN_STOCK",
  "BRAND_ADDED",
  "ERA_OPENS",
  "LOCAL_SEASONAL",
  "BETTER_ROUTE",
  "REQUEST_STATUS",
  "QUALIFICATION_COMPLETE",
  "PARTNER_CHANGE",
] as const;

export const MARKET_REQUEST_STATES = [
  "REQUESTED",
  "GAINING_SUPPORT",
  "RESEARCHING",
  "SOURCE_FOUND",
  "QUALIFYING",
  "APPROVED",
  "ENTERING_ERA",
  "DECLINED",
  "ON_HOLD",
  "RETIRED",
] as const;

const TRANSITIONS: Record<string, readonly string[]> = {
  REQUESTED: ["GAINING_SUPPORT", "RESEARCHING", "ON_HOLD", "DECLINED"],
  GAINING_SUPPORT: ["RESEARCHING", "ON_HOLD", "DECLINED"],
  RESEARCHING: ["SOURCE_FOUND", "ON_HOLD", "DECLINED"],
  SOURCE_FOUND: ["QUALIFYING", "ON_HOLD", "DECLINED"],
  QUALIFYING: ["APPROVED", "ON_HOLD", "DECLINED"],
  APPROVED: ["ENTERING_ERA", "ON_HOLD"],
  ENTERING_ERA: ["RETIRED", "ON_HOLD"],
  ON_HOLD: ["GAINING_SUPPORT", "RESEARCHING", "QUALIFYING", "DECLINED"],
  DECLINED: [],
  RETIRED: [],
};

export function canTransitionMarketRequest(from: string, to: string) {
  return Boolean(TRANSITIONS[from]?.includes(to));
}

export function marketRequestTransitionNeedsEvidence(to: string) {
  return ["SOURCE_FOUND", "QUALIFYING", "APPROVED", "ENTERING_ERA", "DECLINED"].includes(to);
}

export function parseWatchItemInput(body: Record<string, unknown>) {
  const targetType = String(body.targetType || "").trim().toUpperCase();
  const targetKey = String(body.targetKey || "").trim().slice(0, 255);
  const rawAlerts = Array.isArray(body.alertTypes) ? body.alertTypes : [];
  const alertTypes = [...new Set(rawAlerts.map((value) => String(value).trim().toUpperCase()))];
  const priceThresholdCents =
    body.priceThresholdCents === null || body.priceThresholdCents === undefined
      ? null
      : Number(body.priceThresholdCents);

  if (!WATCH_TARGET_TYPES.includes(targetType as (typeof WATCH_TARGET_TYPES)[number])) {
    throw new Error("WATCH_TARGET_TYPE_INVALID");
  }
  if (!targetKey) throw new Error("WATCH_TARGET_KEY_REQUIRED");
  if (alertTypes.length === 0 || alertTypes.length > 8) {
    throw new Error("WATCH_ALERT_TYPES_REQUIRED");
  }
  for (const alert of alertTypes) {
    if (!WATCH_ALERT_TYPES.includes(alert as (typeof WATCH_ALERT_TYPES)[number])) {
      throw new Error("WATCH_ALERT_TYPE_INVALID");
    }
  }
  if (
    priceThresholdCents !== null &&
    (!Number.isInteger(priceThresholdCents) || priceThresholdCents <= 0)
  ) {
    throw new Error("WATCH_PRICE_THRESHOLD_INVALID");
  }
  if (priceThresholdCents !== null && targetType !== "PRODUCT") {
    throw new Error("WATCH_PRICE_THRESHOLD_PRODUCT_ONLY");
  }

  return {
    targetType,
    targetKey,
    alertTypes,
    priceThresholdCents,
  };
}
