import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, asc, desc, eq, sql } from "drizzle-orm";
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

  // Read-only schema probe. Report table presence without exposing connection details.
  const schemaTables = ["eras", "watch_jobs", "action_receipts", "suppliers"] as const;
  let schemaAvailability: Record<string, boolean> | null = null;
  try {
    const probe = await db.execute(sql`SELECT
      to_regclass('public.eras') IS NOT NULL AS eras,
      to_regclass('public.watch_jobs') IS NOT NULL AS watch_jobs,
      to_regclass('public.action_receipts') IS NOT NULL AS action_receipts,
      to_regclass('public.suppliers') IS NOT NULL AS suppliers`);
    const first = probe.rows[0] as Record<string, unknown> | undefined;
    if (first) {
      schemaAvailability = Object.fromEntries(
        schemaTables.map((name) => [name, first[name] === true])
      );
    }
  } catch (error) {
    console.error("Read-only Watchtower schema check failed:", error);
  }

  // The presence of a table does not establish that its expected columns exist.
  let receiptColumnsReady: boolean | null = null;
  try {
    const columns = await db.execute(sql`SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'action_receipts'`);
    const available = new Set(columns.rows.map((row) => String(row.column_name)));
    receiptColumnsReady = ["id","action_type","authority_class","subject_type","subject_id","status","actor","details","created_at"]
      .every((name) => available.has(name));
  } catch (error) {
    console.error("Read-only CJ receipt column check failed:", error);
  }

  // Inspect every Era Engine dependency before authorizing a migration.
  const eraTables = [
    "eras", "era_media_assets", "era_sections", "era_products",
    "era_watchtower_bindings", "era_events", "era_archive_snapshots", "products"
  ] as const;
  let eraTableAvailability: Record<string, boolean> | null = null;
  let eraColumnCompatibility: boolean | null = null;
  try {
    const result = await db.execute(sql`SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN
      ('eras','era_media_assets','era_sections','era_products','era_watchtower_bindings','era_events','era_archive_snapshots','products')`);
    const found = new Set(result.rows.map((row) => String(row.table_name)));
    eraTableAvailability = Object.fromEntries(eraTables.map((name) => [name, found.has(name)]));
    if (found.has("eras")) {
      const columns = await db.execute(sql`SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'eras'`);
      const available = new Set(columns.rows.map((row) => String(row.column_name)));
      eraColumnCompatibility = [
        "id","slug","name","eyebrow","story","kind","lifecycle_state",
        "visibility","is_primary","start_at","end_at","theme_tokens",
        "watchtower_profile","archive_policy","created_at","updated_at","content_revision"
      ].every((name) => available.has(name));
    } else {
      eraColumnCompatibility = false;
    }
  } catch (error) {
    console.error("Read-only Era Engine schema check failed:", error);
  }

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

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6" aria-labelledby="database-readiness-title">
          <h2 id="database-readiness-title" className="text-xl font-bold">Database readiness · read-only</h2>
          <p className="mt-2 text-sm text-white/55">This checks table availability in the database bound to this deployment. It never creates, changes, or deletes tables.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {schemaTables.map((tableName) => (
              <div key={tableName} className="flex items-center justify-between rounded-xl bg-black/20 p-3 text-sm">
                <code>{tableName}</code>
                <span className={schemaAvailability?.[tableName] === true ? "text-emerald-200" : "text-amber-200"}>
                  {schemaAvailability === null ? "UNKNOWN" : schemaAvailability[tableName] ? "PRESENT" : "MISSING"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl bg-black/20 p-3 text-sm">
            <span>Receipt table column compatibility</span>
            <span className={receiptColumnsReady === true ? "text-emerald-200" : "text-amber-200"}>
              {receiptColumnsReady === null ? "UNKNOWN" : receiptColumnsReady ? "COMPATIBLE" : "MISSING COLUMNS"}
            </span>
          </div>
          {schemaAvailability === null || Object.values(schemaAvailability).some((present) => !present) || receiptColumnsReady !== true ? (
            <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">
              <p className="font-semibold">Engineering attention required — no owner database action requested.</p>
              <p className="mt-2">Confirm that this Preview branch uses the intended Acre Era database configuration and approved schema migrations. Do not paste passwords, click Initialize repeatedly, or create another Watchtower.</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-emerald-200">Required tables are present. Application read/write tests and receipt readback are still required.</p>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6" aria-labelledby="era-readiness-title">
          <h2 id="era-readiness-title" className="text-xl font-bold">Era Engine readiness · read-only</h2>
          <p className="mt-2 text-sm text-white/55">Checks all known Era Engine table dependencies before planning a migration. This is not proof that a migration has run or that historical content exists.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {eraTables.map((tableName) => (
              <div key={tableName} className="flex items-center justify-between rounded-xl bg-black/20 p-3 text-sm">
                <code>{tableName}</code>
                <span className={eraTableAvailability?.[tableName] === true ? "text-emerald-200" : "text-amber-200"}>
                  {eraTableAvailability === null ? "UNKNOWN" : eraTableAvailability[tableName] ? "PRESENT" : "MISSING"}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-xl bg-black/20 p-3 text-sm">
              <span>Era root column compatibility</span>
              <span className={eraColumnCompatibility === true ? "text-emerald-200" : "text-amber-200"}>
                {eraColumnCompatibility === null ? "UNKNOWN" : eraColumnCompatibility ? "COMPATIBLE" : "NOT READY"}
              </span>
            </div>
          </div>
          {eraTableAvailability === null || Object.values(eraTableAvailability).some((present) => !present) || eraColumnCompatibility !== true ? (
            <p className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100">
              Era Engine is not schema-ready in this deployment. Engineering must confirm the intended Preview database and apply only a reviewed, environment-scoped migration after checking existing data. Do not initialize or copy production credentials here.
            </p>
          ) : (
            <p className="mt-4 text-sm text-emerald-200">Era Engine table inventory is present. Content, constraints, migrations and runtime behavior still require verification.</p>
          )}
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
            <p className="mt-4 text-xs leading-5 text-white/45">Separate legacy diagnostic tools remain available for controlled runtime proof. They are not a second owner dashboard.</p>
            <Link href="/admin/advanced" className="mt-3 inline-flex text-sm font-semibold text-indigo-200 underline underline-offset-4">
              Open restricted diagnostics and self-tests →
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
