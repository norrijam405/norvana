import { ApplicationReviewControls } from "@/components/admin/application-review-controls";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { producerInterestSubmissions, producerConversationNotes } from "@/db/schema";
import { ADMIN_SESSION_COOKIE,adminSessionConfigured,verifyCurrentAdminSessionToken } from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";

export const dynamic = "force-dynamic";
export default async function ProducerApplicationsPage({searchParams}: {searchParams: Promise<{q?:string; status?:string}>}) {
  if (!adminSessionConfigured()) redirect("/admin");
  const session=await verifyCurrentAdminSessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  const params=await searchParams;
  const q=typeof params.q==="string"?params.q.trim().toLowerCase().slice(0,100):"";
  const statusFilter=typeof params.status==="string"?params.status.trim().toUpperCase().slice(0,40):"ALL";
  let records:(typeof producerInterestSubmissions.$inferSelect)[]=[];
  let loadFailed=false;
  let history:(typeof producerConversationNotes.$inferSelect)[]=[];
  try {
    records=await db.select().from(producerInterestSubmissions).orderBy(desc(producerInterestSubmissions.createdAt)).limit(100);
    if(records.length) history=await db.select().from(producerConversationNotes).where(inArray(producerConversationNotes.interestSubmissionId, records.map(r=>r.id))).orderBy(desc(producerConversationNotes.createdAt)).limit(500);
  }
  catch(e){loadFailed=true;console.error("Producer applications loading failed",e);}
  const visible=records.filter(row=>(!q||[row.businessName,row.contactName,row.email,row.location,...row.productCategories].some(v=>String(v||"").toLowerCase().includes(q)))&&(statusFilter==="ALL"||row.status.toUpperCase()===statusFilter));
  const statuses=Array.from(new Set(records.map(row=>row.status.toUpperCase()))).sort();
  return <main className="min-h-screen bg-[#0d0f0c] pb-20 text-white">
    <WatchtowerNav current="/admin/producers"/>
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/admin/producers" className="text-sm text-indigo-200 hover:underline">← Farms & Producers</Link>
      <h1 className="mt-4 text-4xl font-bold">Producer applications</h1>
      <p className="mt-3 text-sm text-white/60">Private intake review with explicit audited status decisions. Submitting an application never makes someone an approved vendor. Newest 100 applications displayed. HubSpot synchronization is not active.</p>
      <form method="GET" action="/admin/producers/applications" className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
        <label className="min-w-[240px] flex-1 text-xs text-white/70">Search applications<input type="search" name="q" maxLength={100} defaultValue={typeof params.q==="string"?params.q.slice(0,100):""} placeholder="Farm, contact, product or state" className="mt-2 w-full rounded-xl border border-white/15 bg-[#191b18] p-3 text-sm text-white"/></label>
        <label className="text-xs text-white/70">Status<select name="status" defaultValue={statusFilter} className="mt-2 block rounded-xl border border-white/15 bg-[#191b18] p-3 text-sm text-white"><option value="ALL">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
        <button type="submit" className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold">Filter</button>
        <Link href="/admin/producers/applications" className="rounded-xl border border-white/15 px-5 py-3 text-sm">Clear</Link>
      </form>
      {loadFailed?<div role="alert" className="mt-6 rounded-xl border border-rose-400/40 bg-rose-950/30 p-5">Database unavailable. Application count and records cannot be confirmed. No records were modified.</div>:
      <><p className="mt-6 text-sm text-indigo-200">{visible.length} matching application(s) from the newest {records.length} (up to 100)</p><div className="mt-4 space-y-4">{visible.map(row=><article key={row.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
        <div className="flex flex-wrap justify-between gap-2"><h2 className="text-xl font-semibold">{row.businessName}</h2><span className="rounded-lg border border-white/20 px-3 py-1 text-xs">{row.status}</span></div>
        <p className="mt-2 text-sm text-white/65">{row.location} · {row.salesModel} · Applied {row.createdAt.toLocaleDateString("en-US")}</p>
        <p className="mt-2 break-all text-sm text-white/80">{row.contactName} · {row.email}{row.phone?" · "+row.phone:""}</p>
        {row.website?<p className="mt-2 break-all text-xs text-indigo-200">Website supplied: {row.website}</p>:null}
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div><dt className="text-white/40">Products</dt><dd className="mt-1">{row.productCategories.join(", ")||"Not provided"}</dd></div>
          <div><dt className="text-white/40">Fulfillment</dt><dd className="mt-1">{row.fulfillmentModes.join(", ")||"Not provided"}</dd></div>
          <div><dt className="text-white/40">Seasonality</dt><dd className="mt-1 whitespace-pre-wrap">{row.seasonality||"Not provided"}</dd></div>
          <div><dt className="text-white/40">Lead time</dt><dd className="mt-1 whitespace-pre-wrap">{row.leadTimeNotes||"Not provided"}</dd></div>
          <div><dt className="text-white/40">Capacity</dt><dd className="mt-1 whitespace-pre-wrap">{row.capacityNotes||"Not provided"}</dd></div>
          <div><dt className="text-white/40">Partnership goals</dt><dd className="mt-1 whitespace-pre-wrap">{row.painPoint||"Not provided"}</dd></div>
          <div><dt className="text-white/40">Pilot interest</dt><dd className="mt-1">{row.pilotInterest}</dd></div>
          <div><dt className="text-white/40">Media discussion</dt><dd className="mt-1">{row.mediaInterest}</dd></div>
        </dl>
        <ApplicationReviewControls id={row.id} status={row.status}/>
        <details className="mt-4 rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-semibold text-indigo-200">Review history ({history.filter(h=>h.interestSubmissionId===row.id && h.conversationStage==="APPLICATION_REVIEW").length})</summary><div className="mt-3 space-y-3">{history.filter(h=>h.interestSubmissionId===row.id && h.conversationStage==="APPLICATION_REVIEW").map(h=><div key={h.id} className="rounded-lg bg-black/25 p-3 text-sm"><p className="text-xs text-white/50">{h.createdAt.toLocaleString("en-US")} · {String(h.answers.fromStatus||"Unknown")} → {String(h.answers.toStatus||"Unknown")}</p><p className="mt-2 whitespace-pre-wrap">{h.operatorSummary}</p></div>)}{!history.some(h=>h.interestSubmissionId===row.id && h.conversationStage==="APPLICATION_REVIEW")?<p className="text-sm text-white/50">No decision history recorded in the loaded set.</p>:null}{history.length>=500?<p className="text-xs text-amber-200">History capped at 500 recent notes; older events may not be displayed.</p>:null}</div></details>
      </article>)}{visible.length===0?<p className="rounded-xl border border-white/10 p-6 text-white/60">{records.length===0?"No applications have been saved yet.":"No matching applications within the newest 100 records."}</p>:null}</div></>}
      <p className="mt-6 text-xs text-amber-200">Handle submitted contact details privately. Never copy them to public tickets or GitHub. No automated approvals, vendor onboarding, or outreach from this page.</p>
    </div>
  </main>;
}
