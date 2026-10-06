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

        <section className="mx-auto max-w-7xl px-4 pb-14 pt-4 sm:px-6 lg:px-8 lg:pb-20">
          <div className="grid gap-4 overflow-hidden rounded-[2rem] bg-soil p-6 text-cream md:grid-cols-[1.2fr_.8fr] md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">What&apos;s happening now</p>
              <h2 className="mt-3 font-display text-3xl font-black tracking-[-0.03em] md:text-4xl">
                See the current Era, local spotlights, what shoppers are asking for, and what Acre Era is paying attention to.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-cream/68">
                This is where the store feels alive — not another explanation of how we designed it.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-3">
              <Link href="/era-drops" className="btn-primary !bg-wheat !text-soil text-center">
                Enter the Eras
              </Link>
              <Link href="/market" className="btn-ghost-light text-center">
                Meet the people behind Market
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
