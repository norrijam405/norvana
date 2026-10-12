import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { darwinEvaluations, deliveryObservations, demandObservations } from "@/db/schema";
import { requireCurrentRecoveryAdmin } from "@/lib/admin-guard";
import { scoreDemand, type DemandSignalInput } from "@/lib/intelligence/demand";
import { evaluateDarwinCandidate } from "@/lib/intelligence/darwin";
import { predictDelivery, type DeliveryObservation } from "@/lib/logistics/delivery-intelligence";
import type { OpportunityEconomicsInput } from "@/lib/watchtower/intelligence";

const num = (value: unknown, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;
const nullableNum = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? null
    : Number.isFinite(Number(value))
      ? Number(value)
      : null;
const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function parseEconomics(value: unknown): OpportunityEconomicsInput {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    salePriceCents: num(input.salePriceCents),
    productCostCents: nullableNum(input.productCostCents),
    inboundFreightCents: nullableNum(input.inboundFreightCents),
    outboundShippingCents: nullableNum(input.outboundShippingCents),
    paymentFeeCents: nullableNum(input.paymentFeeCents),
    marketplaceFeeCents: nullableNum(input.marketplaceFeeCents),
    affiliateCommissionCents: nullableNum(input.affiliateCommissionCents),
    returnReserveCents: nullableNum(input.returnReserveCents),
    fraudReserveCents: nullableNum(input.fraudReserveCents),
    warrantyReserveCents: nullableNum(input.warrantyReserveCents),
    authenticationCostCents: nullableNum(input.authenticationCostCents),
    customerAcquisitionCostCents: nullableNum(input.customerAcquisitionCostCents),
  };
}

function parseDemand(value: unknown): DemandSignalInput {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    internalRequests: nullableNum(input.internalRequests),
    sellThroughRate: nullableNum(input.sellThroughRate),
    repeatPurchaseRate: nullableNum(input.repeatPurchaseRate),
    searchTrendIndex: nullableNum(input.searchTrendIndex),
    customerVoiceScore: nullableNum(input.customerVoiceScore),
    velocityIndex: nullableNum(input.velocityIndex),
    sampleSize: nullableNum(input.sampleSize),
    observedAt: str(input.observedAt) || new Date(),
  };
}

function parseDelivery(value: unknown): DeliveryObservation[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item)
    )
    .map((item) => ({
      handlingDays: num(item.handlingDays),
      transitDays: num(item.transitDays),
      deliveredOnTime: item.deliveredOnTime === true,
      lost: item.lost === true,
      damaged: item.damaged === true,
      trackingGapHours: nullableNum(item.trackingGapHours),
    }));
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

  const subjectType = str(body.subjectType);
  const subjectKey = str(body.subjectKey);
  const candidateKey = str(body.candidateKey);
  const evidenceRef = str(body.evidenceRef);

  if (!subjectType || !subjectKey || !candidateKey || !evidenceRef) {
    return NextResponse.json(
      { error: "subjectType, subjectKey, candidateKey, and evidenceRef are required." },
      { status: 400 }
    );
  }

  const demandInput = parseDemand(body.demand);
  const deliveryInput = parseDelivery(body.deliveryObservations);
  const demand = scoreDemand(demandInput);
  const delivery = predictDelivery(deliveryInput);

  const result = evaluateDarwinCandidate({
    id: candidateKey,
    economics: parseEconomics(body.economics),
    demand,
    delivery,
    sourceTrustScore: num(body.sourceTrustScore),
    returnRisk: num(body.returnRisk),
    spoilageRisk: num(body.spoilageRisk),
    supportBurden: num(body.supportBurden),
  });

  const observedAt = demandInput.observedAt ? new Date(demandInput.observedAt) : new Date();
  if (!Number.isFinite(observedAt.getTime())) {
    return NextResponse.json({ error: "Demand observation time is invalid." }, { status: 400 });
  }

  await db.insert(demandObservations).values({
    subjectType,
    subjectKey,
    internalRequests: demandInput.internalRequests,
    sellThroughRate: demandInput.sellThroughRate,
    repeatPurchaseRate: demandInput.repeatPurchaseRate,
    searchTrendIndex: demandInput.searchTrendIndex,
    customerVoiceScore: demandInput.customerVoiceScore,
    velocityIndex: demandInput.velocityIndex,
    sampleSize: demandInput.sampleSize === null || demandInput.sampleSize === undefined
      ? null
      : Math.round(demandInput.sampleSize),
    evidenceRef,
    observedAt,
  });

  if (deliveryInput.length) {
    await db.insert(deliveryObservations).values(
      deliveryInput.map((observation) => ({
        routeId: Number.isInteger(Number(body.routeId)) ? Number(body.routeId) : null,
        supplierId: Number.isInteger(Number(body.supplierId)) ? Number(body.supplierId) : null,
        carrier: str(body.carrier),
        serviceLevel: str(body.serviceLevel),
        originRegion: str(body.originRegion),
        destinationRegion: str(body.destinationRegion),
        handlingHours: Math.round(observation.handlingDays * 24),
        transitHours: Math.round(observation.transitDays * 24),
        promisedHours: null,
        deliveredOnTime: observation.deliveredOnTime,
        lost: observation.lost === true,
        damaged: observation.damaged === true,
        trackingGapHours: observation.trackingGapHours === null || observation.trackingGapHours === undefined
          ? null
          : Math.round(observation.trackingGapHours),
        evidenceRef,
        observedAt,
      }))
    );
  }

  const [evaluation] = await db
    .insert(darwinEvaluations)
    .values({
      subjectType,
      subjectKey,
      candidateKey,
      policyVersion: "DARWIN_R0",
      eligible: result.eligible,
      fitnessScore: result.fitnessScore,
      rejectionCodes: result.rejectionCodes,
      economics: result.economics,
      demand: {
        score: result.demandScore,
        confidence: result.demandConfidence,
        components: demand.components,
      },
      delivery: {
        reliabilityScore: result.deliveryReliabilityScore,
        confidence: result.deliveryConfidence,
        promiseMinDays: delivery.promiseMinDays,
        promiseMaxDays: delivery.promiseMaxDays,
        sampleSize: delivery.sampleSize,
      },
      risks: result.risks,
      evidenceRefs: [evidenceRef],
      evaluatedAt: new Date(),
    })
    .returning();

  return NextResponse.json(
    {
      evaluation,
      decision: result,
      customerFacing: false,
      authority: "DECISION_SUPPORT_ONLY",
      consequentialActionTaken: false,
    },
    { status: 201 }
  );
}
