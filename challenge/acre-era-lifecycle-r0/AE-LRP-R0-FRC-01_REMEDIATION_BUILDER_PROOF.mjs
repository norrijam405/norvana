import pg from "pg";
import { pool } from "../../src/db/index.ts";
import {
  closeEra,
  EraLifecycleError,
} from "../../src/lib/era-engine/lifecycle-service.ts";

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function one(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  if (rows.length !== 1) throw new Error("expected exactly one row");
  return rows[0];
}

async function seedCase(setup, label, ordinal) {
  const t0 = new Date("2026-10-03T22:00:00.000Z");
  const product = await one(
    setup,
    `insert into products
      (name, slug, description, price, compare_at_price, cost, niche, status,
       commerce_model, source_provider_slug, brand_name, product_condition,
       authorization_state, image_rights_state, external_seller_name,
       product_evidence, images, inventory)
     values
      ($1,$2,'synthetic',125.00,150.00,80.00,'proof','active',
       'QUALIFIED_SUPPLIER','synthetic-owned','Acre Era','NEW',
       'DIRECT_RETAIL_AUTHORIZED','OWNED','Acre Era',
       '{"evidenceRef":"synthetic:frc01-builder"}'::json,
       '["https://assets.example.invalid/frc01-builder.jpg"]'::json,1)
     returning *`,
    [`FRC01 ${label} Product`, `frc01-${label}-product-${ordinal}`]
  );

  const secondProduct = await one(
    setup,
    `insert into products
      (name, slug, description, price, compare_at_price, cost, niche, status,
       commerce_model, source_provider_slug, brand_name, product_condition,
       authorization_state, image_rights_state, external_seller_name,
       product_evidence, images, inventory)
     values
      ($1,$2,'synthetic',77.00,90.00,50.00,'proof','active',
       'QUALIFIED_SUPPLIER','synthetic-owned','Acre Era','NEW',
       'DIRECT_RETAIL_AUTHORIZED','OWNED','Acre Era',
       '{"evidenceRef":"synthetic:frc01-builder-secondary"}'::json,
       '["https://assets.example.invalid/frc01-builder-secondary.jpg"]'::json,1)
     returning *`,
    [`FRC01 ${label} Secondary`, `frc01-${label}-secondary-${ordinal}`]
  );

  const era = await one(
    setup,
    `insert into eras
      (slug,name,eyebrow,story,kind,lifecycle_state,visibility,is_primary,
       start_at,theme_tokens,watchtower_profile,archive_policy,created_at,updated_at)
     values
      ($1,$2,'Synthetic','Synthetic','CATEGORY','ACTIVE','PUBLIC',false,$3,
       '{}'::json,'{}'::json,'{"mode":"immutable-closure"}'::json,$3,$3)
     returning *`,
    [`frc01-${label}-era-${ordinal}`, `FRC01 ${label} Era`, t0]
  );

  const section = await one(
    setup,
    `insert into era_sections (era_id,section_type,position,config,status)
     values ($1,'HERO',0,'{"headline":"before"}'::json,'ENABLED')
     returning *`,
    [era.id]
  );

  const media = await one(
    setup,
    `insert into era_media_assets
      (era_id,asset_type,media_url,rights_state,rights_evidence_ref,
       source_label,status,sha256,alt_text,created_at,updated_at)
     values
      ($1,'HERO_IMAGE','https://assets.example.invalid/frc01-builder-hero.jpg',
       'OWNED','synthetic:rights','Synthetic','APPROVED',$2,'before',$3,$3)
     returning *`,
    [era.id, "f".repeat(64), t0]
  );

  const membership = await one(
    setup,
    `insert into era_products
      (era_id,product_id,position,role,curation_reason,evidence_ref,status,assigned_at)
     values ($1,$2,0,'FEATURED','synthetic','synthetic:frc01-builder','ACTIVE',$3)
     returning *`,
    [era.id, product.id, t0]
  );

  const binding = await one(
    setup,
    `insert into era_watchtower_bindings
      (era_id,watch_job_slug,importance,public_facet,config)
     values ($1,'frc01-watch',10,'price-history','{"mode":"read-only"}'::json)
     returning *`,
    [era.id]
  );

  return { t0, era, product, secondProduct, section, media, membership, binding };
}

async function waitForCloseCas(inspector, eraId) {
  for (let i = 0; i < 100; i++) {
    const { rows } = await inspector.query(
      `select pid, wait_event_type, query
         from pg_stat_activity
        where datname=current_database()
          and pid <> pg_backend_pid()
          and wait_event_type='Lock'
          and lower(query) like '%update%'
          and lower(query) like '%eras%'
          and query like '%' || $1::text || '%'`,
      [eraId]
    );
    if (rows.length) return true;

    const generic = await inspector.query(
      `select pid
         from pg_stat_activity
        where datname=current_database()
          and pid <> pg_backend_pid()
          and wait_event_type='Lock'
          and lower(query) like '%update%'
          and lower(query) like '%eras%'`
    );
    if (generic.rows.length) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

function closureErrorCode(error) {
  if (error instanceof EraLifecycleError) return error.code;
  if (error instanceof Error) return error.message;
  return String(error);
}

async function runRace(label, ordinal, mutate, assertRetrySnapshot) {
  const setup = new Client({ connectionString: url });
  const blocker = new Client({ connectionString: url });
  const inspector = new Client({ connectionString: url });
  await Promise.all([setup.connect(), blocker.connect(), inspector.connect()]);

  try {
    const seeded = await seedCase(setup, label, ordinal);
    const before = await one(
      setup,
      "select content_revision from eras where id=$1",
      [seeded.era.id]
    );

    await blocker.query("begin");
    await blocker.query("select id from eras where id=$1 for update", [seeded.era.id]);

    const closePromise = closeEra({
      eraId: seeded.era.id,
      closureEvidenceRef: `synthetic:frc01-builder:${label}:first-close`,
      publicNote: "FRC-01 remediation concurrency proof",
      actor: "remediation-builder",
      now: new Date(seeded.t0.getTime() + 1_000),
    });

    const observedBlockedCas = await waitForCloseCas(inspector, seeded.era.id);
    assert(observedBlockedCas, `${label}: close did not reach blocked Era CAS`);

    await mutate(blocker, seeded);
    await blocker.query("commit");

    let firstCloseError = null;
    try {
      await closePromise;
    } catch (error) {
      firstCloseError = closureErrorCode(error);
    }

    assert(
      firstCloseError === "ERA_CHANGED_BEFORE_CLOSURE" ||
        firstCloseError === "ERA_CHANGED_DURING_SNAPSHOT",
      `${label}: concurrent mutation was not fail-closed; got ${firstCloseError}`
    );

    const afterRace = await one(
      setup,
      "select lifecycle_state,content_revision from eras where id=$1",
      [seeded.era.id]
    );
    assert(afterRace.lifecycle_state === "ACTIVE", `${label}: stale close reached CLOSED`);
    assert(
      Number(afterRace.content_revision) > Number(before.content_revision),
      `${label}: child mutation did not advance content revision`
    );

    const snapshotsAfterFailedClose = await one(
      setup,
      `select count(*)::int as count
         from era_archive_snapshots
        where era_id=$1 and snapshot_kind='CLOSURE'`,
      [seeded.era.id]
    );
    assert(
      snapshotsAfterFailedClose.count === 0,
      `${label}: stale closure snapshot survived failed CAS`
    );

    const retry = await closeEra({
      eraId: seeded.era.id,
      closureEvidenceRef: `synthetic:frc01-builder:${label}:retry`,
      publicNote: "FRC-01 remediation retry captures committed child state",
      actor: "remediation-builder",
      now: new Date(seeded.t0.getTime() + 2_000),
    });
    assert(retry.era.lifecycleState === "CLOSED", `${label}: retry did not close`);
    assertRetrySnapshot(retry.snapshot.snapshot, seeded);

    return {
      case: label,
      observedBlockedCas,
      firstClose: "FAIL_CLOSED",
      firstCloseError,
      revisionBefore: Number(before.content_revision),
      revisionAfterMutation: Number(afterRace.content_revision),
      retry: "CLOSED_WITH_MUTATION_CAPTURED",
      snapshotDigest: retry.snapshot.snapshotDigest,
    };
  } finally {
    try { await blocker.query("rollback"); } catch {}
    await Promise.all([setup.end(), blocker.end(), inspector.end()]);
  }
}

const cases = [];

cases.push(await runRace(
  "product-price-update",
  1,
  async (client, seeded) => {
    await client.query("update products set price=99.00 where id=$1", [seeded.product.id]);
  },
  (snapshot) => {
    assert(Number(snapshot.products?.[0]?.product?.price) === 99, "product price mutation not captured");
  }
));

cases.push(await runRace(
  "membership-insert",
  2,
  async (client, seeded) => {
    await client.query(
      `insert into era_products
        (era_id,product_id,position,role,curation_reason,evidence_ref,status,assigned_at)
       values ($1,$2,1,'STANDARD','concurrent insert','synthetic:membership-race','ACTIVE',$3)`,
      [seeded.era.id, seeded.secondProduct.id, seeded.t0]
    );
  },
  (snapshot, seeded) => {
    assert(
      snapshot.products?.some((item) => item.product?.id === seeded.secondProduct.id),
      "membership insert not captured"
    );
  }
));

cases.push(await runRace(
  "section-update",
  3,
  async (client, seeded) => {
    await client.query(
      `update era_sections set config='{"headline":"after"}'::json where id=$1`,
      [seeded.section.id]
    );
  },
  (snapshot) => {
    assert(snapshot.sections?.[0]?.config?.headline === "after", "section mutation not captured");
  }
));

cases.push(await runRace(
  "media-update",
  4,
  async (client, seeded) => {
    await client.query("update era_media_assets set alt_text='after' where id=$1", [seeded.media.id]);
  },
  (snapshot) => {
    assert(snapshot.media?.[0]?.altText === "after", "media mutation not captured");
  }
));

cases.push(await runRace(
  "watchtower-binding-update",
  5,
  async (client, seeded) => {
    await client.query(
      "update era_watchtower_bindings set importance=99 where id=$1",
      [seeded.binding.id]
    );
  },
  (snapshot) => {
    assert(snapshot.watchtower?.[0]?.importance === 99, "Watchtower binding mutation not captured");
  }
));

console.log(JSON.stringify({
  schema: "AE_LRP_R0_FRC01_REMEDIATION_BUILDER_POSTGRES_PROOF_V1",
  findingId: "AE-LRP-R0-FRC-01",
  status: "PASS",
  postgres: "17",
  proofClass: "DISPOSABLE_POSTGRESQL_CHILD_REVISION_CAS_CONCURRENCY",
  cases,
  guarantees: {
    staleAcceptedClosureSnapshots: 0,
    failedCloseSnapshotsPersisted: 0,
    productDataCovered: true,
    membershipPhantomCovered: true,
    sectionsCovered: true,
    mediaCovered: true,
    watchtowerBindingsCovered: true,
    committedMutationCapturedOnRetry: true,
  },
}, null, 2));

await pool.end();
