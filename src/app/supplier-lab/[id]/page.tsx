import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildSyntheticOrderSimulation,
  getSupplierLabCandidate,
  getSyntheticSupplierScenarios,
} from "@/lib/supplier-gateway/simulation.ts";
import { getSupplierRegistryProfile } from "@/lib/supplier-gateway/registry.ts";

function money(cents: number | null) {
  if (cents === null) return "UNKNOWN";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default async function SupplierLabCandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = getSupplierLabCandidate(id);
  if (!candidate) notFound();

  const scenarios = getSyntheticSupplierScenarios(id);
  const simulation = buildSyntheticOrderSimulation(id);

  return (
    <main className="min-h-screen bg-bone text-obsidian">
      <header className="border-b border-border bg-bone/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/supplier-lab" className="font-display text-lg font-bold">
            ← Supplier Lab
          </Link>
          <span className="badge bg-amber-50 text-amber-700">SIMULATION ONLY</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-border bg-surface p-7 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-accent">
              {candidate.lane} / {candidate.category}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold">{candidate.name}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted">{candidate.concept}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="badge bg-amber-50 text-amber-700">{candidate.availability}</span>
              <span className="badge bg-surface-hover text-muted">{candidate.truthState}</span>
              <span className="badge bg-surface-hover text-muted">SUPPLIER {candidate.supplierBinding}</span>
            </div>

            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-900">
                Synthetic scenario boundary
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-900/80">
                The comparison numbers below are local test fixtures. They are not current supplier prices,
                freight quotes, delivery promises, stock, account entitlements, or live SKUs. Their only purpose
                is to prove Norvana&apos;s normalization and routing logic before supplier credentials exist.
              </p>
            </div>
          </div>

          <aside className="rounded-3xl bg-gradient-to-br from-obsidian via-gray-900 to-indigo-950 p-7 text-white shadow-lg">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Internal target retail</p>
            <p className="mt-2 font-display text-3xl font-bold">
              {money(candidate.targetRetailCents.min)}–{money(candidate.targetRetailCents.max)}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/50">Planning target only. Not a customer price.</p>

            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/50">Execution authority</p>
              <p className="mt-2 font-display text-2xl font-bold">LOCKED R0</p>
              <p className="mt-2 text-sm leading-6 text-white/50">
                This page cannot submit, publish, fulfill, refund, activate, or spend.
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-sm md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-accent">
            ROUTING SIMULATION
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold">Provider-neutral landed-cost test</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            The same candidate is passed through multiple normalized provider scenarios. Lowest simulated
            landed cost ranks first; no provider-specific ordering code is invoked.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-muted">
                  <th className="border-b border-border px-3 py-3">Rank</th>
                  <th className="border-b border-border px-3 py-3">Provider</th>
                  <th className="border-b border-border px-3 py-3">Synthetic item</th>
                  <th className="border-b border-border px-3 py-3">Synthetic shipping</th>
                  <th className="border-b border-border px-3 py-3">Synthetic landed</th>
                  <th className="border-b border-border px-3 py-3">Scenario window</th>
                  <th className="border-b border-border px-3 py-3">Live stock</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario) => {
                  const profile = getSupplierRegistryProfile(scenario.providerId);
                  return (
                    <tr key={scenario.providerId}>
                      <td className="border-b border-border px-3 py-4 font-mono">#{scenario.rank}</td>
                      <td className="border-b border-border px-3 py-4">
                        <p className="font-semibold">{profile?.displayName ?? scenario.providerId}</p>
                        <p className="mt-1 text-xs text-muted">LOCAL_SYNTHETIC_FIXTURE</p>
                      </td>
                      <td className="border-b border-border px-3 py-4">{money(scenario.itemCostCents)}</td>
                      <td className="border-b border-border px-3 py-4">{money(scenario.shippingCostCents)}</td>
                      <td className="border-b border-border px-3 py-4 font-semibold">{money(scenario.landedCostCents)}</td>
                      <td className="border-b border-border px-3 py-4">
                        {scenario.deliveryWindowDays.min}–{scenario.deliveryWindowDays.max} simulated days
                      </td>
                      <td className="border-b border-border px-3 py-4">UNKNOWN</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-accent">RISK FLAGS</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.riskFlags.map((flag) => (
                <span key={flag} className="badge bg-amber-50 text-amber-700">{flag}</span>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-accent">ORDER OBJECT</p>
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Class" value={simulation?.simulationClass ?? "NONE"} />
              <Row label="Selected provider" value={simulation?.selectedProviderId ?? "NONE"} />
              <Row label="Supplier SKU" value="NONE" />
              <Row label="External submission" value="FORBIDDEN" />
              <Row label="Final state" value={simulation?.finalState ?? "NONE"} />
            </dl>
          </div>
        </section>

        <footer className="mt-8 border-t border-border py-8 text-xs leading-6 text-muted">
          Promotion to a real supplier candidate requires account-level API entitlement, authenticated
          read-only catalog proof, stock/freight evidence, and later independent verification.
        </footer>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-mono text-xs">{value}</dd>
    </div>
  );
}
