import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  customerAlertEvents,
  customerWatchItems,
} from "@/db/schema";
import {
  WATCH_ALERT_TYPES,
  WATCH_TARGET_TYPES,
} from "./policy";

export type CustomerAlertSignal = {
  eventType: string;
  targetType: string;
  targetKey: string;
  signalKey: string;
  evidenceRef?: string | null;
  payload?: Record<string, unknown>;
};

const PUBLIC_PAYLOAD_KEYS = new Set([
  "productSlug",
  "brand",
  "eraSlug",
  "requestId",
  "currentPriceCents",
  "previousPriceCents",
  "stockState",
  "routeId",
  "sellerName",
  "publicNote",
  "observedAt",
]);

function bounded(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

export function sanitizeAlertSignal(input: CustomerAlertSignal) {
  const eventType = bounded(input.eventType, 60).toUpperCase();
  const targetType = bounded(input.targetType, 30).toUpperCase();
  const targetKey = bounded(input.targetKey, 255);
  const signalKey = bounded(input.signalKey, 255);
  const evidenceRef = bounded(input.evidenceRef, 1500) || null;

  if (!WATCH_ALERT_TYPES.includes(eventType as (typeof WATCH_ALERT_TYPES)[number])) {
    throw new Error("ALERT_SIGNAL_TYPE_INVALID");
  }
  if (!WATCH_TARGET_TYPES.includes(targetType as (typeof WATCH_TARGET_TYPES)[number])) {
    throw new Error("ALERT_TARGET_TYPE_INVALID");
  }
  if (!targetKey) throw new Error("ALERT_TARGET_KEY_REQUIRED");
  if (!signalKey) throw new Error("ALERT_SIGNAL_KEY_REQUIRED");

  const payload = Object.fromEntries(
    Object.entries(input.payload || {})
      .filter(([key]) => PUBLIC_PAYLOAD_KEYS.has(key))
      .map(([key, value]) => [key, value])
  );

  const serialized = JSON.stringify(payload);
  if (serialized.length > 8_000) throw new Error("ALERT_PUBLIC_PAYLOAD_TOO_LARGE");

  return { eventType, targetType, targetKey, signalKey, evidenceRef, payload };
}

export function alertFingerprint(input: {
  watchItemId: number;
  eventType: string;
  signalKey: string;
}) {
  return createHash("sha256")
    .update(`${input.watchItemId}|${input.eventType}|${input.signalKey}`)
    .digest("hex");
}

function watchMatchesSignal(
  watch: typeof customerWatchItems.$inferSelect,
  signal: ReturnType<typeof sanitizeAlertSignal>
) {
  if (!watch.alertTypes.includes(signal.eventType)) return false;

  if (
    signal.eventType === "PRICE_DROP" &&
    watch.priceThresholdCents !== null
  ) {
    const current = Number(signal.payload.currentPriceCents);
    if (!Number.isInteger(current)) return false;
    if (current > watch.priceThresholdCents) return false;
  }

  return true;
}

export async function evaluateAndQueueCustomerAlerts(
  input: CustomerAlertSignal
) {
  const signal = sanitizeAlertSignal(input);

  const watches = await db
    .select()
    .from(customerWatchItems)
    .where(
      and(
        eq(customerWatchItems.targetType, signal.targetType),
        eq(customerWatchItems.targetKey, signal.targetKey),
        eq(customerWatchItems.status, "ACTIVE")
      )
    );

  let matched = 0;
  let queued = 0;

  for (const watch of watches) {
    if (!watchMatchesSignal(watch, signal)) continue;
    matched += 1;

    const fingerprint = alertFingerprint({
      watchItemId: watch.id,
      eventType: signal.eventType,
      signalKey: signal.signalKey,
    });

    const inserted = await db
      .insert(customerAlertEvents)
      .values({
        watchItemId: watch.id,
        eventType: signal.eventType,
        signalKey: signal.signalKey,
        fingerprint,
        evidenceRef: signal.evidenceRef,
        payload: signal.payload,
        status: "PENDING",
      })
      .onConflictDoNothing({ target: customerAlertEvents.fingerprint })
      .returning({ id: customerAlertEvents.id });

    if (inserted.length) queued += 1;
  }

  return {
    matched,
    queued,
    deduplicated: matched - queued,
    deliveryAuthority: "QUEUE_ONLY_NO_EXTERNAL_DELIVERY" as const,
  };
}
