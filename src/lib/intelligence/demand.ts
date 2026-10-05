export type DemandSignalInput = {
  internalRequests?: number | null;
  sellThroughRate?: number | null;
  repeatPurchaseRate?: number | null;
  searchTrendIndex?: number | null;
  customerVoiceScore?: number | null;
  velocityIndex?: number | null;
  sampleSize?: number | null;
  observedAt?: Date | string | null;
};

export type DemandScore = {
  score: number;
  confidence: number;
  components: {
    requests: number;
    sellThrough: number;
    repeatPurchase: number;
    searchTrend: number;
    customerVoice: number;
    velocity: number;
  };
  freshnessMultiplier: number;
  sampleMultiplier: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const pct = (value: number | null | undefined) =>
  Number.isFinite(value) ? clamp01(Number(value)) : 0;
const boundedIndex = (value: number | null | undefined) =>
  Number.isFinite(value) ? clamp01(Number(value) / 100) : 0;

function requestSignal(value: number | null | undefined) {
  if (!Number.isFinite(value) || Number(value) <= 0) return 0;
  // Saturates gradually so a viral request pile cannot overwhelm every other signal.
  return clamp01(Math.log1p(Number(value)) / Math.log(101));
}

function freshness(observedAt: Date | string | null | undefined, now: Date) {
  if (!observedAt) return 0.6;
  const observed = new Date(observedAt);
  if (!Number.isFinite(observed.getTime())) return 0.6;
  const ageDays = Math.max(0, (now.getTime() - observed.getTime()) / 86_400_000);
  if (ageDays <= 1) return 1;
  if (ageDays <= 7) return 0.95;
  if (ageDays <= 30) return 0.8;
  if (ageDays <= 90) return 0.65;
  return 0.45;
}

function sampleConfidence(sampleSize: number | null | undefined) {
  if (!Number.isFinite(sampleSize) || Number(sampleSize) <= 0) return 0.35;
  return clamp01(0.35 + Math.log1p(Number(sampleSize)) / Math.log(1001) * 0.65);
}

export function scoreDemand(input: DemandSignalInput, now = new Date()): DemandScore {
  const components = {
    requests: requestSignal(input.internalRequests),
    sellThrough: pct(input.sellThroughRate),
    repeatPurchase: pct(input.repeatPurchaseRate),
    searchTrend: boundedIndex(input.searchTrendIndex),
    customerVoice: boundedIndex(input.customerVoiceScore),
    velocity: boundedIndex(input.velocityIndex),
  };

  const weighted =
    components.requests * 0.18 +
    components.sellThrough * 0.24 +
    components.repeatPurchase * 0.18 +
    components.searchTrend * 0.14 +
    components.customerVoice * 0.10 +
    components.velocity * 0.16;

  const freshnessMultiplier = freshness(input.observedAt, now);
  const sampleMultiplier = sampleConfidence(input.sampleSize);

  return {
    score: Math.round(weighted * freshnessMultiplier * 100),
    confidence: Math.round(sampleMultiplier * freshnessMultiplier * 100),
    components: Object.fromEntries(
      Object.entries(components).map(([key, value]) => [key, Math.round(value * 100)])
    ) as DemandScore["components"],
    freshnessMultiplier,
    sampleMultiplier,
  };
}

export function demandBand(score: number) {
  if (score >= 75) return "HIGH";
  if (score >= 50) return "PROMISING";
  if (score >= 30) return "EARLY";
  return "WEAK";
}
