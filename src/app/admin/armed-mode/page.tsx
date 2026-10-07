import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";
import { WATCHTOWER_ALL_JOB_TEMPLATES } from "@/lib/watchtower/default-jobs";

export const dynamic = "force-dynamic";

const LEVELS = [
  {
    name: "GREEN · Observe",
    state: "LIVE-SAFE",
    copy: "Research suppliers, affiliate programs, product safety, brand authorization, demand, operating costs, and local producers.",
    examples: ["Web research", "Catalog observation", "Recall monitoring", "Supplier discovery"],
  },
  {
    name: "BLUE · Recommend",
    state: "LIVE-SAFE",
    copy: "Compare economics, rank suppliers, draft product candidates, recommend pricing ranges, delivery options, and future Eras.",
    examples: ["Supplier ranking", "Margin analysis", "Product candidates", "Draft Era ideas"],
  },
  {
    name: "AMBER · Ask Me",
    state: "OWNER APPROVAL",
    copy: "Prepare the action, but stop before anything external or consequential happens.",
    examples: ["Supplier enrollment", "Customer contact", "Publishing", "Paid service signup"],
  },
  {
    name: "RED · Autonomous",
    state: "LOCKED",
    copy: "Execution stays disabled until the exact workflow has independent proof, real credentials, rollback, and owner-approved authority.",
    examples: ["Place orders", "Buy labels", "Refund", "Fulfill", "Publish live"],
  },
] as const;

const OWNER_TASKS = [
  {
    priority: "NOW",
    title: "Confirm Acre Era trade-name / DBA status",
    detail: "If Acre Era is already registered under Norris James Data, LLC, bank the proof. If not, keep applications under the legal LLC and use Acre Era only where a trade/store name is allowed.",
    href: "/admin/credentials",
  },
  {
    priority: "NOW",
    title: "Prepare a current W-9",
    detail: "Keep a signed current W-9 ready for distributors such as Petra and D&H. Do not paste the EIN into Watchtower source code.",
    href: "/admin/credentials",
  },
  {
    priority: "NOW",
    title: "Confirm resale certificate / sales-permit paperwork",
    detail: "We know the sales permit exists. We still need to know which document satisfies reseller exemption requirements for supplier applications and direct-to-customer shipments.",
    href: "/admin/credentials",
  },
  {
    priority: "NEXT",
    title: "Apply to Petra Industries",
    detail: "Use Norris James Data, LLC as the legal entity and Acre Era as the storefront / trade name where allowed. Petra is a first-tier electronics and general-goods distributor target.",
    href: "/admin/affiliates",
  },
  {
    priority: "NEXT",
    title: "Apply to D&H, CWR, and Ingram Micro",
    detail: "These are distributor-account applications, not generic app installs. Approval gives us much stronger electronics and device sourcing options.",
    href: "/admin/affiliates",
  },
  {
    priority: "NEXT",
    title: "Finish CJ Affiliate + Rakuten",
    detail: "Awin and Impact are already complete. CJ Affiliate and Rakuten are the remaining major network accounts in the first-wave plan.",
    href: "/admin/affiliates",
  },
  {
    priority: "NEXT",
    title: "Create remaining Acre Era social profiles",
    detail: "Instagram is claimed as @acre.era with the approved Concept A avatar. TikTok and Pinterest remain. Account terms, login, and MFA stay with the founder.",
    href: null,
  },
  {
    priority: "NEXT",
    title: "Verify Acre Era in Google Search Console",
    detail: "The crawl, sitemap, canonical, metadata, and indexability foundation is live. The remaining step is property verification in Search Console and sitemap submission.",
    href: null,
  },
  {
    priority: "INFRA",
    title: "Create / connect a dedicated Acre Era database",
    detail: "The current legacy Norvana preview database is missing the newer Era schema. This is the main infrastructure gate before durable Watchtower operation and Production launch.",
    href: "/admin/launch",
  },
] as const;

export default async function ArmedModePage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const safeWatchers = WATCHTOWER_ALL_JOB_TEMPLATES.filter(
    (job) => job.authority === "OBSERVE" || job.authority === "RECOMMEND"
  );
  const actWatchers = WATCHTOWER_ALL_JOB_TEMPLATES.filter((job) => job.authority === "ACT");

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/armed-mode" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_80%_18%,rgba(129,140,248,.13),transparent_25rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">Armed Mode</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Full intelligence. Consequential execution stays on a leash.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Acre Era can research, observe, compare, calculate, draft, and recommend aggressively now. Money movement, customer contact, supplier activation, order placement, fulfillment, refunds, and public publishing stay behind explicit approval until their exact workflows are proven.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-emerald-100/70">Safe watchers</p>
              <p className="mt-2 font-display text-3xl font-bold">{safeWatchers.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Watcher budget ceiling</p>
              <p className="mt-2 font-display text-3xl font-bold">$0</p>
            </div>
            <div className="rounded-2xl border border-rose-300/15 bg-rose-300/[0.05] p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-rose-100/70">ACT watchers</p>
              <p className="mt-2 font-display text-3xl font-bold">{actWatchers.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-rose-100/45">Remain locked</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          {LEVELS.map((level) => (
            <article key={level.name} className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-display text-2xl font-bold">{level.name}</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  {level.state}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/50">{level.copy}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {level.examples.map((example) => (
                  <span key={example} className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/55">
                    {example}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">What I need from you</p>
              <h2 className="mt-2 font-display text-3xl font-black">Owner checklist</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                These are the human/account steps that unlock real supplier relationships and public discovery. Everything else stays on my side of the table.
              </p>
            </div>
            <Link href="/admin/credentials" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70">
              Open Credentials
            </Link>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {OWNER_TASKS.map((task) => (
              <article key={task.title} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/50">
                  {task.priority}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold">{task.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{task.detail}</p>
                {task.href ? (
                  <Link href={task.href} className="mt-4 inline-flex text-sm font-semibold text-indigo-200 underline underline-offset-4">
                    Open related room →
                  </Link>
                ) : (
                  <span className="mt-4 inline-flex text-xs font-semibold uppercase tracking-[0.12em] text-amber-100/70">
                    Founder action needed
                  </span>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-emerald-300/15 bg-emerald-300/[0.05] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Operating posture</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Armed does not mean reckless.</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-emerald-50/70">
            Research and recommendation lanes are approved to move aggressively with zero spend. No mode on this page changes payment, supplier-connector, fulfillment, customer-contact, refund, or Production-release environment flags.
          </p>
        </section>
      </div>
    </main>
  );
}
