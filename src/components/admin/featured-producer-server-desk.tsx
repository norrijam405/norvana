"use client";
import { useState } from "react";
type Draft={businessName:string;region:string;category:string;story:string;contactEmail:string;mediaRights:string;sponsorship:string};
const initial:Draft={businessName:"",region:"",category:"FARM",story:"",contactEmail:"",mediaRights:"UNVERIFIED",sponsorship:"EDITORIAL_UNPAID"};
export function FeaturedProducerServerDesk(){
 const [d,setD]=useState<Draft>(initial);const [saving,setSaving]=useState(false);const [message,setMessage]=useState("");
 const [items,setItems]=useState<Array<{id:number;businessName:string;region:string;category:string;status:string;sponsorship:string}>>([]);
 const [loaded,setLoaded]=useState(false);const field="mt-1 block w-full rounded-lg border border-white/20 bg-[#171916] p-3 text-sm text-white";
 async function load(){setMessage("");try{const r=await fetch("/api/admin/featured-producers",{cache:"no-store"});const x=await r.json();if(!r.ok)throw Error(x.error||"Could not load");setItems(x.proposals);setLoaded(true);}catch(e){setMessage(e instanceof Error?e.message:"Load failed");}}
 async function save(){setSaving(true);setMessage("");try{const r=await fetch("/api/admin/featured-producers",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(d)});const x=await r.json();if(!r.ok)throw Error(x.error||"Save failed");setMessage("Saved private proposal #"+x.id+". Nothing published or charged.");setD(initial);await load();}catch(e){setMessage(e instanceof Error?e.message:"Save failed");}finally{setSaving(false);}}
 return <section className="mb-8 rounded-2xl border border-indigo-300/20 bg-indigo-400/[.06] p-6">
 <p className="text-xs uppercase tracking-widest text-indigo-200">Server-saved · private Watchtower records</p>
 <h2 className="mt-2 text-2xl font-bold">Featured Producer proposals</h2>
 <p className="mt-2 text-sm text-white/60">Unlike browser-only concepts, these drafts are stored in the isolated Preview database. They cannot publish or bill a business.</p>
 <div className="mt-4 grid gap-3 sm:grid-cols-2">
 <label className="text-xs">Business name<input className={field} maxLength={160} value={d.businessName} onChange={e=>setD({...d,businessName:e.target.value})}/></label>
 <label className="text-xs">City / region<input className={field} maxLength={160} value={d.region} onChange={e=>setD({...d,region:e.target.value})}/></label>
 <label className="text-xs">Category<select className={field} value={d.category} onChange={e=>setD({...d,category:e.target.value,sponsorship:"EDITORIAL_UNPAID"})}>{["FARM","RANCH","FOOD_MAKER","ARTISAN","LOCAL_SHOP","WINERY_DISCOVERY","BREWERY_DISCOVERY"].map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label>
 <label className="text-xs">Contact email (optional)<input type="email" className={field} maxLength={320} value={d.contactEmail} onChange={e=>setD({...d,contactEmail:e.target.value})}/></label>
 <label className="text-xs">Media rights<select className={field} value={d.mediaRights} onChange={e=>setD({...d,mediaRights:e.target.value})}><option value="UNVERIFIED">Unverified</option><option value="REQUESTED">Requested</option><option value="DOCUMENTED_REVIEW">Documented — needs review</option></select></label>
 <label className="text-xs">Advertising idea<select className={field} value={d.sponsorship} onChange={e=>setD({...d,sponsorship:e.target.value})}><option value="EDITORIAL_UNPAID">Unpaid editorial</option>{!["WINERY_DISCOVERY","BREWERY_DISCOVERY"].includes(d.category)?<option value="SPONSORED_PROPOSAL">Sponsored proposal (not billed)</option>:null}</select></label>
 <label className="text-xs sm:col-span-2">Story notes<textarea className={field} maxLength={1000} rows={3} value={d.story} onChange={e=>setD({...d,story:e.target.value})}/></label>
 </div>
 <div className="mt-4 flex flex-wrap gap-3"><button disabled={saving||d.businessName.trim().length<2||d.region.trim().length<2} className="rounded-lg bg-indigo-500 px-4 py-3 text-sm font-bold disabled:opacity-50" onClick={save}>{saving?"Saving…":"Save to Preview database"}</button><button className="rounded-lg border border-white/20 px-4 py-3 text-sm" onClick={load}>Load saved proposals</button></div>
 {message?<p role="status" className="mt-3 text-sm text-indigo-200">{message}</p>:null}
 {loaded?<div className="mt-4 space-y-2">{items.length===0?<p className="text-sm text-white/50">No saved proposals.</p>:items.map(x=><div key={x.id} className="rounded-xl border border-white/10 p-3 text-sm"><strong>#{x.id} · {x.businessName}</strong><p className="text-xs text-white/50">{x.region} · {x.category} · {x.status} · {x.sponsorship}</p></div>)}</div>:null}
 <p className="mt-4 text-xs text-amber-200">No public listing, billing, outbound outreach, alcohol promotion or automatic approval.</p>
 </section>;
}
