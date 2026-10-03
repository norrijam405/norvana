import pg from "pg";
import { pool } from "../../src/db/index.ts";
import { closeEra } from "../../src/lib/era-engine/lifecycle-service.ts";

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const setup = new Client({ connectionString: url });
const gate = new Client({ connectionString: url });
const inspector = new Client({ connectionString: url });
const mutator = new Client({ connectionString: url });
await Promise.all([
  setup.connect(),
  gate.connect(),
  inspector.connect(),
  mutator.connect(),
]);

async function one(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  if (rows.length !== 1) throw new Error("expected exactly one row");
  return rows[0];
}

const t0 = new Date("2026-10-03T23:50:00.000Z");
const era = await one(
  setup,
  `insert into eras
    (slug,name,eyebrow,story,kind,lifecycle_state,visibility,is_primary,
     start_at,theme_tokens,watchtower_profile,archive_policy,created_at,updated_at)
   values
    ('frc02-era-row-race','FRC02 Era Row Race','Synthetic','before-snapshot',
     'CATEGORY','ACTIVE','PUBLIC',false,$1,
     '{}'::json,'{}'::json,'{"mode":"immutable-closure"}'::json,$1,$1)
   returning *`,
  [t0]
);

const before = await one(
  setup,
  "select story, updated_at, content_revision from eras where id=$1",
  [era.id]
);

// Hold the archive table so closeEra can finish all snapshot reads and then
// block exactly at snapshot persistence, before its final Era CAS.
await gate.query("begin");
await gate.query("lock table era_archive_snapshots in access exclusive mode");

let closeFinished = false;
const closePromise = closeEra({
  eraId: era.id,
  closureEvidenceRef: "synthetic:fresh-rechallenger:frc02",
  publicNote: "Era-row mutation after snapshot construction",
  actor: "fresh-rechallenger",
  now: new Date(t0.getTime() + 1000),
}).finally(() => {
  closeFinished = true;
});

let observedBlockedSnapshotInsert = false;
for (let i = 0; i < 100; i++) {
  const { rows } = await inspector.query(
    `select pid, wait_event_type, query
       from pg_stat_activity
      where datname=current_database()
        and pid <> pg_backend_pid()
        and wait_event_type='Lock'
        and lower(query) like '%insert into%'
        and lower(query) like '%era_archive_snapshots%'`
  );
  if (rows.length) {
    observedBlockedSnapshotInsert = true;
    break;
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
}

if (!observedBlockedSnapshotInsert) {
  throw new Error("did not observe closeEra blocked at closure snapshot persistence");
}

// This is ordinary direct SQL against snapshot-contributing Era state.
// The candidate has no trigger that advances content_revision for Era-row
// changes and updated_at is not database-managed.
const mutation = await one(
  mutator,
  `update eras
      set story='after-snapshot-before-close'
    where id=$1
    returning story, updated_at, content_revision`,
  [era.id]
);

const mutationCommittedBeforeCloseCompleted = !closeFinished;

await gate.query("commit");
const closure = await closePromise;

const persisted = await one(
  setup,
  "select snapshot from era_archive_snapshots where id=$1",
  [closure.snapshot.id]
);
const live = await one(
  setup,
  "select story, lifecycle_state, updated_at, content_revision from eras where id=$1",
  [era.id]
);

const snapshotStory = persisted.snapshot?.era?.story;
const staleAccepted =
  observedBlockedSnapshotInsert &&
  mutationCommittedBeforeCloseCompleted &&
  before.story === "before-snapshot" &&
  mutation.story === "after-snapshot-before-close" &&
  before.updated_at.toISOString() === mutation.updated_at.toISOString() &&
  Number(before.content_revision) === Number(mutation.content_revision) &&
  live.lifecycle_state === "CLOSED" &&
  snapshotStory === "before-snapshot" &&
  live.story === "after-snapshot-before-close";

const evidence = {
  schema: "AE_LRP_R0_FRC02_RAW_EVIDENCE_V1",
  findingId: "AE-LRP-R0-FRC-02",
  title: "CLOSURE_SNAPSHOT_ERA_ROW_MUTATION_NOT_COVERED_BY_REVISION_OR_UPDATED_AT_GUARD",
  challengedCandidate: {
    commit: "571d24a00ff1fb1aa319b125bf793584c7f059a0",
    parent: "718e73d23a0c3d691b7bd994cf6462ce32686255",
    tree: "63209916cd87c3f88cbace8fc7d152d59cc2f016",
  },
  timing: {
    observedBlockedSnapshotInsert,
    mutationCommittedBeforeCloseCompleted,
  },
  guardState: {
    beforeUpdatedAt: before.updated_at.toISOString(),
    mutationUpdatedAt: mutation.updated_at.toISOString(),
    beforeContentRevision: Number(before.content_revision),
    mutationContentRevision: Number(mutation.content_revision),
    guardChangedByMutation:
      before.updated_at.toISOString() !== mutation.updated_at.toISOString() ||
      Number(before.content_revision) !== Number(mutation.content_revision),
  },
  closure: {
    lifecycleState: live.lifecycle_state,
    persistedSnapshotStory: snapshotStory,
    liveStoryAtCloseCompletion: live.story,
    closureSnapshotDigest: closure.snapshot.snapshotDigest,
  },
  status: staleAccepted ? "REPRODUCED" : "NOT_REPRODUCED",
  consequence:
    "A direct Era-row mutation can commit after snapshot construction but before close completion without advancing updated_at or content_revision, allowing closeEra to accept a stale CLOSURE snapshot.",
};

console.log(JSON.stringify(evidence, null, 2));

if (!staleAccepted) process.exitCode = 1;

await Promise.all([
  setup.end(),
  gate.end(),
  inspector.end(),
  mutator.end(),
]);
await pool.end();
