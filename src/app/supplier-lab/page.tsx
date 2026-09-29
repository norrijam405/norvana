import Link from "next/link";
import { SUPPLIER_LAB_CANDIDATES } from "@/lib/supplier-gateway/demo-products";
import { SUPPLIER_REGISTRY_R0 } from "@/lib/supplier-gateway/registry";

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function SupplierLabPage() {
  const general = SUPPLIER_LAB_CANDIDATES.filter(
    (candidate) => candidate.lane === "GENERAL_MERCHANDISE"
  );
  const pod = SUPPLIER_LAB_CANDIDATES.filter((candidate) => candidate.lane === "POD");
  const qualifying = SUPPLIER_REGISTRY_R0.filter((supplier) => supplier.disposition === "QUALIFY");

  return (
    <main className="min-h-screen bg-bone text-obsidian">
      <header className="border-b border-border bg-bone/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-indigo-accent">
              NORVANA / SUPPLIER LAB R0
            </p>
            <p className="mt-1 font-display text-lg font-bold">Candidate Shelf</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/shop" className="btn-secondary text-sm">Storefront</Link>
            <Link href="/admin" className="btn-primary text-sm">Watchtower</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-obsidian via-gray-900 to-obsidian p-7 text-white shadow-lg md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-indigo-300/20 bg-indigo-300/10 px-3 py-1 text-xs font-semibold text-indigo-200">
                READ-ONLY PRODUCT PROVING
              </span>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold md:text-6xl">
                Products we can shape now without pretending they are live.
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
                These are merchandising candidates for Norvana&apos;s supplier-abstraction work.
                They are not supplier-bound, not in stock, not published for sale, and cannot be ordered.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Candidates" value={String(SUPPLIER_LAB_CANDIDATES.length)} />
              <Metric label="Supplier pool" value={String(qualifying.length)} />
              <Metric label="Order authority" value="LOCKED" />
              <Metric label="Live supplier SKUs" value="0" />
            </div>
          </div>
        </section>

        <SafetyBanner />

        <CandidateSection
          eyebrow="GENERAL MERCHANDISE"
          title="Drops candidate shelf"
          copy="Designed to prove catalog, stock, freight, landed-cost and supplier-routing workflows once provider accounts are qualified."
          candidates={general}
        />

        <CandidateSection
          eyebrow="PRINT ON DEMAND"
          title="Norvana branded concepts"
          copy="Designed to prove POD costs, production windows, branding, international routing and defect/return normalization."
          candidates={pod}
        />

        <section className="mt-10 rounded-3xl border border-border bg-surface p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-accent">
                QUALIFICATION PIPELINE
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold">Supplier fit — not supplier truth</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
                A supplier appearing here means it is in the qualification queue. It does not mean an account,
                SKU, price, stock level or API entitlement has been proven.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {qualifying.map((supplier) => (
              <article key={supplier.providerId} className="rounded-2xl border border-border bg-bone p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-bold">{supplier.displayName}</h3>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted">{supplier.lane}</p>
                  </div>
                  <span className="badge bg-indigo-accent/10 text-indigo-dark">
                    #{supplier.priority ?? "—"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="badge bg-surface text-muted">{supplier.qualificationState}</span>
                  <span className="badge bg-surface text-muted">{supplier.apiEntitlementState}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted">{supplier.notes[0]}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-10 border-t border-border py-8 text-xs leading-6 text-muted">
          Supplier Lab R0 contains no checkout, no supplier credentials, no live inventory,
          no external order path and no claim of supplier availability.
        </footer>
      </div>
    </main>
  );
}

function CandidateSection({
  eyebrow,
  title,
  copy,
  candidates,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  candidates: readonly (typeof SUPPLIER_LAB_CANDIDATES)[number][];
}) {
  return (
    <section className="mt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-3xl font-bold">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{copy}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {candidates.map((candidate, index) => (
          <article
            key={candidate.id}
            className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <div className="relative flex aspect-[4/3] items-end overflow-hidden bg-gradient-to-br from-gray-950 via-gray-800 to-indigo-950 p-5 text-white">
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, #818CF8 0%, transparent 34%), radial-gradient(circle at 80% 80%, #6366F1 0%, transparent 36%)",
              }} />
              <div className="relative">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Concept {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 font-display text-xl font-bold">{candidate.category}</p>
              </div>
            </div>

            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                <span className="badge bg-amber-50 text-amber-700">NOT FOR SALE</span>
                <span className="badge bg-surface-hover text-muted">{candidate.truthState}</span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{candidate.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{candidate.concept}</p>

              <div className="mt-5 rounded-2xl bg-bone p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Internal target retail
                </p>
                <p className="mt-1 font-display text-xl font-bold">
                  {money(candidate.targetRetailCents.min)}–{money(candidate.targetRetailCents.max)}
                </p>
                <p className="mt-1 text-xs text-muted">Planning target only — not a customer price.</p>
              </div>

              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Supplier-fit hypotheses
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate.supplierFit.map((supplier) => (
                    <span key={supplier} className="badge bg-indigo-accent/10 text-indigo-dark">
                      {supplier}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-muted">Supplier binding: UNBOUND</p>
                <p className="mt-1 text-xs text-muted">Stock / landed cost / delivery: UNKNOWN</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SafetyBanner() {
  return (
    <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <p className="text-xs font-bold uppercase tracking-[0.18em]">Truth boundary</p>
      <p className="mt-2 text-sm leading-6">
        This shelf is a merchandising/proving surface. Nothing here represents current supplier stock,
        current wholesale pricing, current shipping cost or a sellable Norvana listing. Those facts remain
        UNKNOWN until a qualified read-only supplier adapter proves them.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-white/40">{label}</p>
      <p className="mt-2 font-display text-xl font-bold">{value}</p>
    </div>
  );
}
