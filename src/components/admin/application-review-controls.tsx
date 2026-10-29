"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const TRANSITIONS:Record<string,string[]>={NEW:["REVIEWING","NEEDS_INFO","DECLINED","PAUSED"],REVIEWING:["NEEDS_INFO","QUALIFIED","DECLINED","PAUSED"],NEEDS_INFO:["REVIEWING","DECLINED","PAUSED"],QUALIFIED:["REVIEWING","PAUSED"],DECLINED:["REVIEWING"],PAUSED:["REVIEWING","DECLINED"]};
export function ApplicationReviewControls({id,status}:{id:number;status:string}) {
 const router=useRouter();const choices=TRANSITIONS[status]||[];const [next,setNext]=useState(choices[0]||"");const [note,setNote]=useState("");const [pending,setPending]=useState(false);const [message,setMessage]=useState("");
 useEffect(()=>{setNext((current)=>choices.includes(current)?current:(choices[0]||""));},[status]);
 async function save(){if(pending)return;setPending(true);setMessage("");try{
 const r=await fetch("/api/admin/producer-applications/"+id+"/review",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({status:next,note})});
 const body=await r.json().catch(()=>({}));if(!r.ok){setMessage(body.error||"Could not update review");return;}
 setNote("");setMessage("Review decision saved with an audit note.");router.refresh();
 }catch{setMessage("Network unavailable; nothing confirmed.");}finally{setPending(false);}}
 return <div className="mt-5 rounded-xl border border-indigo-300/20 bg-black/20 p-4">
   <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Internal review only · current {status}</p>
   <div className="mt-3 flex flex-wrap items-end gap-3">
     <label className="text-sm text-white/70">Decision<select value={next} onChange={e=>setNext(e.target.value)} className="mt-1 block rounded-lg border border-white/15 bg-[#171916] p-2 text-white">{choices.map(s=><option key={s}>{s}</option>)}</select></label>
     <label className="min-w-[240px] flex-1 text-sm text-white/70">Reason / next follow-up<input value={note} maxLength={2000} onChange={e=>setNote(e.target.value)} placeholder="Required audit note" className="mt-1 block w-full rounded-lg border border-white/15 bg-[#171916] p-2 text-white"/></label>
     <button type="button" disabled={pending||!choices.includes(next)||note.trim().length<3} onClick={save} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold disabled:opacity-40">{pending?"Saving…":"Save decision"}</button>
   </div>
   {message?<p role="status" className="mt-3 text-xs text-indigo-200">{message}</p>:null}
   <p className="mt-2 text-xs text-white/40">Qualified means review-ready, not a vendor agreement. No outreach, product publishing or HubSpot changes occur here.</p>
 </div>;
}
