"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Footer } from "./footer";
import { JourneyHero } from "./acre-era/journey-hero";

type PartnerProduct = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  brandName?: string | null;
  externalSellerName?: string | null;
  sourceProviderSlug?: string | null;
  imageRightsState?: string | null;
  authorizationState?: string | null;
};

type PartnerCollection = {
  id: number;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  theme: string;
  startDate: string;
  endDate: string;
  heroImage?: string | null;
  isActive: boolean;
};

const IMAGE_OK = new Set([
  "OWNED",
  "BRAND_AUTHORIZED",
  "SUPPLIER_AUTHORIZED",
  "AFFILIATE_FEED_AUTHORIZED",
]);

function PartnerCard({ product, index }: { product: PartnerProduct; index: number }) {
  const image = IMAGE_OK.has(product.imageRightsState || "") ? product.images?.[0] : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: Math.min(index * 0.04, 0.24) }}
      className="group overflow-hidden rounded-[1.7rem] border border-soil/10 bg-cream shadow-[0_20px_60px_rgba(48,46,35,.06)]"
    >
      <Link href={"/shop/" + product.slug}>
        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-sage-wash">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} className="h-full w-full object-contain bg-white" referrerPolicy="no-referrer" />
          ) : (
            <span className="text-6xl">↗</span>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-soil/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream">
            Buy from partner
          </span>
        </div>

        <div className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-leaf">
            {product.brandName || product.externalSellerName || "Partner find"}
          </p>
          <h3 className="mt-2 font-display text-xl font-bold text-soil">{product.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{product.description}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="font-semibold text-soil">{"$"}{product.price.toFixed(2)}</span>
            {product.compareAtPrice ? (
              <span className="text-sm text-muted line-through">{"$"}{product.compareAtPrice.toFixed(2)}</span>
            ) : null}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-leaf">
            See details + buying option →
          </p>
        </div>
      </Link>
    </motion.article>
  );
}

export function PartnerMarketClient({
  activeCollection,
  featured,
  allProducts,
}: {
  activeCollection: PartnerCollection | null;
  featured: PartnerProduct[];
  allProducts: PartnerProduct[];
}) {
  return (
    <>
      <main className="min-h-screen bg-bone text-soil">
        <JourneyHero
          variant="partner"
          eyebrow="Partner Finds · premium finds · trusted buying paths"
          title="Good products can come"
          accent="from more than one road."
          copy="Acre Era curates brands, retailers, and qualified buying paths that fit the world we are building — from useful electronics and gaming gear to premium shoes, bags, accessories, and special finds."
          primaryHref="#current-partner-era"
          primaryLabel="Explore Partner Finds"
          secondaryHref="/shop"
          secondaryLabel="Browse Goods"
        />

        <section id="current-partner-era" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {activeCollection ? (
            <>
              <div className="mb-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">{activeCollection.eyebrow}</p>
                  <h2 className="mt-2 font-display text-4xl font-black md:text-5xl">{activeCollection.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{activeCollection.description}</p>
                </div>
                <div className="text-xs text-muted">
                  {activeCollection.startDate || "Current"}{activeCollection.endDate ? " → " + activeCollection.endDate : ""}
                </div>
              </div>

              {featured.length ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {featured.map((product, index) => <PartnerCard key={product.id} product={product} index={index} />)}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-soil/15 bg-cream p-10 text-center text-muted">
                  This partner curation is being assembled. Products stay hidden until their program approval and image rights are documented.
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-soil/15 bg-cream p-10 text-center">
              <p className="text-4xl">🧭</p>
              <h2 className="mt-4 font-display text-2xl font-bold">The first Partner Era is being curated.</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
                We will not fill this page with random affiliate links. A collection goes live only after the relationship, imagery rights, and product data are documented.
              </p>
            </div>
          )}
        </section>

        <section className="border-y border-soil/10 bg-sage-wash/55">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-leaf">All active partner finds</p>
                <h2 className="mt-2 font-display text-3xl font-black md:text-4xl">Curated beyond one storefront.</h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-muted">
                Some products are bought directly through Acre Era and some through trusted partners. We keep that distinction visible while still making the experience feel like one carefully curated world.
              </p>
            </div>

            {allProducts.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allProducts.map((product, index) => <PartnerCard key={product.id} product={product} index={index} />)}
              </div>
            ) : (
              <p className="rounded-3xl border border-dashed border-soil/15 bg-cream p-8 text-center text-sm text-muted">
                No partner products are public yet.
              </p>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Curated, not dumped", "Acre Era chooses what earns a place instead of mirroring an entire affiliate catalog."],
              ["Rights before imagery", "Partner photography appears only when the program or supplier grants us the right to use it."],
              ["Checkout truth", "We tell you when the partner—not Acre Era—owns payment, shipping, returns, and warranty."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-3xl border border-soil/10 bg-cream p-6">
                <h3 className="font-display text-xl font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
