import Link from "next/link";
import { Footer } from "@/components/footer";
import { JourneyHero } from "@/components/acre-era/journey-hero";

const DROP_WORLDS = [
  {
    profile: "organic",
    title: "Fresh living",
    copy: "Market, family, home, pets, seasonal food, and everyday routines with warmer, grounded presentation.",
    tone: "bg-[#e8e9d9] text-soil",
  },
  {
    profile: "kinetic",
    title: "Movement + style",
    copy: "Sports, streetwear, performance, creator culture, and fast-moving seasonal moments.",
    tone: "bg-[#c7783e] text-cream",
  },
  {
    profile: "cinematic",
    title: "Premium + editorial",
    copy: "Luxury, accessories, special releases, craftsmanship, fashion, and elevated storytelling.",
    tone: "bg-[#25271f] text-cream",
  },
  {
    profile: "precision",
    title: "Tech + creator",
    copy: "Electronics, gaming, workspaces, devices, and clean technical presentation.",
    tone: "bg-[#eef0e7] text-soil",
  },
];

export default function EraDropsPage() {
  return (
    <>
      <main className="bg-bone text-soil">
        <JourneyHero
          variant="drops"
          eyebrow="Acre Era Drops · limited moments · changing worlds"
          title="The store changes"
          accent="with the moment."
          copy="Era Drops are curated worlds built around what people are actually interested in now — from seasonal food and family life to premium fashion, sports, tech, and special finds."
          primaryHref="#drop-worlds"
          primaryLabel="Explore the worlds"
          secondaryHref="/archive"
          secondaryLabel="Visit the Archive"
        />

        <section id="drop-worlds" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-4 md:grid-cols-2">
            {DROP_WORLDS.map((world) => (
              <article key={world.profile} className={"min-h-[22rem] rounded-[2rem] p-7 md:p-9 " + world.tone}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">{world.profile}</p>
                <h2 className="mt-4 max-w-md font-display text-4xl font-black tracking-[-0.035em]">{world.title}</h2>
                <p className="mt-4 max-w-md text-sm leading-7 opacity-75">{world.copy}</p>
                <div className="mt-12 h-px w-full bg-current opacity-15" />
                <p className="mt-5 text-xs uppercase tracking-[0.16em] opacity-60">
                  Same Acre Era · different world
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-soil/10 bg-cream">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_.85fr] lg:px-8 lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">How it should feel</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
                Like driving from the country into the city without ever leaving the brand.
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted">
                A farm-led Era can feel warm and grounded. A premium bag or sneaker drop can feel darker and more editorial. A tech Era can feel precise. The visual mood changes, but navigation, trust, and shopping behavior remain familiar.
              </p>
            </div>
            <div className="rounded-[2rem] bg-soil p-7 text-cream md:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">What does not change</p>
              <div className="mt-6 space-y-4">
                {[
                  "Clear seller and checkout responsibility",
                  "Useful delivery expectations",
                  "No fake inventory or made-up partner claims",
                  "Plain customer language",
                  "Products selected because they fit the moment",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-cream/10 bg-cream/5 px-4 py-3 text-sm text-cream/80">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="rounded-[2rem] bg-gradient-to-br from-[#3f4636] via-[#5b5547] to-[#302d29] p-8 text-cream md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Between drops</p>
            <h2 className="mt-3 max-w-3xl font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
              Everyday shopping keeps moving even when the spotlight changes.
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-cream/70">
              Era Drops are discovery. Goods and Market are repeat life. They are meant to strengthen each other, not compete for attention.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary !bg-wheat !text-soil">Shop Goods</Link>
              <Link href="/market" className="btn-ghost-light">Visit Market</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
