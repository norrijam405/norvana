import type { Metadata } from "next";
import { GarageSaleExperience } from "@/components/garage-sale/garage-sale-experience";
import { getGarageSaleSafeSpotAdapter } from "@/lib/garage-sale/safespot-fixtures";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Digital Garage Sale — fictional concept preview",
  description: "Explore whole-sale shopping and a local-only seller studio in the Acre Era fictional Garage Sale preview. No live listings or bookings.",
  robots: { index: false, follow: false },
};
export default function GarageSalePage() {
  const safeSpots = getGarageSaleSafeSpotAdapter();
  return <>
    <main className="min-h-screen bg-bone text-soil">
      <section className="relative overflow-hidden bg-[linear-gradient(118deg,#263428_0%,#40583e_65%,#675746_100%)] px-4 py-14 text-cream sm:px-6 lg:px-8 lg:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-52 h-[36rem] w-[36rem] rounded-full border-[4rem] border-cream/[0.055]" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.24em] text-wheat">Acre Era / Neighborhood discoveries</p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            One person's clear-out.<span className="block text-wheat">Your next good find.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-cream/80 sm:text-lg">
            Explore an entire garage sale, put together a bundle, or build your own sale—all in one place.
            For now, this is a fictional, non-transactional preview.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs font-semibold text-cream/75">
            <span className="rounded-full border border-cream/25 px-4 py-2">Whole-sale storefronts</span>
            <span className="rounded-full border border-cream/25 px-4 py-2">Build a sample bundle</span>
            <span className="rounded-full border border-cream/25 px-4 py-2">Seller review studio</span>
          </div>
        </div>
      </section>
      <GarageSaleExperience safeSpots={safeSpots} />
    </main>
    <Footer />
  </>;
}
