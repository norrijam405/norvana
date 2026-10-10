import Link from "next/link";
import { Footer } from "@/components/footer";
import { HOME_PREVIEW_PRODUCTS } from "@/lib/acre-era/preview-products";
import { AcreEraHomeJourney } from "@/components/acre-era/acre-era-home-journey";

export function BetweenErasHome() {
  return (
    <>
      <main className="bg-bone text-soil">
        <AcreEraHomeJourney showPreviewProducts={process.env.VERCEL_ENV === "preview"} />

        <section className="border-b border-soil/10 bg-cream">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 md:grid-cols-[.72fr_1.28fr] md:items-center lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">What Acre Era is</p>
            <p className="max-w-4xl font-display text-2xl font-bold leading-tight tracking-[-0.025em] md:text-3xl">
              One place for fresh food, everyday goods, premium finds, and changing Eras — built so the store can move with real life instead of forcing every shopper into one lane.
            </p>
          </div>
        </section>

        {process.env.VERCEL_ENV === "preview" ? (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Shop Acre Era</p>
                <h2 className="mt-3 max-w-3xl font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
                  From the grocery run to the night out.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                  The shelf can move from produce and pet care to beauty, tech, sneakers, and premium pieces without making you feel like you left the store.
                </p>
              </div>
              <Link href="/shop" className="btn-secondary">See the full Preview Shelf</Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HOME_PREVIEW_PRODUCTS.slice(0, 4).map((product) => (
                <article key={product.id} className="overflow-hidden rounded-[1.6rem] border border-soil/10 bg-cream shadow-sm">
                  <div className={"flex aspect-[4/3] items-center justify-center bg-gradient-to-br " + product.accent}>
                    <div className="text-center text-cream">
                      <div className="text-6xl">{product.icon}</div>
                      <div className="mt-4 rounded-full border border-white/20 bg-black/15 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em]">
                        Preview concept
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-leaf">
                      {product.niche.replace("-", " ")}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold">{product.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{product.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-display text-lg font-bold">${product.price.toFixed(2)}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Not for sale</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-6 lg:grid-cols-[.82fr_1.18fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">More ways to shop one world</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
                Acre Era can go wider without pretending every item comes from the same shelf.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted lg:justify-self-end">
              Some products come directly through Acre Era, some come from local producers, and some are carefully selected from trusted retail and brand partners. We keep the buying path clear so you always know who owns checkout, shipping, returns, and warranty.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                eyebrow: "Goods Era",
                title: "Acre Era goods",
                copy: "Useful everyday products, electronics, home, pets, beauty, family, style, and more as real supply is qualified.",
                href: "/shop",
                cta: "Browse Goods Era",
              },
              {
                eyebrow: "Market Era",
                title: "Local + food",
                copy: "Farms, makers, butchers, bakers, wineries, and the people behind what lands on the table.",
                href: "/market",
                cta: "Enter Market Era",
              },
              {
                eyebrow: "Finds Era",
                title: "Trusted partner finds",
                copy: "Name-brand, premium, hard-to-find, and specialty products we can recommend without pretending Acre Era warehouses them.",
                href: "/partners",
                cta: "Explore Finds Era",
              },
            ].map((lane) => (
              <Link
                key={lane.title}
                href={lane.href}
                className="group rounded-[1.7rem] border border-soil/10 bg-cream p-6 transition hover:-translate-y-1 hover:border-leaf/25 hover:shadow-sm"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-leaf">{lane.eyebrow}</p>
                <h3 className="mt-3 font-display text-2xl font-bold">{lane.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{lane.copy}</p>
                <span className="mt-6 inline-flex text-sm font-semibold text-soil group-hover:text-leaf">{lane.cta} →</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-6 lg:px-8 lg:pb-20">
          <div className="grid gap-4 overflow-hidden rounded-[2rem] bg-soil p-6 text-cream md:grid-cols-[1.2fr_.8fr] md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">What&apos;s happening now</p>
              <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] md:text-4xl">
                See the current Era, local spotlights, what shoppers are asking for, and what Acre Era is paying attention to.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/68">
                Company updates, local stories, shopper ideas, community moments, and what is moving right now all land here.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-3">
              <Link href="/era-drops" className="btn-primary !bg-wheat !text-soil text-center">
                Open Era Drop
              </Link>
              <Link href="/market" className="btn-ghost-light text-center">
                Enter Market Era
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
