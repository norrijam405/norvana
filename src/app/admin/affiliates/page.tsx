import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";
import { AFFILIATE_PROGRAMS } from "@/lib/watchtower/affiliate-programs";

export const dynamic = "force-dynamic";

const PRIORITY_LABELS = {
  APPLY_FIRST: "Apply first",
  SELECTIVE: "Selective",
  LATER: "Later",
} as const;

export default async function AffiliateProgramsPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  const first = AFFILIATE_PROGRAMS.filter((item) => item.priority === "APPLY_FIRST");
  const selective = AFFILIATE_PROGRAMS.filter((item) => item.priority === "SELECTIVE");
  const later = AFFILIATE_PROGRAMS.filter((item) => item.priority === "LATER");

  const priorityCounts = [
    { label: "Apply first", value: first.length },
    { label: "Selective", value: selective.length },
    { label: "Later", value: later.length },
  ];

  const priorityGroups = [
    { key: "APPLY_FIRST", title: "Apply first", items: first },
    { key: "SELECTIVE", title: "Selective", items: selective },
    { key: "LATER", title: "Later / low priority", items: later },
  ] as const;

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/affiliates" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_18%,rgba(232,198,138,.12),transparent_24rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Affiliate Programs</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
            Wide coverage. Narrow activation.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Acre Era can cover almost every shopping category without becoming a random affiliate-link farm.
            Apply broadly enough to build options, then keep only the programs that convert, pay, and fit the customer experience.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {priorityCounts.map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">{label}</p>
                <p className="mt-2 font-display text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-10">
          {priorityGroups.map(({ key, title, items }) => (
            <div key={key}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">{title}</p>
                <h2 className="mt-2 font-display text-3xl font-black">
                  {key === "APPLY_FIRST"
                    ? "Build the first profitable bench."
                    : key === "SELECTIVE"
                      ? "Useful when the category needs depth."
                      : "Only chase these when the economics justify it."}
                </h2>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {items.map((program) => (
                  <article key={program.slug} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
                          {program.categories.join(" · ")}
                        </p>
                        <h3 className="mt-2 font-display text-xl font-bold">{program.name}</h3>
                        <p className="mt-1 text-xs text-white/35">{program.network}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">
                        {PRIORITY_LABELS[program.priority]}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-white/52">{program.coverage}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Economics</p>
                        <p className="mt-2 text-xs leading-5 text-white/60">{program.economics}</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/30">Why Acre Era</p>
                        <p className="mt-2 text-xs leading-5 text-white/60">{program.why}</p>
                      </div>
                    </div>

                    {program.caution ? (
                      <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-100">
                        {program.caution}
                      </p>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-2">
                      <a href={program.applyUrl} target="_blank" rel="noreferrer" className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white">
                        Apply / details
                      </a>
                      <a href={program.website} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70">
                        Visit store
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
