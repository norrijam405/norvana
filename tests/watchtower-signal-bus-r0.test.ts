import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  parseWatchtowerSignal,
  signalIsFresh,
} from "../src/lib/watchtower/signal-policy.ts";
import {
  projectWatchtowerSignalToCustomerAlert,
} from "../src/lib/watchtower/signal-projector.ts";

function baseSignal(overrides: Record<string, unknown> = {}) {
  return {
    signalKey: "price:product-1:2026-10-03T16:00:00Z",
    signalType: "PRICE_OBSERVATION",
    subjectType: "PRODUCT",
    subjectKey: "product-1",
    truthState: "VERIFIED",
    sourceKind: "OFFICIAL_API",
    evidenceRef: "provider:price:123",
    observedAt: "2026-10-03T16:00:00Z",
    expiresAt: "2026-10-04T16:00:00Z",
    publicPayload: {
      productSlug: "product-1",
      currentPriceCents: 49900,
      previousPriceCents: 52900,
      currency: "USD",
    },
    privatePayload: {
      sourceLatencyMs: 120,
    },
    ...overrides,
  };
}

test("signal parser normalizes evidence-backed observations and canonical digest", () => {
  const now = new Date("2026-10-03T16:01:00Z");
  const left = parseWatchtowerSignal(baseSignal(), now);
  const right = parseWatchtowerSignal(
    baseSignal({
      publicPayload: {
        currency: "USD",
        previousPriceCents: 52900,
        currentPriceCents: 49900,
        productSlug: "product-1",
      },
    }),
    now
  );

  assert.equal(left.signalType, "PRICE_OBSERVATION");
  assert.equal(left.truthState, "VERIFIED");
  assert.equal(left.payloadDigest, right.payloadDigest);
  assert.match(left.payloadDigest, /^[a-f0-9]{64}$/);
});

test("signal parser rejects unknown public keys instead of silently exposing data", () => {
  assert.throws(
    () =>
      parseWatchtowerSignal(
        baseSignal({
          publicPayload: {
            productSlug: "product-1",
            customerEmail: "private@example.com",
          },
        }),
        new Date("2026-10-03T16:01:00Z")
      ),
    /WATCHTOWER_SIGNAL_PUBLIC_PAYLOAD_KEY_NOT_ALLOWED/
  );
});

test("signal parser recursively blocks secrets and customer PII from private payload", () => {
  for (const privatePayload of [
    { apiKey: "secret" },
    { nested: { accessToken: "secret" } },
    { customer: { email: "private@example.com" } },
    { billing: { address: "123 Main" } },
  ]) {
    assert.throws(
      () =>
        parseWatchtowerSignal(
          baseSignal({ privatePayload }),
          new Date("2026-10-03T16:01:00Z")
        ),
      /WATCHTOWER_SIGNAL_PRIVATE_PAYLOAD_SENSITIVE_KEY/
    );
  }
});

test("signal parser rejects implausible future observations and bad expiry windows", () => {
  assert.throws(
    () =>
      parseWatchtowerSignal(
        baseSignal({ observedAt: "2026-10-03T17:00:00Z" }),
        new Date("2026-10-03T16:00:00Z")
      ),
    /WATCHTOWER_SIGNAL_OBSERVED_AT_FUTURE/
  );

  assert.throws(
    () =>
      parseWatchtowerSignal(
        baseSignal({ expiresAt: "2026-10-03T15:59:59Z" }),
        new Date("2026-10-03T16:01:00Z")
      ),
    /WATCHTOWER_SIGNAL_EXPIRY_INVALID/
  );
});

test("signal freshness derives from expiry without mutating historical truth", () => {
  assert.equal(
    signalIsFresh(
      { expiresAt: "2026-10-03T17:00:00Z" },
      new Date("2026-10-03T16:00:00Z")
    ),
    true
  );
  assert.equal(
    signalIsFresh(
      { expiresAt: "2026-10-03T15:00:00Z" },
      new Date("2026-10-03T16:00:00Z")
    ),
    false
  );
});

test("only VERIFIED price decreases project into customer price-drop alerts", () => {
  const verified = projectWatchtowerSignalToCustomerAlert({
    signalKey: "price-1",
    signalType: "PRICE_OBSERVATION",
    subjectType: "PRODUCT",
    subjectKey: "product-1",
    truthState: "VERIFIED",
    evidenceRef: "price:evidence",
    publicPayload: {
      currentPriceCents: 49900,
      previousPriceCents: 52900,
      productSlug: "product-1",
    },
  });

  assert.equal(verified?.eventType, "PRICE_DROP");
  assert.equal(verified?.targetType, "PRODUCT");

  assert.equal(
    projectWatchtowerSignalToCustomerAlert({
      signalKey: "price-2",
      signalType: "PRICE_OBSERVATION",
      subjectType: "PRODUCT",
      subjectKey: "product-1",
      truthState: "OBSERVED",
      evidenceRef: "price:evidence",
      publicPayload: {
        currentPriceCents: 49900,
        previousPriceCents: 52900,
      },
    }),
    null
  );

  assert.equal(
    projectWatchtowerSignalToCustomerAlert({
      signalKey: "price-3",
      signalType: "PRICE_OBSERVATION",
      subjectType: "PRODUCT",
      subjectKey: "product-1",
      truthState: "VERIFIED",
      evidenceRef: "price:evidence",
      publicPayload: {
        currentPriceCents: 53900,
        previousPriceCents: 52900,
      },
    }),
    null
  );
});

test("verified state-change signals project to the intended customer watch types", () => {
  const cases = [
    {
      signalType: "STOCK_OBSERVATION",
      subjectType: "PRODUCT",
      eventType: "BACK_IN_STOCK",
      payload: { stockState: "IN_STOCK", previousStockState: "OUT_OF_STOCK" },
    },
    {
      signalType: "BRAND_STATE_CHANGED",
      subjectType: "BRAND",
      eventType: "BRAND_ADDED",
      payload: { currentState: "ACTIVE", previousState: "QUALIFYING" },
    },
    {
      signalType: "ERA_STATE_CHANGED",
      subjectType: "ERA",
      eventType: "ERA_OPENS",
      payload: { currentState: "ACTIVE", previousState: "SCHEDULED" },
    },
    {
      signalType: "REQUEST_STATE_CHANGED",
      subjectType: "REQUEST",
      eventType: "REQUEST_STATUS",
      payload: { currentState: "SOURCE_FOUND", previousState: "RESEARCHING" },
    },
    {
      signalType: "ROUTE_BEST_CHANGED",
      subjectType: "PRODUCT",
      eventType: "BETTER_ROUTE",
      payload: { routeId: 4 },
    },
  ];

  for (const item of cases) {
    const projected = projectWatchtowerSignalToCustomerAlert({
      signalKey: "signal-" + item.eventType,
      signalType: item.signalType,
      subjectType: item.subjectType,
      subjectKey: "subject-1",
      truthState: "VERIFIED",
      evidenceRef: "evidence:1",
      publicPayload: item.payload,
    });
    assert.equal(projected?.eventType, item.eventType);
  }
});

test("Signal Bus migration is append-only at PostgreSQL level", async () => {
  const migration = await readFile(
    new URL("../drizzle/0014_watchtower_signal_bus_r0.sql", import.meta.url),
    "utf8"
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS watchtower_signals/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS watchtower_signal_projections/);
  assert.match(migration, /reject_watchtower_signal_mutation/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON watchtower_signals/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON watchtower_signal_projections/);
});

test("Signal Bus ingestion is idempotent and collision-sensitive", async () => {
  const source = await readFile(
    new URL("../src/lib/watchtower/signal-bus.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /onConflictDoNothing/);
  assert.match(source, /WATCHTOWER_SIGNAL_KEY_COLLISION/);
  assert.match(source, /CUSTOMER_ALERT_R0/);
  assert.match(source, /evaluateAndQueueCustomerAlerts/);
  assert.match(source, /idempotentReplay/);
});

test("Signal Bus API is observe/project/queue only", async () => {
  const source = await readFile(
    new URL("../src/app/api/admin/watchtower/signals/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /requireCurrentRecoveryAdmin/);
  assert.match(source, /OBSERVE_PROJECT_QUEUE_ONLY/);
  assert.doesNotMatch(source, /sendEmail|sendSms|sendPush|twilio|sendgrid|mailgun/i);
  assert.doesNotMatch(source, /PRODUCT_ROUTE_ACTIVATE|ERA_ACTIVATE|supplier.*activate/i);
});
