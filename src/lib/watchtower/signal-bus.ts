import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  watchtowerSignalProjections,
  watchtowerSignals,
} from "@/db/schema";
import { evaluateAndQueueCustomerAlerts } from "@/lib/customer-intent/alert-evaluator";
import {
  parseWatchtowerSignal,
  type WatchtowerSignalInput,
} from "./signal-policy";
import { projectWatchtowerSignalToCustomerAlert } from "./signal-projector";

const CUSTOMER_ALERT_PROJECTOR = "CUSTOMER_ALERT_R0";

export async function ingestWatchtowerSignal(input: WatchtowerSignalInput) {
  const parsed = parseWatchtowerSignal(input);

  const [inserted] = await db
    .insert(watchtowerSignals)
    .values({
      signalKey: parsed.signalKey,
      signalType: parsed.signalType,
      subjectType: parsed.subjectType,
      subjectKey: parsed.subjectKey,
      truthState: parsed.truthState,
      sourceKind: parsed.sourceKind,
      evidenceRef: parsed.evidenceRef,
      observedAt: parsed.observedAt,
      expiresAt: parsed.expiresAt,
      publicPayload: parsed.publicPayload,
      privatePayload: parsed.privatePayload,
      payloadDigest: parsed.payloadDigest,
    })
    .onConflictDoNothing({ target: watchtowerSignals.signalKey })
    .returning();

  const signal =
    inserted ??
    (
      await db
        .select()
        .from(watchtowerSignals)
        .where(eq(watchtowerSignals.signalKey, parsed.signalKey))
        .limit(1)
    )[0];

  if (!signal) throw new Error("WATCHTOWER_SIGNAL_PERSIST_FAILED");

  if (signal.payloadDigest !== parsed.payloadDigest) {
    throw new Error("WATCHTOWER_SIGNAL_KEY_COLLISION");
  }

  const [existingProjection] = await db
    .select()
    .from(watchtowerSignalProjections)
    .where(
      and(
        eq(watchtowerSignalProjections.signalId, signal.id),
        eq(watchtowerSignalProjections.projector, CUSTOMER_ALERT_PROJECTOR)
      )
    )
    .limit(1);

  if (existingProjection) {
    return {
      inserted: Boolean(inserted),
      signal: {
        id: signal.id,
        signalKey: signal.signalKey,
        signalType: signal.signalType,
        subjectType: signal.subjectType,
        subjectKey: signal.subjectKey,
        truthState: signal.truthState,
        payloadDigest: signal.payloadDigest,
      },
      projection: existingProjection.result,
      idempotentReplay: true,
    };
  }

  const customerAlert = projectWatchtowerSignalToCustomerAlert({
    signalKey: signal.signalKey,
    signalType: signal.signalType,
    subjectType: signal.subjectType,
    subjectKey: signal.subjectKey,
    truthState: signal.truthState,
    evidenceRef: signal.evidenceRef,
    publicPayload: signal.publicPayload,
  });

  const result: Record<string, unknown> = customerAlert
    ? await evaluateAndQueueCustomerAlerts(customerAlert)
    : {
        matched: 0,
        queued: 0,
        deduplicated: 0,
        deliveryAuthority: "QUEUE_ONLY_NO_EXTERNAL_DELIVERY",
        projection: "NO_CUSTOMER_ALERT",
      };

  const projectionKey = `customer-alert-r0:${signal.id}`;

  await db
    .insert(watchtowerSignalProjections)
    .values({
      signalId: signal.id,
      projector: CUSTOMER_ALERT_PROJECTOR,
      projectionKey,
      result,
    })
    .onConflictDoNothing({
      target: [
        watchtowerSignalProjections.signalId,
        watchtowerSignalProjections.projector,
      ],
    });

  return {
    inserted: Boolean(inserted),
    signal: {
      id: signal.id,
      signalKey: signal.signalKey,
      signalType: signal.signalType,
      subjectType: signal.subjectType,
      subjectKey: signal.subjectKey,
      truthState: signal.truthState,
      payloadDigest: signal.payloadDigest,
    },
    projection: result,
    idempotentReplay: false,
  };
}
