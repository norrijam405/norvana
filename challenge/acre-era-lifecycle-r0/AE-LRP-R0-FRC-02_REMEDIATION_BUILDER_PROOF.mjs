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
  if (rows.length !== 1) throw new Error(`expected exactly one row for: ${sql}`);
  return rows[0];
}

function errorCode(error) {
  if (error instanceof EraLifecycleError) return error.code;
  if (error instanceof Error) return error.message;
  return String(error);
}

async function seedEra(client, label, ordinal, { withSection = false } = {}) {
  const t0 = new Date("2026-10-04T00:10:00.000Z");
  const era = await one(
    client,
    `insert into eras
      (slug,name,eyebrow,story,kind,lifecycle_state,visibility,is_primary,
       start_at,theme_tokens,watchtower_profile,archive_policy,created_at,updated_at)
     values
      ($1,$2,'before-eyebrow','before-story','CATEGORY','ACTIVE','PUBLIC',false,$3,
       '{"accent":"before"}'::json,'{"profile":"not-in-snapshot"}'::json,
       '{"mode":"immutable-closure","version":"before"}'::json,$3,$3)
     returning *`,
    [`frc02-builder-${label}-${ordinal}`, `FRC02 Builder ${label} ${ordinal}`, t0]
  );

  let section = null;
  if (withSection) {
    section = await one(
      client,
      `insert into era_sections (era_id,section_type,position,config,status)
       values ($1,'HERO',0,'{"headline":"before"}'::json,'ENABLED')
       returning *`,
      [era.id]
    );
  }

  return { era, section, t0 };
}

async function waitForBlockedSnapshotInsert(inspector) {
  for (let i = 0; i < 120; i++) {
    const { rows } = await inspector.query(
      `select pid, wait_event_type, query
         from pg_stat_activity
        where datname=current_database()
          and pid <> pg_backend_pid()
          and wait_event_type='Lock'
          and lower(query) like '%insert into%'
          and lower(query) like '%era_archive_snapshots%'`
    );
    if (rows.length) return true;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

async function closureSnapshotCount(client, eraId) {
  const { rows } = await client.query(
    `select count(*)::int as count
       from era_archive_snapshots
      where era_id=$1 and snapshot_kind='CLOSURE'`,
    [eraId]
  );
  return Number(rows[0]?.count ?? 0);
}

async function runEraFieldRace({
  label,
  ordinal,
  mutate,
  retryEraId = (seeded) => seeded.era.id,
  prepareRetry,
  assertRetrySnapshot,
}) {
  const setup = new Client({ connectionString: url });
  const gate = new Client({ connectionString: url });
  const inspector = new Client({ connectionString: url });
  const mutator = new Client({ connectionString: url });
  await Promise.all([setup.connect(), gate.connect(), inspector.connect(), mutator.connect()]);

  try {
    const seeded = await seedEra(setup, label, ordinal);
    const before = await one(
      setup,
      "select id,lifecycle_state,content_revision,updated_at from eras where id=$1",
      [seeded.era.id]
    );

    await gate.query("begin");
    await gate.query("lock table era_archive_snapshots in access exclusive mode");

    const closePromise = closeEra({
      eraId: seeded.era.id,
      closureEvidenceRef: `synthetic:frc02-builder:${label}:first-close`,
      publicNote: "FRC-02 Era-row closure consistency proof",
      actor: "remediation-builder",
      now: new Date(seeded.t0.getTime() + 1_000),
    });

    const observedBlockedSnapshotInsert = await waitForBlockedSnapshotInsert(inspector);
    assert(observedBlockedSnapshotInsert, `${label}: close never reached blocked snapshot persistence`);

    const mutation = await mutate(mutator, seeded, before);
    const mutationCommittedBeforeCloseCompleted = true;

    await gate.query("commit");

    let firstCloseError = null;
    try {
      await closePromise;
    } catch (error) {
      firstCloseError = errorCode(error);
    }

    assert(
      firstCloseError === "ERA_CHANGED_BEFORE_CLOSURE" ||
        firstCloseError === "ERA_CHANGED_DURING_SNAPSHOT",
      `${label}: stale closure was not rejected; got ${firstCloseError}`
    );

    const effectiveId = retryEraId(seeded, mutation);
    const afterMutation = await one(
      setup,
      "select id,lifecycle_state,content_revision,updated_at from eras where id=$1",
      [effectiveId]
    );

    assert(
      Number(afterMutation.content_revision) !== Number(before.content_revision) ||
        afterMutation.updated_at.toISOString() !== before.updated_at.toISOString() ||
        effectiveId !== seeded.era.id,
      `${label}: mutation changed no closure guard operand`
    );

    assert(
      (await closureSnapshotCount(setup, seeded.era.id)) === 0,
      `${label}: failed close persisted a stale CLOSURE snapshot`
    );

    if (prepareRetry) await prepareRetry(setup, seeded, mutation, afterMutation);

    const retry = await closeEra({
      eraId: effectiveId,
      closureEvidenceRef: `synthetic:frc02-builder:${label}:retry`,
      publicNote: "FRC-02 retry after committed Era-row mutation",
      actor: "remediation-builder",
      now: new Date(seeded.t0.getTime() + 2_000),
    });

    assert(retry.era.lifecycleState === "CLOSED", `${label}: retry did not close`);
    if (assertRetrySnapshot) assertRetrySnapshot(retry.snapshot.snapshot, seeded, mutation);

    assert(
      Number(retry.era.contentRevision) > Number(retry.snapshot.snapshot.era.contentRevision),
      `${label}: application-path close did not advance Era revision`
    );

    return {
      case: label,
      observedBlockedSnapshotInsert,
      mutationCommittedBeforeCloseCompleted,
      firstClose: "FAIL_CLOSED",
      firstCloseError,
      revisionBefore: Number(before.content_revision),
      revisionAfterMutation: Number(afterMutation.content_revision),
      retry: "CLOSED_WITH_COMMITTED_MUTATION_CAPTURED",
      retrySnapshotDigest: retry.snapshot.snapshotDigest,
      applicationCloseAdvancedRevision: true,
    };
  } finally {
    try { await gate.query("rollback"); } catch {}
    await Promise.all([setup.end(), gate.end(), inspector.end(), mutator.end()]);
  }
}

const cases = [];
let ordinal = 0;

const simpleCases = [
  {
    label: "slug",
    sql: "update eras set slug=$2 where id=$1 returning *",
    value: "frc02-builder-slug-after",
    snapshot: (s) => s.era.slug,
  },
  {
    label: "name",
    sql: "update eras set name=$2 where id=$1 returning *",
    value: "name-after-snapshot",
    snapshot: (s) => s.era.name,
  },
  {
    label: "eyebrow",
    sql: "update eras set eyebrow=$2 where id=$1 returning *",
    value: "eyebrow-after-snapshot",
    snapshot: (s) => s.era.eyebrow,
  },
  {
    label: "story-exact-frc02",
    sql: "update eras set story=$2 where id=$1 returning *",
    value: "after-snapshot-before-close",
    snapshot: (s) => s.era.story,
  },
  {
    label: "kind",
    sql: "update eras set kind=$2 where id=$1 returning *",
    value: "COLLECTION",
    snapshot: (s) => s.era.kind,
  },
  {
    label: "visibility",
    sql: "update eras set visibility=$2 where id=$1 returning *",
    value: "PRIVATE",
    snapshot: (s) => s.era.visibility,
  },
  {
    label: "is-primary",
    sql: "update eras set is_primary=$2 where id=$1 returning *",
    value: true,
    snapshot: (s) => s.era.isPrimary,
  },
  {
    label: "start-at",
    sql: "update eras set start_at=$2 where id=$1 returning *",
    value: new Date("2026-10-04T00:09:30.000Z"),
    snapshot: (s) => s.era.startAt,
    expected: (value) => value.toISOString(),
  },
  {
    label: "end-at",
    sql: "update eras set end_at=$2 where id=$1 returning *",
    value: new Date("2026-10-04T00:10:30.000Z"),
    snapshot: (s) => s.era.endAt,
    expected: (value) => value.toISOString(),
  },
  {
    label: "theme-tokens",
    sql: "update eras set theme_tokens=$2::json where id=$1 returning *",
    value: JSON.stringify({ accent: "after", mode: "dark" }),
    snapshot: (s) => JSON.stringify(s.era.themeTokens),
    expected: (value) => JSON.stringify(JSON.parse(value)),
  },
  {
    label: "archive-policy",
    sql: "update eras set archive_policy=$2::json where id=$1 returning *",
    value: JSON.stringify({ mode: "immutable-closure", version: "after" }),
    snapshot: (s) => JSON.stringify(s.era.archivePolicy),
    expected: (value) => JSON.stringify(JSON.parse(value)),
  },
  {
    label: "created-at",
    sql: "update eras set created_at=$2 where id=$1 returning *",
    value: new Date("2026-10-03T23:59:00.000Z"),
    snapshot: (s) => s.era.createdAt,
    expected: (value) => value.toISOString(),
  },
  {
    label: "updated-at",
    sql: "update eras set updated_at=$2 where id=$1 returning *",
    value: new Date("2026-10-04T00:10:45.000Z"),
    snapshot: (s) => s.era.updatedAt,
    expected: (value) => value.toISOString(),
  },
];

for (const spec of simpleCases) {
  ordinal += 1;
  cases.push(await runEraFieldRace({
    label: spec.label,
    ordinal,
    mutate: async (client, seeded) =>
      one(client, spec.sql, [seeded.era.id, spec.value]),
    assertRetrySnapshot: (snapshot) => {
      const actual = spec.snapshot(snapshot);
      const expected = spec.expected ? spec.expected(spec.value) : spec.value;
      assert(actual === expected, `${spec.label}: retry snapshot did not capture committed value`);
    },
  }));
}

ordinal += 1;
cases.push(await runEraFieldRace({
  label: "content-revision-direct",
  ordinal,
  mutate: async (client, seeded) =>
    one(
      client,
      "update eras set content_revision=content_revision+7 where id=$1 returning *",
      [seeded.era.id]
    ),
  assertRetrySnapshot: (snapshot, _seeded, mutation) => {
    assert(
      Number(snapshot.era.contentRevision) === Number(mutation.content_revision),
      "content-revision-direct: retry snapshot did not capture committed revision"
    );
  },
}));

ordinal += 1;
cases.push(await runEraFieldRace({
  label: "lifecycle-state",
  ordinal,
  mutate: async (client, seeded) =>
    one(client, "update eras set lifecycle_state='DRAFT' where id=$1 returning *", [seeded.era.id]),
  prepareRetry: async (client, seeded) => {
    await client.query("update eras set lifecycle_state='ACTIVE' where id=$1", [seeded.era.id]);
  },
  assertRetrySnapshot: (snapshot) => {
    assert(snapshot.era.lifecycleState === "ACTIVE", "lifecycle-state: retry was not restored safely");
  },
}));

ordinal += 1;
cases.push(await runEraFieldRace({
  label: "primary-visibility-lifecycle-multifield",
  ordinal,
  mutate: async (client, seeded) =>
    one(
      client,
      `update eras
          set name='multi-name-after',
              eyebrow='multi-eyebrow-after',
              story='multi-story-after',
              visibility='PRIVATE',
              is_primary=true,
              theme_tokens='{"accent":"multi-after"}'::json,
              archive_policy='{"mode":"immutable-closure","version":"multi-after"}'::json
        where id=$1
        returning *`,
      [seeded.era.id]
    ),
  assertRetrySnapshot: (snapshot) => {
    assert(snapshot.era.name === "multi-name-after", "multifield: name missing");
    assert(snapshot.era.eyebrow === "multi-eyebrow-after", "multifield: eyebrow missing");
    assert(snapshot.era.story === "multi-story-after", "multifield: story missing");
    assert(snapshot.era.visibility === "PRIVATE", "multifield: visibility missing");
    assert(snapshot.era.isPrimary === true, "multifield: primary missing");
    assert(snapshot.era.themeTokens?.accent === "multi-after", "multifield: theme missing");
    assert(snapshot.era.archivePolicy?.version === "multi-after", "multifield: archive policy missing");
  },
}));

// Sequential direct changes must monotonically advance the same guard.
ordinal += 1;
cases.push(await runEraFieldRace({
  label: "sequential-era-updates",
  ordinal,
  mutate: async (client, seeded) => {
    await client.query("update eras set story='sequential-one' where id=$1", [seeded.era.id]);
    return one(
      client,
      "update eras set story='sequential-two', name='sequential-name' where id=$1 returning *",
      [seeded.era.id]
    );
  },
  assertRetrySnapshot: (snapshot) => {
    assert(snapshot.era.story === "sequential-two", "sequential: final story missing");
    assert(snapshot.era.name === "sequential-name", "sequential: final name missing");
  },
}));

// PK/id is represented in the snapshot. A concurrent id move must make the
// original closure CAS miss; the retry uses the committed new id.
ordinal += 1;
cases.push(await runEraFieldRace({
  label: "id",
  ordinal,
  mutate: async (client, seeded) => {
    const newId = Number(seeded.era.id) + 1_000_000;
    return one(client, "update eras set id=$2 where id=$1 returning *", [seeded.era.id, newId]);
  },
  retryEraId: (_seeded, mutation) => Number(mutation.id),
  assertRetrySnapshot: (snapshot, _seeded, mutation) => {
    assert(Number(snapshot.era.id) === Number(mutation.id), "id: retry snapshot did not capture moved id");
  },
}));

// A rolled-back direct Era update must roll back its trigger revision as well,
// allowing the in-flight closure to complete against the unchanged row.
{
  ordinal += 1;
  const setup = new Client({ connectionString: url });
  const gate = new Client({ connectionString: url });
  const inspector = new Client({ connectionString: url });
  const mutator = new Client({ connectionString: url });
  await Promise.all([setup.connect(), gate.connect(), inspector.connect(), mutator.connect()]);
  try {
    const seeded = await seedEra(setup, "rollback", ordinal);
    const before = await one(setup, "select story,content_revision from eras where id=$1", [seeded.era.id]);
    await gate.query("begin");
    await gate.query("lock table era_archive_snapshots in access exclusive mode");
    const closePromise = closeEra({
      eraId: seeded.era.id,
      closureEvidenceRef: "synthetic:frc02-builder:rollback",
      actor: "remediation-builder",
      now: new Date(seeded.t0.getTime() + 1_000),
    });
    assert(await waitForBlockedSnapshotInsert(inspector), "rollback: closure never reached gate");
    await mutator.query("begin");
    const inside = await one(
      mutator,
      "update eras set story='rolled-back-story' where id=$1 returning story,content_revision",
      [seeded.era.id]
    );
    assert(Number(inside.content_revision) > Number(before.content_revision), "rollback: trigger did not fire");
    await mutator.query("rollback");
    await gate.query("commit");
    const closed = await closePromise;
    assert(closed.snapshot.snapshot.era.story === before.story, "rollback: uncommitted story leaked into snapshot");
    cases.push({
      case: "rollback",
      firstClose: "CLOSED_UNCHANGED",
      rolledBackRevision: Number(inside.content_revision),
      committedRevisionBeforeClose: Number(before.content_revision),
      snapshotStory: closed.snapshot.snapshot.era.story,
    });
  } finally {
    try { await mutator.query("rollback"); } catch {}
    try { await gate.query("rollback"); } catch {}
    await Promise.all([setup.end(), gate.end(), inspector.end(), mutator.end()]);
  }
}

// Concurrent Era-row + child-row changes must both invalidate the stale build,
// and retry must capture both committed values.
{
  ordinal += 1;
  const setup = new Client({ connectionString: url });
  const gate = new Client({ connectionString: url });
  const inspector = new Client({ connectionString: url });
  const mutator = new Client({ connectionString: url });
  await Promise.all([setup.connect(), gate.connect(), inspector.connect(), mutator.connect()]);
  try {
    const seeded = await seedEra(setup, "era-and-child", ordinal, { withSection: true });
    await gate.query("begin");
    await gate.query("lock table era_archive_snapshots in access exclusive mode");
    const closePromise = closeEra({
      eraId: seeded.era.id,
      closureEvidenceRef: "synthetic:frc02-builder:era-and-child:first",
      actor: "remediation-builder",
      now: new Date(seeded.t0.getTime() + 1_000),
    });
    assert(await waitForBlockedSnapshotInsert(inspector), "era-and-child: closure never reached gate");
    await mutator.query("update eras set story='era-after' where id=$1", [seeded.era.id]);
    await mutator.query(
      `update era_sections set config='{"headline":"child-after"}'::json where id=$1`,
      [seeded.section.id]
    );
    await gate.query("commit");
    let firstError = null;
    try { await closePromise; } catch (error) { firstError = errorCode(error); }
    assert(
      firstError === "ERA_CHANGED_BEFORE_CLOSURE" || firstError === "ERA_CHANGED_DURING_SNAPSHOT",
      `era-and-child: stale close not rejected; got ${firstError}`
    );
    assert((await closureSnapshotCount(setup, seeded.era.id)) === 0, "era-and-child: stale snapshot persisted");
    const retry = await closeEra({
      eraId: seeded.era.id,
      closureEvidenceRef: "synthetic:frc02-builder:era-and-child:retry",
      actor: "remediation-builder",
      now: new Date(seeded.t0.getTime() + 2_000),
    });
    assert(retry.snapshot.snapshot.era.story === "era-after", "era-and-child: Era mutation missing on retry");
    assert(retry.snapshot.snapshot.sections?.[0]?.config?.headline === "child-after", "era-and-child: child mutation missing on retry");
    cases.push({
      case: "concurrent-era-and-child",
      firstClose: "FAIL_CLOSED",
      firstCloseError: firstError,
      failedCloseSnapshotsPersisted: 0,
      retryCapturedEraAndChild: true,
    });
  } finally {
    try { await gate.query("rollback"); } catch {}
    await Promise.all([setup.end(), gate.end(), inspector.end(), mutator.end()]);
  }
}

// Two concurrent close attempts: exactly one may establish the lifecycle
// transition. The other must fail closed, and no duplicate authoritative
// snapshot may be created.
{
  ordinal += 1;
  const setup = new Client({ connectionString: url });
  await setup.connect();
  try {
    const seeded = await seedEra(setup, "two-closes", ordinal);
    const requests = [1, 2].map((n) =>
      closeEra({
        eraId: seeded.era.id,
        closureEvidenceRef: `synthetic:frc02-builder:two-closes:${n}`,
        actor: "remediation-builder",
        now: new Date(seeded.t0.getTime() + 1_000),
      })
    );
    const settled = await Promise.allSettled(requests);
    const fulfilled = settled.filter((x) => x.status === "fulfilled");
    const rejected = settled.filter((x) => x.status === "rejected");
    assert(fulfilled.length === 1, `two-closes: expected one success, got ${fulfilled.length}`);
    assert(rejected.length === 1, `two-closes: expected one rejection, got ${rejected.length}`);
    assert((await closureSnapshotCount(setup, seeded.era.id)) === 1, "two-closes: expected one authoritative snapshot");
    cases.push({
      case: "two-concurrent-closures",
      successfulClosures: fulfilled.length,
      rejectedClosures: rejected.length,
      authoritativeClosureSnapshots: 1,
      rejection: errorCode(rejected[0].reason),
    });
  } finally {
    await setup.end();
  }
}

console.log(JSON.stringify({
  schema: "AE_LRP_R0_FRC02_REMEDIATION_BUILDER_POSTGRES_PROOF_V1",
  findingId: "AE-LRP-R0-FRC-02",
  status: "PASS",
  postgres: "17",
  proofClass: "DISPOSABLE_POSTGRESQL_ERA_ROW_REVISION_CAS_CONCURRENCY",
  snapshotRelevantEraColumns: [
    "id","slug","name","eyebrow","story","kind","lifecycle_state","visibility",
    "is_primary","start_at","end_at","theme_tokens","archive_policy",
    "content_revision","created_at","updated_at"
  ],
  excludedEraColumns: {
    watchtower_profile: "NOT_SERIALIZED_IN_ACRE_ERA_ARCHIVE_SNAPSHOT_R0",
  },
  cases,
  guarantees: {
    exactFrc02StoryRaceClosed: true,
    directSqlOmittingUpdatedAtCovered: true,
    nameCovered: true,
    eyebrowCovered: true,
    themeTokensCovered: true,
    archivePolicyCovered: true,
    visibilityPrimaryLifecycleCovered: true,
    allSerializedMutableEraFieldsCovered: true,
    multipleFieldsOneTransactionCovered: true,
    sequentialChangesCovered: true,
    concurrentEraAndChildCovered: true,
    rollbackCovered: true,
    twoConcurrentClosureAttemptsCovered: true,
    failedCloseSnapshotsPersisted: 0,
    retryCapturesCommittedMutation: true,
    applicationPathCloseCovered: true,
  },
}, null, 2));

await pool.end();
