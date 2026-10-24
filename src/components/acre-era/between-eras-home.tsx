import Link from "next/link";
import { Footer } from "@/components/footer";
import { AcreEraHomeJourney } from "@/components/acre-era/acre-era-home-journey";

const departments = [
  { number: "01", name: "Everyday goods", detail: "Home, personal care, pets and useful essentials.", href: "/shop", action: "Explore goods", tone: "bg-[#ebe7de]" },
  { number: "02", name: "Market & makers", detail: "Discover producers and the people behind the products.", href: "/market", action: "Explore market", tone: "bg-[#e4e9df]" },
  { number: "03", name: "Selected finds", detail: "Discover distinctive brands and partner collections.", href: "/partners", action: "Explore finds", tone: "bg-[#e6e0db]" },
];

export function BetweenErasHome() {
  return (
    <>
      <main className="bg-bone text-soil">
        <AcreEraHomeJourney showPreviewProducts={false} />
        <section className="border-b border-soil/10 bg-cream">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-leaf">The Acre Era edit</p>
              <p className="mt-1 font-display text-xl font-semibold tracking-tight md:text-2xl">Useful things. Good discoveries. One considered place.</p>
            </div>
            <Link href="/shop" className="inline-flex min-h-11 items-center justify-center rounded-full border border-soil/25 px-6 text-sm font-semibold transition hover:bg-soil hover:text-cream">Browse the shop →</Link>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-leaf">Explore the store</p>
              <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-[-.04em] sm:text-5xl">Find your next good thing.</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-muted">Browse by what matters to you today. Availability and purchase options are shown on each product listing.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {departments.map((department) => (
              <Link href={department.href} key={department.number} className={department.tone + " group flex min-h-[18rem] flex-col justify-between rounded-[1.6rem] border border-soil/10 p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8"}>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-xs text-soil/45">{department.number} / 03</span>
                  <span aria-hidden="true" className="text-2xl text-soil/50 transition group-hover:translate-x-1">↗</span>
                </div>
                <div>
                  <h3 className="font-display text-3xl font-semibold tracking-[-.035em]">{department.name}</h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-soil/65">{department.detail}</p>
                  <span className="mt-6 inline-block border-b border-soil/40 pb-1 text-sm font-semibold">{department.action}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
        <section className="bg-[#20281f] text-cream">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-[1.15fr_.85fr] md:items-end lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-wheat">A different way to discover</p>
              <h2 className="mt-4 max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-[-.035em] sm:text-5xl">A little more intentional. A lot less clutter.</h2>
            </div>
            <div>
              <p className="text-sm leading-7 text-cream/70">We're building a store where products earn their place. See what is available, who handles your order and where checkout happens before you decide.</p>
              <Link href="/how-it-works" className="mt-6 inline-flex min-h-11 items-center border-b border-wheat pb-1 text-sm font-semibold text-wheat">How Acre Era works →</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
