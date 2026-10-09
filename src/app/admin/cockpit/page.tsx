import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { watchCandidateSnapshots, watchCandidates, watchJobs } from "@/db/schema";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { ownerCredentialState } from "@/lib/admin-identity";
import { WatchtowerHero } from "@/components/admin/watchtower-hero";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";
import { WATCHTOWER_CONNECTIONS, connectionStatus } from "@/lib/watchtower/connections";
import { buildOwnerActions } from "@/lib/watchtower/owner-actions";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function numeric(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function moneyFromCents(value: unknown) {
  const cents = numeric(value);
  return cents === null ? null : new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function pctFromBps(value: unknown) {
  const bps = numeric(value);
  return bps === null ? null : `${(bps / 100).toFixed(1)}%`;
}

function firstString(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function candidateImage(identity: JsonRecord) {
  const direct = firstString(identity, ["imageUrl", "thumbnailUrl", "image", "image_url", "thumbnail"]);
  if (direct) return direct;
  const images = identity.images;
  if (Array.isArray(images)) {
    const first = images.find((item) => typeof item === "string" && item.trim());
    return typeof first === "string" ? first : null;
  }
  return null;
}

function candidateEconomics(candidate: typeof watchCandidates.$inferSelect, snapshot?: typeof watchCandidateSnapshots.$inferSelect) {
  const candidateEconomics = record(candidate.economics);
  const snapshotEconomics = record(snapshot?.economics);
  const economics = Object.keys(snapshotEconomics).length ? snapshotEconomics : candidateEconomics;
  const nestedCosts = record(economics.costs);

  const projected = moneyFromCents(
    economics.contributionCents ??
      economics.projectedProfitCents ??
      economics.projectedContributionCents ??
      economics.affiliateCommissionCents
  );
  const margin = pctFromBps(economics.contributionMarginBps ?? economics.marginBps);
  const salePrice = moneyFromCents(
    economics.salePriceCents ??
      economics.retailPriceCents ??
      economics.totalCustomerPriceCents
  );
  const productCost = moneyFromCents(
    economics.productCostCents ??
      nestedCosts.productCostCents ??
      economics.sourceCostCents
  );
  const shipping = moneyFromCents(
    economics.outboundShippingCents ??
      nestedCosts.outboundShippingCents ??
      economics.shippingCents
  );
  const commission = moneyFromCents(economics.affiliateCommissionCents);

  return { projected, margin, salePrice, productCost, shipping, commission };
}

function candidateConfidence(snapshot?: typeof watchCandidateSnapshots.$inferSelect) {
  const scorecard = record(snapshot?.scorecard);
  const raw = numeric(scorecard.confidence ?? scorecard.confidenceScore ?? scorecard.completenessPct ?? scorecard.score);
  if (raw === null) return null;
  const normalized = raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

const ROOMS = [
  {
    href: "/admin/armed-mode",
    title: "Armed Mode",
    copy: "Green and Blue intelligence can move now; Amber asks you; Red autonomous execution stays locked until proven.",
    eyebrow: "AUTHORITY",
  },
  {
    href: "/admin/money",
    title: "Money",
    copy: "Revenue, payment state, refunds, shipping charges, and eventually contribution margin.",
    eyebrow: "CASH",
  },
  {
    href: "/admin/orders",
    title: "Orders + Delivery",
    copy: "Customer orders, supplier handoff, tracking, and delivery exceptions.",
    eyebrow: "MOVE",
  },
  {
    href: "/admin/suppliers",
    title: "Brands + Suppliers",
    copy: "Who can supply what, what is connected, and what still needs qualification.",
    eyebrow: "SOURCE",
  },
  {
    href: "/admin/connections",
    title: "Connections",
    copy: "Stripe, shipping, delivery, media, messaging, commerce, and platform APIs.",
    eyebrow: "CONNECT",
  },
  {
    href: "/admin/affiliates",
    title: "Partner + Supplier Hub",
    copy: "Affiliate networks, name-brand programs, dropship suppliers, and print-on-demand options with cost truth and signup links.",
    eyebrow: "EARN",
  },
  {
    href: "/admin/credentials",
    title: "Business Credentials",
    copy: "Legal entity, EIN/tax-document readiness, resale paperwork, W-9, DBA status, and supplier application packs without exposing private numbers.",
    eyebrow: "QUALIFY",
  },
  {
    href: "/admin/producers",
    title: "Farms + Producers",
    copy: "Farm conversations, follow-ups, pilot fit, delivery notes, and detailed discovery.",
    eyebrow: "RELATIONSHIPS",
  },
  {
    href: "/admin/era-studio",
    title: "Era Studio",
    copy: "Draft Eras, media, curated products, readiness, and controlled activation.",
    eyebrow: "CREATE",
  },
  {
    href: "/admin/intelligence",
    title: "Intelligence",
    copy: "Demand, Darwin economics, delivery comparisons, producer prospects, and media discovery.",
    eyebrow: "LEARN",
  },
  {
    href: "/admin/launch",
    title: "Launch",
    copy: "Domain, database, payments, suppliers, fulfillment, and the last gates before Production.",
    eyebrow: "GO LIVE",
  },
  {
    href: "/admin/system-health",
    title: "System Health",
    copy: "Watchers, proof state, runtime health, and advanced controls.",
    eyebrow: "ADVANCED",
  },
];

export default async function WatchtowerCockpitPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  let initialized = false;
  let jobs: (typeof watchJobs.$inferSelect)[] = [];
  let candidates: (typeof watchCandidates.$inferSelect)[] = [];
  let candidateSnapshots: (typeof watchCandidateSnapshots.$inferSelect)[] = [];

  try {
    [jobs, candidates, candidateSnapshots] = await Promise.all([
      db.select().from(watchJobs).orderBy(asc(watchJobs.name)),
      db.select().from(watchCandidates).orderBy(desc(watchCandidates.createdAt)).limit(50),
      db.select().from(watchCandidateSnapshots).orderBy(desc(watchCandidateSnapshots.observedAt)).limit(200),
    ]);
    initialized = true;
  } catch {}

  const latestSnapshotByCandidate = new Map<number, typeof watchCandidateSnapshots.$inferSelect>();
  for (const snapshot of candidateSnapshots) {
    if (!latestSnapshotByCandidate.has(snapshot.candidateId)) {
      latestSnapshotByCandidate.set(snapshot.candidateId, snapshot);
    }
  }
  const scoutPicks = candidates.filter((candidate) => candidate.status === "NEW").slice(0, 8);

  const ownerCredential = await ownerCredentialState();
  const enabledJobs = jobs.filter((job) => job.status === "ENABLED").length;
  const unresolvedCandidates = candidates.filter((candidate) => candidate.status === "NEW").length;
  const externalActionsEnabled =
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true" ||
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true";
  const producerInterestEnabled =
    process.env.PRODUCER_INTEREST_INTAKE_ENABLED === "true";
  const producerConversationPersistenceEnabled =
    process.env.PRODUCER_CONVERSATION_PERSISTENCE_ENABLED === "true";

  const connectionStates = WATCHTOWER_CONNECTIONS.map((entry) => ({
    entry,
    state: connectionStatus(entry).state,
  }));

  const ownerActions = buildOwnerActions({
    initialized,
    unresolvedCandidates,
    enabledJobs,
    totalJobs: jobs.length,
    ownerCredentialRotated: ownerCredential.rotated,
    connections: connectionStates,
    producerInterestEnabled,
    producerConversationPersistenceEnabled,
    externalActionsEnabled,
  });

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/cockpit" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WatchtowerHero
          watcherCount={initialized ? jobs.length : null}
          enabledCount={enabledJobs}
          candidateCount={unresolvedCandidates}
          initialized={initialized}
        />

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Owner inbox</p>
              <h2 className="mt-2 font-display text-3xl font-black">What needs me?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                The point of Watchtower is to tell you what deserves attention, not make you interpret ten dashboards.
              </p>
            </div>
            <Link
              href="/admin/system-health"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/60"
            >
              Advanced / System Health
            </Link>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-2">
            {ownerActions.slice(0, 8).map((action) => (
              <article key={action.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <span
                  className={
                    "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] " +
                    (action.priority === "NOW"
                      ? "bg-rose-300/10 text-rose-200"
                      : action.priority === "SOON"
                        ? "bg-amber-300/10 text-amber-100"
                        : "bg-white/5 text-white/40")
                  }
                >
                  {action.priority}
                </span>
                <h3 className="mt-3 font-display text-xl font-bold">{action.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/50">{action.detail}</p>
                {action.href && action.actionLabel ? (
                  <Link href={action.href} className="mt-4 inline-flex text-sm font-semibold text-indigo-200 underline underline-offset-4">
                    {action.actionLabel} →
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">Scout product memos</p>
              <h2 className="mt-2 font-display text-3xl font-black">Why would I want this item?</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
                Scouts should earn your attention. Each memo shows what the item is, what we currently think it can make,
                why it fits Acre Era, and what still needs proof. Missing economics stay missing — Watchtower does not invent profit.
              </p>
            </div>
            <Link href="/admin/intelligence" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70">
              Open Intelligence
            </Link>
          </div>

          {scoutPicks.length ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {scoutPicks.map((candidate) => {
                const snapshot = latestSnapshotByCandidate.get(candidate.id);
                const identity = record(snapshot?.identity);
                const economics = candidateEconomics(candidate, snapshot);
                const image = candidateImage(identity);
                const confidence = candidateConfidence(snapshot);
                const riskFlags = Array.from(new Set([
                  ...(Array.isArray(candidate.riskFlags) ? candidate.riskFlags : []),
                  ...(Array.isArray(snapshot?.riskFlags) ? snapshot.riskFlags : []),
                ])).slice(0, 5);
                const why =
                  candidate.recommendation.trim() ||
                  firstString(record(snapshot?.scorecard), ["reason", "recommendation", "summary"]) ||
                  `Scout found a potentially useful ${candidate.lane || "product"} opportunity. Qualification is still incomplete.`;

                return (
                  <article key={candidate.id} className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20">
                    <div className="grid sm:grid-cols-[11rem_1fr]">
                      <div className="flex min-h-44 items-center justify-center bg-white/[0.04]">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={image} alt="" className="h-44 w-full object-contain bg-white" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="px-5 text-center">
                            <div className="text-4xl">📦</div>
                            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Image pending</p>
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                              {candidate.lane || "Scout find"} · {candidate.truthState}
                            </p>
                            <h3 className="mt-2 font-display text-xl font-bold">{candidate.title}</h3>
                            <p className="mt-1 text-xs text-white/35">{candidate.sourceName || "Source pending"}</p>
                          </div>
                          {confidence !== null ? (
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-white/60">
                              {confidence}% confidence
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] p-3">
                            <p className="text-[9px] uppercase tracking-[0.14em] text-emerald-100/55">
                              {economics.commission ? "Projected commission" : "Projected contribution"}
                            </p>
                            <p className="mt-1 font-display text-xl font-bold text-emerald-100">
                              {economics.commission || economics.projected || "Pending"}
                            </p>
                            <p className="mt-1 text-[10px] text-emerald-100/45">
                              {economics.margin ? `${economics.margin} margin` : "Needs complete economics"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                            <p className="text-[9px] uppercase tracking-[0.14em] text-white/30">Customer / source economics</p>
                            <p className="mt-1 text-xs text-white/65">
                              Sell: {economics.salePrice || "pending"}
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                              Cost: {economics.productCost || "pending"}
                              {economics.shipping ? ` · Ship: ${economics.shipping}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/10 p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">Why Scout likes it</p>
                      <p className="mt-2 text-sm leading-6 text-white/60">{why}</p>

                      <div className="mt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100/70">What could kill the deal</p>
                        {riskFlags.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {riskFlags.map((flag) => (
                              <span key={flag} className="rounded-full border border-amber-300/15 bg-amber-300/[0.05] px-2.5 py-1 text-[10px] text-amber-100/75">
                                {flag.replaceAll("_", " ")}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-white/35">
                            No recorded risk flag yet. That does not mean the candidate is fully qualified.
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {candidate.sourceUrl ? (
                          <a
                            href={candidate.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70"
                          >
                            View source ↗
                          </a>
                        ) : null}
                        <span className="text-[10px] uppercase tracking-[0.12em] text-white/30">
                          Candidate #{candidate.id} · {candidate.status}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm text-white/40">
              No Scout product candidates are waiting right now. When Scouts find something, the memo will appear here.
            </div>
          )}
        </section>

        <section className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Quick actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["/admin/armed-mode", "Open Armed Mode"],
              ["/admin/producers", "Start a farm call"],
              ["/admin/orders", "Review orders"],
              ["/admin/suppliers", "Check suppliers"],
              ["/admin/credentials", "Business credentials"],
              ["/admin/connections", "Connect a service"],
              ["/admin/era-studio", "Build an Era"],
              ["/admin/launch", "Check launch readiness"],
              ["/", "Preview storefront"],
            ].map(([href, label]) => (
              <Link
                key={href + label}
                href={href}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/70 transition hover:border-indigo-300/30 hover:bg-white/10 hover:text-white"
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Operating rooms</p>
            <h2 className="mt-2 font-display text-3xl font-black">Run the business without becoming the IT department.</h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ROOMS.map((room) => (
              <Link
                key={room.href}
                href={room.href}
                className="group min-h-56 rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-indigo-300/30 hover:bg-white/[0.055]"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-200">{room.eyebrow}</p>
                <h3 className="mt-3 font-display text-2xl font-bold">{room.title}</h3>
                <p className="mt-4 text-sm leading-6 text-white/50">{room.copy}</p>
                <span className="mt-8 inline-flex text-sm font-semibold text-white/70 group-hover:text-white">Open room →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Authority</p>
            <h2 className="mt-2 font-display text-2xl font-bold">Armed Mode: intelligence is live-safe; execution remains gated.</h2>
            <p className="mt-4 text-sm leading-7 text-white/50">
              Research, quotes, status, comparisons, and owner recommendations can become automatic. Spending money, contacting customers, refunding, creating deliveries, publishing Eras, or activating suppliers remain separate permissions.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">GREEN · OBSERVE</span>
              <span className="rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1.5 text-xs text-indigo-100">BLUE · RECOMMEND</span>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs text-amber-100">AMBER · ASK ME</span>
              <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1.5 text-xs text-rose-100/60">RED · LOCKED</span>
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-black/20 p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Quick status</p>
            <div className="mt-5 space-y-3">
              {[
                ["Watchers enabled", String(enabledJobs)],
                ["Candidates waiting", String(unresolvedCandidates)],
                ["Connections needing setup", String(connectionStates.filter((row) => row.state === "NEEDS_SETUP" || row.state === "PARTIAL").length)],
                ["Consequential actions", externalActionsEnabled ? "ENABLED" : "LOCKED"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3 text-sm">
                  <span className="text-white/45">{label}</span>
                  <span className="font-semibold text-white/75">{value}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
