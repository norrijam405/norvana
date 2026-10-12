export type DeliveryObservation = {
  handlingDays: number;
  transitDays: number;
  deliveredOnTime: boolean;
  lost?: boolean;
  damaged?: boolean;
  trackingGapHours?: number | null;
};

export type DeliveryPrediction = {
  sampleSize: number;
  p50Days: number | null;
  p90Days: number | null;
  promiseMinDays: number | null;
  promiseMaxDays: number | null;
  onTimeRate: number | null;
  lossRate: number | null;
  damageRate: number | null;
  reliabilityScore: number;
  confidence: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function quantile(values: number[], q: number) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  const next = sorted[base + 1];
  return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base]);
}

export function predictDelivery(observations: DeliveryObservation[]): DeliveryPrediction {
  const valid = observations.filter(
    (o) =>
      Number.isFinite(o.handlingDays) &&
      Number.isFinite(o.transitDays) &&
      o.handlingDays >= 0 &&
      o.transitDays >= 0
  );

  if (!valid.length) {
    return {
      sampleSize: 0,
      p50Days: null,
      p90Days: null,
      promiseMinDays: null,
      promiseMaxDays: null,
      onTimeRate: null,
      lossRate: null,
      damageRate: null,
      reliabilityScore: 0,
      confidence: 0,
    };
  }

  const totals = valid.map((o) => o.handlingDays + o.transitDays);
  const p50 = quantile(totals, 0.5)!;
  const p90 = quantile(totals, 0.9)!;
  const onTimeRate = valid.filter((o) => o.deliveredOnTime).length / valid.length;
  const lossRate = valid.filter((o) => o.lost).length / valid.length;
  const damageRate = valid.filter((o) => o.damaged).length / valid.length;
  const gapPenalty =
    valid.reduce((sum, o) => sum + Math.min(72, Math.max(0, o.trackingGapHours ?? 0)), 0) /
    valid.length /
    72;

  const reliability = clamp01(
    onTimeRate * 0.65 +
      (1 - lossRate) * 0.18 +
      (1 - damageRate) * 0.12 +
      (1 - gapPenalty) * 0.05
  );

  const confidence = clamp01(0.3 + Math.log1p(valid.length) / Math.log(501) * 0.7);

  return {
    sampleSize: valid.length,
    p50Days: Number(p50.toFixed(1)),
    p90Days: Number(p90.toFixed(1)),
    promiseMinDays: Math.max(0, Math.floor(p50)),
    promiseMaxDays: Math.max(Math.ceil(p90), Math.ceil(p50)),
    onTimeRate,
    lossRate,
    damageRate,
    reliabilityScore: Math.round(reliability * 100),
    confidence: Math.round(confidence * 100),
  };
}

export type ShipmentStateInput = {
  promisedBy?: Date | string | null;
  lastTrackingEventAt?: Date | string | null;
  carrierAcceptedAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  now?: Date;
};

export type ShipmentRiskState = "NORMAL" | "WATCH" | "AT_RISK" | "LATE" | "DELIVERED";

export function shipmentRiskState(input: ShipmentStateInput): ShipmentRiskState {
  const now = input.now ?? new Date();
  const promised = input.promisedBy ? new Date(input.promisedBy) : null;
  const lastEvent = input.lastTrackingEventAt ? new Date(input.lastTrackingEventAt) : null;

  if (input.deliveredAt) return "DELIVERED";
  if (promised && Number.isFinite(promised.getTime()) && now > promised) return "LATE";

  const hoursWithoutTracking =
    lastEvent && Number.isFinite(lastEvent.getTime())
      ? (now.getTime() - lastEvent.getTime()) / 3_600_000
      : null;

  if (!input.carrierAcceptedAt && promised) {
    const hoursToPromise = (promised.getTime() - now.getTime()) / 3_600_000;
    if (hoursToPromise <= 24) return "AT_RISK";
    if (hoursToPromise <= 48) return "WATCH";
  }

  if (hoursWithoutTracking !== null) {
    if (hoursWithoutTracking >= 72) return "AT_RISK";
    if (hoursWithoutTracking >= 36) return "WATCH";
  }

  return "NORMAL";
}

export function allocatedRouteDeliveryCostCents(input: {
  routeCostCents: number;
  completedStops: number;
  failedStops?: number;
}) {
  const routeCost = Math.max(0, Math.round(input.routeCostCents));
  const completed = Math.max(0, Math.floor(input.completedStops));
  const failed = Math.max(0, Math.floor(input.failedStops ?? 0));
  const attemptedStops = completed + failed;

  if (attemptedStops === 0) return null;
  return Math.ceil(routeCost / attemptedStops);
}
