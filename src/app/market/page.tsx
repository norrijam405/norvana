import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { marketRequests, products } from "@/db/schema";
import { FarmLifeStory } from "@/components/acre-era/farm-life-story";
import { BringItHere } from "@/components/acre-era/bring-it-here";
import { EvolvingField } from "@/components/acre-era/evolving-field";
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
        <section className="relative isolate overflow-hidden bg-leaf text-cream">
          <EvolvingField />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-wheat">
              Acre Era Market
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-black leading-[.96] md:text-7xl">
              Fresh should feel connected to where it came from.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-cream/75 md:text-lg">
              This is the farm-and-grocery side of Acre Era: seasonal food, local growers, makers, and useful context without pretending every item is local when it is not.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
          <FarmLifeStory
            videoUrl={PREVIEW_FARM_MEDIA.videoUrl}
            posterUrl={PREVIEW_FARM_MEDIA.posterUrl}
          />

          <section>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">Market shelf</p>
                <h2 className="mt-2 font-display text-3xl font-bold md:text-5xl">Fresh + useful.</h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-muted">
                Only active catalog items in food, grocery, garden, or wellness lanes appear here. Local-source claims require separate evidence.
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
                  That is intentional. The page will not manufacture local-farm claims or demo inventory. Use Bring It Here below to create real demand evidence while partner sourcing is qualified.
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
