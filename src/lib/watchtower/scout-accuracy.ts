export type ScoutAccuracyState = "INSUFFICIENT_DATA" | "MEASURED";
export type PostLaunchDecision = "LEARN" | "KEEP" | "PUSH" | "REPRICE" | "DEMOTE" | "REMOVE";

export type ScoutAccuracyInput = {
  projectedContributionPerOrderCents: number;
  actualContributionCents: number;
  settledOrders: number;
};

export type PostLaunchInput = ScoutAccuracyInput & {
  outboundClicks?: number | null;
  convertedOrders?: number | null;
  returnRate?: number | null;
};

function finite(value: number | null | undefined, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

export function gradeScoutForecast(input: ScoutAccuracyInput) {
  const projected = finite(input.projectedContributionPerOrderCents);
  const settledOrders = Math.max(0, Math.floor(finite(input.settledOrders)));
  const actualTotal = finite(input.actualContributionCents);

  if (settledOrders < 5) {
    return {
      state: "INSUFFICIENT_DATA" as ScoutAccuracyState,
      minimumSettledOrders: 5,
      settledOrders,
      projectedContributionPerOrderCents: projected,
      actualContributionPerOrderCents: settledOrders ? Math.round(actualTotal / settledOrders) : null,
      accuracyPct: null,
      bias: "UNKNOWN" as const,
    };
  }

  const actualPerOrder = Math.round(actualTotal / settledOrders);
  const denominator = Math.max(Math.abs(projected), 1);
  const errorRatio = Math.abs(actualPerOrder - projected) / denominator;
  const accuracyPct = Math.max(0, Math.min(100, Math.round((1 - errorRatio) * 100)));

  const bias =
    actualPerOrder > projected * 1.05
      ? "UNDER_ESTIMATED"
      : actualPerOrder < projected * 0.95
        ? "OVER_ESTIMATED"
        : "ON_TARGET";

  return {
    state: "MEASURED" as ScoutAccuracyState,
    minimumSettledOrders: 5,
    settledOrders,
    projectedContributionPerOrderCents: projected,
    actualContributionPerOrderCents: actualPerOrder,
    accuracyPct,
    bias,
  };
}

export function postLaunchDecision(input: PostLaunchInput) {
  const forecast = gradeScoutForecast(input);
  if (forecast.state === "INSUFFICIENT_DATA") {
    return {
      decision: "LEARN" as PostLaunchDecision,
      forecast,
      reasons: ["Need at least 5 settled orders before changing merchandising based on performance."],
    };
  }

  const projected = finite(input.projectedContributionPerOrderCents);
  const actual = forecast.actualContributionPerOrderCents ?? 0;
  const returnRate = Math.max(0, finite(input.returnRate));
  const clicks = Math.max(0, Math.floor(finite(input.outboundClicks)));
  const convertedOrders = Math.max(0, Math.floor(finite(input.convertedOrders)));
  const conversionRate = clicks > 0 ? convertedOrders / clicks : null;
  const reasons: string[] = [];

  if (actual <= 0 || returnRate >= 0.2) {
    if (actual <= 0) reasons.push("Observed contribution per settled order is non-positive.");
    if (returnRate >= 0.2) reasons.push("Observed return rate is 20% or higher.");
    return { decision: "REMOVE" as PostLaunchDecision, forecast, conversionRate, reasons };
  }

  if (projected > 0 && actual < projected * 0.65) {
    reasons.push("Observed contribution is more than 35% below forecast.");
    return { decision: "REPRICE" as PostLaunchDecision, forecast, conversionRate, reasons };
  }

  if (clicks >= 50 && conversionRate !== null && conversionRate < 0.005) {
    reasons.push("At least 50 outbound visits produced less than 0.5% conversion.");
    return { decision: "DEMOTE" as PostLaunchDecision, forecast, conversionRate, reasons };
  }

  if (
    projected > 0 &&
    actual >= projected * 1.1 &&
    returnRate <= 0.08 &&
    conversionRate !== null &&
    conversionRate >= 0.02
  ) {
    reasons.push("Observed contribution beats forecast by at least 10%.");
    reasons.push("Return rate is 8% or lower.");
    reasons.push("Observed conversion is at least 2%.");
    return { decision: "PUSH" as PostLaunchDecision, forecast, conversionRate, reasons };
  }

  reasons.push("Observed economics remain positive without a strong remove, reprice, demote, or push signal.");
  return { decision: "KEEP" as PostLaunchDecision, forecast, conversionRate, reasons };
}
