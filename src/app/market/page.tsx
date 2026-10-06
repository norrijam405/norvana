import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { marketRequests, products } from "@/db/schema";
import { FarmLifeStory } from "@/components/acre-era/farm-life-story";
import { BringItHere } from "@/components/acre-era/bring-it-here";
import { JourneyHero } from "@/components/acre-era/journey-hero";
import { Footer } from "@/components/footer";

export const dynamic = "force-dynamic";

const MARKET_NICHES = ["grocery", "food", "garden", "wellness"];

const PRODUCT_EMOJIS: Record<string, string> = {
  grocery: "🥕",
  food: "🍎",
  garden: "🌿",
  wellness: "🌾",
};

const PREVIEW_FARM_MEDIA =
  process.env.VERCEL_ENV === "preview"
    ? {
        videoUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.mp4",
        posterUrl: "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.jpg",
      }
    : { videoUrl: null, posterUrl: null };

export default async function MarketPage() {
  let marketProducts: typeof products.$inferSelect[] = [];
  let requests: Array<{
    title: string;
    category: string;
    requestCount: number;
    status: string;
  }> = [];

  try {
    marketProducts = await db
      .select()
      .from(products)
      .where(
        inArray(products.niche, MARKET_NICHES)
      )
      .orderBy(desc(products.rating))
      .limit(12);

    requests = await db
      .select({
        title: marketRequests.title,
        category: marketRequests.category,
        requestCount: marketRequests.requestCount,
        status: marketRequests.status,
      })
      .from(marketRequests)
      .orderBy(desc(marketRequests.requestCount))
      .limit(8);
  } catch {
    // The preview may be running before the Acre Era migration is applied.
  }

  const activeMarketProducts = marketProducts.filter((product) => product.status === "active");

  return (
    <>
      <main>
        <JourneyHero
          variant="market"
          eyebrow="Local farms · independent makers · everyday food"
          title="Fresh food. Local stories."
          accent="From field to front door."
          copy="Acre Era Market connects seasonal food, local producers, useful everyday staples, and the roads that carry them into real life."
          primaryHref="#market-shelf"
          primaryLabel="Explore the Market"
          secondaryHref="/growers"
          secondaryLabel="For Growers"
        />

        <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
          <FarmLifeStory
            videoUrl={PREVIEW_FARM_MEDIA.videoUrl}
            posterUrl={PREVIEW_FARM_MEDIA.posterUrl}
          />

          <section className="rounded-[2rem] border border-soil/10 bg-cream p-6 md:p-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Behind the shelf</p>
                <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Food has people behind it.</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-muted">
                Market can give small operators a little room to be seen without turning the page into a documentary.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["🌾", "Growers", "Weather, harvest timing, labor, seasonality, and the daily work behind what looks simple on a shelf."],
                ["🥩", "Butchers + meat shops", "Cuts, sourcing, cold-chain handling, prep, and the people keeping local meat moving safely."],
                ["🍇", "Wineries + vineyards", "Land, seasons, fermentation, hospitality, and the small businesses built around place."],
                ["🥖", "Bakers + makers", "Early mornings, small batches, neighborhood demand, and the craft behind everyday food."],
              ].map(([icon, title, copy]) => (
                <article key={title} className="rounded-2xl bg-bone p-5">
                  <div className="text-3xl">{icon}</div>
                  <h3 className="mt-3 font-display text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">{copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="market-shelf">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Market shelf</p>
                <h2 className="mt-2 font-display text-3xl font-bold md:text-5xl">Fresh + useful.</h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-muted">
                Fresh produce, pantry staples, local makers, and useful food-world finds can live together here. We keep source and availability clear without turning shopping into a technical report.
              </p>
            </div>

            {activeMarketProducts.length ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeMarketProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={"/shop/" + product.slug}
                    className="group rounded-[1.5rem] border border-soil/10 bg-cream p-4 transition hover:-translate-y-1 hover:border-leaf/30"
                  >
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[1.1rem] bg-sage-wash text-6xl">
                      <div className="absolute inset-0 acre-contours opacity-25" />
                      <span className="relative">{PRODUCT_EMOJIS[product.niche] || "🧺"}</span>
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-leaf">
                      {product.niche}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold">{product.name}</h3>
                    <p className="mt-2 text-sm text-muted">{"$"}{product.price.toFixed(2)}</p>
                    <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.14em]">
                      See its passport →
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-[1.5rem] border border-dashed border-soil/20 bg-cream p-8">
                <h3 className="font-display text-xl font-bold">Market inventory is not published yet.</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                  We are building this shelf from real availability instead of filling it with placeholders. As farms, makers, and food partners are ready, their products will appear here.
                </p>
              </div>
            )}
          </section>

          {requests.length ? (
            <section id="local" className="rounded-[2rem] bg-sage-wash p-7 md:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Community demand</p>
              <h2 className="mt-2 font-display text-3xl font-bold">What shoppers want brought here.</h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {requests.map((request) => (
                  <div key={request.category + request.title} className="rounded-2xl bg-cream p-5">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">{request.category}</p>
                    <h3 className="mt-2 font-semibold">{request.title}</h3>
                    <p className="mt-3 text-sm text-leaf">{request.requestCount} demand signal{request.requestCount === 1 ? "" : "s"}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <BringItHere />

          <section id="farm-facts" className="rounded-[2rem] bg-soil p-7 text-cream md:p-10">
            <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Farm facts + real pressure</p>
                <h2 className="mt-3 font-display text-3xl font-black md:text-4xl">
                  The food looks simple on the shelf. The work behind it is not.
                </h2>
                <p className="mt-4 text-sm leading-7 text-cream/70">
                  Acre Era does not need to turn shopping into a lecture, but we do want customers to understand why reliable local supply is hard and why a fair delivery model matters.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Weather + timing", "Growers carry weather, harvest timing, labor, and spoilage risk before a customer ever sees the product."],
                  ["Transport matters", "A low product cost can disappear fast once packaging, handling, distance, and failed delivery are added."],
                  ["Small pilots help", "Starting with predictable pickup days and grouped routes can be safer than promising unlimited on-demand delivery."],
                ].map(([title, copy]) => (
                  <article key={title} className="rounded-2xl border border-cream/10 bg-cream/5 p-5">
                    <h3 className="font-display text-lg font-bold text-wheat">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-cream/70">{copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-soil/10 bg-cream p-7 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">For growers + local businesses</p>
            <div className="mt-3 grid gap-8 md:grid-cols-[1fr_.8fr]">
              <div>
                <h2 className="font-display text-3xl font-bold">A storefront should tell more than a SKU.</h2>
                <p className="mt-4 text-sm leading-6 text-muted">
                  Acre Era can give growers and local producers a place to show what they make, what is in season, where they serve, and how customers can actually get it. We would rather start with a small pilot and learn the real demand and delivery costs than overpromise.
                </p>
              </div>
              <div className="grid gap-3">
                {["Story + origin", "Seasonal availability", "Pickup / delivery options", "Wholesale readiness", "Start with a small pilot"].map((item) => (
                  <div key={item} className="rounded-xl bg-sage-wash px-4 py-3 text-sm font-medium">{item}</div>
                ))}
                <Link href="/growers" className="btn-primary mt-2 text-center">For growers + producers</Link>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
