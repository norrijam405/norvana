import pg from "pg";
import { pool } from "../../src/db/index.ts";
import { closeEra, EraLifecycleError } from "../../src/lib/era-engine/lifecycle-service.ts";
const {Client}=pg; const url=process.env.DATABASE_URL; if(!url) throw new Error("DATABASE_URL required");
const A=(v,m)=>{if(!v)throw new Error(m)}; const one=async(c,q,p=[])=>{const r=await c.query(q,p);A(r.rows.length===1,"expected one row");return r.rows[0]};
const code=e=>e instanceof EraLifecycleError?e.code:(e?.code||e?.message||String(e));
async function seed(c,label,n=0){const t=new Date("2026-10-04T07:00:00Z");return {t,era:await one(c,`insert into eras(slug,name,eyebrow,story,kind,lifecycle_state,visibility,is_primary,start_at,theme_tokens,watchtower_profile,archive_policy,created_at,updated_at) values($1,$2,'e','before','CATEGORY','ACTIVE','PUBLIC',false,$3,'{}','{}','{"mode":"immutable-closure"}',$3,$3) returning *`,[`frc03-fresh-${label}-${n}`,`Fresh ${label} ${n}`,t])}}
async function reject(c,q,p,label){let e;try{await c.query(q,p)}catch(x){e=x}A(e&&e.code==="23514",label+" expected 23514 got "+code(e));return e.code}
async function waitSnapshotGate(c){for(let i=0;i<160;i++){const r=await c.query(`select 1 from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid() and wait_event_type='Lock' and lower(query) like '%era_archive_snapshots%'`);if(r.rows.length)return true;await new Promise(r=>setTimeout(r,50))}return false}
async function countClosure(c,id){return Number((await one(c,`select count(*)::int n from era_archive_snapshots where era_id=$1 and snapshot_kind='CLOSURE'`,[id])).n)}
const cases=[];
let postgresVersion=null;
const c=new Client({connectionString:url}); await c.connect();
try{
  postgresVersion=(await one(c,"select version() v")).v;
  let s=await seed(c,"direct",1); const id=s.era.id;
  await c.query("update eras set content_revision=7 where id=$1",[id]);
  cases.push({case:"direct-zero",sqlstate:await reject(c,"update only eras set content_revision=0 where id=$1",[id],"zero")});
  cases.push({case:"older-positive",sqlstate:await reject(c,"update eras set content_revision=3 where id=$1",[id],"older")});
  cases.push({case:"negative-update",sqlstate:await reject(c,"update eras set content_revision=-1 where id=$1",[id],"negative")});
  cases.push({case:"case-expression",sqlstate:await reject(c,"update eras set content_revision=case when true then 6 else content_revision end where id=$1",[id],"case")});
  const noop=await one(c,"update eras set content_revision=content_revision where id=$1 returning content_revision",[id]); A(+noop.content_revision===7,"noop changed revision");
  cases.push({case:"no-op",revision:+noop.content_revision});
  let ie;try{await c.query(`insert into eras(slug,name,kind,lifecycle_state,visibility,is_primary,theme_tokens,watchtower_profile,archive_policy,content_revision) values('frc03-fresh-neg','neg','CATEGORY','DRAFT','PRIVATE',false,'{}','{}','{}',-1)`)}catch(e){ie=e}A(ie?.code==="23514","negative insert accepted");cases.push({case:"negative-insert",sqlstate:ie.code});

  s=await seed(c,"same-statement",2); const b=+s.era.content_revision;
  let r=await one(c,"update eras set story='after', content_revision=$2 where id=$1 returning story,content_revision",[s.era.id,b]);
  A(r.story==="after"&&+r.content_revision>b,"same-statement neutralized revision"); cases.push({case:"snapshot-field-plus-old-revision",before:b,after:+r.content_revision});

  s=await seed(c,"update-from",3); const b3=+s.era.content_revision;
  r=await one(c,`with v(id,story,rev) as (values($1::int,'after'::text,$2::int)) update eras e set story=v.story,content_revision=v.rev from v where e.id=v.id returning e.content_revision`,[s.era.id,b3]);
  A(+r.content_revision>b3,"UPDATE FROM neutralized"); cases.push({case:"cte-update-from-same-statement",before:b3,after:+r.content_revision});

  s=await seed(c,"merge",4); const b4=+s.era.content_revision;
  await c.query(`merge into eras e using (select $1::int id,$2::int rev) v on e.id=v.id when matched then update set story='after',content_revision=v.rev`,[s.era.id,b4]);
  r=await one(c,"select content_revision from eras where id=$1",[s.era.id]);A(+r.content_revision>b4,"MERGE neutralized");cases.push({case:"merge-same-statement",before:b4,after:+r.content_revision});

  s=await seed(c,"savepoint",5); const b5=+s.era.content_revision; await c.query("begin"); await c.query("update eras set story='after' where id=$1",[s.era.id]); await c.query("savepoint x"); let se;try{await c.query("update eras set content_revision=$2 where id=$1",[s.era.id,b5])}catch(e){se=e;await c.query("rollback to savepoint x")}A(se?.code==="23514","savepoint reset accepted");await c.query("commit");r=await one(c,"select content_revision from eras where id=$1",[s.era.id]);A(+r.content_revision>b5,"savepoint lost bump");cases.push({case:"savepoint",resetSqlstate:se.code,after:+r.content_revision});

  s=await seed(c,"rollback",6); const b6=+s.era.content_revision;await c.query("begin");await c.query("update eras set story='rolled' where id=$1",[s.era.id]);await c.query("rollback");r=await one(c,"select story,content_revision from eras where id=$1",[s.era.id]);A(r.story==="before"&&+r.content_revision===b6,"rollback mismatch");cases.push({case:"rollback",restored:true});

  s=await seed(c,"child",7); const b7=+s.era.content_revision; const sec=await one(c,`insert into era_sections(era_id,section_type,position,config,status) values($1,'HERO',0,'{"headline":"a"}','ENABLED') returning *`,[s.era.id]);r=await one(c,"select content_revision from eras where id=$1",[s.era.id]);A(+r.content_revision>b7,"child insert no bump");const afterChild=+r.content_revision;await reject(c,"update eras set content_revision=$2 where id=$1",[s.era.id,b7],"child reset");await c.query(`update era_sections set config='{"headline":"b"}' where id=$1`,[sec.id]);r=await one(c,"select content_revision from eras where id=$1",[s.era.id]);A(+r.content_revision>afterChild,"child update no bump");cases.push({case:"child-neutralization",before:b7,afterInsert:afterChild,afterUpdate:+r.content_revision,resetRejected:true});

  const m1=await seed(c,"bulk",8),m2=await seed(c,"bulk",9); const ids=[m1.era.id,m2.era.id]; await c.query("update eras set story='bulk',content_revision=0 where id=any($1::int[])",[ids]); const rr=await c.query("select id,content_revision from eras where id=any($1::int[]) order by id",[ids]);A(rr.rows.every(x=>+x.content_revision>0),"bulk neutralized");cases.push({case:"bulk-multirow",rows:rr.rows});
} finally {try{await c.query("rollback")}catch{} await c.end()}

// Exact closure race: snapshot constructed, mutation commits, reset attempt rejected, close must fail with zero CLOSURE rows, retry must capture mutation.
{
 const setup=new Client({connectionString:url}),gate=new Client({connectionString:url}),inspect=new Client({connectionString:url}),mut=new Client({connectionString:url});
 await Promise.all([setup.connect(),gate.connect(),inspect.connect(),mut.connect()]);
 try{
  const s=await seed(setup,"closure-race",20); const before=await one(setup,"select content_revision from eras where id=$1",[s.era.id]);
  await gate.query("begin");await gate.query("lock table era_archive_snapshots in access exclusive mode");
  const cp=closeEra({eraId:s.era.id,closureEvidenceRef:"synthetic:fresh-frc03",actor:"fresh-rechallenger",now:new Date(s.t.getTime()+1000)});
  A(await waitSnapshotGate(inspect),"close never reached snapshot gate");
  await mut.query("update eras set story='after-race' where id=$1",[s.era.id]); const bumped=await one(mut,"select content_revision from eras where id=$1",[s.era.id]);A(+bumped.content_revision>+before.content_revision,"race mutation no bump");
  await reject(mut,"update only eras set content_revision=$2 where id=$1",[s.era.id,+before.content_revision],"race reset");
  await gate.query("commit");let ce;try{await cp}catch(e){ce=e}A(["ERA_CHANGED_BEFORE_CLOSURE","ERA_CHANGED_DURING_SNAPSHOT"].includes(code(ce)),"stale close accepted: "+code(ce));A(await countClosure(setup,s.era.id)===0,"failed close persisted CLOSURE");
  const live=await one(setup,"select lifecycle_state,story from eras where id=$1",[s.era.id]);A(live.lifecycle_state==="ACTIVE","failed close changed state");
  const retry=await closeEra({eraId:s.era.id,closureEvidenceRef:"synthetic:fresh-frc03-retry",actor:"fresh-rechallenger",now:new Date(s.t.getTime()+2000)});A(retry.era.lifecycleState==="CLOSED","retry failed");A(retry.snapshot.snapshot.era.story==="after-race","retry missed committed mutation");
  cases.push({case:"exact-story-race",resetRejected:true,firstClose:code(ce),failedCloseSnapshots:0,retryCaptured:true});
 } finally {try{await gate.query("rollback")}catch{};await Promise.all([setup.end(),gate.end(),inspect.end(),mut.end()])}
}
console.log("FRC03_FRESH_RECHALLENGE_BEGIN");
console.log(JSON.stringify({schema:"AE_LRP_R0_FRC03_FRESH_RECHALLENGE_EXECUTION_V1",candidate:"bcd245f48b125a4f6f875edda15077dc699f80e0",postgresVersion,result:"PASS_SO_FAR",cases},null,2));
console.log("FRC03_FRESH_RECHALLENGE_END");
await pool.end();