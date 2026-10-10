import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { IntelligenceWorkbench } from "@/components/admin/intelligence-workbench";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function IntelligenceAdminPage() {
  if (!adminSessionConfigured()) redirect("/admin");

  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-bone text-obsidian">
      <header className="sticky top-0 z-40 border-b border-border bg-bone/90 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-accent">
              Acre Era / Internal
            </p>
            <p className="font-display text-lg font-bold">Intelligence & Delivery</p>
          </div>
          <Link
            href="/admin"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface hover:text-obsidian"
          >
            Back to Watchtower
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-obsidian via-gray-900 to-obsidian p-7 text-white shadow-lg md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-light">
            Decision support only
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-5xl">
            Find demand. Protect margin. Deliver reliably.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65 md:text-base">
            This owner-only workspace evaluates opportunities, records farm and producer prospects,
            and searches candidate hero footage. It cannot publish products, contact partners,
            place orders, create shipments, issue refunds, or spend money.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {["Demand", "Darwin economics", "Delivery", "Producer intake", "Media discovery"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/65"
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <IntelligenceWorkbench />

        <p className="mt-8 text-xs leading-5 text-muted">
          Internal terminology and scores remain inside this owner workspace. Customer-facing Acre Era
          surfaces receive only plain shopping outcomes such as price, availability, seller, returns,
          and evidence-based delivery expectations.
        </p>
      </div>
    </main>
  );
}
