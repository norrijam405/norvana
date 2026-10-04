import pg from "pg";
import { pool } from "../../src/db/index.ts";
import { closeEra, EraLifecycleError } from "../../src/lib/era-engine/lifecycle-service.ts";
const {Client}=pg; const url=process.env.DATABASE_URL; if(!url) throw new Error("DATABASE_URL required");
const A=(v,m)=>{if(!v)throw new Error(m)}; const one=async(c,q,p=[])=>{const r=await c.query(q,p);A(r.rows.length===1,m(q));return r.rows[0]}; const m=q=>"expected one row: "+q.slice(0,80);
const code=e=>e instanceof EraLifecycleError?e.code:(e?.code||e?.message||String(e));
async function reject(c,q,p=[],label="regression"){let e;try{await c.query(q,p)}catch(x){e=x}A(e?.code==="23514",label+" expected 23514 got "+code(e));return e.code}
async function seed(c,label){const t=new Date("2026-10-04T09:00:00Z");const era=await one(c,`insert into eras(slug,name,eyebrow,story,kind,lifecycle_state,visibility,is_primary,start_at,theme_tokens,watchtower_profile,archive_policy,created_at,updated_at) values($1,$2,'ia','before','CATEGORY','ACTIVE','PUBLIC',false,$3,'{}','{}','{"mode":"immutable-closure"}',$3,$3) returning *`,[`frc03-ia-${label}-${Date.now()}-${Math.random()}`,`IA ${label}`,t]);return {era,t}}
async function rev(c,id){return +(await one(c,"select content_revision from eras where id=$1",[id])).content_revision}
async function waitGate(c){for(let i=0;i<160;i++){const r=await c.query(`select 1 from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid() and wait_event_type='Lock' and lower(query) like '%era_archive_snapshots%'`);if(r.rows.length)return true;await new Promise(r=>setTimeout(r,50))}return false}
async function closures(c,id){return +(await one(c,"select count(*)::int n from era_archive_snapshots where era_id=$1 and snapshot_kind='CLOSURE'",[id])).n}
const cases=[]; const c=new Client({connectionString:url}); await c.connect(); let postgresVersion;
try{
 postgresVersion=(await one(c,"select version() v")).v;
 let s=await seed(c,"direct"); await c.query("update eras set content_revision=9 where id=$1",[s.era.id]);
 for(const [name,q] of [["zero","update eras set content_revision=0 where id=$1"],["older","update only eras set content_revision=4 where id=$1"],["negative","update eras set content_revision=-1 where id=$1"],["case","update eras set content_revision=case when true then 8 else content_revision end where id=$1"]]) cases.push({case:name,sqlstate:await reject(c,q,[s.era.id],name)});
 let r=await one(c,"update eras set content_revision=content_revision where id=$1 returning content_revision",[s.era.id]);A(+r.content_revision===9,"noop changed"); await c.query("update eras set content_revision=12 where id=$1",[s.era.id]);A(await rev(c,s.era.id)===12,"increase failed");
 let ie;try{await c.query(`insert into eras(slug,name,kind,lifecycle_state,visibility,is_primary,theme_tokens,watchtower_profile,archive_policy,content_revision) values('ia-neg-${Date.now()}','x','CATEGORY','DRAFT','PRIVATE',false,'{}','{}','{}',-1)`)}catch(e){ie=e}A(ie?.code==="23514","negative insert accepted");
 cases.push({case:"direct-invariants",noop:9,increase:12,negativeInsert:ie.code});

 for(const [name,sql] of [
  ["ordinary","update eras set story='ordinary',content_revision=$2 where id=$1 returning content_revision"],
  ["update-from","with v(id,rev) as (values($1::int,$2::int)) update eras e set story='from',content_revision=v.rev from v where e.id=v.id returning e.content_revision"]
 ]){s=await seed(c,name);const b=await rev(c,s.era.id);r=await one(c,sql,[s.era.id,b]);A(+r.content_revision>b,name+" neutralized");cases.push({case:name,before:b,after:+r.content_revision})}
 s=await seed(c,"merge");let b=await rev(c,s.era.id);await c.query("merge into eras e using(select $1::int id,$2::int rev)v on e.id=v.id when matched then update set story='merge',content_revision=v.rev",[s.era.id,b]);A(await rev(c,s.era.id)>b,"merge neutralized");
 s=await seed(c,"multiwrite");b=await rev(c,s.era.id);await c.query("begin");await c.query("update eras set story='a' where id=$1",[s.era.id]);let x=await rev(c,s.era.id);await c.query("update eras set name='b' where id=$1",[s.era.id]);let y=await rev(c,s.era.id);await c.query("savepoint sp");let se;try{await c.query("update eras set content_revision=$2 where id=$1",[s.era.id,b])}catch(e){se=e;await c.query("rollback to sp")}A(se?.code==="23514"&&y>x&&x>b,"multiwrite/savepoint failure");await c.query("commit");
 s=await seed(c,"rollback");b=await rev(c,s.era.id);await c.query("begin");await c.query("update eras set story='rollback' where id=$1",[s.era.id]);await c.query("rollback");r=await one(c,"select story,content_revision from eras where id=$1",[s.era.id]);A(r.story==="before"&&+r.content_revision===b,"rollback incoherent");
 cases.push({case:"transaction-semantics",savepointReset:se.code,rollback:true});

 // Independent child INSERT/UPDATE/DELETE matrix.
 for(const table of ["era_sections","era_media_assets","era_watchtower_bindings"]){
   s=await seed(c,table); b=await rev(c,s.era.id); let id;
   if(table==="era_sections") id=(await one(c,"insert into era_sections(era_id,section_type,position,config,status) values($1,'HERO',0,'{}','ENABLED') returning id",[s.era.id])).id;
   if(table==="era_media_assets") id=(await one(c,"insert into era_media_assets(era_id,asset_type,media_url,rights_state,status) values($1,'IMAGE','https://example.invalid/a','VERIFIED','ACTIVE') returning id",[s.era.id])).id;
   if(table==="era_watchtower_bindings") id=(await one(c,"insert into era_watchtower_bindings(era_id,watch_job_slug,importance,public_facet,config) values($1,'ia-watch',70,'ia','{}') returning id",[s.era.id])).id;
   let a=await rev(c,s.era.id);A(a>b,table+" insert no bump");
   if(table==="era_sections") await c.query("update era_sections set position=position+1 where id=$1",[id]);
   if(table==="era_media_assets") await c.query("update era_media_assets set alt_text='changed' where id=$1",[id]);
   if(table==="era_watchtower_bindings") await c.query("update era_watchtower_bindings set importance=30 where id=$1",[id]);
   let u=await rev(c,s.era.id);A(u>a,table+" update no bump");await c.query("delete from "+table+" where id=$1",[id]);let d=await rev(c,s.era.id);A(d>u,table+" delete no bump");await reject(c,"update eras set content_revision=$2 where id=$1",[s.era.id,b],table+" reset");cases.push({case:table,before:b,insert:a,update:u,delete:d});
 }
 // Membership + referenced product mutation across two Eras.
 const e1=await seed(c,"product-a"),e2=await seed(c,"product-b"); const prod=await one(c,`insert into products(slug,name,description,price,images,status) values($1,'IA Product','x',1,'[]','active') returning id`,[`ia-product-${Date.now()}`]);
 const b1=await rev(c,e1.era.id),b2=await rev(c,e2.era.id);const ep1=await one(c,"insert into era_products(era_id,product_id,position,role,curation_reason,evidence_ref,status) values($1,$2,0,'FEATURED','ia','synthetic:ia','ACTIVE') returning id",[e1.era.id,prod.id]);const ep2=await one(c,"insert into era_products(era_id,product_id,position,role,curation_reason,evidence_ref,status) values($1,$2,0,'FEATURED','ia','synthetic:ia','ACTIVE') returning id",[e2.era.id,prod.id]);let p1=await rev(c,e1.era.id),p2=await rev(c,e2.era.id);A(p1>b1&&p2>b2,"membership insert no bump");await c.query("update products set description='mutated' where id=$1",[prod.id]);let q1=await rev(c,e1.era.id),q2=await rev(c,e2.era.id);A(q1>p1&&q2>p2,"multi-era product mutation no bump");await c.query("update era_products set position=1 where id=$1",[ep1.id]);let u1=await rev(c,e1.era.id);A(u1>q1,"membership update no bump");await c.query("delete from era_products where id=$1",[ep2.id]);let d2=await rev(c,e2.era.id);A(d2>q2,"membership delete no bump");cases.push({case:"membership-product-multiera",e1:[b1,p1,q1,u1],e2:[b2,p2,q2,d2]});
} finally {try{await c.query("rollback")}catch{} await c.end()}

// Closure race independent from FRC harness.
{
 const setup=new Client({connectionString:url}),gate=new Client({connectionString:url}),inspect=new Client({connectionString:url}),mut=new Client({connectionString:url});await Promise.all([setup.connect(),gate.connect(),inspect.connect(),mut.connect()]);
 try{const s=await seed(setup,"closure");const before=await rev(setup,s.era.id);await gate.query("begin");await gate.query("lock table era_archive_snapshots in access exclusive mode");const cp=closeEra({eraId:s.era.id,closureEvidenceRef:"synthetic:independent-assurance",actor:"independent-assurance",now:new Date(s.t.getTime()+1000)});A(await waitGate(inspect),"close did not reach gate");await mut.query("update eras set story='ia-committed' where id=$1",[s.era.id]);const bumped=await rev(mut,s.era.id);A(bumped>before,"race mutation no bump");await reject(mut,"update eras set content_revision=$2 where id=$1",[s.era.id,before],"race reset");await gate.query("commit");let ce;try{await cp}catch(e){ce=e}A(["ERA_CHANGED_BEFORE_CLOSURE","ERA_CHANGED_DURING_SNAPSHOT"].includes(code(ce)),"stale closure accepted "+code(ce));A(await closures(setup,s.era.id)===0,"failed close persisted stale snapshot");const live=await one(setup,"select lifecycle_state from eras where id=$1",[s.era.id]);A(live.lifecycle_state==="ACTIVE","failed close changed lifecycle");const retry=await closeEra({eraId:s.era.id,closureEvidenceRef:"synthetic:independent-assurance-retry",actor:"independent-assurance",now:new Date(s.t.getTime()+2000)});A(retry.era.lifecycleState==="CLOSED"&&retry.snapshot.snapshot.era.story==="ia-committed","retry missed committed mutation");cases.push({case:"closure-race",firstClose:code(ce),failedSnapshots:0,retryCaptured:true});}
 finally{try{await gate.query("rollback")}catch{} await Promise.all([setup.end(),gate.end(),inspect.end(),mut.end()])}
}
console.log("FRC03_INDEPENDENT_ASSURANCE_BEGIN");console.log(JSON.stringify({schema:"AE_LRP_R0_FRC03_INDEPENDENT_ASSURANCE_EXECUTION_V1",candidate:"bcd245f48b125a4f6f875edda15077dc699f80e0",parent:"d3a044e96be8d0397825a8ec3e781b20b3bf6814",tree:"05509a76a76975d57275a34c6554a9c948876c83",postgresVersion,result:"PASS_SO_FAR",cases},null,2));console.log("FRC03_INDEPENDENT_ASSURANCE_END");await pool.end();
