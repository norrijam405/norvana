import { NextRequest, NextResponse } from "next/server";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { compareLocalDeliveryModes } from "@/lib/logistics/local-delivery-economics";

const integer = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
};

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rawStops = Array.isArray(body.stops) ? body.stops : [];
  const stops = rawStops.flatMap((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const stop = value as Record<string, unknown>;
    const contribution = integer(stop.contributionBeforeDeliveryCents, Number.NaN);
    if (!Number.isFinite(contribution)) return [];
    return [{
      orderKey: typeof stop.orderKey === "string" && stop.orderKey.trim()
        ? stop.orderKey.trim()
        : `order-${index + 1}`,
      contributionBeforeDeliveryCents: contribution,
    }];
  });

  if (!stops.length) {
    return NextResponse.json({ error: "At least one valid delivery stop is required." }, { status: 400 });
  }

  const result = compareLocalDeliveryModes({
    stops,
    scheduledRouteCostCents: integer(body.scheduledRouteCostCents),
    thirdPartyPerOrderCents: integer(body.thirdPartyPerOrderCents),
    minimumContributionPerOrderCents: integer(body.minimumContributionPerOrderCents),
  });

  return NextResponse.json({
    comparison: result,
    authority: "DECISION_SUPPORT_ONLY",
    shipmentCreated: false,
    customerFacing: false,
  });
}
