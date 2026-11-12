import type { Metadata } from "next";
import Link from "next/link";
import { GarageSaleDemo } from "@/components/garage-sale/garage-sale-demo";
import { SellerStudio } from "@/components/garage-sale/seller-studio";
import { MessagePreviewWorkbench } from "@/components/garage-sale/message-preview-workbench";
import { getGarageSaleSafeSpotAdapter } from "@/lib/garage-sale/safespot-fixtures";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Digital Garage Sale — fictional concept preview",
  description: "Explore a fictional digital garage sale with sample bundle offers and a future SafeSpot integration concept. No live listings or reservations.",
  robots: { index: false, follow: false },
};
export default function GarageSalePage() {
  // Fixture-only: no database writes, external API calls or customer data.
  const safeSpots = getGarageSaleSafeSpotAdapter();
  return (
    <>
      <main className="min-h-screen bg-bone text-soil">
        <section className="bg-[linear-gradient(125deg,#263428,#465c43)] px-4 py-16 text-cream sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-xs font-semibold uppercase tracking-[.22em] text-wheat">Acre Era · future marketplace module</p>
            <h1 className="mt-4 max-w-4xl font-display text-5xl font-black tracking-tight md:text-7xl">Your whole garage sale. One digital storefront.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-cream/80">
              Explore an entire neighborhood sale, build a sample bundle and preview a private-pickup journey.
              A fictional, non-transactional prototype for testing the experience.
            </p>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"><Link href="/safety" className="inline-flex rounded-xl border border-soil/15 bg-cream px-5 py-3 text-sm font-semibold text-soil underline underline-offset-4">Explore safety across all Acre Era experiences</Link></div>
        <GarageSaleDemo safeSpots={safeSpots} />
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"><SellerStudio /><MessagePreviewWorkbench /></div>
      </main>
      <Footer />
    </>
  );
}
