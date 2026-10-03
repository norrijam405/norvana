import pg from "pg";
import { pool } from "../../src/db/index.ts";
import { closeEra } from "../../src/lib/era-engine/lifecycle-service.ts";

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const setup = new Client({ connectionString: url });
const blocker = new Client({ connectionString: url });
const inspector = new Client({ connectionString: url });
await Promise.all([setup.connect(), blocker.connect(), inspector.connect()]);

async function one(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  if (rows.length !== 1) throw new Error("expected exactly one row");
  return rows[0];
}

const t0 = new Date("2026-10-03T20:30:00.000Z");
const product = await one(setup,
  `insert into products
    (name, slug, description, price, compare_at_price, cost, niche, status,
     commerce_model, source_provider_slug, brand_name, product_condition,
     authorization_state, image_rights_state, external_seller_name,
     product_evidence, images, inventory)
   values
    ('FRC Snapshot Product', 'frc-snapshot-product', 'synthetic', 125.00, 150.00, 80.00,
     'proof', 'active', 'QUALIFIED_SUPPLIER', 'synthetic-owned', 'Acre Era', 'NEW',
     'DIRECT_RETAIL_AUTHORIZED', 'OWNED', 'Acre Era',
     '{"evidenceRef":"synthetic:frc"}'::json,
     '["https://assets.example.invalid/frc.jpg"]'::json, 1)
   returning *`);

const era = await one(setup,
  `insert into eras
    (slug, name, eyebrow, story, kind, lifecycle_state, visibility, is_primary,
     start_at, theme_tokens, watchtower_profile, archive_policy, created_at, updated_at)
   values
    ('frc-snapshot-era', 'FRC Snapshot Era', 'Synthetic', 'Synthetic',
     'CATEGORY', 'ACTIVE', 'PUBLIC', false, $1,
     '{}'::json, '{}'::json, '{"mode":"immutable-closure"}'::json, $1, $1)
   returning *`, [t0]);

await setup.query(
  `insert into era_products
    (era_id, product_id, position, role, curation_reason, evidence_ref, status, assigned_at)
   values ($1,$2,0,'FEATURED','synthetic','synthetic:frc','ACTIVE',$3)`,
  [era.id, product.id, t0]
);

await blocker.query("begin");
await blocker.query("select id from eras where id=$1 for update", [era.id]);

const closePromise = closeEra({
  eraId: era.id,
  closureEvidenceRef: "synthetic:fresh-rechallenger:closure-race",
  publicNote: "TOCTOU challenge",
  actor: "fresh-rechallenger",
  now: new Date(t0.getTime() + 1000),
});

let observedBlockedUpdate = false;
for (let i = 0; i < 60; i++) {
  const { rows } = await inspector.query(
    `select pid, wait_event_type, query
       from pg_stat_activity
      where datname=current_database()
        and pid <> pg_backend_pid()
        and wait_event_type='Lock'
        and lower(query) like '%update%'
        and lower(query) like '%eras%'`
  );
  if (rows.length) {
    observedBlockedUpdate = true;
    break;
  }
  await new Promise((r) => setTimeout(r, 100));
}
if (!observedBlockedUpdate) throw new Error("did not observe closeEra blocked at Era UPDATE");

await blocker.query("update products set price=99.00 where id=$1", [product.id]);
await blocker.query("commit");

const closure = await closePromise;

const persisted = await one(setup,
  "select snapshot from era_archive_snapshots where id=$1",
  [closure.snapshot.id]
);
const live = await one(setup, "select price from products where id=$1", [product.id]);
const closedEra = await one(setup, "select lifecycle_state from eras where id=$1", [era.id]);

const snapPrice = Number(persisted.snapshot.products?.[0]?.product?.price);
const livePrice = Number(live.price);
const reproduced =
  observedBlockedUpdate &&
  closedEra.lifecycle_state === "CLOSED" &&
  snapPrice === 125 &&
  livePrice === 99;

const evidence = {
  schema: "AE_LRP_R0_FRC01_RAW_EVIDENCE_V1",
  findingId: "AE-LRP-R0-FRC-01",
  title: "CLOSURE_SNAPSHOT_TOCTOU_CHILD_MUTATION_NOT_COVERED_BY_ERA_CAS",
  challengedCandidate: {
    commit: "7f8241e2dac3f044d03fd4627526e77884ff1c90",
    parent: "c123c154d98013b617167421c573249f14054c8e",
    tree: "a538bc0d4a67a860cd52a88f8e106d2df74d55c0"
  },
  observedBlockedUpdate,
  concurrentMutationCommittedBeforeCloseCompleted: true,
  closedLifecycleState: closedEra.lifecycle_state,
  persistedClosureSnapshotProductPrice: snapPrice,
  liveProductPriceAtCloseCommit: livePrice,
  status: reproduced ? "REPRODUCED" : "NOT_REPRODUCED",
  consequence: "closeEra can persist a closure snapshot built before a child-row mutation that commits before the Era close transaction completes, because its CAS protects only eras.updated_at."
};
console.log(JSON.stringify(evidence, null, 2));

if (!reproduced) process.exitCode = 1;

await Promise.all([setup.end(), blocker.end(), inspector.end()]);
await pool.end();
