import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import {
  WATCHTOWER_CONNECTIONS,
  connectionStatus,
} from "@/lib/watchtower/connections";

export const dynamic = "force-dynamic";

const AUTHORITY_COPY = {
  WATCH: "Read / observe",
  RECOMMEND: "Recommend only",
  ACT: "Can become consequential",
} as const;

export default async function ConnectionsPage() {
  if (!adminSessionConfigured()) redirect("/admin");

  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) redirect("/admin/login");

  const rows = WATCHTOWER_CONNECTIONS.map((entry) => ({
    ...entry,
    status: connectionStatus(entry),
  }));

  const connected = rows.filter((row) => row.status.state === "CONNECTED").length;
  const partial = rows.filter((row) => row.status.state === "PARTIAL").length;
  const needsSetup = rows.filter((row) => row.status.state === "NEEDS_SETUP").length;

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0f0c]/90 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
              ACRE ERA / WATCHTOWER
            </p>
            <p className="font-display text-lg font-bold">Connections Center</p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white"
          >
            Back to Watchtower
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_20%,rgba(99,102,241,.18),transparent_26rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-200">
            Connections
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Every outside company in one place.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            See what Acre Era uses each company for, whether the required credentials are present,
            where to get access, and how much authority the connection is allowed to have.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ["Connected", connected],
              ["Partial", partial],
              ["Needs setup", needsSetup],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
                <p className="mt-2 font-display text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <article key={row.slug} className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
                    {row.category.replaceAll("_", " ")}
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold">{row.name}</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">{row.purpose}</p>
                </div>
                <span
                  className={
                    "rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] " +
                    (row.status.state === "CONNECTED"
                      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
                      : row.status.state === "PARTIAL"
                        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                        : row.status.state === "ACCOUNT_OR_PLATFORM"
                          ? "border-indigo-300/20 bg-indigo-300/10 text-indigo-100"
                          : "border-white/10 bg-white/5 text-white/45")
                  }
                >
                  {row.status.state.replaceAll("_", " ")}
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Authority</p>
                  <p className="mt-2 text-sm font-semibold text-white/80">{AUTHORITY_COPY[row.authority]}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Credential state</p>
                  <p className="mt-2 text-sm font-semibold text-white/80">
                    {row.status.totalKeys
                      ? row.status.presentKeys + " of " + row.status.totalKeys + " required items present"
                      : "Platform/account connection"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-white/42">{row.notes}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={row.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Open {row.name}
                </a>
                {row.developerUrl ? (
                  <a
                    href={row.developerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10"
                  >
                    API / developer setup
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Operator rule</p>
          <h2 className="mt-2 font-display text-2xl font-bold">Green does not mean autonomous.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
            A connected API can be available for reading while consequential actions stay locked.
            Watchtower should be able to gather prices, availability, quotes, and status long before
            it is allowed to spend money, send messages, create shipments, or change customer orders.
          </p>
        </section>
      </div>
    </main>
  );
}
