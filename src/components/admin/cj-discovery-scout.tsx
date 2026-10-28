"use client";
import { useState } from "react";
type Candidate={sku:string;name:string;sourcePrice:number;verifiedUnits:number;processingDays:string|null;keyword:string;state:string};
export function CjDiscoveryScout(){
 const [busy,setBusy]=useState(false);
 const [data,setData]=useState<{candidates:Candidate[];searched:string[];errors:string[];disclaimer:string}|null>(null);
 const [message,setMessage]=useState("");
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
    <p className="mt-2 text-sm">CJ listed price: <strong>${x.sourcePrice.toFixed(2)}</strong> · Verified inventory signal: {x.verifiedUnits} units</p>
    <p className="mt-1 text-xs text-white/50">Processing estimate: {x.processingDays||"Not supplied"} · Shipping and exact variant unverified</p>
   </article>)}
   <p className="text-xs leading-5 text-amber-100">{data.disclaimer}</p>
  </div>:null}
 </section>;
}
