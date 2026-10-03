import pg from "pg";
import { createHash } from "node:crypto";
import { projectWatchtowerSignalToCustomerAlert } from "../src/lib/watchtower/signal-projector.ts";
import { alertFingerprint, watchMatchesAlertSignal } from "../src/lib/customer-intent/alert-policy.ts";
import { isEraMediaPublic } from "../src/lib/era-engine/policy.ts";

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const client = new Client({ connectionString: databaseUrl });
await client.connect();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function stable(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, stable(nested)])
    );
  }
  return value;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

async function one(sql, params = []) {
  const { rows } = await client.query(sql, params);
  assert(rows.length === 1, "expected exactly one row");
  return rows[0];
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

const now = new Date("2026-10-03T19:30:00.000Z");
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

const era = await one(
  `insert into eras
    (slug, name, eyebrow, story, kind, lifecycle_state, visibility, is_primary,
     theme_tokens, watchtower_profile, archive_policy, created_at, updated_at)
   values
    ($1, 'Lifecycle Proof Era', 'Synthetic proof',
     'A synthetic Era used only to prove the isolated backend lifecycle.',
     'CATEGORY', 'DRAFT', 'PRIVATE', false,
     '{"preset":"cleanTech"}'::json,
     '{"profile":"proof"}'::json,
     '{"mode":"immutable-closure"}'::json,
     $2, $2)
   returning *`,
  [slug, now]
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
  [era.id, product.id, now]
);

await client.query(
  `insert into era_watchtower_bindings
    (era_id, watch_job_slug, importance, public_facet, config)
   values
    ($1, 'product-economics-watch', 10, 'price-history', '{"mode":"read-only"}'::json)`,
  [era.id]
);

const { rows: sections } = await client.query(
  "select * from era_sections where era_id=$1 and status='ENABLED' order by position,id",
  [era.id]
);
const { rows: mediaRows } = await client.query(
  "select * from era_media_assets where era_id=$1 order by id",
  [era.id]
);
const { rows: assignments } = await client.query(
  `select ep.id as assignment_id, p.id as product_id, p.status as product_status,
          p.commerce_model, p.authorization_state, p.external_checkout_url
     from era_products ep
     join products p on p.id=ep.product_id
    where ep.era_id=$1 and ep.status='ACTIVE'
    order by ep.id`,
  [era.id]
);

assert(sections.some((row) => row.section_type === "HERO"), "missing HERO section");
assert(
  mediaRows.some((row) =>
    isEraMediaPublic({
      mediaUrl: row.media_url,
      rightsState: row.rights_state,
      rightsEvidenceRef: row.rights_evidence_ref,
      rightsStartsAt: row.rights_starts_at,
      rightsEndsAt: row.rights_ends_at,
      status: row.status,
    }, now)
  ),
  "no public hero media"
);
assert(assignments.length === 1, "expected one active product");

const readinessDigest = digest({
  era: {
    id: era.id,
    kind: era.kind,
    lifecycleState: era.lifecycle_state,
    visibility: era.visibility,
    isPrimary: era.is_primary,
    startAt: era.start_at ? new Date(era.start_at).toISOString() : null,
    endAt: era.end_at ? new Date(era.end_at).toISOString() : null,
    updatedAt: new Date(era.updated_at).toISOString(),
  },
  sections: sections.map((section) => ({
    id: section.id,
    sectionType: section.section_type,
    position: section.position,
    status: section.status,
    config: section.config,
  })),
  media: mediaRows.map((asset) => ({
    id: asset.id,
    assetType: asset.asset_type,
    status: asset.status,
    rightsState: asset.rights_state,
    rightsEvidenceRef: asset.rights_evidence_ref,
    mediaUrl: asset.media_url,
    posterUrl: asset.poster_url,
    rightsStartsAt: asset.rights_starts_at ? new Date(asset.rights_starts_at).toISOString() : null,
    rightsEndsAt: asset.rights_ends_at ? new Date(asset.rights_ends_at).toISOString() : null,
    altText: asset.alt_text,
  })),
  products: assignments.map((assignment) => ({
    assignmentId: assignment.assignment_id,
    productId: assignment.product_id,
    productStatus: assignment.product_status,
    commerceModel: assignment.commerce_model,
    authorizationState: assignment.authorization_state,
    externalCheckoutUrl: assignment.external_checkout_url,
  })),
});
assert(/^[a-f0-9]{64}$/.test(readinessDigest), "invalid readiness digest");

const activationTime = new Date(now.getTime() + 60_000);
const activated = await one(
  `update eras
      set lifecycle_state='ACTIVE', visibility='PUBLIC', is_primary=true,
          start_at=$2, updated_at=$2
    where id=$1 and lifecycle_state='DRAFT'
    returning *`,
  [era.id, activationTime]
);
assert(activated.lifecycle_state === "ACTIVE", "Era activation failed");

const current = await one(
  `select * from eras
    where lifecycle_state='ACTIVE' and visibility='PUBLIC' and is_primary=true`
);
assert(current.id === era.id, "current Era resolver invariant failed");

const watchItem = await one(
  `insert into customer_watch_items
    (actor_key_hash, target_type, target_key, alert_types, price_threshold_cents, status)
   values
    ($1, 'PRODUCT', $2, '["PRICE_DROP"]'::json, 12000, 'ACTIVE')
   returning *`,
  ["b".repeat(64), productSlug]
);

const signal = {
  signalKey: "synthetic:price:" + productSlug + ":1",
  signalType: "PRICE_OBSERVATION",
  subjectType: "PRODUCT",
  subjectKey: productSlug,
  truthState: "VERIFIED",
  evidenceRef: "synthetic:lifecycle-proof:price",
  publicPayload: {
    productSlug,
    currentPriceCents: 11900,
    previousPriceCents: 12500,
    currency: "USD",
  },
};

const projected = projectWatchtowerSignalToCustomerAlert(signal);
assert(projected?.eventType === "PRICE_DROP", "verified signal did not project");

const signalDigest = digest({
  signalType: signal.signalType,
  subjectType: signal.subjectType,
  subjectKey: signal.subjectKey,
  truthState: signal.truthState,
  sourceKind: "SYNTHETIC_PROOF",
  evidenceRef: signal.evidenceRef,
  observedAt: activationTime.toISOString(),
  expiresAt: null,
  publicPayload: signal.publicPayload,
  privatePayload: {},
});

const insertedSignal = await one(
  `insert into watchtower_signals
    (signal_key, signal_type, subject_type, subject_key, truth_state, source_kind,
     evidence_ref, observed_at, public_payload, private_payload, payload_digest)
   values ($1,$2,$3,$4,$5,'SYNTHETIC_PROOF',$6,$7,$8::json,'{}'::json,$9)
   returning *`,
  [
    signal.signalKey,
    signal.signalType,
    signal.subjectType,
    signal.subjectKey,
    signal.truthState,
    signal.evidenceRef,
    activationTime,
    JSON.stringify(signal.publicPayload),
    signalDigest,
  ]
);

const matches = watchMatchesAlertSignal(
  {
    id: watchItem.id,
    alertTypes: watchItem.alert_types,
    priceThresholdCents: watchItem.price_threshold_cents,
  },
  projected
);
assert(matches, "projected signal did not match watch item");

const fingerprint = alertFingerprint({
  watchItemId: watchItem.id,
  eventType: projected.eventType,
  signalKey: projected.signalKey,
});

await client.query(
  `insert into watchtower_signal_projections
    (signal_id, projector, projection_key, result)
   values ($1, 'CUSTOMER_ALERT_R0', $2, $3::json)
   on conflict do nothing`,
  [insertedSignal.id, "CUSTOMER_ALERT_R0:" + signal.signalKey, JSON.stringify(projected)]
);

await client.query(
  `insert into customer_alert_events
    (watch_item_id, event_type, signal_key, fingerprint, evidence_ref, payload, status)
   values ($1,$2,$3,$4,$5,$6::json,'PENDING')
   on conflict do nothing`,
  [
    watchItem.id,
    projected.eventType,
    projected.signalKey,
    fingerprint,
    projected.evidenceRef,
    JSON.stringify(projected.payload),
  ]
);

// Idempotent replay: same signal and same projected alert remain singular.
await client.query(
  `insert into watchtower_signals
    (signal_key, signal_type, subject_type, subject_key, truth_state, source_kind,
     evidence_ref, observed_at, public_payload, private_payload, payload_digest)
   values ($1,$2,$3,$4,$5,'SYNTHETIC_PROOF',$6,$7,$8::json,'{}'::json,$9)
   on conflict do nothing`,
  [
    signal.signalKey,
    signal.signalType,
    signal.subjectType,
    signal.subjectKey,
    signal.truthState,
    signal.evidenceRef,
    activationTime,
    JSON.stringify(signal.publicPayload),
    signalDigest,
  ]
);
await client.query(
  `insert into customer_alert_events
    (watch_item_id, event_type, signal_key, fingerprint, evidence_ref, payload, status)
   values ($1,$2,$3,$4,$5,$6::json,'PENDING')
   on conflict do nothing`,
  [
    watchItem.id,
    projected.eventType,
    projected.signalKey,
    fingerprint,
    projected.evidenceRef,
    JSON.stringify(projected.payload),
  ]
);
const alertCount = await one(
  "select count(*)::int as count from customer_alert_events where fingerprint=$1",
  [fingerprint]
);
assert(alertCount.count === 1, "idempotent replay created duplicate alert");

const { rows: archiveSections } = await client.query(
  "select * from era_sections where era_id=$1 order by position,id",
  [era.id]
);
const { rows: archiveMedia } = await client.query(
  "select * from era_media_assets where era_id=$1 order by id",
  [era.id]
);
const { rows: archiveProducts } = await client.query(
  `select ep.*, p.id as p_id, p.slug as p_slug, p.name as p_name,
          p.description as p_description, p.price as p_price,
          p.compare_at_price as p_compare_at_price, p.niche as p_niche,
          p.commerce_model as p_commerce_model,
          p.source_provider_slug as p_source_provider_slug,
          p.brand_name as p_brand_name, p.product_condition as p_product_condition,
          p.authorization_state as p_authorization_state,
          p.image_rights_state as p_image_rights_state,
          p.external_seller_name as p_external_seller_name,
          p.external_product_id as p_external_product_id,
          p.images as p_images, p.status as p_status
     from era_products ep join products p on p.id=ep.product_id
    where ep.era_id=$1 order by ep.position,ep.id`,
  [era.id]
);
const { rows: archiveBindings } = await client.query(
  "select * from era_watchtower_bindings where era_id=$1 order by importance,id",
  [era.id]
);

const activeEra = await one("select * from eras where id=$1", [era.id]);
const snapshot = {
  schema: "ACRE_ERA_ARCHIVE_SNAPSHOT_R0",
  era: {
    id: activeEra.id,
    slug: activeEra.slug,
    name: activeEra.name,
    eyebrow: activeEra.eyebrow,
    story: activeEra.story,
    kind: activeEra.kind,
    lifecycleState: activeEra.lifecycle_state,
    visibility: activeEra.visibility,
    isPrimary: activeEra.is_primary,
    startAt: activeEra.start_at ? new Date(activeEra.start_at).toISOString() : null,
    endAt: activeEra.end_at ? new Date(activeEra.end_at).toISOString() : null,
    themeTokens: activeEra.theme_tokens,
    archivePolicy: activeEra.archive_policy,
    createdAt: new Date(activeEra.created_at).toISOString(),
    updatedAt: new Date(activeEra.updated_at).toISOString(),
  },
  sections: archiveSections.map((section) => ({
    id: section.id,
    sectionType: section.section_type,
    position: section.position,
    config: section.config,
    status: section.status,
  })),
  media: archiveMedia.map((asset) => ({
    id: asset.id,
    assetType: asset.asset_type,
    mediaUrl: asset.media_url,
    posterUrl: asset.poster_url,
    rightsState: asset.rights_state,
    rightsEvidenceRef: asset.rights_evidence_ref,
    sourceLabel: asset.source_label,
    sourceUrl: asset.source_url,
    brandName: asset.brand_name,
    providerSlug: asset.provider_slug,
    rightsStartsAt: asset.rights_starts_at ? new Date(asset.rights_starts_at).toISOString() : null,
    rightsEndsAt: asset.rights_ends_at ? new Date(asset.rights_ends_at).toISOString() : null,
    status: asset.status,
    sha256: asset.sha256,
    altText: asset.alt_text,
  })),
  products: archiveProducts.map((row) => ({
    membership: {
      id: row.id,
      position: row.position,
      role: row.role,
      curationReason: row.curation_reason,
      evidenceRef: row.evidence_ref,
      status: row.status,
      assignedAt: new Date(row.assigned_at).toISOString(),
      removedAt: row.removed_at ? new Date(row.removed_at).toISOString() : null,
    },
    product: {
      id: row.p_id,
      slug: row.p_slug,
      name: row.p_name,
      description: row.p_description,
      price: row.p_price,
      compareAtPrice: row.p_compare_at_price,
      niche: row.p_niche,
      commerceModel: row.p_commerce_model,
      sourceProviderSlug: row.p_source_provider_slug,
      brandName: row.p_brand_name,
      productCondition: row.p_product_condition,
      authorizationState: row.p_authorization_state,
      imageRightsState: row.p_image_rights_state,
      externalSellerName: row.p_external_seller_name,
      externalProductId: row.p_external_product_id,
      images: row.p_images,
      status: row.p_status,
    },
  })),
  watchtower: archiveBindings.map((binding) => ({
    watchJobSlug: binding.watch_job_slug,
    importance: binding.importance,
    publicFacet: binding.public_facet,
    config: binding.config,
  })),
};
const snapshotDigest = digest(snapshot);

const savedSnapshot = await one(
  `insert into era_archive_snapshots
    (era_id, snapshot_kind, snapshot_digest, snapshot, evidence_ref, actor)
   values ($1,'CLOSURE',$2,$3::json,'synthetic:lifecycle-proof:closure','ci')
   returning *`,
  [era.id, snapshotDigest, JSON.stringify(snapshot)]
);

const closeTime = new Date(activationTime.getTime() + 60_000);
await client.query(
  `update eras
      set lifecycle_state='CLOSED', is_primary=false, end_at=$2, updated_at=$2
    where id=$1 and lifecycle_state='ACTIVE'`,
  [era.id, closeTime]
);

await expectReject("immutable archive snapshot update", () =>
  client.query("update era_archive_snapshots set actor='mutated' where id=$1", [savedSnapshot.id])
);
await expectReject("immutable archive snapshot delete", () =>
  client.query("delete from era_archive_snapshots where id=$1", [savedSnapshot.id])
);

await client.query(
  "update eras set lifecycle_state='ARCHIVED', updated_at=$2 where id=$1 and lifecycle_state='CLOSED'",
  [era.id, new Date(closeTime.getTime() + 60_000)]
);

await client.query("update products set price=999.99 where id=$1", [product.id]);
const mutatedProduct = await one("select price from products where id=$1", [product.id]);
assert(Number(mutatedProduct.price) === 999.99, "live product mutation did not apply");

const persistedSnapshot = await one(
  "select snapshot from era_archive_snapshots where id=$1",
  [savedSnapshot.id]
);
assert(
  Number(persistedSnapshot.snapshot.products[0].product.price) === 125,
  "archive product price changed with live product"
);

await client.query(
  `update era_media_assets
      set rights_state='REVOKED', status='REVOKED',
          rights_evidence_ref='synthetic:lifecycle-proof:revocation',
          updated_at=$2
    where id=$1`,
  [media.id, new Date(closeTime.getTime() + 120_000)]
);
const revokedMedia = await one("select * from era_media_assets where id=$1", [media.id]);
assert(
  !isEraMediaPublic({
    mediaUrl: revokedMedia.media_url,
    rightsState: revokedMedia.rights_state,
    rightsEvidenceRef: revokedMedia.rights_evidence_ref,
    rightsStartsAt: revokedMedia.rights_starts_at,
    rightsEndsAt: revokedMedia.rights_ends_at,
    status: revokedMedia.status,
  }, new Date(closeTime.getTime() + 180_000)),
  "revoked media remained public"
);
assert(
  persistedSnapshot.snapshot.media[0].rightsState === "OWNED" &&
    persistedSnapshot.snapshot.media[0].status === "APPROVED",
  "immutable snapshot no longer preserves historical media state"
);

const finalEra = await one("select * from eras where id=$1", [era.id]);
assert(finalEra.lifecycle_state === "ARCHIVED", "Era did not reach ARCHIVED state");

console.log(JSON.stringify({
  status: "PASS",
  proofClass: "ISOLATED_SYNTHETIC_FULL_LIFECYCLE_POSTGRESQL_R0",
  eraId: era.id,
  productId: product.id,
  readinessDigest,
  snapshotDigest,
  signalKey: signal.signalKey,
  alertFingerprint: fingerprint,
  alertCount: alertCount.count,
  lifecycle: ["DRAFT", "ACTIVE", "CLOSED", "ARCHIVED"],
  invariants: {
    currentEraResolved: "PASS",
    verifiedSignalProjected: "PASS",
    alertReplayIdempotent: "PASS",
    immutableClosureSnapshot: "PASS",
    archivedProductHistorical: "PASS",
    revokedMediaHidden: "PASS",
  },
}, null, 2));

await client.end();
