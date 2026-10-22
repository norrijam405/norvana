import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { producerInterestSubmissions } from "@/db/schema";
import { ADMIN_SESSION_COOKIE,adminSessionConfigured,verifyCurrentAdminSessionToken } from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";

export const dynamic = "force-dynamic";
export default async function ProducerApplicationsPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const session=await verifyCurrentAdminSessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  let records:(typeof producerInterestSubmissions.$inferSelect)[]=[];
  let loadFailed=false;
  try {records=await db.select().from(producerInterestSubmissions).orderBy(desc(producerInterestSubmissions.createdAt)).limit(100);}
  catch(e){loadFailed=true;console.error("Producer applications loading failed",e);}
  return <main className="min-h-screen bg-[#0d0f0c] pb-20 text-white">
    <WatchtowerNav current="/admin/producers"/>
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/admin/producers" className="text-sm text-indigo-200 hover:underline">← Farms & Producers</Link>
      <h1 className="mt-4 text-4xl font-bold">Producer applications</h1>
      <p className="mt-3 text-sm text-white/60">Read-only intake review. Submitting an application never makes someone an approved vendor. Newest 100 applications displayed. HubSpot synchronization is not active.</p>
      {loadFailed?<div role="alert" className="mt-6 rounded-xl border border-rose-400/40 bg-rose-950/30 p-5">Database unavailable. Application count and records cannot be confirmed. No records were modified.</div>:
      <><p className="mt-6 text-sm text-indigo-200">{records.length} application(s) in this page of results</p><div className="mt-4 space-y-4">{records.map(row=><article key={row.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-6">
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
      </article>)}{records.length===0?<p className="rounded-xl border border-white/10 p-6 text-white/60">No applications have been saved yet.</p>:null}</div></>}
      <p className="mt-6 text-xs text-amber-200">Handle submitted contact details privately. Never copy them to public tickets or GitHub. No automated approvals, vendor onboarding, or outreach from this page.</p>
    </div>
  </main>;
}
