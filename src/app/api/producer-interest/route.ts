import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { producerInterestSubmissions } from "@/db/schema";
import { consumeCustomerVoiceQuota } from "@/lib/customer-voice/throttle";
import { readJsonObjectLimited } from "@/lib/request-body";

const clean = (value: unknown, max = 500) =>
  typeof value === "string"
    ? value.trim().replace(/\s+/g, " ").slice(0, max)
    : "";

const list = (value: unknown, maxItems = 12) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => clean(item, 120))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(req: NextRequest) {
  let quota;
  try {
    quota = await consumeCustomerVoiceQuota(req, "PRODUCER_INTEREST");
  } catch {
    return NextResponse.json(
      { error: "Producer interest protection is not configured." },
      { status: 503 }
    );
  }

  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Too many submissions right now. Try again later." },
      {
        status: 429,
        headers: { "retry-after": String(quota.retryAfterSeconds) },
      }
    );
  }

  const parsed = await readJsonObjectLimited(req, 24_000);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: parsed.error, code: parsed.code },
      { status: parsed.status }
    );
  }

  const businessName = clean(parsed.body.businessName, 255);
  const contactName = clean(parsed.body.contactName, 255);
  const email = clean(parsed.body.email, 320).toLowerCase();
  const phone = clean(parsed.body.phone, 80);
  const location = clean(parsed.body.location, 255);
  const website = clean(parsed.body.website, 1000);
  const productCategories = list(parsed.body.productCategories, 16);
  const seasonality = clean(parsed.body.seasonality, 1000);
  const salesModel = clean(parsed.body.salesModel, 40) || "UNKNOWN";
  const fulfillmentModes = list(parsed.body.fulfillmentModes, 10);
  const leadTimeNotes = clean(parsed.body.leadTimeNotes, 1000);
  const capacityNotes = clean(parsed.body.capacityNotes, 1500);
  const painPoint = clean(parsed.body.painPoint, 1500);
  const pilotInterest = clean(parsed.body.pilotInterest, 20) || "YES";
  const mediaInterest = clean(parsed.body.mediaInterest, 20) || "DISCUSS";

  if (
    businessName.length < 2 ||
    contactName.length < 2 ||
    location.length < 2 ||
    !validEmail(email) ||
    productCategories.length === 0
  ) {
    return NextResponse.json(
      { error: "Add your business, contact, location, email, and at least one product category." },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(producerInterestSubmissions)
    .values({
      businessName,
      contactName,
      email,
      phone: phone || null,
      location,
      website: website || null,
      productCategories,
      seasonality,
      salesModel,
      fulfillmentModes,
      leadTimeNotes,
      capacityNotes,
      painPoint,
      pilotInterest,
      mediaInterest,
      status: "NEW",
    })
    .returning({ id: producerInterestSubmissions.id });

  return NextResponse.json(
    {
      accepted: true,
      submissionId: created.id,
      status: "NEW",
      nextStep: "ACRE_ERA_REVIEW",
      approvedPartner: false,
      customerFacing: false,
      message: "Thanks. Acre Era will review the fit before any pilot or public listing is discussed.",
    },
    { status: 201 }
  );
}
