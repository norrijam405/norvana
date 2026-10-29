import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProducerMediaPlanner } from "@/components/admin/producer-media-planner";
import { FeaturedProducerPlanner } from "@/components/admin/featured-producer-planner";
import { FeaturedProducerServerDesk } from "@/components/admin/featured-producer-server-desk";
import Link from "next/link";
import { ProducerOutreachTemplates } from "@/components/admin/producer-outreach-templates";
import { ProducerConversationNotebook } from "@/components/admin/producer-conversation-notebook";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function ProducerConversationPage() {
  if (!adminSessionConfigured()) redirect("/admin");

  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) redirect("/admin/login");

  const persistenceEnabled =
    process.env.PRODUCER_CONVERSATION_PERSISTENCE_ENABLED === "true";

  const intakeEnabled = process.env.PRODUCER_INTEREST_INTAKE_ENABLED === "true";

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/producers" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_20%,rgba(99,102,241,.18),transparent_25rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
            Conversation intelligence
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Talk like a person. Capture like a system.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            This is the detailed call sheet for farms, food hubs, makers, and producers. Use the public form for a light introduction; use this notebook for the real conversation, follow-up, and pilot decision.
          </p>
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-indigo-200">Relationship CRM</p>
          <h2 className="mt-2 text-2xl font-semibold">HubSpot is the source of truth for partner relationships</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
            Keep prospect records, contact details, follow-up tasks, and relationship status in HubSpot.
            The producer notebook remains a separate operator workspace until a scoped, server-side HubSpot OAuth connection is implemented.
            This link does not sync data and Watchtower cannot send HubSpot emails yet.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="https://app-na2.hubspot.com/contacts/247749145/objects/0-2/views/all/list" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold hover:bg-indigo-400">Open partner companies in HubSpot ↗</a>
            <a href="https://app-na2.hubspot.com/contacts/247749145/objects/0-1/views/all/list" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold hover:bg-white/10">Open contacts ↗</a>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[.04] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Public business application</p>
          <h2 className="mt-2 text-2xl font-bold">Let partners answer before the call</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">Share a questionnaire covering products, seasonality, fulfillment, partnership goals and media permission. Submissions use the existing protected intake API, only when the operator enables it. Applications are review-only, never auto-approved or published.</p>
          <Link href="/become-a-partner" target="_blank" className="mt-4 inline-block rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold hover:bg-indigo-400">Open partner application ↗</Link>
          <Link href="/admin/producers/applications" className="ml-3 inline-block rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10">Review applications →</Link>
          <p className="mt-3 text-xs text-amber-200">Activation prerequisite: PRODUCER_INTEREST_INTAKE_ENABLED=true plus configured anti-spam quota and database, on a verified Preview. Do not share the public link until a test submission is confirmed.</p>
        </section>
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[.04] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Operator launch checks</p>
          <h2 className="mt-2 text-xl font-semibold">Supplier intake readiness</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-white/50">Public application submissions</p>
              <p className={intakeEnabled ? "mt-1 font-semibold text-emerald-200" : "mt-1 font-semibold text-amber-200"}>{intakeEnabled ? "Feature flag enabled — test still required" : "Disabled — do not distribute the link"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs text-white/50">Server-backed conversation notes</p>
              <p className={persistenceEnabled ? "mt-1 font-semibold text-emerald-200" : "mt-1 font-semibold text-amber-200"}>{persistenceEnabled ? "Feature flag enabled — test still required" : "Browser drafts only"}</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-5 text-white/45">These flags do not confirm database health, abuse protection, deployment readiness or successful submissions. Always prove a test submission and owner review on the exact deployed commit before outreach.</p>
        </section>
        <FeaturedProducerServerDesk />
        <FeaturedProducerPlanner />
        <ProducerMediaPlanner />
        <ProducerOutreachTemplates />
        <ProducerConversationNotebook persistenceEnabled={persistenceEnabled} />
      </div>
    </main>
  );
}
