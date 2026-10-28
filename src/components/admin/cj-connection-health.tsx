"use client";
import { useState } from "react";
export function CjConnectionHealth(){
 const [working,setWorking]=useState(false);
 const [result,setResult]=useState<{state:string;message:string}|null>(null);
 async function check(){
  setWorking(true);setResult(null);
  try {const r=await fetch("/api/admin/cj/health",{cache:"no-store"});const x=await r.json();setResult(r.ok?x:{state:"UNAVAILABLE",message:x.error||"Unable to check CJ access."});}
  catch{setResult({state:"UNAVAILABLE",message:"Network error checking CJ access."});}
  finally{setWorking(false);}
 }
 return <section className="mt-6 rounded-2xl border border-indigo-300/20 bg-indigo-300/[.05] p-5">
 <h2 className="text-xl font-bold">CJ Dropshipping · Connection Check</h2>
 <p className="mt-2 text-sm text-white/60">Checks whether CJ accepts this deployment's configured API key. No order, payment, import or fulfillment is performed.</p>
 <button type="button" onClick={check} disabled={working} className="mt-4 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{working?"Checking…":"Check CJ API access"}</button>
 {result?<p role="status" className="mt-3 text-sm text-indigo-100"><strong>{result.state.replaceAll("_"," ")}:</strong> {result.message}</p>:null}
 </section>;
}
