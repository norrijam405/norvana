import type { ReactNode } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { watchCandidates, watchJobs, watchRuns } from "@/db/schema";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WATCHTOWER_ALL_JOB_TEMPLATES } from "@/lib/watchtower/default-jobs";
import { JobToggle, WatchtowerControls } from "@/components/admin/watchtower-controls";
import { WatchtowerSelfTest } from "@/components/admin/watchtower-self-test";
import { WatchtowerWorkerSelfTest } from "@/components/admin/watchtower-worker-self-test";
import { ownerCredentialState } from "@/lib/admin-identity";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";
import { AUTHORIZED_COMMERCE_PROVIDERS } from "@/lib/commerce/provider-registry";
import { WatchtowerHero } from "@/components/admin/watchtower-hero";

export const dynamic = "force-dynamic";

function cadenceLabel(minutes: number) {
  if (minutes % 10080 === 0) return `Every ${minutes / 10080} week${minutes === 10080 ? "" : "s"}`;
  if (minutes % 1440 === 0) return `Every ${minutes / 1440} day${minutes === 1440 ? "" : "s"}`;
  if (minutes % 60 === 0) return `Every ${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  return `Every ${minutes} min`;
}

export default async function AdminPage() {
  const setupHelperAvailable = process.env.VERCEL_ENV !== "production";

  if (!adminSessionConfigured()) {
    return (
      <main className="min-h-screen bg-bone px-4 py-16 text-obsidian">
        <div className="mx-auto max-w-3xl">
          <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-obsidian via-gray-900 to-obsidian p-8 text-white shadow-xl md:p-12">
            <p className="text-xs font-medium tracking-[0.28em] text-indigo-light">ACRE ERA / WATCHTOWER</p>
            <h1 className="mt-4 font-display text-4xl font-bold">Owner login needs configuration</h1>
            <p className="mt-5 max-w-2xl leading-7 text-white/60">
              The historical browser password is retired. Watchtower now uses a server-side
              owner credential and signed session.
            </p>
            <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">
              No default password exists in source code, and historical passwords are not accepted.
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {setupHelperAvailable ? (
                <Link href="/admin/setup" className="btn-primary">
                  Generate Preview setup values
                </Link>
              ) : null}
              <Link href="/" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10">
                Return to storefront
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) redirect("/admin/login");

  const runtimeId = currentWatchtowerRuntimeId();

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

  const ownerCredential = await ownerCredentialState();

  let controlProofPassed = false;
  let workerProofPassed = false;

  if (initialized && runtimeId) {
    try {
      const [controlProof] = await db
        .select({ id: watchRuns.id })
        .from(watchRuns)
        .where(
          and(
            eq(watchRuns.trigger, "CONTROL_TEST"),
            eq(watchRuns.status, "PASS"),
            eq(watchRuns.runtimeId, runtimeId)
          )
        )
        .limit(1);

      const [workerProof] = await db
        .select({ id: watchRuns.id })
        .from(watchRuns)
        .where(
          and(
            eq(watchRuns.trigger, "WORKER_TEST"),
            eq(watchRuns.status, "PASS"),
            eq(watchRuns.runtimeId, runtimeId)
          )
        )
        .limit(1);

      controlProofPassed = Boolean(controlProof);
      workerProofPassed = Boolean(workerProof);
    } catch {
      controlProofPassed = false;
      workerProofPassed = false;
    }
  }
  const enabledJobs = jobs.filter((job) => job.status === "ENABLED").length;
  const unresolvedCandidates = candidates.filter((candidate) => candidate.status === "NEW").length;
  const schedulerConfigured = Boolean(process.env.NORVANA_WATCHTOWER_CRON_SECRET);
  const executorEnabled = process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true";
  const externalActionsEnabled =
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true" ||
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true";
  const federationConfigured =
    process.env.IGNIAQUA_FEDERATION_ENABLED === "true" &&
    Boolean(process.env.IGNIAQUA_FEDERATION_BASE_URL);

  return (
    <main className="min-h-screen bg-bone text-obsidian">
      <header className="sticky top-0 z-40 border-b border-border bg-bone/85 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-display text-xl font-bold tracking-wider text-obsidian">
            ACRE ERA
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <Link href="/" className="text-sm font-medium text-muted transition-colors hover:text-obsidian">
              Home
            </Link>
            <Link href="/shop" className="text-sm font-medium text-muted transition-colors hover:text-obsidian">
              Shop
            </Link>
            <Link href="/archive" className="text-sm font-medium text-muted transition-colors hover:text-obsidian">
              Archive
            </Link>
            <span className="text-sm font-semibold text-indigo-accent">Watchtower</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/admin/account" className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-obsidian">
              Account
            </Link>
            <Link
              href="/admin/intelligence"
              className="rounded-lg border border-indigo-accent/30 bg-indigo-accent/10 px-3 py-2 text-sm font-semibold text-indigo-accent transition-colors hover:bg-indigo-accent/15"
            >
              Intelligence
            </Link>
            <WatchtowerControls initialized={initialized} />
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <WatchtowerHero
          watcherCount={initialized ? jobs.length : null}
          enabledCount={enabledJobs}
          candidateCount={unresolvedCandidates}
          initialized={initialized}
        />

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <InfoCard eyebrow="SYSTEM" title="Truth state">
            <StatusRow label="Database" value={initialized ? "READY" : "NOT INITIALIZED"} good={initialized} />
            <StatusRow
              label="Scheduler secret"
              value={schedulerConfigured ? "CONFIGURED" : "NOT CONFIGURED"}
              good={schedulerConfigured}
            />
            <StatusRow label="Executor" value={executorEnabled ? "CONFIGURED" : "DISABLED"} good={!executorEnabled} />
            <StatusRow
              label="External actions"
              value={externalActionsEnabled ? "ENABLED" : "DISABLED"}
              good={!externalActionsEnabled}
            />
            <StatusRow label="IgniAqua federation" value={federationConfigured ? "CONFIGURED" : "PLANNED"} good={!federationConfigured} />
            <StatusRow
              label="Proof scope"
              value={runtimeId ? "CURRENT DEPLOYMENT" : "UNBOUND"}
              good={Boolean(runtimeId)}
            />
            <StatusRow
              label="Control proof"
              value={controlProofPassed ? "PASS" : "REQUIRED"}
              good={controlProofPassed}
            />
            <StatusRow
              label="Worker proof"
              value={workerProofPassed ? "PASS" : "REQUIRED"}
              good={workerProofPassed}
            />
            <StatusRow
              label="Owner credential"
              value={ownerCredential.rotated ? "PERMANENT" : "ROTATION REQUIRED"}
              good={ownerCredential.rotated}
            />
            {!ownerCredential.rotated ? (
              <Link
                href="/admin/account"
                className="mt-4 inline-flex rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
              >
                Replace temporary owner password
              </Link>
            ) : null}
            <WatchtowerSelfTest />
            <WatchtowerWorkerSelfTest controlProofPassed={controlProofPassed} />
          </InfoCard>

          <InfoCard eyebrow="AUTHORITY" title="Bounded by design">
            <p className="text-sm leading-6 text-muted">
              Watchtower R0 can observe and recommend. Spending, bidding, publishing, supplier
              activation, refunds, and fulfillment remain outside its authority.
            </p>
            <div className="mt-5 rounded-2xl bg-surface-hover p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted">Current ceiling</p>
              <p className="mt-2 font-display text-xl font-bold">Recommend only</p>
            </div>
          </InfoCard>

          <InfoCard eyebrow="OPERATING DOCTRINE" title="Closest-to-$0">
            <p className="text-sm leading-6 text-muted">
              Every watcher starts at a {"$"}0 automation budget. Paid data, APIs, models, or
              subscriptions require evidence that the expense saves more or materially lowers risk.
            </p>
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-border p-4">
              <span className="text-sm text-muted">Default budget</span>
              <span className="font-display text-xl font-bold text-indigo-accent">{"$"}0</span>
            </div>
          </InfoCard>
        </section>

        <section className="mt-8 rounded-3xl border border-border bg-surface p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-accent">Automation</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Watchers</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-6 text-muted">
                These lanes watch Acre Era&apos;s market and operating surface. They begin paused and stay bounded by the authority ceiling.
              </p>
            </div>
            <span className={executorEnabled
              ? "badge bg-emerald-50 text-success"
              : "badge bg-surface-hover text-muted"
            }>
              {executorEnabled ? "Executor configured" : "Executor disabled"}
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {(initialized ? jobs : WATCHTOWER_ALL_JOB_TEMPLATES).map((job) => {
              const id = "id" in job ? job.id : null;
              const status = "status" in job ? job.status : "PLANNED";

              return (
                <article
                  key={job.slug}
                  className="rounded-2xl border border-border bg-bone p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">{job.name}</h3>
                        <span className="badge bg-indigo-accent/10 font-mono text-[10px] text-indigo-dark">
                          {job.authority}
                        </span>
                        <span className="badge bg-surface text-[10px] uppercase text-muted">
                          {job.category}
                        </span>
                      </div>
                      <p className="mt-3 text-[15px] leading-6 text-muted">{job.description}</p>
                      <p className="mt-4 text-sm text-muted">
                        {cadenceLabel(job.cadenceMinutes)} · budget ceiling {"$"}{(job.budgetCents / 100).toFixed(2)}
                      </p>
                    </div>

                    {initialized && id ? (
                      <JobToggle job={{ id, status }} />
                    ) : (
                      <span className="badge bg-surface text-muted">Planned</span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <DataPanel eyebrow="AUTHORIZED COMMERCE" title="Provider qualification queue">
            <div className="grid gap-3 md:grid-cols-2">
              {AUTHORIZED_COMMERCE_PROVIDERS.map((provider) => (
                <a
                  key={provider.slug}
                  href={provider.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-border bg-bone p-4 transition hover:border-indigo-accent/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">
                        {provider.lane} · {provider.models.join(" / ")}
                      </p>
                    </div>
                    <span className="badge bg-surface font-mono text-[10px] text-muted">
                      {provider.state}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted">
                    {provider.capabilities.slice(0, 3).join(" · ")}
                  </p>
                </a>
              ))}
            </div>
          </DataPanel>

          <DataPanel eyebrow="INTELLIGENCE R2" title="Data we now preserve">
            <div className="space-y-3">
              {[
                ["Identity", "Brand · GTIN/UPC · MPN/SKU · condition · source model"],
                ["Pricing", "Retail · source cost · competitors · historical observations"],
                ["Supply", "Stock · warehouse · freight · lead time · returns"],
                ["Trust", "Authorization · provenance · authenticity · image rights · warranty · recalls"],
                ["Demand", "Bring It Here · Customer Voice · trends · sell-through · competition"],
                ["Economics", "Contribution after freight, fees, returns, fraud, warranty, auth and CAC"],
              ].map(([label, detail]) => (
                <div key={label} className="rounded-2xl border border-border bg-bone p-4">
                  <p className="font-medium">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-muted">
              New intelligence watchers are seeded PAUSED and remain inside OBSERVE/RECOMMEND with a {"$"}0 automation budget.
            </p>
          </DataPanel>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <DataPanel eyebrow="OPERATIONS" title="Recent runs">
            {runs.length ? (
              <div className="space-y-3">
                {runs.map((run) => (
                  <div key={run.id} className="rounded-2xl border border-border bg-bone p-4">
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">Run #{run.id}</span>
                      <span className="font-mono text-xs text-muted">{run.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">{run.summary || "No summary yet."}</p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>No Watchtower executions have been recorded yet.</Empty>
            )}
          </DataPanel>

          <DataPanel eyebrow="SCOUT" title="Candidate inbox">
            {candidates.length ? (
              <div className="space-y-3">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="rounded-2xl border border-border bg-bone p-4">
                    <div className="flex justify-between gap-4">
                      <span className="font-medium">{candidate.title}</span>
                      <span className="font-mono text-xs text-muted">{candidate.truthState}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {candidate.sourceName || "Unknown source"} · {candidate.lane}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>No sourcing or operating candidates have been recorded yet.</Empty>
            )}
          </DataPanel>
        </section>

        <footer className="mt-10 flex flex-wrap items-center gap-2 border-t border-border py-7 text-xs text-muted">
          <span>Acre Era owns customer-facing commerce state.</span>
          <span>•</span>
          <span>IgniAqua services remain authority-bounded.</span>
          <span>•</span>
          <Link href="/" className="font-medium text-indigo-accent hover:underline">Storefront</Link>
        </footer>
      </div>
    </main>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusChip({
  tone,
  children,
}: {
  tone: "green" | "indigo" | "muted";
  children: ReactNode;
}) {
  const classes =
    tone === "green"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : tone === "indigo"
        ? "border-indigo-300/20 bg-indigo-300/10 text-indigo-200"
        : "border-white/10 bg-white/5 text-white/50";

  return <span className={`rounded-full border px-3 py-1.5 font-medium ${classes}`}>{children}</span>;
}

function InfoCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-xl font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DataPanel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-xl font-bold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusRow({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-2.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <span className={good ? "font-mono text-[11px] text-success" : "font-mono text-[11px] text-muted"}>
        {value}
      </span>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-bone p-5 text-sm text-muted">
      {children}
    </p>
  );
}
