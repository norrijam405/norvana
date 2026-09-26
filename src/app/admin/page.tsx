import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { watchCandidates, watchJobs, watchRuns } from "@/db/schema";
import {
  ADMIN_SESSION_COOKIE,
  adminAuthConfigured,
  verifyAdminSessionToken,
} from "@/lib/admin-session";
import { WATCHTOWER_JOB_TEMPLATES } from "@/lib/watchtower/default-jobs";
import { JobToggle, WatchtowerControls } from "@/components/admin/watchtower-controls";

export const dynamic = "force-dynamic";

function cadenceLabel(minutes: number) {
  if (minutes % 10080 === 0) return `Every ${minutes / 10080} week${minutes === 10080 ? "" : "s"}`;
  if (minutes % 1440 === 0) return `Every ${minutes / 1440} day${minutes === 1440 ? "" : "s"}`;
  if (minutes % 60 === 0) return `Every ${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  return `Every ${minutes} min`;
}

export default async function AdminPage() {
  if (!adminAuthConfigured()) {
    return (
      <main className="min-h-screen bg-obsidian px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs tracking-[0.28em] text-indigo-light">NORVANA / WATCHTOWER</p>
          <h1 className="mt-4 font-display text-4xl font-bold">Owner login needs configuration</h1>
          <p className="mt-5 max-w-2xl leading-7 text-white/65">
            The old browser password has been retired. Generate a new server-side password hash
            and session secret with <code className="text-indigo-light">npm run admin:credentials -- &quot;your-new-password&quot;</code>,
            then store the generated values as server environment secrets.
          </p>
          <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">
            No default password exists in source code, and historical passwords are not accepted.
          </div>
          <Link href="/" className="mt-8 inline-flex rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70">
            Return to storefront
          </Link>
        </div>
      </main>
    );
  }

  const cookieStore = await cookies();
  const session = verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  let initialized = false;
  let jobs: (typeof watchJobs.$inferSelect)[] = [];
  let runs: (typeof watchRuns.$inferSelect)[] = [];
  let candidates: (typeof watchCandidates.$inferSelect)[] = [];

  try {
    jobs = await db.select().from(watchJobs).orderBy(asc(watchJobs.name));
    runs = await db.select().from(watchRuns).orderBy(desc(watchRuns.createdAt)).limit(8);
    candidates = await db
      .select()
      .from(watchCandidates)
      .orderBy(desc(watchCandidates.createdAt))
      .limit(8);
    initialized = true;
  } catch {
    initialized = false;
  }

  const enabledJobs = jobs.filter((job) => job.status === "ENABLED").length;
  const unresolvedCandidates = candidates.filter((candidate) => candidate.status === "NEW").length;
  const schedulerConfigured = Boolean(process.env.NORVANA_WATCHTOWER_CRON_SECRET);
  const executorEnabled = process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true";
  const federationConfigured =
    process.env.IGNIAQUA_FEDERATION_ENABLED === "true" &&
    Boolean(process.env.IGNIAQUA_FEDERATION_BASE_URL);

  return (
    <main className="min-h-screen bg-obsidian text-white">
      <header className="border-b border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs tracking-[0.28em] text-indigo-light">NORVANA</p>
            <h1 className="mt-1 font-display text-2xl font-bold">Watchtower Control Panel</h1>
          </div>
          <WatchtowerControls initialized={initialized} />
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          <Metric label="Watchers" value={initialized ? String(jobs.length) : "Not initialized"} />
          <Metric label="Enabled" value={String(enabledJobs)} />
          <Metric label="New candidates" value={String(unresolvedCandidates)} />
          <Metric label="ACT authority" value="Locked" />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Automation</p>
                <h2 className="mt-2 font-display text-2xl font-bold">Watchers</h2>
              </div>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                {executorEnabled ? "Executor configured" : "Executor not enabled yet"}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {(initialized ? jobs : WATCHTOWER_JOB_TEMPLATES).map((job) => {
                const id = "id" in job ? job.id : null;
                const status = "status" in job ? job.status : "PLANNED";
                return (
                  <article key={job.slug} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{job.name}</h3>
                          <span className="rounded-full bg-white/5 px-2 py-1 font-mono text-[10px] text-white/45">
                            {job.authority}
                          </span>
                          <span className="rounded-full bg-white/5 px-2 py-1 text-[10px] uppercase text-white/45">
                            {job.category}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/55">{job.description}</p>
                        <p className="mt-3 text-xs text-white/35">
                          {cadenceLabel(job.cadenceMinutes)} · budget ceiling {"$"}{(job.budgetCents / 100).toFixed(2)}
                        </p>
                      </div>
                      {initialized && id ? (
                        <JobToggle job={{ id, status }} />
                      ) : (
                        <span className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/40">
                          Planned
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <Panel title="Truth state">
              <StatusRow label="Database" value={initialized ? "READY" : "NOT INITIALIZED"} />
              <StatusRow label="Scheduler" value={schedulerConfigured ? "CONFIGURED" : "NOT CONFIGURED"} />
              <StatusRow label="Executor" value={executorEnabled ? "CONFIGURED" : "DISABLED"} />
              <StatusRow label="External actions" value="DISABLED" />
              <StatusRow label="IgniAqua federation" value={federationConfigured ? "CONFIGURED" : "PLANNED"} />
            </Panel>

            <Panel title="Authority ceiling">
              <p className="text-sm leading-6 text-white/55">
                Watchtower R0 may observe and recommend. It cannot spend money, place bids,
                publish products, activate suppliers, or submit fulfillment orders.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <span className="rounded-lg bg-emerald-400/10 px-2 py-2 text-emerald-200">OBSERVE</span>
                <span className="rounded-lg bg-indigo-400/10 px-2 py-2 text-indigo-200">RECOMMEND</span>
                <span className="rounded-lg bg-white/5 px-2 py-2 text-white/30">ACT LOCKED</span>
              </div>
            </Panel>

            <Panel title="Closest-to-$0">
              <p className="text-sm leading-6 text-white/55">
                Every watcher starts with a $0 automation budget. Paid data, APIs, models, or
                subscriptions require evidence that the expense saves more or materially lowers risk.
              </p>
            </Panel>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <Panel title="Recent runs">
            {runs.length ? (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div key={run.id} className="rounded-xl border border-white/10 p-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-white/75">Run #{run.id}</span>
                      <span className="font-mono text-xs text-white/40">{run.status}</span>
                    </div>
                    <p className="mt-2 text-white/45">{run.summary || "No summary yet."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>No Watchtower executions have been recorded yet.</Empty>
            )}
          </Panel>

          <Panel title="Candidate inbox">
            {candidates.length ? (
              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="rounded-xl border border-white/10 p-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-white/75">{candidate.title}</span>
                      <span className="font-mono text-xs text-white/40">{candidate.truthState}</span>
                    </div>
                    <p className="mt-2 text-white/45">
                      {candidate.sourceName || "Unknown source"} · {candidate.lane}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>No sourcing or operating candidates have been recorded yet.</Empty>
            )}
          </Panel>
        </section>

        <footer className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6 text-xs text-white/35">
          <span>Norvana owns business state.</span>
          <span>•</span>
          <span>IgniAqua services remain authority-bounded.</span>
          <span>•</span>
          <Link href="/" className="text-indigo-light hover:underline">Storefront</Link>
        </footer>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 py-2.5 text-sm last:border-0">
      <span className="text-white/45">{label}</span>
      <span className="font-mono text-[11px] text-white/70">{value}</span>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/35">{children}</p>;
}
