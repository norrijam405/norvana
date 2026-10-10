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

const CREDENTIALS = [
  {
    title: "Legal business",
    state: "AVAILABLE",
    detail: "Norris James Data, LLC is the legal entity used for supplier, distributor, affiliate, and reseller applications.",
    sensitive: false,
  },
  {
    title: "Federal EIN / Tax ID",
    state: "AVAILABLE",
    detail: "Owner confirmed the company has a Federal EIN / Tax ID. Watchtower never displays or stores the number on this page.",
    sensitive: true,
  },
  {
    title: "Sales permit",
    state: "AVAILABLE",
    detail: "Owner confirmed an active sales permit. Verify issuing state and expiration / renewal requirements before submitting supplier applications.",
    sensitive: true,
  },
  {
    title: "Resale certificate",
    state: "VERIFY / PREPARE",
    detail: "Confirm whether the existing sales permit paperwork includes the resale certificate required by each distributor and ship-to jurisdiction.",
    sensitive: true,
  },
  {
    title: "W-9",
    state: "PREPARE",
    detail: "Keep a current signed W-9 ready for distributors that require federal tax documentation.",
    sensitive: true,
  },
  {
    title: "Acre Era trade name / DBA",
    state: "VERIFY",
    detail: "Use Acre Era as the customer-facing brand. Do not claim a formally registered DBA unless registration has actually been completed.",
    sensitive: false,
  },
  {
    title: "Business address + contact",
    state: "VERIFY",
    detail: "Keep the legal business address, business email, and business phone consistent across applications.",
    sensitive: true,
  },
  {
    title: "Bank reference",
    state: "OPTIONAL / LATER",
    detail: "Some wholesale credit applications may request banking information. Only provide it directly to the verified distributor when necessary.",
    sensitive: true,
  },
  {
    title: "Trade references",
    state: "OPTIONAL / LATER",
    detail: "Some distributors may ask for supplier or vendor references when extending terms. Cash / card accounts often require less.",
    sensitive: true,
  },
];

const APPLICATION_PACKS = [
  {
    name: "Petra Industries",
    requirements: ["Legal business", "EIN / Tax ID", "W-9", "Sales permit / resale certificate", "Business contact"],
  },
  {
    name: "D&H Distributing",
    requirements: ["Legal business", "Federal ID", "Tax exemption / resale documentation", "Owner / officer information"],
  },
  {
    name: "Ingram Micro",
    requirements: ["Legal business", "Trade name / DBA if used", "Sales registration", "Resale certificate", "Business contact"],
  },
  {
    name: "CWR Wholesale",
    requirements: ["Dealer application", "Business identity", "Resale documentation", "Shipping / billing contact"],
  },
];

export default async function BusinessCredentialsPage() {
  if (!adminSessionConfigured()) redirect("/admin");
  const cookieStore = await cookies();
  const session = await verifyCurrentAdminSessionToken(
    cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  );
  if (!session) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-[#0d0f0c] text-white">
      <WatchtowerNav current="/admin/credentials" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_82%_18%,rgba(232,198,138,.12),transparent_24rem),linear-gradient(135deg,#171916,#0d0f0c)] p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Business Credentials</p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-[-0.04em] md:text-6xl">
            One application pack for every serious supplier.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55 md:text-base">
            This page tracks what Norris James Data, LLC already has and what still needs preparation before Acre Era applies to distributors, affiliate networks, and wholesale programs. Sensitive numbers are intentionally never displayed here.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/admin/affiliates" className="rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white">
              Open Partner Hub
            </Link>
            <Link href="/admin/suppliers" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70">
              Open Brands + Suppliers
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CREDENTIALS.map((item) => (
            <article key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-xl font-bold">{item.title}</h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/55">
                  {item.state}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/50">{item.detail}</p>
              {item.sensitive ? (
                <p className="mt-4 text-[10px] uppercase tracking-[0.14em] text-amber-200/70">
                  Private document — never expose on storefront
                </p>
              ) : null}
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">Application packs</p>
          <h2 className="mt-2 font-display text-3xl font-black">What the big distributors are likely to ask for.</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {APPLICATION_PACKS.map((pack) => (
              <article key={pack.name} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <h3 className="font-display text-xl font-bold">{pack.name}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {pack.requirements.map((requirement) => (
                    <span key={requirement} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                      {requirement}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-amber-300/15 bg-amber-300/[0.05] p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">Document handling rule</p>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-amber-50/75">
            Watchtower should track whether a credential exists, its issuing jurisdiction, expiration, and which supplier needs it. Actual EINs, tax IDs, bank details, signed tax forms, and permit numbers should remain in a protected document store or be uploaded directly to the verified supplier portal — never embedded in source code or shown on the public Acre Era site.
          </p>
        </section>
      </div>
    </main>
  );
}
