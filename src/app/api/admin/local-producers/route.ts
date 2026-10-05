import { desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { localProducers } from "@/db/schema";
import {
  PRODUCER_CHANNELS,
  PRODUCER_FULFILLMENT_MODES,
  validateProducerIntake,
  type ProducerIntake,
} from "@/lib/local-food/producer-intake";
import {
  requireCurrentRecoveryAdmin,
  requireCurrentRecoveryAdminRead,
} from "@/lib/admin-guard";

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const asNullableString = (value: unknown) => {
  const parsed = asString(value);
  return parsed || null;
};
const asStringArray = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
const asNullableNumber = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : Number.NaN;

function parseProducer(body: Record<string, unknown>): ProducerIntake {
  const channel = asString(body.channel);
  const fulfillmentModes = asStringArray(body.fulfillmentModes);

  if (!PRODUCER_CHANNELS.includes(channel as (typeof PRODUCER_CHANNELS)[number])) {
    throw new Error("PRODUCER_CHANNEL_INVALID");
  }
  if (fulfillmentModes.some((mode) => !PRODUCER_FULFILLMENT_MODES.includes(mode as (typeof PRODUCER_FULFILLMENT_MODES)[number]))) {
    throw new Error("PRODUCER_FULFILLMENT_MODE_INVALID");
  }

  const mediaPermissionStatus = asString(body.mediaPermissionStatus) || "UNKNOWN";
  if (!["UNKNOWN", "DISCUSS", "GRANTED", "DECLINED"].includes(mediaPermissionStatus)) {
    throw new Error("PRODUCER_MEDIA_PERMISSION_INVALID");
  }

  const pilotInterest = asString(body.pilotInterest) || "UNKNOWN";
  if (!["UNKNOWN", "YES", "NO", "MAYBE"].includes(pilotInterest)) {
    throw new Error("PRODUCER_PILOT_INTEREST_INVALID");
  }

  return {
    name: asString(body.name),
    channel: channel as ProducerIntake["channel"],
    contactName: asNullableString(body.contactName),
    contactEmail: asNullableString(body.contactEmail),
    website: asNullableString(body.website),
    serviceAreas: asStringArray(body.serviceAreas),
    productCategories: asStringArray(body.productCategories),
    seasonalNotes: asNullableString(body.seasonalNotes),
    wholesaleAvailable: body.wholesaleAvailable === true,
    minimumOrderCents: asNullableNumber(body.minimumOrderCents),
    leadTimeHours: asNullableNumber(body.leadTimeHours),
    fulfillmentModes: fulfillmentModes as ProducerIntake["fulfillmentModes"],
    shipsNationally: body.shipsNationally === true,
    coldChainRequired: body.coldChainRequired === true,
    currentDeliveryDays: asStringArray(body.currentDeliveryDays),
    packagingNotes: asNullableString(body.packagingNotes),
    insuranceNotes: asNullableString(body.insuranceNotes),
    foodSafetyNotes: asNullableString(body.foodSafetyNotes),
    mediaPermissionStatus: mediaPermissionStatus as ProducerIntake["mediaPermissionStatus"],
    pilotInterest: pilotInterest as ProducerIntake["pilotInterest"],
    capacityNotes: asNullableString(body.capacityNotes),
    paymentPreference: asNullableString(body.paymentPreference),
    biggestPainPoint: asNullableString(body.biggestPainPoint),
  };
}

export async function GET(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdminRead(req);
  if (gate) return gate;

  const rows = await db
    .select()
    .from(localProducers)
    .orderBy(desc(localProducers.updatedAt), desc(localProducers.id))
    .limit(250);

  return NextResponse.json(
    { producers: rows, customerFacing: false },
    { headers: { "cache-control": "no-store" } }
  );
}

export async function POST(req: NextRequest) {
  const gate = await requireCurrentRecoveryAdmin(req);
  if (gate) return gate;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  let parsed: ProducerIntake;
  try {
    parsed = parseProducer(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "PRODUCER_INTAKE_INVALID" },
      { status: 400 }
    );
  }

  const validation = validateProducerIntake(parsed);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "PRODUCER_INTAKE_INCOMPLETE", issues: validation.issues },
      { status: 409 }
    );
  }

  const [producer] = await db
    .insert(localProducers)
    .values({
      name: parsed.name,
      channel: parsed.channel,
      status: "PROSPECT",
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      website: parsed.website,
      serviceAreas: parsed.serviceAreas,
      productCategories: parsed.productCategories,
      seasonalNotes: parsed.seasonalNotes ?? "",
      wholesaleAvailable: parsed.wholesaleAvailable,
      minimumOrderCents: parsed.minimumOrderCents,
      leadTimeHours: parsed.leadTimeHours,
      fulfillmentModes: parsed.fulfillmentModes,
      shipsNationally: parsed.shipsNationally,
      coldChainRequired: parsed.coldChainRequired,
      currentDeliveryDays: parsed.currentDeliveryDays ?? [],
      packagingNotes: parsed.packagingNotes ?? "",
      insuranceNotes: parsed.insuranceNotes ?? "",
      foodSafetyNotes: parsed.foodSafetyNotes ?? "",
      mediaPermissionStatus: parsed.mediaPermissionStatus,
      pilotInterest: parsed.pilotInterest,
      capacityNotes: parsed.capacityNotes ?? "",
      paymentPreference: parsed.paymentPreference ?? "",
      biggestPainPoint: parsed.biggestPainPoint ?? "",
      evidenceRefs: [],
      updatedAt: new Date(),
    })
    .returning();

  return NextResponse.json(
    {
      producer,
      authority: "PROSPECT_INTAKE_ONLY",
      customerFacing: false,
      nextGate: "FOUNDER_OR_OPERATOR_PARTNERSHIP_REVIEW",
    },
    { status: 201 }
  );
}
