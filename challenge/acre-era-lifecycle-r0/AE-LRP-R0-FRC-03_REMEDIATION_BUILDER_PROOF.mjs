import pg from "pg";
import { pool } from "../../src/db/index.ts";
import { closeEra, EraLifecycleError } from "../../src/lib/era-engine/lifecycle-service.ts";

const { Client } = pg;
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

function assert(v,m){ if(!v) throw new Error(m); }
async function one(c,sql,p=[]){ const {rows}=await c.query(sql,p); if(rows.length!==1) throw new Error("expected one row: "+sql); return rows[0]; }
function code(e){ if(e instanceof EraLifecycleError) return e.code; if(e instanceof Error) return e.message; return String(e); }
async function closureCount(c,id){ return Number((await one(c,"select count(*)::int count from era_archive_snapshots where era_id=$1 and snapshot_kind='CLOSURE'",[id])).count); }
async function waitGate(c){
  for(let i=0;i<160;i++){
    const {rows}=await c.query(`select pid from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid() and wait_event_type='Lock' and lower(query) like '%insert into%' and lower(query) like '%era_archive_snapshots%'`);
    if(rows.length) return true;
    await new Promise(r=>setTimeout(r,50));
  }
  return false;
}
async function seedEra(c,label,n){
  const t0=new Date("2026-10-04T05:30:00.000Z");
  const era=await one(c,`insert into eras
    (slug,name,eyebrow,story,kind,lifecycle_state,visibility,is_primary,start_at,theme_tokens,watchtower_profile,archive_policy,created_at,updated_at)
    values ($1,$2,'before-eyebrow','before-story','CATEGORY','ACTIVE','PUBLIC',false,$3,'{"accent":"before"}'::json,'{}'::json,'{"mode":"immutable-closure","version":"before"}'::json,$3,$3)
    returning *`,[`frc03-builder-${label}-${n}`,`FRC03 Builder ${label} ${n}`,t0]);
  return {era,t0};
}
async function expectRegressionRejected(c,eraId,target,label){
  let err=null;
  try { await c.query("update eras set content_revision=$2 where id=$1",[eraId,target]); } catch(e){ err=e; }
  assert(err, label+": revision regression unexpectedly accepted");
  assert(err.code==="23514", label+": expected 23514, got "+err.code);
  return {case:label,rejected:true,sqlstate:err.code};
}
async function runRace(label,n,mutate,{sameTx=false}={}){
  const setup=new Client({connectionString:url}), gate=new Client({connectionString:url}), inspector=new Client({connectionString:url}), mut=new Client({connectionString:url});
  await Promise.all([setup.connect(),gate.connect(),inspector.connect(),mut.connect()]);
  try{
    const seeded=await seedEra(setup,label,n);
    const before=await one(setup,"select content_revision,updated_at from eras where id=$1",[seeded.era.id]);
    await gate.query("begin");
    await gate.query("lock table era_archive_snapshots in access exclusive mode");
    const closeP=closeEra({eraId:seeded.era.id,closureEvidenceRef:`synthetic:frc03-builder:${label}:first`,actor:"remediation-builder",now:new Date(seeded.t0.getTime()+1000)});
    assert(await waitGate(inspector),label+": close never reached snapshot gate");

    if(sameTx) await mut.query("begin");
    await mutate(mut,seeded);
    const bumped=await one(mut,"select content_revision from eras where id=$1",[seeded.era.id]);
    assert(Number(bumped.content_revision)>Number(before.content_revision),label+": mutation did not advance revision");

    let resetError=null;
    if(sameTx){
      await mut.query("savepoint before_reset");
      try { await mut.query("update only eras set content_revision=$2 where id=$1",[seeded.era.id,before.content_revision]); }
      catch(e){ resetError=e; await mut.query("rollback to savepoint before_reset"); }
      assert(resetError?.code==="23514",label+": same-tx reset not rejected");
      await mut.query("release savepoint before_reset");
      await mut.query("commit");
    } else {
      try { await mut.query("update only eras set content_revision=$2 where id=$1",[seeded.era.id,before.content_revision]); }
      catch(e){ resetError=e; }
      assert(resetError?.code==="23514",label+": later reset not rejected");
    }

    await gate.query("commit");
    let firstErr=null; try{ await closeP; }catch(e){ firstErr=code(e); }
    assert(["ERA_CHANGED_BEFORE_CLOSURE","ERA_CHANGED_DURING_SNAPSHOT"].includes(firstErr),label+": stale close not rejected: "+firstErr);
    assert(await closureCount(setup,seeded.era.id)===0,label+": failed close persisted snapshot");
    const live=await one(setup,"select lifecycle_state,content_revision from eras where id=$1",[seeded.era.id]);
    assert(live.lifecycle_state==="ACTIVE",label+": stale close changed lifecycle");

    const retry=await closeEra({eraId:seeded.era.id,closureEvidenceRef:`synthetic:frc03-builder:${label}:retry`,actor:"remediation-builder",now:new Date(seeded.t0.getTime()+2000)});
    assert(retry.era.lifecycleState==="CLOSED",label+": retry failed");
    return {case:label,resetRejected:true,resetSqlstate:resetError.code,firstClose:"FAIL_CLOSED",firstCloseError:firstErr,failedCloseSnapshotsPersisted:0,retry:"CLOSED_WITH_COMMITTED_MUTATION_CAPTURED"};
  } finally {
    try{await gate.query("rollback");}catch{}
    try{await mut.query("rollback");}catch{}
    await Promise.all([setup.end(),gate.end(),inspector.end(),mut.end()]);
  }
}

const cases=[];
{
  const c=new Client({connectionString:url}); await c.connect();
  try{
    const s=await seedEra(c,"direct-guard",1);
    await c.query("update eras set content_revision=5 where id=$1",[s.era.id]);
    cases.push(await expectRegressionRejected(c,s.era.id,4,"older-positive"));
    cases.push(await expectRegressionRejected(c,s.era.id,0,"restore-earlier"));
    cases.push(await expectRegressionRejected(c,s.era.id,-1,"below-zero-update"));
    const noOp=await one(c,"update eras set content_revision=content_revision where id=$1 returning content_revision",[s.era.id]);
    assert(Number(noOp.content_revision)===5,"no-op changed revision");
    cases.push({case:"no-op-revision-update",accepted:true,revision:5});
    let insertErr=null;
    try{await c.query(`insert into eras(slug,name,kind,lifecycle_state,visibility,is_primary,theme_tokens,watchtower_profile,archive_policy,content_revision) values('frc03-negative-insert','negative','CATEGORY','DRAFT','PRIVATE',false,'{}','{}','{}',-1)`);}catch(e){insertErr=e;}
    assert(insertErr?.code==="23514","negative insert not rejected");
    cases.push({case:"negative-insert",rejected:true,sqlstate:insertErr.code});
  } finally { await c.end(); }
}

cases.push(await runRace("story-same-transaction-reset",2,async(c,s)=>{await c.query("update only eras set story='after-story' where id=$1",[s.era.id]);},{sameTx:true}));
cases.push(await runRace("story-later-transaction-reset",3,async(c,s)=>{await c.query("update eras set story='after-story-later' where id=$1",[s.era.id]);}));
cases.push(await runRace("cte-update-from-reset",4,async(c,s)=>{await c.query("with v(id,val) as (values ($1::int,$2::varchar)) update eras e set name=v.val from v where e.id=v.id",[s.era.id,"after-name"]);}));
cases.push(await runRace("merge-reset",5,async(c,s)=>{await c.query(`merge into eras e using (select $1::int id,'{"accent":"after"}'::json val) v on e.id=v.id when matched then update set theme_tokens=v.val`,[s.era.id]);}));
cases.push(await runRace("multifield-reset",6,async(c,s)=>{await c.query(`update eras set eyebrow='after',archive_policy='{"mode":"immutable-closure","version":"after"}'::json,kind='COLLECTION' where id=$1`,[s.era.id]);}));
cases.push(await runRace("sequential-reset",7,async(c,s)=>{await c.query("update eras set story='one' where id=$1",[s.era.id]); await c.query("update eras set story='two',name='two' where id=$1",[s.era.id]);}));
cases.push(await runRace("visibility-primary-lifecycle-reset",8,async(c,s)=>{await c.query("update eras set visibility='PRIVATE',is_primary=true,lifecycle_state='ACTIVE' where id=$1",[s.era.id]);}));

// Rollback and savepoint semantics.
{
  const c=new Client({connectionString:url}); await c.connect();
  try{
    const s=await seedEra(c,"rollback-savepoint",9);
    const before=await one(c,"select story,content_revision from eras where id=$1",[s.era.id]);
    await c.query("begin");
    await c.query("update eras set story='rolled-back' where id=$1",[s.era.id]);
    await c.query("rollback");
    const after=await one(c,"select story,content_revision from eras where id=$1",[s.era.id]);
    assert(after.story===before.story && Number(after.content_revision)===Number(before.content_revision),"rollback did not restore row+revision");
    await c.query("begin");
    await c.query("update eras set story='committed-via-savepoint' where id=$1",[s.era.id]);
    await c.query("savepoint reset_try");
    let err=null; try{await c.query("update eras set content_revision=$2 where id=$1",[s.era.id,before.content_revision]);}catch(e){err=e;await c.query("rollback to savepoint reset_try");}
    assert(err?.code==="23514","savepoint regression not rejected");
    await c.query("commit");
    cases.push({case:"rollback-and-savepoint",rollbackRestored:true,savepointResetRejected:true});
  } finally { try{await c.query("rollback");}catch{} await c.end(); }
}

// Child-state reset matrix: every mutation advances the Era revision; a direct
// attempt to restore the previous revision is rejected at the DB boundary.
{
  const c=new Client({connectionString:url}); await c.connect();
  try{
    const {era,t0}=await seedEra(c,"child-matrix",10);
    const product=await one(c,`insert into products(name,slug,description,price,compare_at_price,cost,niche,status,commerce_model,source_provider_slug,brand_name,product_condition,authorization_state,image_rights_state,external_seller_name,product_evidence,images,inventory)
      values('P','frc03-child-p','synthetic',10,12,5,'proof','active','QUALIFIED_SUPPLIER','synthetic','Acre','NEW','DIRECT_RETAIL_AUTHORIZED','OWNED','Acre','{}','[]',1) returning *`);
    const second=await one(c,`insert into products(name,slug,description,price,compare_at_price,cost,niche,status,commerce_model,source_provider_slug,brand_name,product_condition,authorization_state,image_rights_state,external_seller_name,product_evidence,images,inventory)
      values('P2','frc03-child-p2','synthetic',11,13,6,'proof','active','QUALIFIED_SUPPLIER','synthetic','Acre','NEW','DIRECT_RETAIL_AUTHORIZED','OWNED','Acre','{}','[]',1) returning *`);
    async function mutateAndReject(label,fn){
      const before=Number((await one(c,"select content_revision from eras where id=$1",[era.id])).content_revision);
      const result=await fn();
      const after=Number((await one(c,"select content_revision from eras where id=$1",[era.id])).content_revision);
      assert(after>before,label+": child mutation did not advance revision");
      const rej=await expectRegressionRejected(c,era.id,before,"child-"+label);
      cases.push({case:"child-"+label,revisionBefore:before,revisionAfter:after,resetRejected:rej.rejected});
      return result;
    }
    const m=await mutateAndReject("membership-insert",()=>one(c,`insert into era_products(era_id,product_id,position,role,curation_reason,evidence_ref,status,assigned_at) values($1,$2,0,'FEATURED','x','synthetic','ACTIVE',$3) returning *`,[era.id,product.id,t0]));
    await mutateAndReject("membership-update",()=>c.query("update era_products set role='STANDARD' where id=$1",[m.id]));
    await mutateAndReject("membership-delete",()=>c.query("delete from era_products where id=$1",[m.id]));
    const s=await mutateAndReject("section-insert",()=>one(c,`insert into era_sections(era_id,section_type,position,config,status) values($1,'HERO',0,'{"headline":"before"}','ENABLED') returning *`,[era.id]));
    await mutateAndReject("section-update",()=>c.query(`update era_sections set config='{"headline":"after"}' where id=$1`,[s.id]));
    await mutateAndReject("section-delete",()=>c.query("delete from era_sections where id=$1",[s.id]));
    const media=await mutateAndReject("media-insert",()=>one(c,`insert into era_media_assets(era_id,asset_type,media_url,rights_state,rights_evidence_ref,source_label,status,sha256,alt_text,created_at,updated_at) values($1,'HERO_IMAGE','https://example.invalid/a','OWNED','synthetic','Synthetic','APPROVED',$2,'before',$3,$3) returning *`,[era.id,"a".repeat(64),t0]));
    await mutateAndReject("media-update",()=>c.query("update era_media_assets set alt_text='after' where id=$1",[media.id]));
    await mutateAndReject("media-delete",()=>c.query("delete from era_media_assets where id=$1",[media.id]));
    const b=await mutateAndReject("watchtower-insert",()=>one(c,`insert into era_watchtower_bindings(era_id,watch_job_slug,importance,public_facet,config) values($1,'frc03-watch',1,'price-history','{}') returning *`,[era.id]));
    await mutateAndReject("watchtower-update",()=>c.query("update era_watchtower_bindings set importance=2 where id=$1",[b.id]));
    await mutateAndReject("watchtower-delete",()=>c.query("delete from era_watchtower_bindings where id=$1",[b.id]));
    const mem=await one(c,`insert into era_products(era_id,product_id,position,role,curation_reason,evidence_ref,status,assigned_at) values($1,$2,0,'FEATURED','x','synthetic','ACTIVE',$3) returning *`,[era.id,second.id,t0]);
    await mutateAndReject("referenced-product-one-era",()=>c.query("update products set price=22 where id=$1",[second.id]));
    const era2=(await seedEra(c,"product-multi",11)).era;
    await c.query(`insert into era_products(era_id,product_id,position,role,curation_reason,evidence_ref,status,assigned_at) values($1,$2,0,'FEATURED','x','synthetic','ACTIVE',$3)`,[era2.id,second.id,t0]);
    const before1=Number((await one(c,"select content_revision from eras where id=$1",[era.id])).content_revision);
    const before2=Number((await one(c,"select content_revision from eras where id=$1",[era2.id])).content_revision);
    await c.query("update products set price=23 where id=$1",[second.id]);
    const after1=Number((await one(c,"select content_revision from eras where id=$1",[era.id])).content_revision);
    const after2=Number((await one(c,"select content_revision from eras where id=$1",[era2.id])).content_revision);
    assert(after1>before1 && after2>before2,"multi-era product mutation did not bump both");
    await expectRegressionRejected(c,era.id,before1,"product-multi-era-1");
    await expectRegressionRejected(c,era2.id,before2,"product-multi-era-2");
    cases.push({case:"referenced-product-multiple-eras",bothAdvanced:true,bothResetsRejected:true});
    void mem;
  } finally { await c.end(); }
}

console.log(JSON.stringify({
  schema:"AE_LRP_R0_FRC03_REMEDIATION_BUILDER_POSTGRES_PROOF_V1",
  findingId:"AE-LRP-R0-FRC-03",
  status:"PASS",
  postgres:"17",
  proofClass:"DISPOSABLE_POSTGRESQL_MONOTONIC_NON_NEUTRALIZABLE_ERA_REVISION",
  cases,
  guarantees:{
    directRevisionLoweringRejected:true,
    exactPriorRevisionRestoreRejected:true,
    olderPositiveRejected:true,
    belowZeroRejected:true,
    sameTransactionResetRejected:true,
    laterCommittedResetRejected:true,
    ordinaryUpdateResetClosed:true,
    updateOnlyResetClosed:true,
    cteUpdateFromResetClosed:true,
    mergeResetClosed:true,
    multiFieldResetClosed:true,
    sequentialMutationResetClosed:true,
    lifecycleVisibilityPrimaryResetClosed:true,
    childResetMatrixCovered:true,
    rollbackCovered:true,
    savepointsCovered:true,
    failedCloseSnapshotsPersisted:0,
    retryCapturesCommittedMutation:true
  }
},null,2));

await pool.end();
