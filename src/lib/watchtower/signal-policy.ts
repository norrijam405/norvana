import { sha256CanonicalDigest } from "../evidence/canonical-json.ts";

export const WATCHTOWER_SIGNAL_TYPES = [
  "PRICE_OBSERVATION",
  "STOCK_OBSERVATION",
  "ROUTE_BEST_CHANGED",
  "ROUTE_STATE_CHANGED",
  "ERA_STATE_CHANGED",
  "REQUEST_STATE_CHANGED",
  "QUALIFICATION_STATE_CHANGED",
  "PARTNER_STATE_CHANGED",
  "BRAND_STATE_CHANGED",
  "LOCAL_SEASONAL_AVAILABILITY",
  "AUTHORIZATION_OBSERVATION",
  "PROVENANCE_OBSERVATION",
  "RECALL_SAFETY_OBSERVATION",
  "SHIPPING_OBSERVATION",
  "WARRANTY_OBSERVATION",
  "RETURN_POLICY_OBSERVATION",
  "DEMAND_OBSERVATION",
  "CUSTOMER_VOICE_OBSERVATION",
] as const;

export const WATCHTOWER_SIGNAL_SUBJECT_TYPES = [
  "PRODUCT",
  "ROUTE",
  "BRAND",
  "ERA",
  "REQUEST",
  "PROVIDER",
  "CATEGORY",
  "LOCAL_PARTNER",
] as const;

export const WATCHTOWER_TRUTH_STATES = [
  "OBSERVED",
  "VERIFIED",
  "CONFLICT",
] as const;

export const WATCHTOWER_SIGNAL_SOURCE_KINDS = [
  "OFFICIAL_API",
  "OFFICIAL_WEB",
  "PARTNER_FEED",
  "SUPPLIER_API",
  "CUSTOMER_VOICE",
  "INTERNAL",
  "MANUAL_EVIDENCE",
  "GOVERNMENT",
] as const;

const PUBLIC_KEYS = new Set([
  "productSlug",
  "brand",
  "routeId",
  "sellerName",
  "currency",
  "currentPriceCents",
  "previousPriceCents",
  "stockState",
  "previousStockState",
  "eraSlug",
  "currentState",
  "previousState",
  "requestId",
  "publicNote",
  "observedAt",
  "deliveryMinDays",
  "deliveryMaxDays",
  "warrantySummary",
  "returnSummary",
  "authorizationState",
  "provenanceState",
  "recallStatus",
  "demandCount",
  "rating",
  "reviewCount",
  "season",
  "availabilityState",
]);

const PRIVATE_DENY_FRAGMENTS = [
  "password",
  "secret",
  "token",
  "apikey",
  "api_key",
  "accesskey",
  "access_key",
  "cookie",
  "session",
  "customeremail",
  "customer_email",
  "email",
  "phone",
  "address",
  "card",
  "paymentintent",
  "payment_intent",
  "actorkeyhash",
  "actor_key_hash",
];

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

function jsonObject(value: unknown, code: string, maxBytes: number) {
  if (!value) return {};
  if (typeof value !== "object" || Array.isArray(value)) throw new Error(code);
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new Error(code);
  }
  if (serialized.length > maxBytes) throw new Error(code + "_TOO_LARGE");
  return value as Record<string, unknown>;
}

function containsDeniedPrivateKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsDeniedPrivateKey);
  if (!value || typeof value !== "object") return false;

  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (PRIVATE_DENY_FRAGMENTS.some((fragment) => normalized.includes(fragment))) {
      return true;
    }
    if (containsDeniedPrivateKey(nested)) return true;
  }
  return false;
}

export type WatchtowerSignalInput = {
  signalKey: unknown;
  signalType: unknown;
  subjectType: unknown;
  subjectKey: unknown;
  truthState?: unknown;
  sourceKind: unknown;
  evidenceRef: unknown;
  observedAt: unknown;
  expiresAt?: unknown;
  publicPayload?: unknown;
  privatePayload?: unknown;
};

export function parseWatchtowerSignal(
  input: WatchtowerSignalInput,
  now = new Date()
) {
  const signalKey = clean(input.signalKey, 255);
  const signalType = clean(input.signalType, 80).toUpperCase();
  const subjectType = clean(input.subjectType, 40).toUpperCase();
  const subjectKey = clean(input.subjectKey, 255);
  const truthState = clean(input.truthState || "OBSERVED", 30).toUpperCase();
  const sourceKind = clean(input.sourceKind, 60).toUpperCase();
  const evidenceRef = clean(input.evidenceRef, 1500);
  const observedAt = new Date(String(input.observedAt || ""));
  const expiresAt =
    input.expiresAt === undefined || input.expiresAt === null || input.expiresAt === ""
      ? null
      : new Date(String(input.expiresAt));

  if (!signalKey) throw new Error("WATCHTOWER_SIGNAL_KEY_REQUIRED");
  if (
    !WATCHTOWER_SIGNAL_TYPES.includes(
      signalType as (typeof WATCHTOWER_SIGNAL_TYPES)[number]
    )
  ) {
    throw new Error("WATCHTOWER_SIGNAL_TYPE_INVALID");
  }
  if (
    !WATCHTOWER_SIGNAL_SUBJECT_TYPES.includes(
      subjectType as (typeof WATCHTOWER_SIGNAL_SUBJECT_TYPES)[number]
    )
  ) {
    throw new Error("WATCHTOWER_SIGNAL_SUBJECT_INVALID");
  }
  if (!subjectKey) throw new Error("WATCHTOWER_SIGNAL_SUBJECT_KEY_REQUIRED");
  if (
    !WATCHTOWER_TRUTH_STATES.includes(
      truthState as (typeof WATCHTOWER_TRUTH_STATES)[number]
    )
  ) {
    throw new Error("WATCHTOWER_SIGNAL_TRUTH_STATE_INVALID");
  }
  if (
    !WATCHTOWER_SIGNAL_SOURCE_KINDS.includes(
      sourceKind as (typeof WATCHTOWER_SIGNAL_SOURCE_KINDS)[number]
    )
  ) {
    throw new Error("WATCHTOWER_SIGNAL_SOURCE_KIND_INVALID");
  }
  if (!evidenceRef) throw new Error("WATCHTOWER_SIGNAL_EVIDENCE_REQUIRED");
  if (!Number.isFinite(observedAt.getTime())) {
    throw new Error("WATCHTOWER_SIGNAL_OBSERVED_AT_INVALID");
  }
  if (observedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
    throw new Error("WATCHTOWER_SIGNAL_OBSERVED_AT_FUTURE");
  }
  if (expiresAt && !Number.isFinite(expiresAt.getTime())) {
    throw new Error("WATCHTOWER_SIGNAL_EXPIRES_AT_INVALID");
  }
  if (expiresAt && expiresAt <= observedAt) {
    throw new Error("WATCHTOWER_SIGNAL_EXPIRY_INVALID");
  }

  const rawPublic = jsonObject(
    input.publicPayload,
    "WATCHTOWER_SIGNAL_PUBLIC_PAYLOAD_INVALID",
    12_000
  );
  const publicPayload = Object.fromEntries(
    Object.entries(rawPublic).filter(([key]) => PUBLIC_KEYS.has(key))
  );

  if (Object.keys(rawPublic).length !== Object.keys(publicPayload).length) {
    throw new Error("WATCHTOWER_SIGNAL_PUBLIC_PAYLOAD_KEY_NOT_ALLOWED");
  }

  const privatePayload = jsonObject(
    input.privatePayload,
    "WATCHTOWER_SIGNAL_PRIVATE_PAYLOAD_INVALID",
    40_000
  );

  if (containsDeniedPrivateKey(privatePayload)) {
    throw new Error("WATCHTOWER_SIGNAL_PRIVATE_PAYLOAD_SENSITIVE_KEY");
  }

  const normalized = {
    signalKey,
    signalType,
    subjectType,
    subjectKey,
    truthState,
    sourceKind,
    evidenceRef,
    observedAt,
    expiresAt,
    publicPayload,
    privatePayload,
  };

  return {
    ...normalized,
    payloadDigest: sha256CanonicalDigest({
      ...normalized,
      observedAt: observedAt.toISOString(),
      expiresAt: expiresAt?.toISOString() ?? null,
    }),
  };
}

export function signalIsFresh(
  signal: { expiresAt: Date | string | null },
  now = new Date()
) {
  if (!signal.expiresAt) return true;
  const expiresAt = new Date(signal.expiresAt);
  return Number.isFinite(expiresAt.getTime()) && now < expiresAt;
}
