export type DeliveryStopEconomics = {
  orderKey: string;
  contributionBeforeDeliveryCents: number;
};

export type DeliveryModeEconomics = {
  mode: "SCHEDULED_ROUTE" | "THIRD_PARTY_PER_ORDER";
  orderCount: number;
  totalDeliveryCostCents: number;
  deliveryCostPerOrderCents: number;
  totalContributionAfterDeliveryCents: number;
  contributionPerOrderCents: number;
  viable: boolean;
};

export function compareLocalDeliveryModes(input: {
  stops: DeliveryStopEconomics[];
  scheduledRouteCostCents: number;
  thirdPartyPerOrderCents: number;
  minimumContributionPerOrderCents: number;
}) {
  const stops = input.stops.filter((stop) =>
    Number.isFinite(stop.contributionBeforeDeliveryCents)
  );
  const count = stops.length;
  const contributionBeforeDelivery = stops.reduce(
    (sum, stop) => sum + Math.round(stop.contributionBeforeDeliveryCents),
    0
  );

  if (!count) {
    return {
      scheduled: null,
      thirdParty: null,
      recommendedMode: null,
      savingsCents: 0,
    };
  }

  const scheduledCost = Math.max(0, Math.round(input.scheduledRouteCostCents));
  const thirdPartyCost =
    Math.max(0, Math.round(input.thirdPartyPerOrderCents)) * count;

  const build = (
    mode: DeliveryModeEconomics["mode"],
    totalDeliveryCostCents: number
  ): DeliveryModeEconomics => {
    const totalContributionAfterDeliveryCents =
      contributionBeforeDelivery - totalDeliveryCostCents;
    const contributionPerOrderCents = Math.floor(
      totalContributionAfterDeliveryCents / count
    );

    return {
      mode,
      orderCount: count,
      totalDeliveryCostCents,
      deliveryCostPerOrderCents: Math.ceil(totalDeliveryCostCents / count),
      totalContributionAfterDeliveryCents,
      contributionPerOrderCents,
      viable:
        contributionPerOrderCents >=
        Math.max(0, Math.round(input.minimumContributionPerOrderCents)),
    };
  };

  const scheduled = build("SCHEDULED_ROUTE", scheduledCost);
  const thirdParty = build("THIRD_PARTY_PER_ORDER", thirdPartyCost);

  let recommendedMode: DeliveryModeEconomics["mode"] | null = null;
  if (scheduled.viable || thirdParty.viable) {
    if (scheduled.viable && !thirdParty.viable) recommendedMode = scheduled.mode;
    else if (!scheduled.viable && thirdParty.viable) recommendedMode = thirdParty.mode;
    else {
      recommendedMode =
        scheduled.totalContributionAfterDeliveryCents >=
        thirdParty.totalContributionAfterDeliveryCents
          ? scheduled.mode
          : thirdParty.mode;
    }
  }

  return {
    scheduled,
    thirdParty,
    recommendedMode,
    savingsCents: thirdParty.totalDeliveryCostCents - scheduled.totalDeliveryCostCents,
  };
}

export function breakEvenRouteStops(input: {
  scheduledRouteCostCents: number;
  thirdPartyPerOrderCents: number;
}) {
  const route = Math.max(0, Math.round(input.scheduledRouteCostCents));
  const perOrder = Math.max(0, Math.round(input.thirdPartyPerOrderCents));
  if (perOrder === 0) return null;
  return Math.max(1, Math.ceil(route / perOrder));
}
