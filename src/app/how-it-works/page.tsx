import Link from "next/link";
import { Footer } from "@/components/footer";

const STEPS = [
  {
    number: "01",
    title: "Find what fits",
    copy: "Shop everyday goods, Market, Partner Finds, or a rotating Era. Different worlds share the same Acre Era navigation and shopping language.",
  },
  {
    number: "02",
    title: "Know who is selling it",
    copy: "Acre Era makes the buying route clear. Some products use Acre Era checkout; some qualified partner finds are purchased from the partner.",
  },
  {
    number: "03",
    title: "See the delivery expectation",
    copy: "Delivery timing should reflect the supplier, carrier, geography, and available evidence. We would rather show a realistic window than make a promise we cannot control.",
  },
  {
    number: "04",
    title: "Know who handles the after-sale",
    copy: "Returns, warranty, fulfillment, and customer support responsibilities should be clear before you buy — especially when checkout happens with a partner.",
  },
];

const PATHS = [
  {
    title: "Acre Era checkout",
    badge: "BUY HERE",
    copy: "Acre Era handles the checkout path shown on the product and tells you what fulfillment and return terms apply.",
  },
  {
    title: "Partner checkout",
    badge: "BUY FROM PARTNER",
    copy: "Acre Era helps you discover the product, but the partner handles payment and the responsibilities shown for that offer.",
  },
  {
    title: "Local / Market",
    badge: "LOCAL ROUTE",
    copy: "Pickup, scheduled delivery, community drop, or another practical local route may apply depending on the producer and product.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <main className="bg-bone text-soil">
        <section className="border-b border-soil/10 bg-soil text-cream">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-wheat">How Acre Era works</p>
            <h1 className="mt-4 max-w-5xl font-display text-5xl font-black leading-[.95] tracking-[-0.045em] md:text-7xl">
              One shopping world. Clear buying paths.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-cream/72 md:text-lg">
              Acre Era can carry fresh food, everyday basics, premium finds, and limited Eras without pretending every product comes from the same seller or travels the same way.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-4 md:grid-cols-2">
            {STEPS.map((step) => (
              <article key={step.number} className="rounded-[1.8rem] border border-soil/10 bg-cream p-7 shadow-sm md:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">{step.number}</p>
                <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em]">{step.title}</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-muted">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-soil/10 bg-cream">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Buying paths</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
                Premium does not have to mean confusing.
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted">
                Whether you are buying produce, dog supplies, sneakers, electronics, or a high-end bag, the page should tell you who is taking your money and who is responsible after checkout.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {PATHS.map((path) => (
                <article key={path.title} className="rounded-[1.6rem] border border-soil/10 bg-bone p-6">
                  <span className="rounded-full bg-sage-wash px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-leaf">
                    {path.badge}
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold">{path.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{path.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-[2rem] bg-soil p-8 text-cream md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">What Acre Era is trying to protect</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.035em]">
                Discovery should feel exciting. The buying details should feel boringly clear.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-cream/70">
                We want the video, story, Era, and product discovery to have personality. Seller identity, checkout responsibility, delivery expectations, returns, and warranty should be simple enough that nobody has to guess.
              </p>
            </div>

            <div className="rounded-[2rem] border border-soil/10 bg-cream p-8 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Where next?</p>
              <div className="mt-5 grid gap-3">
                <Link href="/shop" className="rounded-xl bg-bone px-4 py-3 text-sm font-semibold hover:bg-sage-wash">Browse Goods →</Link>
                <Link href="/market" className="rounded-xl bg-bone px-4 py-3 text-sm font-semibold hover:bg-sage-wash">Visit Market →</Link>
                <Link href="/partners" className="rounded-xl bg-bone px-4 py-3 text-sm font-semibold hover:bg-sage-wash">Explore Partner Finds →</Link>
                <Link href="/era-drops" className="rounded-xl bg-bone px-4 py-3 text-sm font-semibold hover:bg-sage-wash">See Era Drops →</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
