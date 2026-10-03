import pg from "pg";

const { Client } = pg;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const client = new Client({ connectionString: databaseUrl });
await client.connect();

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function tableExists(name) {
  const { rows } = await client.query(
    "select to_regclass($1) is not null as exists",
    ["public." + name]
  );
  return rows[0]?.exists === true;
}

async function column(name, columnName) {
  const { rows } = await client.query(
    `select data_type, is_nullable, column_default
       from information_schema.columns
       where table_schema='public' and table_name=$1 and column_name=$2`,
    [name, columnName]
  );
  return rows[0] ?? null;
}

async function indexExists(name) {
  const { rows } = await client.query(
    `select 1
       from pg_indexes
       where schemaname='public' and indexname=$1`,
    [name]
  );
  return rows.length > 0;
}

async function triggerExists(tableName, triggerName) {
  const { rows } = await client.query(
    `select 1
       from pg_trigger t
       join pg_class c on c.oid=t.tgrelid
       join pg_namespace n on n.oid=c.relnamespace
       where n.nspname='public'
         and c.relname=$1
         and t.tgname=$2
         and not t.tgisinternal`,
    [tableName, triggerName]
  );
  return rows.length > 0;
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

const requiredTables = [
  "watch_jobs",
  "watch_runs",
  "watch_candidates",
  "action_receipts",
  "admin_users",
  "admin_auth_throttle",
  "review_events",
  "review_reactions",
  "customer_voice_throttle",
  "market_requests",
  "outbound_referral_clicks",
  "watch_candidate_snapshots",
  "partner_collections",
  "partner_collection_products",
  "eras",
  "era_media_assets",
  "era_sections",
  "era_products",
  "era_watchtower_bindings",
  "era_events",
  "customer_watch_items",
  "customer_alert_events",
  "product_routes",
  "product_route_observations",
  "era_archive_snapshots",
  "watchtower_signals",
  "watchtower_signal_projections",
];

for (const name of requiredTables) {
  assert(await tableExists(name), "missing table: " + name);
}

for (const [tableName, columnName] of [
  ["products", "commerce_model"],
  ["products", "authorization_state"],
  ["products", "image_rights_state"],
  ["products", "external_checkout_url"],
  ["reviews", "verification_state"],
  ["reviews", "fulfillment_rating"],
  ["market_requests", "status_evidence_ref"],
  ["market_requests", "watchtower_candidate_id"],
  ["customer_alert_events", "signal_key"],
  ["customer_alert_events", "fingerprint"],
]) {
  assert(await column(tableName, columnName), `missing column: ${tableName}.${columnName}`);
}

const signalKeyColumn = await column("customer_alert_events", "signal_key");
const fingerprintColumn = await column("customer_alert_events", "fingerprint");
assert(signalKeyColumn?.is_nullable === "NO", "customer_alert_events.signal_key must be NOT NULL");
assert(fingerprintColumn?.is_nullable === "NO", "customer_alert_events.fingerprint must be NOT NULL");

for (const name of [
  "eras_single_active_primary_idx",
  "era_archive_snapshots_digest_idx",
  "customer_alert_events_fingerprint_idx",
  "watchtower_signals_signal_key_idx",
  "watchtower_signal_projections_signal_projector_idx",
]) {
  assert(await indexExists(name), "missing index: " + name);
}

for (const [tableName, triggerName] of [
  ["era_archive_snapshots", "era_archive_snapshots_reject_update"],
  ["era_archive_snapshots", "era_archive_snapshots_reject_delete"],
  ["watchtower_signals", "watchtower_signals_reject_update"],
  ["watchtower_signal_projections", "watchtower_signal_projections_reject_update"],
]) {
  assert(
    await triggerExists(tableName, triggerName),
    `missing trigger: ${tableName}.${triggerName}`
  );
}

const { rows: watcherRows } = await client.query(
  `select count(*)::int as count
   from watch_jobs
   where slug = any($1::text[])`,
  [[
    "consumer-electronics-devices-watch",
    "brand-fashion-wholesale-watch",
    "luxury-authenticity-watch",
    "affiliate-commerce-watch",
    "product-economics-watch",
    "product-safety-recall-watch",
    "brand-authorization-watch",
  ]]
);
assert(watcherRows[0]?.count === 7, "expected seven Watchtower Intelligence R2 jobs");

const { rows: eraRows } = await client.query(
  `insert into eras
    (slug, name, lifecycle_state, visibility, is_primary)
   values
    ('schema-proof-primary', 'Schema Proof Primary', 'ACTIVE', 'PUBLIC', true)
   returning id`
);
const eraId = eraRows[0].id;

await expectReject("single-active-primary invariant", () =>
  client.query(
    `insert into eras
      (slug, name, lifecycle_state, visibility, is_primary)
     values
      ('schema-proof-second-primary', 'Schema Proof Second', 'ACTIVE', 'PUBLIC', true)`
  )
);

const { rows: snapshotRows } = await client.query(
  `insert into era_archive_snapshots
    (era_id, snapshot_kind, snapshot_digest, snapshot, evidence_ref, actor)
   values
    ($1, 'CLOSURE', $2, $3::json, 'schema-proof:evidence', 'ci')
   returning id`,
  [eraId, "a".repeat(64), JSON.stringify({ schema: "ACRE_ERA_ARCHIVE_SNAPSHOT_R0" })]
);
const snapshotId = snapshotRows[0].id;

await expectReject("archive snapshot update immutability", () =>
  client.query(
    "update era_archive_snapshots set actor='mutated' where id=$1",
    [snapshotId]
  )
);
await expectReject("archive snapshot delete immutability", () =>
  client.query("delete from era_archive_snapshots where id=$1", [snapshotId])
);

const { rows: signalRows } = await client.query(
  `insert into watchtower_signals
    (signal_key, signal_type, subject_type, subject_key, truth_state,
     source_kind, evidence_ref, observed_at, public_payload, private_payload,
     payload_digest)
   values
    ('schema-proof:signal:1', 'PRICE_OBSERVATION', 'PRODUCT', 'proof-product',
     'VERIFIED', 'OFFICIAL_API', 'schema-proof:signal-evidence', now(),
     '{"currentPriceCents":1000}'::json, '{}'::json, $1)
   returning id`,
  ["b".repeat(64)]
);
const signalId = signalRows[0].id;

await expectReject("Watchtower signal update immutability", () =>
  client.query(
    "update watchtower_signals set truth_state='CONFLICT' where id=$1",
    [signalId]
  )
);

const { rows: projectionRows } = await client.query(
  `insert into watchtower_signal_projections
    (signal_id, projector, projection_key, result)
   values
    ($1, 'SCHEMA_PROOF', 'schema-proof:projection:1', '{}'::json)
   returning id`,
  [signalId]
);
const projectionId = projectionRows[0].id;

await expectReject("Watchtower projection delete immutability", () =>
  client.query(
    "delete from watchtower_signal_projections where id=$1",
    [projectionId]
  )
);

console.log(
  JSON.stringify(
    {
      status: "PASS",
      migrationCount: 14,
      requiredTableCount: requiredTables.length,
      watcherCount: watcherRows[0].count,
      invariants: {
        singleActivePrimary: "PASS",
        immutableEraArchive: "PASS",
        immutableWatchtowerSignals: "PASS",
        immutableWatchtowerProjections: "PASS",
      },
    },
    null,
    2
  )
);

await client.end();
