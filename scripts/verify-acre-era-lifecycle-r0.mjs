import pg from "pg";
import { pool } from "../src/db/index.ts";
import { evaluateEraActivationReadiness } from "../src/lib/era-engine/readiness.ts";
import { buildEraArchiveSnapshot } from "../src/lib/era-engine/archive.ts";
import {
  resolveCurrentPublicEra,
  resolvePublicEraBySlug,
} from "../src/lib/era-engine/resolver.ts";
import {
  activateEra,
  archiveEra,
  closeEra,
  EraLifecycleError,
} from "../src/lib/era-engine/lifecycle-service.ts";
import { ingestWatchtowerSignal } from "../src/lib/watchtower/signal-bus.ts";
import { evaluateAndQueueCustomerAlerts } from "../src/lib/customer-intent/alert-evaluator.ts";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const client = new Client({ connectionString: databaseUrl });
await client.connect();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function one(sql, params = []) {
  const { rows } = await client.query(sql, params);
  assert(rows.length === 1, "expected exactly one row");
  return rows[0];
}

async function expectCode(label, expectedCode, fn) {
  let caught = null;
  try {
    await fn();
  } catch (error) {
    caught = error;
  }
  assert(caught, label + " unexpectedly succeeded");
  const code =
    caught instanceof EraLifecycleError
      ? caught.code
      : caught instanceof Error
        ? caught.message
        : String(caught);
  assert(
    code === expectedCode,
    label + " rejected with " + code + " instead of " + expectedCode
  );
}

async function expectReject(label, fn) {
  let rejected = false;
  try {
    await fn();
  } catch {
    rejected = true;
  }
  assert(rejected, label + " unexpectedly succeeded");
}

async function seedReadyEra({ slug, name, productId, mediaUrl, now }) {
  const era = await one(
    `insert into eras
      (slug, name, eyebrow, story, kind, lifecycle_state, visibility, is_primary,
       theme_tokens, watchtower_profile, archive_policy, created_at, updated_at)
     values
      ($1, $2, 'Synthetic proof',
       'A synthetic Era used only to prove isolated backend application semantics.',
       'CATEGORY', 'DRAFT', 'PRIVATE', false,
       '{"preset":"cleanTech"}'::json,
       '{"profile":"proof"}'::json,
       '{"mode":"immutable-closure"}'::json,
       $3, $3)
     returning *`,
    [slug, name, now]
  );

  await client.query(
    `insert into era_sections (era_id, section_type, position, config, status)
     values
      ($1, 'HERO', 0, '{"headline":"Lifecycle Proof"}'::json, 'ENABLED'),
      ($1, 'PRODUCT_GRID', 1, '{"columns":4}'::json, 'ENABLED')`,
    [era.id]
  );

  const media = await one(
    `insert into era_media_assets
      (era_id, asset_type, media_url, rights_state, rights_evidence_ref,
       source_label, status, sha256, alt_text, created_at, updated_at)
     values
      ($1, 'HERO_IMAGE', $2, 'OWNED', 'synthetic:rights:owned',
       'Acre Era synthetic proof', 'APPROVED', $3,
       'Synthetic Acre Era lifecycle proof hero', $4, $4)
     returning *`,
    [era.id, mediaUrl, "a".repeat(64), now]
  );

  await client.query(
    `insert into era_products
      (era_id, product_id, position, role, curation_reason, evidence_ref, status, assigned_at)
     values
      ($1, $2, 0, 'FEATURED', 'Synthetic lifecycle proof assignment',
       'synthetic:lifecycle-proof:curation', 'ACTIVE', $3)`,
    [era.id, productId, now]
  );

  await client.query(
    `insert into era_watchtower_bindings
      (era_id, watch_job_slug, importance, public_facet, config)
     values
      ($1, 'product-economics-watch', 10, 'price-history', '{"mode":"read-only"}'::json)`,
    [era.id]
  );

  return { era, media };
}

const t0 = new Date("2026-10-03T19:30:00.000Z");
const slug = "lifecycle-proof-era";
const productSlug = "lifecycle-proof-product";
const mediaUrl = "https://assets.example.invalid/acre-era/lifecycle-proof-hero.jpg";

const product = await one(
  `insert into products
    (name, slug, description, price, compare_at_price, cost, niche, status,
     commerce_model, source_provider_slug, brand_name, product_condition,
     authorization_state, image_rights_state, external_seller_name,
     product_evidence, images, inventory)
   values
    ('Lifecycle Proof Product', $1, 'Synthetic isolated lifecycle proof product',
     125.00, 150.00, 80.00, 'proof', 'active',
     'QUALIFIED_SUPPLIER', 'synthetic-owned', 'Acre Era', 'NEW',
     'DIRECT_RETAIL_AUTHORIZED', 'OWNED', 'Acre Era',
     $2::json, $3::json, 12)
   returning *`,
  [
    productSlug,
    JSON.stringify({ evidenceRef: "synthetic:lifecycle-proof:product" }),
    JSON.stringify(["https://assets.example.invalid/acre-era/proof-product.jpg"]),
  ]
);

const seeded = await seedReadyEra({
  slug,
  name: "Lifecycle Proof Era",
  productId: product.id,
  mediaUrl,
  now: t0,
});
const era = seeded.era;
const media = seeded.media;

const initialReadiness = await evaluateEraActivationReadiness(
  era.id,
  new Date(t0.getTime() + 1_000)
);
assert(initialReadiness, "production readiness did not find Era");
assert(initialReadiness.ready === true, "production readiness unexpectedly blocked");
assert(/^[a-f0-9]{64}$/.test(initialReadiness.readinessDigest), "invalid readiness digest");

await expectCode(
  "mismatched readiness digest",
  "ERA_READINESS_CHANGED",
  () =>
    activateEra({
      eraId: era.id,
      activationEvidenceRef: "synthetic:lifecycle-proof:activation",
      expectedReadinessDigest: "0".repeat(64),
      makePrimary: true,
      actor: "ci",
      now: new Date(t0.getTime() + 2_000),
    })
);

await client.query(
  "update eras set eyebrow='Mutated after readiness', updated_at=$2 where id=$1",
  [era.id, new Date(t0.getTime() + 3_000)]
);

await expectCode(
  "stale readiness after Era mutation",
  "ERA_READINESS_CHANGED",
  () =>
    activateEra({
      eraId: era.id,
      activationEvidenceRef: "synthetic:lifecycle-proof:activation",
      expectedReadinessDigest: initialReadiness.readinessDigest,
      makePrimary: true,
      actor: "ci",
      now: new Date(t0.getTime() + 4_000),
    })
);

const currentReadiness = await evaluateEraActivationReadiness(
  era.id,
  new Date(t0.getTime() + 5_000)
);
assert(currentReadiness?.ready === true, "remediated readiness not ready");

const activation = await activateEra({
  eraId: era.id,
  activationEvidenceRef: "synthetic:lifecycle-proof:activation",
  expectedReadinessDigest: currentReadiness.readinessDigest,
  makePrimary: true,
  actor: "ci",
  now: new Date(t0.getTime() + 6_000),
});
assert(activation.era.lifecycleState === "ACTIVE", "production activation failed");

const currentResolved = await resolveCurrentPublicEra(
  new Date(t0.getTime() + 7_000)
);
assert(currentResolved.ok === true, "production current resolver did not resolve active Era");
assert(currentResolved.era.slug === slug, "production current resolver returned wrong Era");

await expectCode(
  "archive without closure snapshot",
  "ERA_ARCHIVE_CLOSURE_SNAPSHOT_REQUIRED",
  () =>
    archiveEra({
      eraId: era.id,
      archiveEvidenceRef: "synthetic:lifecycle-proof:archive-too-early",
      actor: "ci",
      now: new Date(t0.getTime() + 8_000),
    })
);

const watchItem = await one(
  `insert into customer_watch_items
    (actor_key_hash, target_type, target_key, alert_types, price_threshold_cents, status)
   values
    ($1, 'PRODUCT', $2, '["PRICE_DROP"]'::json, 12000, 'ACTIVE')
   returning *`,
  ["b".repeat(64), productSlug]
);

const signalInput = {
  signalKey: "synthetic:price:" + productSlug + ":1",
  signalType: "PRICE_OBSERVATION",
  subjectType: "PRODUCT",
  subjectKey: productSlug,
  truthState: "VERIFIED",
  sourceKind: "MANUAL_EVIDENCE",
  evidenceRef: "synthetic:lifecycle-proof:price",
  observedAt: new Date(t0.getTime() + 9_000).toISOString(),
  publicPayload: {
    productSlug,
    currentPriceCents: 11900,
    previousPriceCents: 12500,
    currency: "USD",
  },
  privatePayload: {
    internalNote: "synthetic non-sensitive proof detail",
  },
};

const firstIngest = await ingestWatchtowerSignal(signalInput);
assert(firstIngest.inserted === true, "production signal bus did not insert");
assert(firstIngest.idempotentReplay === false, "first signal ingest marked replay");

const replayIngest = await ingestWatchtowerSignal(signalInput);
assert(replayIngest.inserted === false, "signal replay inserted duplicate");
assert(replayIngest.idempotentReplay === true, "signal replay not recognized");

await expectReject("same-key different-payload collision", () =>
  ingestWatchtowerSignal({
    ...signalInput,
    publicPayload: {
      ...signalInput.publicPayload,
      currentPriceCents: 11800,
    },
  })
);

await expectReject("sensitive private signal payload", () =>
  ingestWatchtowerSignal({
    ...signalInput,
    signalKey: signalInput.signalKey + ":private-reject",
    privatePayload: { customerEmail: "never@example.invalid" },
  })
);

const directSanitize = await evaluateAndQueueCustomerAlerts({
  eventType: "PRICE_DROP",
  targetType: "PRODUCT",
  targetKey: productSlug,
  signalKey: "synthetic:direct-alert-sanitize",
  evidenceRef: "synthetic:lifecycle-proof:alert-sanitize",
  payload: {
    productSlug,
    currentPriceCents: 11900,
    customerEmail: "must-not-persist@example.invalid",
    accessToken: "must-not-persist",
  },
});
assert(directSanitize.matched === 1, "direct alert evaluator did not match watch");
assert(directSanitize.queued === 1, "direct alert evaluator did not queue");

const sanitizedAlert = await one(
  "select payload from customer_alert_events where signal_key=$1",
  ["synthetic:direct-alert-sanitize"]
);
assert(!("customerEmail" in sanitizedAlert.payload), "private email leaked to alert payload");
assert(!("accessToken" in sanitizedAlert.payload), "private token leaked to alert payload");

const firstAlertRows = await client.query(
  "select * from customer_alert_events where signal_key=$1",
  [signalInput.signalKey]
);
assert(firstAlertRows.rows.length === 1, "signal bus replay created duplicate alert");

const builtBeforeClose = await buildEraArchiveSnapshot(era.id);
assert(builtBeforeClose, "production archive builder did not build snapshot");

const closure = await closeEra({
  eraId: era.id,
  closureEvidenceRef: "synthetic:lifecycle-proof:closure",
  publicNote: "Synthetic closure proof",
  actor: "ci",
  now: new Date(t0.getTime() + 10_000),
});
assert(closure.era.lifecycleState === "CLOSED", "production closure failed");
assert(
  closure.snapshot.snapshotDigest === builtBeforeClose.digest,
  "persisted closure digest differs from production builder"
);

await expectReject("immutable archive snapshot update", () =>
  client.query("update era_archive_snapshots set actor='mutated' where id=$1", [
    closure.snapshot.id,
  ])
);
await expectReject("immutable archive snapshot delete", () =>
  client.query("delete from era_archive_snapshots where id=$1", [closure.snapshot.id])
);

const archived = await archiveEra({
  eraId: era.id,
  archiveEvidenceRef: "synthetic:lifecycle-proof:archive",
  actor: "ci",
  now: new Date(t0.getTime() + 11_000),
});
assert(archived.era.lifecycleState === "ARCHIVED", "production archive failed");

await client.query("update products set price=999.99 where id=$1", [product.id]);

const archivedResolvedBeforeRevocation = await resolvePublicEraBySlug(
  slug,
  new Date(t0.getTime() + 12_000)
);
assert(archivedResolvedBeforeRevocation, "archived production resolver returned null");
assert(
  Number(archivedResolvedBeforeRevocation.products[0]?.price) === 125,
  "archived production resolver leaked live product mutation"
);
assert(
  archivedResolvedBeforeRevocation.media.some((asset) => asset.id === media.id),
  "archived media disappeared before revocation"
);

const snapshotBeforeRevocation = await one(
  "select snapshot from era_archive_snapshots where id=$1",
  [closure.snapshot.id]
);

await client.query(
  `update era_media_assets
      set rights_state='REVOKED', status='REVOKED',
          rights_evidence_ref='synthetic:lifecycle-proof:revocation',
          updated_at=$2
    where id=$1`,
  [media.id, new Date(t0.getTime() + 13_000)]
);

const archivedResolvedAfterRevocation = await resolvePublicEraBySlug(
  slug,
  new Date(t0.getTime() + 14_000)
);
assert(archivedResolvedAfterRevocation, "archived resolver returned null after revocation");
assert(
  !archivedResolvedAfterRevocation.media.some((asset) => asset.id === media.id),
  "revoked current media remained visible in archived resolution"
);

const snapshotAfterRevocation = await one(
  "select snapshot from era_archive_snapshots where id=$1",
  [closure.snapshot.id]
);
assert(
  JSON.stringify(snapshotAfterRevocation.snapshot) ===
    JSON.stringify(snapshotBeforeRevocation.snapshot),
  "immutable historical snapshot bytes changed after media revocation"
);

const lifecycleEvents = await client.query(
  "select event_type from era_events where era_id=$1 order by id",
  [era.id]
);
assert(
  lifecycleEvents.rows.map((row) => row.event_type).join(",") ===
    "ERA_ACTIVATED,ERA_CLOSED,ERA_ARCHIVED",
  "production lifecycle events missing or out of order"
);

const receipts = await client.query(
  "select action_type from action_receipts where subject_type='era' and subject_id=$1 order by id",
  [String(era.id)]
);
assert(
  receipts.rows.map((row) => row.action_type).join(",") ===
    "ERA_ACTIVATE,ERA_CLOSE,ERA_ARCHIVE",
  "production lifecycle receipts missing or out of order"
);

// Reproduce the exact FC-01 false-positive class against the production resolver.
// This row intentionally models already-active persisted state, not activation.
const futureStart = new Date(t0.getTime() + 60 * 60 * 1000);
const futureEra = await one(
  `insert into eras
    (slug, name, eyebrow, story, kind, lifecycle_state, visibility, is_primary,
     start_at, theme_tokens, watchtower_profile, archive_policy, created_at, updated_at)
   values
    ('future-primary-proof', 'Future Primary Proof', 'Synthetic', 'Synthetic',
     'CATEGORY', 'ACTIVE', 'PUBLIC', true, $1,
     '{}'::json, '{}'::json, '{}'::json, $2, $2)
   returning *`,
  [futureStart, new Date(t0.getTime() + 15_000)]
);

const rawPrimary = await one(
  `select count(*)::int as count from eras
    where id=$1 and lifecycle_state='ACTIVE' and visibility='PUBLIC' and is_primary=true`,
  [futureEra.id]
);
assert(rawPrimary.count === 1, "adversarial raw primary shape was not created");

const futureResolved = await resolveCurrentPublicEra(
  new Date(t0.getTime() + 16_000)
);
assert(
  futureResolved.ok === false &&
    futureResolved.code === "ACTIVE_PRIMARY_ERA_NOT_PUBLIC_NOW",
  "production resolver accepted future-start ACTIVE/PUBLIC/primary Era"
);

let ambiguousPrimary = "DATABASE_GUARDED";
try {
  const second = await one(
    `insert into eras
      (slug, name, eyebrow, story, kind, lifecycle_state, visibility, is_primary,
       start_at, theme_tokens, watchtower_profile, archive_policy, created_at, updated_at)
     values
      ('second-primary-proof', 'Second Primary Proof', 'Synthetic', 'Synthetic',
       'CATEGORY', 'ACTIVE', 'PUBLIC', true, $1,
       '{}'::json, '{}'::json, '{}'::json, $1, $1)
     returning *`,
    [new Date(t0.getTime() - 60_000)]
  );
  const ambiguous = await resolveCurrentPublicEra(new Date(t0.getTime() + 17_000));
  assert(
    ambiguous.ok === false && ambiguous.code === "AMBIGUOUS_ACTIVE_PRIMARY_ERA",
    "production resolver did not reject ambiguous active primaries"
  );
  ambiguousPrimary = "RESOLVER_REJECTED";
  await client.query("delete from eras where id=$1", [second.id]);
} catch (error) {
  // A database uniqueness guard is also valid evidence that ambiguous primary
  // state cannot be persisted through this PostgreSQL schema.
  const message = error instanceof Error ? error.message : String(error);
  assert(
    /unique|duplicate/i.test(message),
    "unexpected failure while testing ambiguous-primary protection: " + message
  );
}

console.log(JSON.stringify({
  status: "PASS",
  proofClass: "ISOLATED_SYNTHETIC_FULL_LIFECYCLE_APPLICATION_PATH_POSTGRESQL_R1",
  eraId: era.id,
  productId: product.id,
  readinessDigest: currentReadiness.readinessDigest,
  snapshotDigest: closure.snapshot.snapshotDigest,
  signalKey: signalInput.signalKey,
  lifecycle: ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"],
  productionPaths: {
    evaluateEraActivationReadiness: "PASS",
    activateEraSharedProductionService: "PASS",
    resolveCurrentPublicEra: "PASS",
    buildEraArchiveSnapshot: "PASS",
    closeEraSharedProductionService: "PASS",
    archiveEraSharedProductionService: "PASS",
    resolvePublicEraBySlugArchived: "PASS",
    ingestWatchtowerSignal: "PASS",
    evaluateAndQueueCustomerAlerts: "PASS",
  },
  adversarial: {
    mismatchedReadinessDigestRejected: "PASS",
    staleReadinessAfterMutationRejected: "PASS",
    archiveWithoutClosureSnapshotRejected: "PASS",
    signalKeyPayloadCollisionRejected: "PASS",
    sensitivePrivateSignalPayloadRejected: "PASS",
    alertPayloadSanitized: "PASS",
    signalReplayIdempotent: "PASS",
    archivedProductHistorical: "PASS",
    revokedCurrentMediaHiddenFromArchivedResolution: "PASS",
    futureStartRawPrimaryRejectedByProductionResolver: "PASS",
    ambiguousPrimary,
  },
  authority: {
    notificationsSent: 0,
    productionTouched: false,
    delivery: "QUEUE_ONLY_NO_EXTERNAL_DELIVERY",
  },
}, null, 2));

await client.end();
await pool.end();
