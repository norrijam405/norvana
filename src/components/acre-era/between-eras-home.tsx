import Link from "next/link";
import { Footer } from "@/components/footer";
import { JourneyHero } from "@/components/acre-era/journey-hero";

const WORLDS = [
  {
    eyebrow: "Market",
    title: "Fresh food. Real people.",
    copy: "Seasonal produce, local makers, and everyday food from sources we can explain.",
    href: "/market",
    cta: "Shop Market",
    className: "from-[#33412f] via-[#536643] to-[#8f7c55]",
    icon: "🥕",
  },
  {
    eyebrow: "Goods",
    title: "Everyday, elevated.",
    copy: "Pets, family, beauty, home, tech, basics, and useful things worth coming back for.",
    href: "/shop",
    cta: "Shop Goods",
    className: "from-[#4f4638] via-[#705b43] to-[#a6875e]",
    icon: "🧺",
  },
  {
    eyebrow: "Partner Finds",
    title: "Brands we believe belong.",
    copy: "Curated finds from outside Acre Era when the product, source, and buying path make sense.",
    href: "/partners",
    cta: "Explore Partners",
    className: "from-[#303632] via-[#48554a] to-[#7a806e]",
    icon: "👟",
  },
  {
    eyebrow: "Era Drops",
    title: "Limited drops. Lasting stories.",
    copy: "Moments, collections, and premium finds shaped around culture, season, place, and demand.",
    href: "/era-drops",
    cta: "See Era Drops",
    className: "from-[#211f1b] via-[#493b31] to-[#8d6b4d]",
    icon: "👜",
  },
];

const IMPACT_NOTES = [
  ["Small share, big responsibility", "Farmers and producers often carry weather, labor, spoilage, and input risk long before a product reaches a shelf."],
  ["Distance changes the math", "Transport, packaging, handling, and failed delivery can erase the advantage of a low product cost."],
  ["Local only works if it works", "A shorter supply chain still has to be dependable, affordable, and worth repeating for the customer and producer."],
];

export function BetweenErasHome() {
  return (
    <>
      <main className="bg-bone text-soil">
        <JourneyHero
          eyebrow="Fresh living · premium finds · everyday goods · curated Eras"
          title="From open roads"
          accent="to city lights."
          copy="Acre Era is one shopping world for fresh food, useful everyday goods, premium finds, and rotating experiences — connected by people, place, and what customers actually want."
          primaryHref="/shop"
          primaryLabel="Explore Acre Era"
          secondaryHref="/market"
          secondaryLabel="Visit Market"
        />

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {WORLDS.map((world) => (
              <Link
                key={world.eyebrow}
                href={world.href}
                className={"group relative min-h-[21rem] overflow-hidden rounded-[1.8rem] bg-gradient-to-br p-6 text-cream shadow-sm transition hover:-translate-y-1 hover:shadow-xl " + world.className}
              >
                <div className="absolute -right-8 -top-8 text-[9rem] opacity-10 transition group-hover:scale-110">
                  {world.icon}
                </div>
                <div className="relative flex h-full flex-col">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-wheat">{world.eyebrow}</p>
                  <h2 className="mt-3 font-display text-3xl font-black leading-[.96]">{world.title}</h2>
                  <p className="mt-4 max-w-xs text-sm leading-6 text-cream/72">{world.copy}</p>
                  <span className="mt-auto inline-flex w-fit rounded-full bg-wheat px-4 py-2 text-sm font-semibold text-soil">
                    {world.cta} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-soil/10 bg-cream">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8 lg:py-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">One world, not two</p>
              <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
                Country roots and city ambition can belong on the same shelf.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
                Someone buying tomatoes today might be shopping for dog food tomorrow, $180 shoes next month, or a premium bag later. Acre Era should understand the whole customer without making fresh food feel cheap or premium shopping feel disconnected from real life.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/shop" className="btn-primary">Browse Goods</Link>
                <Link href="/partners" className="btn-secondary">Partner Finds</Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {IMPACT_NOTES.map(([title, copy]) => (
                <article key={title} className="rounded-[1.5rem] border border-soil/10 bg-bone p-5">
                  <div className="h-1 w-12 rounded-full bg-wheat" />
                  <h3 className="mt-4 font-display text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="era-drop" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="overflow-hidden rounded-[2.2rem] bg-soil text-cream">
            <div className="grid gap-0 lg:grid-cols-[1fr_.8fr]">
              <div className="p-8 md:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Era Drops</p>
                <h2 className="mt-3 max-w-2xl font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
                  The store changes with the moment. The brand stays Acre Era.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-cream/70">
                  A summer road-trip Era can feel kinetic. A premium accessories Era can feel cinematic. A family reset can feel warm and practical. Different world, same spine.
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
