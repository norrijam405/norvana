import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionConfigured,
  verifyCurrentAdminSessionToken,
} from "@/lib/admin-session";
import { WatchtowerNav } from "@/components/admin/watchtower-nav";

export const dynamic = "force-dynamic";

const DOMAIN_CANDIDATES = [
  {
    domain: "acreera.com",
    status: "AVAILABLE WHEN CHECKED",
    price: "$11.25 first year / $11.25 renewal",
    note: "Best brand match. Re-check availability immediately before purchase.",
    recommendation: "TOP PICK",
  },
  {
    domain: "shopacreera.com",
    status: "AVAILABLE WHEN CHECKED",
    price: "$11.25 first year / $11.25 renewal",
    note: "Good fallback if the exact-match domain disappears.",
    recommendation: "BACKUP",
  },
  {
    domain: "acreera.shop",
    status: "AVAILABLE WHEN CHECKED",
    price: "$2.99 first year / $38.39 renewal",
    note: "Cheap first year but meaningfully higher renewal; weaker than the .com for the main brand.",
    recommendation: "SECONDARY",
  },
];

export default async function LaunchReadinessPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) redirect("/admin/login");

  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const pixabayConfigured = Boolean(process.env.PIXABAY_API_KEY);
  const databaseConfigured = Boolean(process.env.DATABASE_URL);
  const sessionConfigured = Boolean(process.env.NORVANA_ADMIN_SESSION_SECRET);
  const workerSecretConfigured = Boolean(process.env.NORVANA_WATCHTOWER_WORKER_SECRET);
  const cronSecretConfigured = Boolean(process.env.NORVANA_WATCHTOWER_CRON_SECRET);
  const producerIntakeEnabled = process.env.PRODUCER_INTEREST_INTAKE_ENABLED === "true";
  const producerNotesEnabled =
    process.env.PRODUCER_CONVERSATION_PERSISTENCE_ENABLED === "true";
  const externalFulfillmentEnabled =
    process.env.NORVANA_EXTERNAL_FULFILLMENT_ENABLED === "true";
  const supplierConnectorsEnabled =
    process.env.NORVANA_SUPPLIER_CONNECTORS_ENABLED === "true";
  const executorEnabled =
    process.env.NORVANA_WATCHTOWER_EXECUTOR_ENABLED === "true";

  const gates = [
    {
      title: "Owner authentication",
      state: sessionConfigured ? "READY" : "BLOCKED",
      detail: sessionConfigured
        ? "Signed Watchtower sessions are configured."
        : "Watchtower session secret is missing.",
      href: "/admin/account",
      action: "Open owner account",
    },
    {
      title: "Database connection",
      state: databaseConfigured ? "CONNECTED" : "BLOCKED",
      detail: databaseConfigured
        ? "A database target exists. Production migrations still need deliberate verification before intake/history gates are opened."
        : "DATABASE_URL is missing.",
      href: "/admin/system-health",
      action: "Open Advanced",
    },
    {
      title: "Payments",
      state: stripeConfigured ? "CONFIGURED" : "NEEDS CREDENTIALS",
      detail: stripeConfigured
        ? "Stripe secret is present in this deployment."
        : "No STRIPE_SECRET_KEY is visible to this deployment yet. Real checkout should not launch without a payment smoke test.",
      href: "/admin/connections",
      action: "Open Connections",
    },
    {
      title: "Media",
      state: pixabayConfigured ? "READY" : "NEEDS CREDENTIALS",
      detail: pixabayConfigured
        ? "Pixabay media discovery is configured."
        : "Pixabay key is missing.",
      href: "/admin/connections",
      action: "Open Connections",
    },
    {
      title: "Watchtower runtime",
      state:
        workerSecretConfigured && cronSecretConfigured ? "PREPARED" : "NEEDS SETUP",
      detail:
        workerSecretConfigured && cronSecretConfigured
          ? "Worker and scheduler secrets are present; executor stays separately gated."
          : "Watchtower worker/scheduler credentials are incomplete.",
      href: "/admin/system-health",
      action: "Open Advanced",
    },
    {
      title: "Farm submissions",
      state: producerIntakeEnabled ? "LIVE" : "DEMO MODE",
      detail: producerIntakeEnabled
        ? "Producer interest submissions can persist."
        : "The public form is visible but intentionally fail-closed until its Production migration is approved.",
      href: "/growers#interest",
      action: "View form",
    },
    {
      title: "Farm conversation history",
      state: producerNotesEnabled ? "LIVE" : "DEVICE DRAFTS",
      detail: producerNotesEnabled
        ? "Watchtower can bank append-only producer conversations."
        : "The notebook works, but durable server history remains locked.",
      href: "/admin/producers",
      action: "Open Farms + Producers",
    },
    {
      title: "Supplier connectors",
      state: supplierConnectorsEnabled ? "ENABLED" : "LOCKED",
      detail: supplierConnectorsEnabled
        ? "Qualified supplier connectors are enabled."
        : "Supplier execution remains locked until at least one source is credentialed and tested.",
      href: "/admin/suppliers",
      action: "Open supplier access board",
    },
    {
      title: "External fulfillment",
      state: externalFulfillmentEnabled ? "ENABLED" : "LOCKED",
      detail: externalFulfillmentEnabled
        ? "External fulfillment actions are enabled."
        : "Courier/fulfillment actions remain locked until a qualified delivery provider is connected and tested.",
      href: "/admin/orders",
      action: "Open Orders + Delivery",
    },
    {
      title: "Watchtower ACT",
      state: executorEnabled ? "ENABLED" : "LOCKED",
      detail: executorEnabled
        ? "Executor is enabled. Confirm authority boundaries before live traffic."
        : "Watchtower can observe/recommend while consequential execution stays locked.",
      href: "/admin/system-health",
      action: "Open Advanced",
    },
  ];

  const blocked = gates.filter((gate) =>
    ["BLOCKED", "NEEDS CREDENTIALS", "NEEDS SETUP"].includes(gate.state)
  ).length;
  const locked = gates.filter((gate) =>
    ["LOCKED", "DEMO MODE", "DEVICE DRAFTS"].includes(gate.state)
  ).length;

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/launch" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_18%,rgba(232,198,138,.13),transparent_25rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Launch Readiness</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
            What is stopping us from going live?
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            One owner view for domain, database, payments, suppliers, fulfillment, Watchtower, producer intake, and the final controlled Production release.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Hard blockers</p>
              <p className="mt-2 font-display text-3xl font-bold">{blocked}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Deliberate locks</p>
              <p className="mt-2 font-display text-3xl font-bold">{locked}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">Release posture</p>
              <p className="mt-2 text-sm font-semibold text-amber-100">CONTROLLED PREVIEW</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 lg:grid-cols-2">
          {gates.map((gate) => (
            <article key={gate.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-display text-xl font-bold">{gate.title}</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/50">
                  {gate.state}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/50">{gate.detail}</p>
              <Link href={gate.href} className="mt-4 inline-flex text-sm font-semibold text-indigo-200 underline underline-offset-4">
                {gate.action} →
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Domain shortlist</p>
          <h2 className="mt-2 font-display text-3xl font-black">Acre Era deserves its own front door.</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
            These prices/availability were checked through the registrar on October 5, 2026 and can change at any time. Re-check immediately before purchase.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {DOMAIN_CANDIDATES.map((item) => (
              <article key={item.domain} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-wheat">{item.recommendation}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{item.domain}</h3>
                <p className="mt-2 text-xs text-emerald-200">{item.status}</p>
                <p className="mt-3 text-sm font-semibold text-white/75">{item.price}</p>
                <p className="mt-3 text-xs leading-5 text-white/40">{item.note}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
