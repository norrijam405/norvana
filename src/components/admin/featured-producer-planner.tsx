"use client";
import { useEffect,useState } from "react";

type Listing={name:string;category:string;region:string;summary:string;rights:string;sponsorship:string;review:string};
const KEY="acre-era-featured-producer-drafts-r1";
const empty:Listing={name:"",category:"FARM",region:"",summary:"",rights:"UNVERIFIED",sponsorship:"EDITORIAL_UNPAID",review:"DRAFT"};
const categories=["FARM","RANCH","FOOD_MAKER","ARTISAN","LOCAL_SHOP","WINERY_DISCOVERY","BREWERY_DISCOVERY"];
export function FeaturedProducerPlanner(){
 const [draft,setDraft]=useState<Listing>(empty);const [rows,setRows]=useState<Listing[]>([]);const [notice,setNotice]=useState("");
 useEffect(()=>{try{const parsed:unknown=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(parsed))setRows(parsed.filter((x):x is Listing=>!!x&&typeof x==="object"&&typeof x.name==="string").slice(0,40));}catch{}},[]);
 function save(){if(draft.name.trim().length<2||draft.region.trim().length<2){setNotice("Add a producer name and location.");return;}
 const entry={...draft,name:draft.name.trim().slice(0,160),region:draft.region.trim().slice(0,160),summary:draft.summary.trim().slice(0,1000),review:"DRAFT"};
 const next=[entry,...rows].slice(0,40);try{localStorage.setItem(KEY,JSON.stringify(next));setRows(next);setDraft(empty);setNotice("Private browser draft saved. No listing published, billed, or sent.");}catch{setNotice("This browser could not save the draft.");}}
 function remove(i:number){const next=rows.filter((_,j)=>j!==i);try{localStorage.setItem(KEY,JSON.stringify(next));setRows(next);setNotice("Draft removed.");}catch{setNotice("Could not update browser storage.");}}
 const field="mt-1 block w-full rounded-lg border border-white/20 bg-[#181a17] p-3 text-sm text-white";
 return <section className="mb-8 rounded-2xl border border-white/10 bg-white/[.04] p-6">
 <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Featured Producers · internal drafts</p>
 <h2 className="mt-2 text-2xl font-bold">Plan a producer spotlight</h2>
 <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">Draft profiles for farms, makers, and shops. Winery and brewery concepts are research-only until alcohol advertising rules are reviewed. Nothing here creates a public listing, campaign, charge, agreement, or contact.</p>
 <div className="mt-5 grid gap-4 md:grid-cols-2">
 <label className="text-sm">Business name<input className={field} value={draft.name} maxLength={160} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>
 <label className="text-sm">Region / city<input className={field} value={draft.region} maxLength={160} onChange={e=>setDraft({...draft,region:e.target.value})}/></label>
 <label className="text-sm">Category<select className={field} value={draft.category} onChange={e=>setDraft({...draft,category:e.target.value,sponsorship:"EDITORIAL_UNPAID"})}>{categories.map(x=><option key={x} value={x}>{x.replaceAll("_"," ")}</option>)}</select></label>
 <label className="text-sm">Photo / content rights<select className={field} value={draft.rights} onChange={e=>setDraft({...draft,rights:e.target.value})}><option value="UNVERIFIED">Unverified — do not publish</option><option value="REQUESTED">Permission requested</option><option value="DOCUMENTED_REVIEW">Documented elsewhere — review required</option></select></label>
 <label className="text-sm">Commercial concept<select className={field} value={draft.sponsorship} onChange={e=>setDraft({...draft,sponsorship:e.target.value})}><option value="EDITORIAL_UNPAID">Unpaid editorial concept</option>{!draft.category.includes("WINERY")&&!draft.category.includes("BREWERY")?<option value="SPONSORED_PROPOSAL">Sponsored proposal — not sold</option>:null}</select></label>
 <label className="text-sm md:col-span-2">Story / potential spotlight<textarea className={field} rows={3} value={draft.summary} maxLength={1000} onChange={e=>setDraft({...draft,summary:e.target.value})}/></label>
 </div>
 <button type="button" onClick={save} className="mt-4 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-bold">Save private concept</button>
 {notice?<p role="status" className="mt-3 text-sm text-indigo-200">{notice}</p>:null}
 <div className="mt-5 space-y-3">{rows.map((x,i)=><article key={i} className="rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-3"><strong>{x.name}</strong><button onClick={()=>remove(i)} className="text-xs text-rose-200 underline">Delete draft</button></div><p className="mt-1 text-xs text-white/50">{x.category.replaceAll("_"," ")} · {x.region} · {x.rights} · {x.sponsorship}</p><p className="mt-2 whitespace-pre-wrap text-sm text-white/70">{x.summary}</p></article>)}</div>
 <p className="mt-4 text-xs text-amber-200">Browser-only workspace; do not store confidential partner details. A real multi-user paid listing system requires server-side records, rights verification, disclosure, payment operations, and legal review.</p>
 </section>
}