import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  canonicalSnapshotJson,
  snapshotDigest,
} from "../src/lib/era-engine/archive-canonical.ts";
import {
  alertFingerprint,
  sanitizeAlertSignal,
  watchMatchesAlertSignal,
} from "../src/lib/customer-intent/alert-policy.ts";

test("archive canonicalization is deterministic across object key order", () => {
  const left = {
    z: 3,
    a: {
      y: 2,
      x: 1,
    },
    date: new Date("2026-10-03T16:00:00Z"),
  };
  const right = {
    date: new Date("2026-10-03T16:00:00Z"),
    a: {
      x: 1,
      y: 2,
    },
    z: 3,
  };

  assert.equal(canonicalSnapshotJson(left), canonicalSnapshotJson(right));
  assert.equal(snapshotDigest(left), snapshotDigest(right));
  assert.match(snapshotDigest(left), /^[a-f0-9]{64}$/);
});

test("alert policy strips private/unapproved payload keys", () => {
  const signal = sanitizeAlertSignal({
    eventType: "price_drop",
    targetType: "product",
    targetKey: "phone-1",
    signalKey: "price-2026-10-03T16:00Z",
    evidenceRef: "watchtower:price:123",
    payload: {
      productSlug: "phone-1",
      currentPriceCents: 49900,
      previousPriceCents: 52900,
      supplierCostCents: 30000,
      internalContributionCents: 12000,
      customerEmail: "do-not-copy@example.com",
    },
  });

  assert.equal(signal.eventType, "PRICE_DROP");
  assert.equal(signal.payload.productSlug, "phone-1");
  assert.equal(signal.payload.currentPriceCents, 49900);
  assert.equal("supplierCostCents" in signal.payload, false);
  assert.equal("internalContributionCents" in signal.payload, false);
  assert.equal("customerEmail" in signal.payload, false);
});

test("alert fingerprint is stable and scoped to watch item", () => {
  const a = alertFingerprint({
    watchItemId: 10,
    eventType: "PRICE_DROP",
    signalKey: "signal-1",
  });
  const b = alertFingerprint({
    watchItemId: 10,
    eventType: "PRICE_DROP",
    signalKey: "signal-1",
  });
  const c = alertFingerprint({
    watchItemId: 11,
    eventType: "PRICE_DROP",
    signalKey: "signal-1",
  });

  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[a-f0-9]{64}$/);
});

test("price-drop alert honors customer threshold", () => {
  const signal = sanitizeAlertSignal({
    eventType: "PRICE_DROP",
    targetType: "PRODUCT",
    targetKey: "laptop",
    signalKey: "price-1",
    evidenceRef: "watchtower:price:1",
    payload: { currentPriceCents: 89900 },
  });

  assert.equal(
    watchMatchesAlertSignal(
      { id: 1, alertTypes: ["PRICE_DROP"], priceThresholdCents: 90000 },
      signal
    ),
    true
  );
  assert.equal(
    watchMatchesAlertSignal(
      { id: 2, alertTypes: ["PRICE_DROP"], priceThresholdCents: 85000 },
      signal
    ),
    false
  );
});

test("archive migration makes snapshots immutable at PostgreSQL level", async () => {
  const migration = await readFile(
    new URL("../drizzle/0013_archive_alert_activation_r0.sql", import.meta.url),
    "utf8"
  );

  assert.match(migration, /CREATE TABLE IF NOT EXISTS era_archive_snapshots/);
  assert.match(migration, /reject_era_archive_snapshot_mutation/);
  assert.match(migration, /BEFORE UPDATE ON era_archive_snapshots/);
  assert.match(migration, /BEFORE DELETE ON era_archive_snapshots/);
  assert.match(migration, /customer_alert_events_fingerprint_idx/);
  assert.doesNotMatch(migration, /pgcrypto/i);
  assert.doesNotMatch(migration, /digest\(/i);
});

test("Era archive snapshot deliberately omits private product and route economics", async () => {
  const source = await readFile(
    new URL("../src/lib/era-engine/archive.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /ACRE_ERA_ARCHIVE_SNAPSHOT_R0/);
  assert.match(source, /curationReason/);
  assert.match(source, /rightsState/);
  assert.doesNotMatch(source, /products\.cost/);
  assert.doesNotMatch(source, /internalContributionCents/);
  assert.doesNotMatch(source, /internalContributionMarginBps/);
  assert.doesNotMatch(source, /customerEmail/);
});

test("closing an Era delegates to the canonical atomic lifecycle service", async () => {
  const [route, service] = await Promise.all([
    readFile(
      new URL("../src/app/api/admin/eras/[id]/close/route.ts", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../src/lib/era-engine/lifecycle-service.ts", import.meta.url),
      "utf8"
    ),
  ]);

  assert.match(route, /closeEra/);
  assert.match(route, /closureEvidenceRef/);
  assert.match(service, /buildEraArchiveSnapshot/);
  assert.match(service, /db\.transaction/);
  assert.match(service, /eraArchiveSnapshots/);
  assert.match(service, /snapshotDigest/);
  assert.match(service, /lifecycleState: "CLOSED"/);
  assert.match(service, /ERA_CLOSE/);
  assert.match(service, /ADMIN_ACT_WITH_IMMUTABLE_SNAPSHOT/);
});

test("archiving delegates to the canonical service and requires a closure snapshot", async () => {
  const [route, service] = await Promise.all([
    readFile(
      new URL("../src/app/api/admin/eras/[id]/archive/route.ts", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../src/lib/era-engine/lifecycle-service.ts", import.meta.url),
      "utf8"
    ),
  ]);

  assert.match(route, /archiveEra/);
  assert.match(route, /archiveEvidenceRef/);
  assert.match(service, /ERA_ARCHIVE_CLOSURE_SNAPSHOT_REQUIRED/);
  assert.match(service, /snapshotKind, "CLOSURE"/);
  assert.match(service, /lifecycleState: "ARCHIVED"/);
  assert.match(service, /eq\(eras\.lifecycleState, "CLOSED"\)/);
  assert.match(service, /ERA_ARCHIVE/);
});

test("media, route, and Era activation remain evidence-gated and transactional", async () => {
  const [media, route, era, lifecycleService] = await Promise.all([
    readFile(
      new URL("../src/app/api/admin/era-media/[id]/approve/route.ts", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../src/app/api/admin/routes/[id]/activate/route.ts", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../src/app/api/admin/eras/[id]/activate/route.ts", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../src/lib/era-engine/lifecycle-service.ts", import.meta.url),
      "utf8"
    ),
  ]);

  assert.match(media, /approvalEvidenceRef/);
  assert.match(media, /evaluateMediaApprovalReadiness/);
  assert.match(media, /db\.transaction/);
  assert.match(media, /ERA_MEDIA_APPROVE/);

  assert.match(route, /activationEvidenceRef/);
  assert.match(route, /evaluateRouteActivationReadiness/);
  assert.match(route, /ROUTE_ACTIVATION_POLICY_NOT_CONFIGURED|routeActivationThresholdsFromEnv/);
  assert.match(route, /db\.transaction/);
  assert.match(route, /PRODUCT_ROUTE_ACTIVATE/);

  assert.match(era, /activationEvidenceRef/);
  assert.match(era, /expectedReadinessDigest/);
  assert.match(era, /activateEra/);
  assert.match(lifecycleService, /currentReadinessDigest/);
  assert.match(lifecycleService, /evaluateEraActivationReadiness/);
  assert.match(lifecycleService, /db\.transaction/);
  assert.match(lifecycleService, /ERA_ACTIVATE/);
  assert.match(lifecycleService, /ERA_CHANGED_AFTER_READINESS/);
  assert.match(lifecycleService, /ERA_CHANGED_BEFORE_ACTIVATION/);
});

test("alert evaluator queues only and does not contain delivery integrations", async () => {
  const [evaluator, endpoint] = await Promise.all([
    readFile(
      new URL("../src/lib/customer-intent/alert-evaluator.ts", import.meta.url),
      "utf8"
    ),
    readFile(
      new URL("../src/app/api/admin/customer-alerts/evaluate/route.ts", import.meta.url),
      "utf8"
    ),
  ]);

  assert.match(evaluator, /QUEUE_ONLY_NO_EXTERNAL_DELIVERY/);
  assert.match(evaluator, /onConflictDoNothing/);
  assert.match(endpoint, /QUEUE_ONLY_NO_EXTERNAL_DELIVERY/);
  assert.doesNotMatch(evaluator, /sendEmail|sendSms|sendPush|twilio|sendgrid|mailgun/i);
  assert.doesNotMatch(endpoint, /sendEmail|sendSms|sendPush|twilio|sendgrid|mailgun/i);
});

test("route activation policy remains deliberately unconfigured by default", async () => {
  const [activation, env] = await Promise.all([
    readFile(new URL("../src/lib/governance/activation.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(activation, /ROUTE_ACTIVATION_POLICY_NOT_CONFIGURED/);
  assert.match(activation, /REQUIRED_AUTHORIZATION_BY_ROUTE/);
  assert.match(activation, /ROUTE_AUTHORIZATION_MISMATCH/);
  assert.match(activation, /ROUTE_AUTHENTICATED_RESALE_PROOF_MISSING/);
  assert.match(env, /NORVANA_ROUTE_MIN_CONTRIBUTION_CENTS=/);
  assert.match(env, /NORVANA_ROUTE_MIN_MARGIN_BPS=/);
});


test("closed and archived public Eras resolve from immutable snapshots, not live product joins", async () => {
  const source = await readFile(
    new URL("../src/lib/era-engine/resolver.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /\["CLOSED", "ARCHIVED"\]\.includes\(era\.lifecycleState\)/);
  assert.match(source, /eraArchiveSnapshots/);
  assert.match(source, /resolveArchivedPublicEra/);
  assert.match(source, /ACRE_ERA_ARCHIVE_SNAPSHOT_R0/);
  assert.match(source, /Archived third-party imagery is hidden by default/);
  assert.match(source, /currentMediaById/);
  assert.match(source, /current\.mediaUrl !== historicalUrl/);
});


test("approved media can be revoked without mutating archive history", async () => {
  const source = await readFile(
    new URL("../src/app/api/admin/era-media/[id]/revoke/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /revocationEvidenceRef/);
  assert.match(source, /rightsState: "REVOKED"/);
  assert.match(source, /status: "REVOKED"/);
  assert.match(source, /ERA_MEDIA_REVOKE/);
  assert.match(source, /db\.transaction/);
});

test("active customer routes have an evidence-gated suspension path", async () => {
  const source = await readFile(
    new URL("../src/app/api/admin/routes/[id]/suspend/route.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /suspensionEvidenceRef/);
  assert.match(source, /eq\(productRoutes\.status, "ACTIVE"\)/);
  assert.match(source, /status: "SUSPENDED"/);
  assert.match(source, /PRODUCT_ROUTE_SUSPEND/);
  assert.match(source, /db\.transaction/);
});


test("closure snapshot consistency is protected by Era content revision CAS", async () => {
  const [migration, archive, service, schema] = await Promise.all([
    readFile(
      new URL("../drizzle/0015_era_closure_snapshot_consistency_r0.sql", import.meta.url),
      "utf8"
    ),
    readFile(new URL("../src/lib/era-engine/archive.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/lib/era-engine/lifecycle-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/db/schema.ts", import.meta.url), "utf8"),
  ]);

  assert.match(schema, /contentRevision: integer\("content_revision"\)/);
  assert.match(archive, /eraContentRevision/);
  assert.match(archive, /ERA_CHANGED_DURING_SNAPSHOT/);
  assert.match(service, /buildEraArchiveSnapshotInTransaction/);
  assert.match(service, /eq\(eras\.contentRevision, current\.contentRevision\)/);

  for (const trigger of [
    "era_products_bump_content_revision",
    "era_sections_bump_content_revision",
    "era_media_assets_bump_content_revision",
    "era_watchtower_bindings_bump_content_revision",
    "products_bump_era_content_revision",
  ]) {
    assert.match(migration, new RegExp(trigger));
  }

  assert.match(migration, /BEFORE INSERT OR UPDATE OR DELETE ON era_products/);
  assert.match(migration, /BEFORE INSERT OR UPDATE OR DELETE ON era_sections/);
  assert.match(migration, /BEFORE INSERT OR UPDATE OR DELETE ON era_media_assets/);
  assert.match(migration, /BEFORE INSERT OR UPDATE OR DELETE ON era_watchtower_bindings/);
  assert.match(migration, /BEFORE UPDATE OR DELETE ON products/);
});
