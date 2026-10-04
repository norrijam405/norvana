import pg from "pg";
import { pool } from "../../src/db/index.ts";
import { closeEra, EraLifecycleError } from "../../src/lib/era-engine/lifecycle-service.ts";

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

function assert(value, message) {
  if (!value) throw new Error(message);
}
async function one(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  if (rows.length !== 1) throw new Error("expected exactly one row");
  return rows[0];
}
function code(error) {
  if (error instanceof EraLifecycleError) return error.code;
  if (error instanceof Error) return error.message;
  return String(error);
}
async function waitForBlockedSnapshotInsert(inspector) {
  for (let i = 0; i < 160; i++) {
    const { rows } = await inspector.query(
      `select pid from pg_stat_activity
        where datname=current_database()
          and pid <> pg_backend_pid()
          and wait_event_type='Lock'
          and lower(query) like '%insert into%'
          and lower(query) like '%era_archive_snapshots%'`
    );
    if (rows.length) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return false;
}
async function closureCount(client, eraId) {
  const row = await one(client,
    "select count(*)::int as count from era_archive_snapshots where era_id=$1 and snapshot_kind='CLOSURE'",
    [eraId]);
  return Number(row.count);
}
async function seedEra(client, label, ordinal, withChildren=false) {
  const t0 = new Date("2026-10-04T02:30:00.000Z");
  const era = await one(client, `
    insert into eras
      (slug,name,eyebrow,story,kind,lifecycle_state,visibility,is_primary,start_at,
       theme_tokens,watchtower_profile,archive_policy,created_at,updated_at)
    values
      ($1,$2,'before-eyebrow','before-story','CATEGORY','ACTIVE','PUBLIC',false,$3,
       '{"accent":"before"}'::json,'{"profile":"not-snapshotted"}'::json,
       '{"mode":"immutable-closure","version":"before"}'::json,$3,$3)
    returning *`,
    [`frc03-${label}-${ordinal}`, `FRC03 ${label} ${ordinal}`, t0]
  );
  let section = null;
  if (withChildren) {
    section = await one(client, `
      insert into era_sections (era_id,section_type,position,config,status)
      values ($1,'HERO',0,'{"headline":"before"}'::json,'ENABLED')
      returning *`, [era.id]);
  }
  return { era, t0, section };
}

async function runNeutralizedEraRace({label, ordinal, mutate, snapshotValue, liveValue}) {
  const setup = new Client({connectionString:url});
  const gate = new Client({connectionString:url});
  const inspector = new Client({connectionString:url});
  const mutator = new Client({connectionString:url});
  await Promise.all([setup.connect(),gate.connect(),inspector.connect(),mutator.connect()]);
  try {
    const seeded = await seedEra(setup,label,ordinal);
    const before = await one(setup,
      "select id,story,name,eyebrow,kind,visibility,is_primary,start_at,end_at,theme_tokens,archive_policy,created_at,updated_at,content_revision from eras where id=$1",
      [seeded.era.id]);

    await gate.query("begin");
    await gate.query("lock table era_archive_snapshots in access exclusive mode");

    let closeFinished = false;
    const closePromise = closeEra({
      eraId: seeded.era.id,
      closureEvidenceRef:`synthetic:fresh-rechallenger:frc03:${label}`,
      publicNote:"FRC-03 revision neutralization challenge",
      actor:"fresh-rechallenger",
      now:new Date(seeded.t0.getTime()+1000),
    }).finally(()=>{closeFinished=true;});

    const blocked = await waitForBlockedSnapshotInsert(inspector);
    assert(blocked, label+": close never blocked at snapshot persistence");

    await mutator.query("begin");
    const changed = await mutate(mutator, seeded, before);
    const afterBump = await one(mutator,
      "select content_revision,updated_at from eras where id=$1",[seeded.era.id]);
    assert(Number(afterBump.content_revision) > Number(before.content_revision),
      label+": snapshot-field mutation did not first advance content_revision");

    const restored = await one(mutator,
      "update only eras set content_revision=$2 where id=$1 returning content_revision,updated_at",
      [seeded.era.id,before.content_revision]);
    assert(Number(restored.content_revision) === Number(before.content_revision),
      label+": direct content_revision-only reset was rejected");
    assert(restored.updated_at.toISOString() === before.updated_at.toISOString(),
      label+": content_revision-only reset unexpectedly changed updated_at");
    await mutator.query("commit");

    const mutationCommittedBeforeCloseCompleted = !closeFinished;
    await gate.query("commit");

    let closure=null, closeError=null;
    try { closure=await closePromise; } catch (e) { closeError=code(e); }

    const live=await one(setup,
      "select * from eras where id=$1",[seeded.era.id]);
    const count=await closureCount(setup,seeded.era.id);
    const persisted=closure ? await one(setup,
      "select snapshot from era_archive_snapshots where id=$1",[closure.snapshot.id]) : null;

    const staleAccepted = Boolean(
      closure &&
      live.lifecycle_state === "CLOSED" &&
      count === 1 &&
      snapshotValue(persisted.snapshot) !== liveValue(live) &&
      mutationCommittedBeforeCloseCompleted
    );

    return {
      case:label,
      sqlForm:changed.sqlForm,
      blockedAtSnapshotPersistence:blocked,
      revisionBefore:Number(before.content_revision),
      revisionAfterSnapshotMutation:Number(afterBump.content_revision),
      revisionAfterDirectReset:Number(restored.content_revision),
      updatedAtPreserved:
        restored.updated_at.toISOString()===before.updated_at.toISOString(),
      mutationCommittedBeforeCloseCompleted,
      closeResult: closure ? "CLOSED" : "REJECTED",
      closeError,
      closureSnapshots:count,
      snapshotValue: persisted ? snapshotValue(persisted.snapshot) : null,
      liveValue:liveValue(live),
      staleAccepted
    };
  } finally {
    try { await gate.query("rollback"); } catch {}
    try { await mutator.query("rollback"); } catch {}
    await Promise.all([setup.end(),gate.end(),inspector.end(),mutator.end()]);
  }
}

async function runControlNoReset() {
  const setup=new Client({connectionString:url});
  const gate=new Client({connectionString:url});
  const inspector=new Client({connectionString:url});
  const mutator=new Client({connectionString:url});
  await Promise.all([setup.connect(),gate.connect(),inspector.connect(),mutator.connect()]);
  try {
    const seeded=await seedEra(setup,"control-no-reset",90);
    const before=await one(setup,"select content_revision from eras where id=$1",[seeded.era.id]);
    await gate.query("begin");
    await gate.query("lock table era_archive_snapshots in access exclusive mode");
    const closePromise=closeEra({
      eraId:seeded.era.id,
      closureEvidenceRef:"synthetic:fresh-rechallenger:frc03:control",
      actor:"fresh-rechallenger",
      now:new Date(seeded.t0.getTime()+1000)
    });
    assert(await waitForBlockedSnapshotInsert(inspector),"control: close did not block");
    const changed=await one(mutator,
      "update eras set story='control-after' where id=$1 returning content_revision",
      [seeded.era.id]);
    assert(Number(changed.content_revision)>Number(before.content_revision),
      "control: revision did not bump");
    await gate.query("commit");
    let err=null;
    try { await closePromise; } catch(e){ err=code(e); }
    return {
      case:"control-no-revision-reset",
      closeResult:err ? "REJECTED":"CLOSED",
      closeError:err,
      closureSnapshots:await closureCount(setup,seeded.era.id)
    };
  } finally {
    try { await gate.query("rollback"); } catch {}
    await Promise.all([setup.end(),gate.end(),inspector.end(),mutator.end()]);
  }
}

async function runChildResetRace() {
  const setup=new Client({connectionString:url});
  const gate=new Client({connectionString:url});
  const inspector=new Client({connectionString:url});
  const mutator=new Client({connectionString:url});
  await Promise.all([setup.connect(),gate.connect(),inspector.connect(),mutator.connect()]);
  try {
    const seeded=await seedEra(setup,"child-section",91,true);
    const before=await one(setup,"select content_revision,updated_at from eras where id=$1",[seeded.era.id]);
    await gate.query("begin");
    await gate.query("lock table era_archive_snapshots in access exclusive mode");
    const closePromise=closeEra({
      eraId:seeded.era.id,
      closureEvidenceRef:"synthetic:fresh-rechallenger:frc03:child",
      actor:"fresh-rechallenger",
      now:new Date(seeded.t0.getTime()+1000)
    });
    assert(await waitForBlockedSnapshotInsert(inspector),"child: close did not block");
    await mutator.query("begin");
    await mutator.query(
      `with changed as (
         update era_sections set config='{"headline":"after"}'::json where id=$1 returning era_id
       )
       select * from changed`,[seeded.section.id]);
    const bumped=await one(mutator,"select content_revision from eras where id=$1",[seeded.era.id]);
    assert(Number(bumped.content_revision)>Number(before.content_revision),"child: revision did not bump");
    const restored=await one(mutator,
      "update eras set content_revision=$2 where id=$1 returning content_revision,updated_at",
      [seeded.era.id,before.content_revision]);
    await mutator.query("commit");
    await gate.query("commit");
    let closure=null,err=null;
    try {closure=await closePromise;}catch(e){err=code(e);}
    const persisted=closure ? await one(setup,
      "select snapshot from era_archive_snapshots where id=$1",[closure.snapshot.id]) : null;
    const liveSection=await one(setup,"select config from era_sections where id=$1",[seeded.section.id]);
    return {
      case:"child-section-cte-update-plus-revision-reset",
      revisionBefore:Number(before.content_revision),
      revisionAfterChildMutation:Number(bumped.content_revision),
      revisionAfterDirectReset:Number(restored.content_revision),
      updatedAtPreserved:restored.updated_at.toISOString()===before.updated_at.toISOString(),
      closeResult:closure?"CLOSED":"REJECTED",
      closeError:err,
      snapshotHeadline:persisted?.snapshot?.sections?.[0]?.config?.headline ?? null,
      liveHeadline:liveSection.config?.headline ?? null,
      closureSnapshots:await closureCount(setup,seeded.era.id),
      staleAccepted:Boolean(closure &&
        persisted?.snapshot?.sections?.[0]?.config?.headline==="before" &&
        liveSection.config?.headline==="after")
    };
  } finally {
    try{await gate.query("rollback");}catch{}
    try{await mutator.query("rollback");}catch{}
    await Promise.all([setup.end(),gate.end(),inspector.end(),mutator.end()]);
  }
}

const cases=[];
cases.push(await runNeutralizedEraRace({
  label:"story-two-statement-reset",ordinal:1,
  mutate:async(c,s)=>{await c.query("update only eras set story='after-story' where id=$1",[s.era.id]);return{sqlForm:"UPDATE ONLY + content_revision-only reset"};},
  snapshotValue:s=>s.era.story,
  liveValue:r=>r.story
}));
cases.push(await runNeutralizedEraRace({
  label:"name-cte-update-reset",ordinal:2,
  mutate:async(c,s)=>{await c.query("with v(id,val) as (values ($1::int,$2::varchar)) update eras e set name=v.val from v where e.id=v.id",[s.era.id,"after-name"]);return{sqlForm:"WITH VALUES ... UPDATE FROM + reset"};},
  snapshotValue:s=>s.era.name,
  liveValue:r=>r.name
}));
cases.push(await runNeutralizedEraRace({
  label:"theme-json-merge-reset",ordinal:3,
  mutate:async(c,s)=>{await c.query(`
    merge into eras e
    using (select $1::int id, '{"accent":"after","mode":"night"}'::json val) v
      on e.id=v.id
    when matched then update set theme_tokens=v.val`,[s.era.id]);return{sqlForm:"MERGE WHEN MATCHED UPDATE + reset"};},
  snapshotValue:s=>JSON.stringify(s.era.themeTokens),
  liveValue:r=>JSON.stringify(r.theme_tokens)
}));
cases.push(await runNeutralizedEraRace({
  label:"archive-policy-multifield-reset",ordinal:4,
  mutate:async(c,s)=>{await c.query(`
    update eras
       set archive_policy='{"mode":"immutable-closure","version":"after"}'::json,
           eyebrow='after-eyebrow',
           kind='COLLECTION',
           start_at=start_at + interval '1 second'
     where id=$1`,[s.era.id]);return{sqlForm:"multi-field UPDATE + interval expression + reset"};},
  snapshotValue:s=>JSON.stringify({p:s.era.archivePolicy,e:s.era.eyebrow,k:s.era.kind,start:s.era.startAt}),
  liveValue:r=>JSON.stringify({p:r.archive_policy,e:r.eyebrow,k:r.kind,start:r.start_at?.toISOString?.() ?? String(r.start_at)})
}));
const control=await runControlNoReset();
const child=await runChildResetRace();

const staleCases=cases.filter(x=>x.staleAccepted);
const staleAccepted=staleCases.length>0 || child.staleAccepted;
assert(control.closeResult==="REJECTED","control without reset unexpectedly closed");
assert(control.closureSnapshots===0,"control failed close persisted CLOSURE snapshot");
assert(staleAccepted,"fresh challenge did not reproduce revision-neutralization bypass");

console.log("FRESH_RECHALLENGER_EVIDENCE_BEGIN");
console.log(JSON.stringify({
  schema:"AE_LRP_R0_FRC03_FRESH_RECHALLENGER_RAW_EVIDENCE_V1",
  date:"2026-10-03",
  repository:"norrijam405/norvana",
  pullRequest:15,
  role:"Fresh Re-Challenger",
  result:"FAIL",
  finding:{
    id:"AE-LRP-R0-FRC-03",
    title:"CONTENT_REVISION_DIRECT_RESET_NEUTRALIZES_CLOSURE_CAS"
  },
  challengedCandidate:{
    commit:"29163ee7cdd31e732c3437b55bc63ed71fa8f294",
    parent:"dd888f81e90e93a6dc5c116e6a558e38e4156591",
    tree:"a4ad399e49bd1a37b8f834d47a6835632f8b2a87"
  },
  mechanism:"A snapshot-contributing mutation first bumps eras.content_revision through 0016, then a content_revision-only UPDATE restores the pre-snapshot revision because content_revision is excluded from the trigger UPDATE OF list. updated_at remains unchanged. closeEra therefore sees its original CAS operands and can accept a stale CLOSURE snapshot.",
  control,
  eraRowCases:cases,
  childRevisionCase:child,
  consequence:"Monotonic Era revision is not database-enforced against direct revision manipulation; stale closure snapshots can be accepted after committed Era-row or child-state mutations.",
  status:"REPRODUCED"
},null,2));
console.log("FRESH_RECHALLENGER_EVIDENCE_END");

await pool.end();
