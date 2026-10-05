import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { watchJobs, watchRuns } from "@/db/schema";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";
import { JobToggle } from "@/components/admin/watchtower-controls";
import { WATCHTOWER_ALL_JOB_TEMPLATES } from "@/lib/watchtower/default-jobs";
import { currentWatchtowerRuntimeId } from "@/lib/watchtower/runtime-id";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  let jobs: (typeof watchJobs.$inferSelect)[] = [];
  let runs: (typeof watchRuns.$inferSelect)[] = [];
  let initialized = false;
  try {
    [jobs, runs] = await Promise.all([
      db.select().from(watchJobs).orderBy(asc(watchJobs.name)),
      db.select().from(watchRuns).orderBy(desc(watchRuns.createdAt)).limit(25),
    ]);
    initialized = true;
  } catch {}

  const runtimeId = currentWatchtowerRuntimeId();
  let controlProof = false;
  let workerProof = false;
  if (initialized && runtimeId) {
    try {
      const [control] = await db.select({ id: watchRuns.id }).from(watchRuns).where(
        and(eq(watchRuns.trigger, "CONTROL_TEST"), eq(watchRuns.status, "PASS"), eq(watchRuns.runtimeId, runtimeId))
      ).limit(1);
      const [worker] = await db.select({ id: watchRuns.id }).from(watchRuns).where(
        and(eq(watchRuns.trigger, "WORKER_TEST"), eq(watchRuns.status, "PASS"), eq(watchRuns.runtimeId, runtimeId))
      ).limit(1);
      controlProof = Boolean(control);
      workerProof = Boolean(worker);
    } catch {}
  }

  const schedulerConfigured = Boolean(process.env.NORVANA_WATCHTOWER_CRON_SECRET);
  const executorEnabled = process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true";
  const externalActionsEnabled =
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true" ||
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true";

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/system-health" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">System Health</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">The technical room.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Proof, watcher state, runtime health, and low-level controls live here so they do not crowd the owner cockpit.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Database", initialized ? "READY" : "NOT READY"],
            ["Scheduler", schedulerConfigured ? "CONFIGURED" : "NOT CONFIGURED"],
            ["Executor", executorEnabled ? "ENABLED" : "DISABLED"],
            ["External actions", externalActionsEnabled ? "ENABLED" : "LOCKED"],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className="mt-2 font-display text-xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Current deployment proof</p>
            <div className="mt-5 space-y-3">
              {[
                ["Runtime bound", runtimeId ? "YES" : "NO"],
                ["Control proof", controlProof ? "PASS" : "REQUIRED"],
                ["Worker proof", workerProof ? "PASS" : "REQUIRED"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl bg-black/20 px-4 py-3 text-sm">
                  <span className="text-white/45">{label}</span>
                  <span className="font-mono text-xs text-white/75">{value}</span>
                </div>
              ))}
            </div>
            <Link href="/admin" className="mt-5 inline-flex text-sm font-semibold text-indigo-200 underline underline-offset-4">
              Open legacy advanced controls →
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Watchers</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {(initialized ? jobs : WATCHTOWER_ALL_JOB_TEMPLATES).map((job) => {
                const id = "id" in job ? job.id : null;
                const status = "status" in job ? job.status : "PLANNED";
                return (
                  <article key={job.slug} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{job.name}</p>
                        <p className="mt-1 text-xs text-white/40">{job.category} · {job.authority}</p>
                      </div>
                      {initialized && id ? <JobToggle job={{ id, status }} /> : <span className="text-xs text-white/35">Planned</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Recent runs</p>
          <div className="mt-5 space-y-2">
            {runs.map((run) => (
              <div key={run.id} className="grid gap-2 rounded-xl bg-black/20 px-4 py-3 text-xs text-white/50 md:grid-cols-[1fr_auto_auto]">
                <span>{run.trigger}</span>
                <span>{run.status}</span>
                <span>{run.createdAt.toISOString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
