import Link from "next/link";
import { Footer } from "@/components/footer";
import { HOME_PREVIEW_PRODUCTS } from "@/lib/acre-era/preview-products";
import { AcreEraHomeJourney } from "@/components/acre-era/acre-era-home-journey";

export function BetweenErasHome() {
  return (
    <>
      <main className="bg-bone text-soil">
        <AcreEraHomeJourney showPreviewProducts={process.env.VERCEL_ENV === "preview"} />

        {process.env.VERCEL_ENV === "preview" ? (
          <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Shop the world</p>
                <h2 className="mt-3 max-w-3xl font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
                  Different lives. Same cart.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                  Fresh food, pets, family, beauty, tech, style, and premium finds can sit together when the experience gives each one room to feel like itself.
                </p>
              </div>
              <Link href="/shop" className="btn-secondary">See the full Preview Shelf</Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HOME_PREVIEW_PRODUCTS.slice(0, 6).map((product) => (
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

        <section id="era-drop" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="overflow-hidden rounded-[2.2rem] bg-soil text-cream">
            <div className="grid gap-0 lg:grid-cols-[1fr_.8fr]">
              <div className="p-8 md:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Era Drops</p>
                <h2 className="mt-3 max-w-2xl font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
                  The next world can feel completely different.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-cream/70">
                  Era Drops are where Acre Era gets more cinematic, seasonal, and limited — without changing the rest of the store into a costume.
                </p>
                <Link href="/era-drops" className="btn-primary mt-7 !bg-wheat !text-soil">
                  Explore Era Drops
                </Link>
              </div>
              <div className="grid grid-cols-2">
                {[
                  ["organic", "Market / Family"],
                  ["kinetic", "Sport / Style"],
                  ["cinematic", "Luxury / Editorial"],
                  ["precision", "Tech / Creator"],
                ].map(([profile, label]) => (
                  <div key={profile} className="flex min-h-40 flex-col justify-end border border-cream/10 bg-cream/5 p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-wheat">{profile}</p>
                    <p className="mt-2 font-display text-lg font-bold">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
