import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { marketRequests } from "@/db/schema";
import { Footer } from "@/components/footer";
import { JourneyHero } from "@/components/acre-era/journey-hero";
import { BringItHere } from "@/components/acre-era/bring-it-here";
import { resolveCurrentPublicEra } from "@/lib/era-engine/resolver";

export const dynamic = "force-dynamic";

const FARM_POSTER = "https://cdn.pixabay.com/video/2022/09/04/130226-746395325_medium.jpg";

export default async function EraDropsPage() {
  let requests: Array<{
    title: string;
    category: string;
    requestCount: number;
    status: string;
  }> = [];

  let currentEraName = "Between Eras";

  try {
    requests = await db
      .select({
        title: marketRequests.title,
        category: marketRequests.category,
        requestCount: marketRequests.requestCount,
        status: marketRequests.status,
      })
      .from(marketRequests)
      .orderBy(desc(marketRequests.requestCount), desc(marketRequests.updatedAt))
      .limit(8);
  } catch {}

  try {
    const resolved = await resolveCurrentPublicEra();
    if (resolved.ok && resolved.era) currentEraName = resolved.era.name;
  } catch {}

  const topRequest = requests[0] ?? null;

  return (
    <>
      <main className="bg-bone text-soil">
        <JourneyHero
          variant="drops"
          eyebrow="Acre Era · what is happening now"
          title="Step into the Era."
          accent="See what is moving."
          copy="The Era board is where Acre Era highlights what is happening, what shoppers are asking for, who we are paying attention to, and the people or places worth putting in the spotlight."
          primaryHref="#era-board"
          primaryLabel="Open the board"
          secondaryHref="/archive"
          secondaryLabel="Past Eras"
        />

        <section id="era-board" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.8rem] bg-soil p-6 text-cream md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wheat">Current Era</p>
              <h2 className="mt-3 font-display text-3xl font-black">{currentEraName}</h2>
              <p className="mt-4 text-sm leading-6 text-cream/65">
                When a new Era becomes active, this board changes with it while the rest of Acre Era keeps moving.
              </p>
            </article>

            <article className="rounded-[1.8rem] border border-soil/10 bg-cream p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">Most requested</p>
              <h2 className="mt-3 font-display text-3xl font-black">
                {topRequest ? topRequest.title : "The board is listening."}
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted">
                {topRequest
                  ? topRequest.requestCount + " signal" + (topRequest.requestCount === 1 ? "" : "s") + " from shoppers so far."
                  : "As people submit products, farms, makers, schools, charities, and community stories, the strongest signals rise here."}
              </p>
            </article>

            <article className="rounded-[1.8rem] border border-soil/10 bg-cream p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">Popular item</p>
              <h2 className="mt-3 font-display text-3xl font-black">Real sales decide this.</h2>
              <p className="mt-4 text-sm leading-6 text-muted">
                Once Acre Era has real orders, this space can surface the item people are actually buying most instead of guessing.
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-soil/10 bg-cream">
          <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-16">
            <article
              className="relative min-h-[28rem] overflow-hidden rounded-[2rem] bg-soil text-cream"
              style={{ backgroundImage: `url("${FARM_POSTER}")`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-soil via-soil/45 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 md:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-wheat">Local spotlight</p>
                <h2 className="mt-3 max-w-2xl font-display text-4xl font-black tracking-[-0.035em]">
                  The people behind the shelf deserve some screen time too.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-cream/72">
                  Farms, butcher shops, wineries, bakers, makers, drivers, schools, charities, and regular people doing something worth noticing can all earn a place on the board.
                </p>
                <Link href="/market" className="btn-primary mt-6 !bg-wheat !text-soil">
                  Visit Market
                </Link>
              </div>
            </article>

            <div className="grid gap-4">
              <article className="rounded-[2rem] bg-[#242720] p-7 text-cream">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-wheat">Company pulse</p>
                <h2 className="mt-3 font-display text-3xl font-black">What Acre Era is working on.</h2>
                <p className="mt-4 text-sm leading-6 text-cream/65">
                  New supplier connections, a new local pilot, a niche getting hot, a new Era coming together, or a company milestone can live here without turning Home into a news feed.
                </p>
              </article>

              <article className="rounded-[2rem] border border-soil/10 bg-bone p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">Community board</p>
                <h2 className="mt-3 font-display text-3xl font-black">Good ideas can come from anywhere.</h2>
                <p className="mt-4 text-sm leading-6 text-muted">
                  Request a product, nominate a farm or maker, point us toward a school or charity, or tell us about a random act of kindness worth sharing.
                </p>
              </article>
            </div>
          </div>
        </section>

        {requests.length ? (
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">What people are asking for</p>
            <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.035em] md:text-5xl">
              The board gets louder when ideas repeat.
            </h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {requests.slice(0, 8).map((request) => (
                <article key={request.category + request.title} className="rounded-2xl border border-soil/10 bg-cream p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-leaf">
                    {request.category.replace("_", " ")}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold">{request.title}</h3>
                  <p className="mt-3 text-sm text-muted">
                    {request.requestCount} signal{request.requestCount === 1 ? "" : "s"}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
          <BringItHere />
        </section>
      </main>
      <Footer />
    </>
  );
}
