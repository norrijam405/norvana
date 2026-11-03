"use client";
import { useState } from "react";
type Candidate={sku:string;name:string;sourcePrice:number;verifiedUnits:number;processingDays:string|null;keyword:string;state:string};
export function CjDiscoveryScout(){
 const [busy,setBusy]=useState(false);
 const [readback,setReadback]=useState<Record<string,{status:"PASS"|"FAIL";message:string}>>({});
 const [data,setData]=useState<{candidates:Candidate[];searched:string[];errors:string[];disclaimer:string}|null>(null);
 const [message,setMessage]=useState("");
 const [checking,setChecking]=useState<string|null>(null);
 const [checks,setChecks]=useState<Record<string,any>>({});
 const [receipts,setReceipts]=useState<Record<string,{checkedAt:string;sku:string;vid:string|null;httpStatus:number|null;state:string;reason:string;stock:number|null;productCost:number|null;shippingCost:number|null;landedCost:number|null;receiptId:number|null;receiptPersisted:boolean}>>({});
 function receiptFor(sku:string,vid:string|null,httpStatus:number|null,body:any,state:string){
  const safeNumber=(value:unknown)=>typeof value==="number"&&Number.isFinite(value)?value:null;
  return {checkedAt:new Date().toISOString(),sku,vid,httpStatus,state,reason:String(body?.reason||body?.error||"No reason provided.").slice(0,300),stock:safeNumber(body?.stock),productCost:safeNumber(body?.productCost),shippingCost:safeNumber(body?.shippingCost),landedCost:safeNumber(body?.baseLandedCost),receiptId:Number.isSafeInteger(body?.receiptId)?body.receiptId:null,receiptPersisted:body?.receiptPersisted===true};
 }
 function exportReceipt(sku:string){
  const receipt=receipts[sku];if(!receipt)return;
  const blob=new Blob([JSON.stringify({schemaVersion:"acre-era-cj-check-r1",source:"/api/admin/cj/qualify",storage:"USER_EXPORTED_NOT_SERVER_VERIFIED",...receipt},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`acre-era-cj-${sku.replace(/[^a-zA-Z0-9_-]/g,"_")}-receipt.json`;link.click();URL.revokeObjectURL(url);
 }
 async function verifyReadback(sku:string){
  const receipt=receipts[sku];
  if(!receipt?.receiptId)return;
  try{
   const response=await fetch(`/api/admin/cj/receipts/${receipt.receiptId}`,{cache:"no-store"});
   const body=await response.json().catch(()=>({}));
   const matches=response.ok&&body.id===receipt.receiptId&&body.subjectId===sku&&body.status===receipt.state&&body.actionType==="CJ_VARIANT_QUALIFICATION";
   setReadback(prev=>({...prev,[sku]:{status:matches?"PASS":"FAIL",message:matches?"Receipt retrieved from server with matching ID, SKU and state. Independent verification still pending.":"Receipt readback did not match the current observation."}}));
  }catch{
   setReadback(prev=>({...prev,[sku]:{status:"FAIL",message:"Could not retrieve the stored receipt."}}));
  }
 }
 async function qualify(sku:string,vid?:string){
  setReadback(prev=>{const next={...prev};delete next[sku];return next;});
  setChecking(sku);
  let httpStatus:number|null=null;
  try{
   const res=await fetch("/api/admin/cj/qualify",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({sku,vid})});
   httpStatus=res.status;
   const body=await res.json().catch(()=>({error:"CJ returned an unreadable response."}));
   const state=res.ok?(typeof body.state==="string"?body.state:"UNKNOWN"):"FAILED";
   setChecks(prev=>({...prev,[sku]:res.ok?body:{...body,state:"FAILED",error:body.error||`CJ check failed (HTTP ${res.status}).`}}));
   setReceipts(prev=>({...prev,[sku]:receiptFor(sku,vid||null,httpStatus,body,state)}));
  }catch{
   setChecks(prev=>({...prev,[sku]:{state:"FAILED",error:"Unable to reach CJ qualification service."}}));
   setReceipts(prev=>({...prev,[sku]:receiptFor(sku,vid||null,httpStatus,{error:"Network unavailable."},"FAILED")}));
  }finally{setChecking(null);}
 }
 async function scout(){
  if(busy)return;setBusy(true);setMessage("");
  try{
   const res=await fetch("/api/admin/cj/scout",{method:"POST",headers:{"content-type":"application/json"}});
   const body=await res.json().catch(()=>({}));
   if(!res.ok)throw new Error(body.error||"CJ scout unavailable.");
   setData(body);
  }catch(e){setMessage(e instanceof Error?e.message:"CJ scout unavailable.");}finally{setBusy(false);}
 }
 return <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <div><p className="text-xs font-bold uppercase tracking-widest text-indigo-200">New product discovery · CJ</p><h2 className="mt-2 text-2xl font-bold">Scout fresh product candidates</h2><p className="mt-2 max-w-2xl text-sm text-white/60">Search three curated categories in CJ's live catalog. Results are candidates only, not a product listing or a freight quote.</p></div>
   <button type="button" onClick={scout} disabled={busy} className="rounded-xl bg-indigo-500 px-5 py-3 font-bold text-white disabled:opacity-50">{busy?"Searching CJ…":"Run CJ Scout"}</button>
  </div>
  {message?<p role="alert" className="mt-3 text-sm text-rose-200">{message}</p>:null}
  {data?<div className="mt-4 space-y-3">
   <p className="text-xs text-white/50">{data.candidates.length} candidates · searched {data.searched.join(", ")} · no purchases or publication</p>
   {data.errors.map((error,i)=><p key={i} className="text-xs text-amber-200">{error}</p>)}
   {data.candidates.length===0?<p className="rounded-lg border border-white/10 p-4 text-sm text-white/60">No verified-inventory candidates returned. This does not mean CJ has no products.</p>:null}
   {data.candidates.map(x=><article key={x.sku} className="rounded-xl border border-white/10 bg-black/20 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{x.name}</p><p className="mt-1 text-xs text-white/50">{x.sku} · {x.keyword}</p></div><span className="rounded-md border border-amber-300/20 px-2 py-1 text-xs text-amber-100">NEEDS ROUTE CHECK</span></div>
    <p className="mt-2 text-sm">CJ listed price: <strong>${x.sourcePrice.toFixed(2)}</strong> · CJ verified inventory reported: {x.verifiedUnits>0?x.verifiedUnits+" units":"Not reported; check exact variant"}</p>
    <p className="mt-1 text-xs text-white/50">Processing estimate: {x.processingDays||"Not supplied"} · Shipping and exact variant unverified</p>
    <button type="button" disabled={checking!==null} onClick={()=>qualify(x.sku)} className="mt-3 rounded-lg border border-indigo-300/30 bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-100 disabled:opacity-50">{checking===x.sku?"Checking CJ…":"Check product + shipping"}</button>
    {checks[x.sku]?<div role="status" className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-xs leading-6 text-white/80">
      <p className="font-semibold">{checks[x.sku].state||"UNAVAILABLE"}</p>
      {receipts[x.sku]?<div className="mt-1 rounded-md border border-white/10 bg-white/[0.035] p-2 text-[11px] text-white/60"><p className="font-semibold text-white/80">CJ check receipt · {receipts[x.sku].state}</p><p>Checked UTC: {receipts[x.sku].checkedAt}</p><p>SKU: {receipts[x.sku].sku} · Variant: {receipts[x.sku].vid||"Not selected"} · HTTP: {receipts[x.sku].httpStatus??"Network unavailable"}</p><p>{receipts[x.sku].receiptPersisted?"Server receipt recorded; still not independently verified.":"Server receipt unavailable; save this browser observation if needed."}</p>{receipts[x.sku].receiptId?<a className="mt-1 inline-block underline text-indigo-200" href={`/api/admin/cj/receipts/${receipts[x.sku].receiptId}`} target="_blank" rel="noreferrer">Open receipt #{receipts[x.sku].receiptId}</a>:null}{receipts[x.sku].receiptId?<button type="button" className="ml-2 underline text-indigo-200" onClick={()=>void verifyReadback(x.sku)}>Verify readback</button>:null}{readback[x.sku]?<p className={readback[x.sku].status==="PASS"?"text-emerald-200":"text-rose-200"}>{readback[x.sku].status}: {readback[x.sku].message}</p>:null}<button type="button" onClick={()=>exportReceipt(x.sku)} className="mt-2 rounded-lg border border-white/20 px-3 py-1 font-semibold text-white/80">Download JSON receipt</button></div>:null}
      <p>{checks[x.sku].error||checks[x.sku].reason}</p>
      {checks[x.sku].baseLandedCost!==null&&checks[x.sku].baseLandedCost!==undefined?<p>Product: ${checks[x.sku].productCost?.toFixed(2)} · Freight: ${checks[x.sku].shippingCost?.toFixed(2)} · Combined: <strong>${checks[x.sku].baseLandedCost.toFixed(2)}</strong> · Transit: {checks[x.sku].transitDays?.min??"?"}–{checks[x.sku].transitDays?.max??"?"} days</p>:null}
      {checks[x.sku].variantOptions?.length?<div className="mt-2 flex flex-wrap items-center gap-2"><select aria-label={`Select variant for ${x.name}`} id={`cj-variant-${x.sku}`} defaultValue="" className="min-h-10 max-w-full flex-1 rounded-lg border border-white/20 bg-[#20221e] p-2 text-xs text-white"><option value="" disabled>Choose exact variant</option>{checks[x.sku].variantOptions.map((v:{vid:string;name:string})=><option key={v.vid} value={v.vid}>{v.name}</option>)}</select><button type="button" disabled={checking!==null} className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50" onClick={()=>{const selected=document.getElementById(`cj-variant-${x.sku}`) as HTMLSelectElement|null;if(selected?.value)void qualify(x.sku,selected.value);}}>Check selected variant</button></div>:null}
      {checks[x.sku].priceExamples?.length?<p>At $14.99: ${checks[x.sku].priceExamples.find((p:any)=>p.price===14.99)?.grossBeforeFees?.toFixed(2)} before fees, taxes, returns, and advertising.</p>:null}
      <p>No approval, import, listing, purchase, or fulfillment was performed.</p>
    </div>:null}
   </article>)}
   <p className="text-xs leading-5 text-amber-100">{data.disclaimer}</p>
  </div>:null}
 </section>;
}
