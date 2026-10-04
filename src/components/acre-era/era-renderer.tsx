import Link from "next/link";
import type { PublicEra, PublicEraProduct } from "@/lib/era-engine/types";
import { EraHeroMedia } from "./era-hero-media";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function checkoutLabel(product: PublicEraProduct) {
  if (product.commerceModel === "AFFILIATE_REFERRAL") {
    return product.externalSellerName
      ? `Checkout with ${product.externalSellerName}`
      : "Partner checkout";
  }

  if (product.externalSellerName) return `Fulfilled by ${product.externalSellerName}`;
  return "Acre Era route";
}

function ProductCard({ product }: { product: PublicEraProduct }) {
  const image = product.images[0] ?? null;

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-soil/10 bg-surface shadow-sm">
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-sage-wash">
          {image ? (
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
              role="img"
              aria-label={product.name}
              style={{ backgroundImage: `url("${image.replaceAll('"', "%22")}")` }}
            />
          ) : (
            <div className="absolute inset-0 acre-era-product-fallback" aria-hidden="true" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-soil/65 to-transparent p-4 pt-12">
            <span className="inline-flex rounded-full bg-cream/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-soil">
              {product.role ? humanize(product.role) : "Curated"}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              {product.brandName ? (
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {product.brandName}
                </p>
              ) : null}
              <h3 className="mt-1 text-xl font-semibold leading-tight text-soil">
                {product.name}
              </h3>
            </div>
            <p className="shrink-0 text-lg font-semibold text-soil">{money(product.price)}</p>
          </div>

          {product.curationReason ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">
              {product.curationReason}
            </p>
          ) : null}

          <div className="mt-5 grid gap-2 border-t border-soil/10 pt-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Route</span>
              <span className="text-right font-medium text-soil">{checkoutLabel(product)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted">Authorization</span>
              <span className="text-right font-medium text-soil">
                {humanize(product.authorizationState || "unknown")}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function EraRenderer({
  era,
  current = false,
}: {
  era: PublicEra;
  current?: boolean;
}) {
  const archived = era.lifecycleState === "CLOSED" || era.lifecycleState === "ARCHIVED";

  return (
    <main>
      <section className="relative isolate min-h-[72svh] overflow-hidden bg-soil text-cream">
        <EraHeroMedia media={era.media} eraName={era.name} />
        <div className="absolute inset-0 bg-gradient-to-r from-soil/95 via-soil/70 to-soil/20" />
        <div className="absolute inset-0 acre-era-hero-grid opacity-30" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[72svh] max-w-7xl items-end px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-cream/25 bg-soil/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] backdrop-blur">
                {current ? "Current Era" : archived ? "From the Archive" : humanize(era.lifecycleState)}
              </span>
              <span className="rounded-full border border-cream/20 px-3 py-1 text-xs uppercase tracking-[0.14em] text-cream/80">
                {humanize(era.kind)}
              </span>
            </div>

            {era.eyebrow ? (
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-wheat">
                {era.eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-4xl text-5xl font-black tracking-[-0.04em] sm:text-6xl lg:text-8xl">
              {era.name}
            </h1>
            {era.story ? (
              <p className="mt-6 max-w-2xl text-base leading-7 text-cream/82 sm:text-lg sm:leading-8">
                {era.story}
              </p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-3">
              {current ? (
                <Link href={`/era/${era.slug}`} className="btn-primary !bg-wheat !text-soil hover:!bg-cream">
                  Enter the Era
                </Link>
              ) : null}
              <Link href="/archive" className="btn-ghost-light">
                Explore the archive
              </Link>
            </div>
          </div>
        </div>
      </section>

      {era.publicWatchtowerFacets.length ? (
        <section className="border-b border-soil/10 bg-surface">
          <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                Watchtower is watching
              </span>
              {era.publicWatchtowerFacets.map((facet) => (
                <span key={facet} className="rounded-full bg-sage-wash px-3 py-1 text-xs font-medium text-soil">
                  {humanize(facet)}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">Why this Era exists</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              Curated on purpose, not dumped from a catalog.
            </h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted lg:justify-self-end">
            Every item shown here comes through the Era’s own curation and public trust rules.
            Source, authorization, checkout responsibility, and historical state stay visible instead of
            being flattened into a generic product grid.
          </p>
        </div>
      </section>

      <section className="border-y border-soil/10 bg-surface/70">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf">
                {archived ? "Historical curation" : "Inside this Era"}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em]">Worth a closer look</h2>
            </div>
            {archived ? (
              <p className="max-w-lg text-sm leading-6 text-muted">
                These products are rendered from the immutable closure snapshot, not today’s mutable catalog.
              </p>
            ) : null}
          </div>

          {era.products.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {era.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-soil/20 bg-bone px-6 py-14 text-center">
              <h3 className="text-xl font-semibold">Nothing is being presented here yet.</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
                Acre Era does not fabricate inventory when an Era has no public, eligible product curation.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="acre-world">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">Passport</p>
            <h2 className="mt-3 text-2xl font-bold">Know what you’re buying.</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Source, authorization, route, condition, and evidence remain separate instead of becoming one vague trust badge.
            </p>
          </div>
          <div className="acre-world">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">Bring It Here</p>
            <h2 className="mt-3 text-2xl font-bold">Demand can shape the next Era.</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Customer requests become evidence for research and qualification—not automatic publication authority.
            </p>
          </div>
          <div className="acre-world">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-leaf">Archive</p>
            <h2 className="mt-3 text-2xl font-bold">History stays history.</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Closed Eras preserve their historical curation while current rights controls can still hide revoked media.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export function NoCurrentEra() {
  return (
    <main className="min-h-[72svh] bg-soil text-cream">
      <div className="acre-contours mx-auto flex min-h-[72svh] max-w-7xl items-end px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-wheat">Between Eras</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            The next world opens when it is actually ready.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-cream/75 sm:text-lg">
            There is no public Current Era right now. Acre Era would rather show that truth than expose a future,
            incomplete, or unqualified collection.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary !bg-wheat !text-soil hover:!bg-cream">Browse goods</Link>
            <Link href="/archive" className="btn-ghost-light">Visit the archive</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
