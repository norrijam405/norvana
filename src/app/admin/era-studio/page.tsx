import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { eraMediaAssets, eraProducts, eras } from "@/db/schema";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";

export const dynamic = "force-dynamic";

export default async function EraStudioPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  let eraRows: (typeof eras.$inferSelect)[] = [];
  let mediaRows: (typeof eraMediaAssets.$inferSelect)[] = [];
  let productRows: (typeof eraProducts.$inferSelect)[] = [];

  try {
    [eraRows, mediaRows, productRows] = await Promise.all([
      db.select().from(eras).orderBy(asc(eras.name)),
      db.select().from(eraMediaAssets).orderBy(desc(eraMediaAssets.createdAt)).limit(500),
      db.select().from(eraProducts).orderBy(desc(eraProducts.assignedAt)).limit(500),
    ]);
  } catch {}

  const current = eraRows.find((era) => era.isPrimary && era.lifecycleState === "ACTIVE") ?? null;
  const draftCount = eraRows.filter((era) => era.lifecycleState === "DRAFT").length;
  const approvedMedia = mediaRows.filter((row) => row.status === "APPROVED").length;
  const pendingMedia = mediaRows.filter((row) => row.status !== "APPROVED").length;

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/era-studio" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_16%,rgba(232,198,138,.13),transparent_25rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Era Studio</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">Build the world before you publish it.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            Era Studio is the owner view for drafts, media, product curation, readiness, and the final handoff into a live Era. Publishing remains a gated action.
          </p>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["Current Era", current ? current.name : "None"],
            ["Drafts", String(draftCount)],
            ["Approved media", String(approvedMedia)],
            ["Media needing review", String(pendingMedia)],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
              <p className="mt-2 font-display text-2xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Era roster</p>
            <div className="mt-5 space-y-3">
              {eraRows.map((era) => {
                const mediaCount = mediaRows.filter((row) => row.eraId === era.id).length;
                const productCount = productRows.filter((row) => row.eraId === era.id && row.status === "ACTIVE").length;
                return (
                  <article key={era.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{era.name}</p>
                        <p className="mt-1 text-xs text-white/40">
                          {era.lifecycleState} · {era.visibility} · {era.kind}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/50">
                        {era.isPrimary ? "PRIMARY" : "SECONDARY"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-white/45">{productCount} curated product(s) · {mediaCount} media asset(s)</p>
                  </article>
                );
              })}
              {eraRows.length === 0 ? <p className="text-sm text-white/45">No Era records available yet.</p> : null}
            </div>
          </div>

          <div className="space-y-5">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Studio flow</p>
              <div className="mt-5 space-y-3">
                {[
                  "1. Define the Era story + visual world",
                  "2. Curate products and buying routes",
                  "3. Approve rights-safe media",
                  "4. Check delivery, source, and customer fit",
                  "5. Preview the whole experience",
                  "6. Publish only after readiness gates pass",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-black/20 px-4 py-3 text-sm text-white/60">{item}</div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">Authority</p>
              <h2 className="mt-2 font-display text-2xl font-bold">Draft freely. Publish carefully.</h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                This room can organize and preview Era state. Activation remains a separate gated operation.
              </p>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
