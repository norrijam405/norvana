"use client";
import { useEffect, useState } from "react";

type Draft = { title:string; videoUrl:string; source:string; rights:string; placement:string };
const KEY="acre-era-media-proposals-r0";
const EMPTY={title:"",videoUrl:"",source:"",rights:"UNVERIFIED",placement:"Producer story"};
export function ProducerMediaPlanner() {
  const [draft,setDraft]=useState<Draft>(EMPTY);
  const [items,setItems]=useState<Draft[]>([]);
  const [notice,setNotice]=useState("");
  useEffect(()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(x))setItems(x.filter(y=>y&&typeof y.title==="string").slice(0,30));}catch{}},[]);
  function save(){try{const url=new URL(draft.videoUrl);if(!["https:","http:"].includes(url.protocol))throw Error();if(!draft.title.trim())throw Error();const next=[{...draft},...items].slice(0,30);setItems(next);localStorage.setItem(KEY,JSON.stringify(next));setDraft(EMPTY);setNotice("Video reference saved in this browser only; not uploaded or published.");}catch{setNotice("Enter a title and full HTTP(S) video link.");}}
  function remove(i:number){const next=items.filter((_,n)=>n!==i);setItems(next);try{localStorage.setItem(KEY,JSON.stringify(next));}catch{}}
  const input="mt-2 w-full rounded-xl border border-white/20 bg-black/20 p-3 text-white";
  return <section className="mb-8 rounded-[2rem] border border-white/10 bg-white/[.04] p-6">
    <p className="text-xs uppercase tracking-widest text-indigo-200">Watchtower media proposals · draft only</p>
    <h2 className="mt-2 text-2xl font-bold">Producer photos & video planner</h2>
    <p className="mt-2 max-w-3xl text-sm text-white/60">Track externally hosted video links and permission status while the secure upload/storage workflow is being built. Browser-only drafts are not synced to HubSpot or Acre Era's database. No media goes live from this form.</p>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <label className="text-sm">Title<input value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})} className={input}/></label>
      <label className="text-sm">Video URL<input type="url" value={draft.videoUrl} onChange={e=>setDraft({...draft,videoUrl:e.target.value})} placeholder="https://…" className={input}/></label>
      <label className="text-sm">Producer / credit<input value={draft.source} onChange={e=>setDraft({...draft,source:e.target.value})} className={input}/></label>
      <label className="text-sm">Planned placement<select className={input} value={draft.placement} onChange={e=>setDraft({...draft,placement:e.target.value})}><option>Producer story</option><option>Market Era</option><option>Goods Era</option><option>Homepage</option></select></label>
      <label className="text-sm">Rights status<select className={input} value={draft.rights} onChange={e=>setDraft({...draft,rights:e.target.value})}><option value="UNVERIFIED">Unverified — don't publish</option><option value="PERMISSION_PENDING">Permission requested</option><option value="DOCUMENTED">Permission documented elsewhere — review before use</option></select></label>
    </div>
    <button type="button" onClick={save} className="mt-4 rounded-xl bg-indigo-500 px-5 py-3 font-semibold hover:bg-indigo-400">Save browser draft</button>
    {notice?<p role="status" className="mt-3 text-sm text-indigo-200">{notice}</p>:null}
    <div className="mt-5 space-y-3">{items.map((v,i)=><div key={i} className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="font-semibold">{v.title}</p><p className="mt-1 text-xs text-white/50">{v.source||"No credit yet"} · {v.rights} · {v.placement}</p><a className="mt-2 block break-all text-xs text-indigo-200 underline" href={v.videoUrl} target="_blank" rel="noopener noreferrer">Review video ↗</a><button type="button" onClick={()=>remove(i)} className="mt-2 text-xs text-rose-200 underline">Remove draft</button></div>)}</div>
  </section>;
}
