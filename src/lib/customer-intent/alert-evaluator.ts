import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  customerAlertEvents,
  customerWatchItems,
} from "@/db/schema";
import {
  alertFingerprint,
  sanitizeAlertSignal,
  watchMatchesAlertSignal,
  type CustomerAlertSignal,
} from "./alert-policy";

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
    if (!watchMatchesAlertSignal(watch, signal)) continue;
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
