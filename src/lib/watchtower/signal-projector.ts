import type { CustomerAlertSignal } from "../customer-intent/alert-policy.ts";

export type ProjectableWatchtowerSignal = {
  signalKey: string;
  signalType: string;
  subjectType: string;
  subjectKey: string;
  truthState: string;
  evidenceRef: string;
  publicPayload: Record<string, unknown>;
};

function state(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

function integer(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export function projectWatchtowerSignalToCustomerAlert(
  signal: ProjectableWatchtowerSignal
): CustomerAlertSignal | null {
  // Customer notifications require verified truth. OBSERVED remains useful
  // internally but must not become a confident customer alert.
  if (signal.truthState !== "VERIFIED") return null;

  const payload = signal.publicPayload;

  switch (signal.signalType) {
    case "PRICE_OBSERVATION": {
      if (signal.subjectType !== "PRODUCT") return null;
      const current = integer(payload.currentPriceCents);
      const previous = integer(payload.previousPriceCents);
      if (current === null || previous === null || current >= previous) return null;
      return {
        eventType: "PRICE_DROP",
        targetType: "PRODUCT",
        targetKey: signal.subjectKey,
        signalKey: signal.signalKey,
        evidenceRef: signal.evidenceRef,
        payload,
      };
    }

    case "STOCK_OBSERVATION":
      if (
        signal.subjectType === "PRODUCT" &&
        state(payload.stockState) === "IN_STOCK" &&
        state(payload.previousStockState) !== "IN_STOCK"
      ) {
        return {
          eventType: "BACK_IN_STOCK",
          targetType: "PRODUCT",
          targetKey: signal.subjectKey,
          signalKey: signal.signalKey,
          evidenceRef: signal.evidenceRef,
          payload,
        };
      }
      return null;

    case "BRAND_STATE_CHANGED":
      if (
        signal.subjectType === "BRAND" &&
        state(payload.currentState) === "ACTIVE" &&
        state(payload.previousState) !== "ACTIVE"
      ) {
        return {
          eventType: "BRAND_ADDED",
          targetType: "BRAND",
          targetKey: signal.subjectKey,
          signalKey: signal.signalKey,
          evidenceRef: signal.evidenceRef,
          payload,
        };
      }
      return null;

    case "ERA_STATE_CHANGED":
      if (
        signal.subjectType === "ERA" &&
        state(payload.currentState) === "ACTIVE" &&
        state(payload.previousState) !== "ACTIVE"
      ) {
        return {
          eventType: "ERA_OPENS",
          targetType: "ERA",
          targetKey: signal.subjectKey,
          signalKey: signal.signalKey,
          evidenceRef: signal.evidenceRef,
          payload,
        };
      }
      return null;

    case "LOCAL_SEASONAL_AVAILABILITY":
      if (
        signal.subjectType === "PRODUCT" &&
        state(payload.availabilityState) === "AVAILABLE"
      ) {
        return {
          eventType: "LOCAL_SEASONAL",
          targetType: "PRODUCT",
          targetKey: signal.subjectKey,
          signalKey: signal.signalKey,
          evidenceRef: signal.evidenceRef,
          payload,
        };
      }
      return null;

    case "ROUTE_BEST_CHANGED":
      if (signal.subjectType !== "PRODUCT") return null;
      return {
        eventType: "BETTER_ROUTE",
        targetType: "PRODUCT",
        targetKey: signal.subjectKey,
        signalKey: signal.signalKey,
        evidenceRef: signal.evidenceRef,
        payload,
      };

    case "REQUEST_STATE_CHANGED":
      if (signal.subjectType !== "REQUEST") return null;
      return {
        eventType: "REQUEST_STATUS",
        targetType: "REQUEST",
        targetKey: signal.subjectKey,
        signalKey: signal.signalKey,
        evidenceRef: signal.evidenceRef,
        payload,
      };

    case "QUALIFICATION_STATE_CHANGED":
      if (
        !["PRODUCT", "BRAND"].includes(signal.subjectType) ||
        state(payload.currentState) !== "APPROVED"
      ) {
        return null;
      }
      return {
        eventType: "QUALIFICATION_COMPLETE",
        targetType: signal.subjectType,
        targetKey: signal.subjectKey,
        signalKey: signal.signalKey,
        evidenceRef: signal.evidenceRef,
        payload,
      };

    case "PARTNER_STATE_CHANGED":
      if (!["PRODUCT", "BRAND"].includes(signal.subjectType)) return null;
      return {
        eventType: "PARTNER_CHANGE",
        targetType: signal.subjectType,
        targetKey: signal.subjectKey,
        signalKey: signal.signalKey,
        evidenceRef: signal.evidenceRef,
        payload,
      };

    default:
      return null;
  }
}
